"""NEON-backed persistence layer for sessions, scores, and insights."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
import json
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class ScorePersistenceRecord:
    score_id: str
    scored_at: datetime
    user_id: str


class NeonRepository:
    """Thin async repository for the backend MVP schema."""

    def __init__(
        self,
        dsn: str,
        *,
        init_schema: bool = True,
        pool_min_size: int = 1,
        pool_max_size: int = 5,
    ) -> None:
        self._dsn = dsn
        self._init_schema = init_schema
        self._pool_min_size = pool_min_size
        self._pool_max_size = pool_max_size
        self._pool = None

    async def connect(self) -> None:
        asyncpg = _import_asyncpg()
        self._pool = await asyncpg.create_pool(
            dsn=self._dsn,
            min_size=self._pool_min_size,
            max_size=self._pool_max_size,
            command_timeout=15,
        )
        if self._init_schema:
            await self.ensure_schema()

    async def close(self) -> None:
        if self._pool is None:
            return
        await self._pool.close()
        self._pool = None

    async def ensure_schema(self) -> None:
        pool = self._require_pool()
        schema_sql = _load_schema_sql()
        async with pool.acquire() as conn:
            await conn.execute(schema_sql)

    async def ensure_user(self, user_id: str) -> None:
        pool = self._require_pool()
        async with pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO users (user_id)
                VALUES ($1::uuid)
                ON CONFLICT (user_id) DO NOTHING
                """,
                user_id,
            )

    async def create_plan(
        self,
        *,
        user_id: str,
        task_title: str,
        intent_text: str,
        must_keep_points: list[str] | None = None,
        ai_help_scope: list[str] | None = None,
        human_owned_scope: list[str] | None = None,
    ) -> str:
        pool = self._require_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO plans (
                    user_id,
                    task_title,
                    intent_text,
                    must_keep_points,
                    ai_help_scope,
                    human_owned_scope,
                    created_at,
                    updated_at
                )
                VALUES (
                    $1::uuid,
                    $2,
                    $3,
                    $4::jsonb,
                    $5::jsonb,
                    $6::jsonb,
                    now(),
                    now()
                )
                RETURNING plan_id
                """,
                user_id,
                task_title,
                intent_text,
                json.dumps(must_keep_points or []),
                json.dumps(ai_help_scope or []),
                json.dumps(human_owned_scope or []),
            )
        return str(row["plan_id"])

    async def create_session(
        self,
        *,
        user_id: str,
        task_type: str,
        deadline_active: bool,
        plan_id: str | None = None,
        intent_text: str | None = None,
    ) -> dict[str, Any]:
        await self.ensure_user(user_id)

        resolved_plan_id = plan_id
        if resolved_plan_id is not None:
            await self._assert_plan_belongs_to_user(plan_id=resolved_plan_id, user_id=user_id)
        elif intent_text:
            resolved_plan_id = await self.create_plan(
                user_id=user_id,
                task_title=f"{task_type.title()} task",
                intent_text=intent_text,
            )

        pool = self._require_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO sessions (
                    user_id,
                    plan_id,
                    started_at,
                    task_type,
                    deadline_active
                )
                VALUES ($1::uuid, $2::uuid, now(), $3, $4)
                RETURNING session_id, started_at
                """,
                user_id,
                resolved_plan_id,
                task_type,
                deadline_active,
            )
            if resolved_plan_id is not None:
                await conn.execute(
                    """
                    UPDATE plans
                    SET session_id = COALESCE(session_id, $1::uuid),
                        updated_at = now()
                    WHERE plan_id = $2::uuid
                      AND user_id = $3::uuid
                    """,
                    row["session_id"],
                    resolved_plan_id,
                    user_id,
                )

        return {
            "session_id": str(row["session_id"]),
            "started_at": row["started_at"],
            "plan_id": resolved_plan_id,
        }

    async def get_session_intent_text(self, session_id: str) -> str | None:
        pool = self._require_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT p.intent_text
                FROM sessions s
                JOIN plans p ON p.plan_id = s.plan_id
                WHERE s.session_id = $1::uuid
                """,
                session_id,
            )
        if row is None:
            return None
        return row["intent_text"]

    async def persist_score(
        self,
        *,
        session_id: str,
        agency_score: int,
        agency_band: str,
        reliance_risk: float,
        decision_type: str,
        components: dict[str, float],
        drivers: list[str],
    ) -> ScorePersistenceRecord:
        pool = self._require_pool()
        async with pool.acquire() as conn:
            session_row = await conn.fetchrow(
                "SELECT user_id FROM sessions WHERE session_id = $1::uuid",
                session_id,
            )
            if session_row is None:
                raise ValueError(f"Unknown session_id: {session_id}")

            row = await conn.fetchrow(
                """
                INSERT INTO agency_scores (
                    session_id,
                    scored_at,
                    agency_score,
                    agency_band,
                    reliance_risk,
                    decision_type,
                    components,
                    drivers
                )
                VALUES ($1::uuid, now(), $2, $3, $4, $5, $6::jsonb, $7::text[])
                RETURNING score_id, scored_at
                """,
                session_id,
                agency_score,
                agency_band,
                reliance_risk,
                decision_type,
                json.dumps(components or {}),
                drivers,
            )

        return ScorePersistenceRecord(
            score_id=str(row["score_id"]),
            scored_at=row["scored_at"],
            user_id=str(session_row["user_id"]),
        )

    async def get_recent_session_scores(self, *, session_id: str, limit: int = 3) -> list[int]:
        pool = self._require_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT agency_score
                FROM agency_scores
                WHERE session_id = $1::uuid
                ORDER BY scored_at DESC
                LIMIT $2
                """,
                session_id,
                limit,
            )
        return [int(row["agency_score"]) for row in rows if row["agency_score"] is not None]

    async def get_user_goal(self, user_id: str) -> int:
        pool = self._require_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT agency_goal FROM users WHERE user_id = $1::uuid",
                user_id,
            )
        if row is None or row["agency_goal"] is None:
            return 70
        return int(row["agency_goal"])

    async def is_trigger_in_cooldown(
        self,
        *,
        user_id: str,
        session_id: str,
        trigger_type: str,
        now_utc: datetime,
    ) -> bool:
        pool = self._require_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT 1
                FROM drift_triggers
                WHERE user_id = $1::uuid
                  AND session_id = $2::uuid
                  AND trigger_type = $3
                  AND cooldown_until > $4
                LIMIT 1
                """,
                user_id,
                session_id,
                trigger_type,
                now_utc,
            )
        return row is not None

    async def create_drift_trigger(
        self,
        *,
        user_id: str,
        session_id: str,
        trigger_type: str,
        severity: str,
        message: str,
        cooldown_minutes: int = 10,
    ) -> dict[str, Any]:
        now_utc = datetime.now(timezone.utc)
        cooldown_until = now_utc + timedelta(minutes=cooldown_minutes)

        pool = self._require_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO drift_triggers (
                    user_id,
                    session_id,
                    trigger_type,
                    severity,
                    message,
                    cooldown_until,
                    created_at
                )
                VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, now())
                RETURNING trigger_id, created_at, cooldown_until
                """,
                user_id,
                session_id,
                trigger_type,
                severity,
                message,
                cooldown_until,
            )

        return {
            "trigger_id": str(row["trigger_id"]),
            "created_at": row["created_at"],
            "cooldown_until": row["cooldown_until"],
        }

    async def get_history(self, *, user_id: str, period: str) -> list[dict[str, Any]]:
        cutoff = _period_cutoff(period)
        pool = self._require_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT a.scored_at, a.agency_score, a.agency_band
                FROM agency_scores a
                JOIN sessions s ON s.session_id = a.session_id
                WHERE s.user_id = $1::uuid
                  AND a.scored_at >= $2
                ORDER BY a.scored_at ASC
                """,
                user_id,
                cutoff,
            )

        return [
            {
                "scored_at": row["scored_at"],
                "agency_score": int(row["agency_score"]),
                "agency_band": row["agency_band"],
            }
            for row in rows
            if row["agency_score"] is not None
        ]

    async def get_insights(self, *, user_id: str, period: str) -> dict[str, Any]:
        cutoff = _period_cutoff(period)
        pool = self._require_pool()

        async with pool.acquire() as conn:
            trigger_rows = await conn.fetch(
                """
                SELECT trigger_type, COUNT(*)::int AS count
                FROM drift_triggers
                WHERE user_id = $1::uuid
                  AND created_at >= $2
                GROUP BY trigger_type
                ORDER BY count DESC
                LIMIT 5
                """,
                user_id,
                cutoff,
            )

            composition_rows = await conn.fetch(
                """
                SELECT COALESCE(a.decision_type, 'unknown') AS decision_type, COUNT(*)::int AS count
                FROM agency_scores a
                JOIN sessions s ON s.session_id = a.session_id
                WHERE s.user_id = $1::uuid
                  AND a.scored_at >= $2
                GROUP BY decision_type
                ORDER BY count DESC
                """,
                user_id,
                cutoff,
            )

            task_rows = await conn.fetch(
                """
                SELECT COALESCE(s.task_type, 'unknown') AS task_type,
                       ROUND(AVG(a.agency_score)::numeric, 1) AS avg_score
                FROM agency_scores a
                JOIN sessions s ON s.session_id = a.session_id
                WHERE s.user_id = $1::uuid
                  AND a.scored_at >= $2
                GROUP BY task_type
                ORDER BY avg_score DESC
                """,
                user_id,
                cutoff,
            )

            baseline_rows = await conn.fetch(
                """
                SELECT a.agency_score
                FROM agency_scores a
                JOIN sessions s ON s.session_id = a.session_id
                WHERE s.user_id = $1::uuid
                  AND a.scored_at >= $2
                  AND a.agency_score IS NOT NULL
                ORDER BY a.scored_at ASC
                """,
                user_id,
                cutoff,
            )

        baseline_scores = [int(row["agency_score"]) for row in baseline_rows]

        return {
            "top_drift_triggers": [
                {
                    "trigger_type": row["trigger_type"],
                    "count": int(row["count"]),
                }
                for row in trigger_rows
            ],
            "decision_composition": {
                row["decision_type"]: int(row["count"])
                for row in composition_rows
            },
            "baseline_delta": _baseline_delta(baseline_scores),
            "avg_by_task_type": {
                row["task_type"]: float(row["avg_score"])
                for row in task_rows
                if row["avg_score"] is not None
            },
        }

    async def set_breach_alert(self, user_id: str) -> bool:
        await self.ensure_user(user_id)

        pool = self._require_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                UPDATE users
                SET breach_alert = true
                WHERE user_id = $1::uuid
                RETURNING user_id
                """,
                user_id,
            )
        return row is not None

    async def _assert_plan_belongs_to_user(self, *, plan_id: str, user_id: str) -> None:
        pool = self._require_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT 1
                FROM plans
                WHERE plan_id = $1::uuid
                  AND user_id = $2::uuid
                """,
                plan_id,
                user_id,
            )
        if row is None:
            raise ValueError("plan_id does not belong to user")

    def _require_pool(self):
        if self._pool is None:
            raise RuntimeError("NeonRepository is not connected")
        return self._pool


def _load_schema_sql() -> str:
    schema_path = Path(__file__).with_name("schema.sql")
    return schema_path.read_text(encoding="utf-8")


def _period_cutoff(period: str) -> datetime:
    now_utc = datetime.now(timezone.utc)
    if period == "day":
        return now_utc - timedelta(days=1)
    if period == "week":
        return now_utc - timedelta(days=7)
    if period == "month":
        return now_utc - timedelta(days=30)
    raise ValueError("period must be one of: day, week, month")


def _baseline_delta(scores: list[int]) -> float:
    if len(scores) < 2:
        return 0.0

    midpoint = len(scores) // 2
    if midpoint == 0 or midpoint == len(scores):
        return 0.0

    first_half = scores[:midpoint]
    second_half = scores[midpoint:]
    first_avg = sum(first_half) / len(first_half)
    second_avg = sum(second_half) / len(second_half)
    return round(second_avg - first_avg, 2)


def _import_asyncpg():
    try:
        import asyncpg  # type: ignore
    except ImportError as exc:  # pragma: no cover
        raise RuntimeError(
            "asyncpg is required for NEON persistence. Install it with `pip install asyncpg`."
        ) from exc
    return asyncpg
