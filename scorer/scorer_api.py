"""FastAPI service for agency scoring and backend persistence."""

from __future__ import annotations

from contextlib import asynccontextmanager
from datetime import datetime, timezone
import logging
import os
from typing import Any, Literal, Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from scorer.agency_formula import compute_agency_score
from scorer.backend_logic import (
    should_trigger_goal_drift,
    should_trigger_low_score,
    trend_direction,
)
from scorer.database.neon_client import NeonRepository
from scorer.features import extract_features
from scorer.heuristic_scorer import score_heuristic
from scorer.text_analysis import analyze_text_scores

logger = logging.getLogger(__name__)

Period = Literal["day", "week", "month"]
TaskType = Literal["study", "work", "personal"]


class EventPayload(BaseModel):
    ai_text: str = ""
    final_text: str = ""
    intent_text: Optional[str] = None

    # Canonical request fields
    latency_ms: int = 0
    accept_count: int = 0
    reject_count: int = 0
    regen_count: int = 0
    accepted: bool = False
    rejected: bool = False
    confidence: Optional[float] = None

    # Session/backend context (optional, for persistence and triggering)
    session_id: Optional[str] = None
    user_id: Optional[str] = None
    task_type: Optional[TaskType] = None
    deadline_active: Optional[bool] = None

    # Legacy aliases supported for integration compatibility
    accept_latency_ms: Optional[int] = None
    num_regenerations: Optional[int] = None
    was_accepted: Optional[bool] = None
    was_rejected: Optional[bool] = None


class ScoreResponse(BaseModel):
    # Current contract
    agency_score: int
    agency_band: str
    reliance_risk: float
    reliance_band: str
    decision_type: str
    drivers: list[str] = Field(default_factory=list)
    text_scores: dict[str, Optional[float]] = Field(default_factory=dict)
    components: dict[str, float] = Field(default_factory=dict)

    # Compatibility aliases (legacy contract)
    band: str
    behavioral_reliance_risk: float
    component_breakdown: dict[str, float] = Field(default_factory=dict)


class SessionStartRequest(BaseModel):
    user_id: str
    task_type: TaskType
    deadline_active: bool = False
    intent_text: Optional[str] = None
    plan_id: Optional[str] = None


class SessionStartResponse(BaseModel):
    session_id: str
    started_at: datetime


class SessionEventFeatures(BaseModel):
    latency_ms: int = 0
    accept_count: int = 0
    reject_count: int = 0
    regen_count: int = 0
    quick_accept: Optional[bool] = None
    adoption_ratio: Optional[float] = None
    manual_addition_ratio: Optional[float] = None
    delete_ratio: Optional[float] = None
    edit_distance_ratio: Optional[float] = None


class SessionEventScore(BaseModel):
    agency_score: int
    agency_band: str
    reliance_risk: float
    reliance_band: Optional[str] = None
    decision_type: Optional[str] = None
    drivers: list[str] = Field(default_factory=list)
    components: dict[str, float] = Field(default_factory=dict)


class SessionEvent(BaseModel):
    session_id: Optional[str] = None
    user_id: Optional[str] = None
    task_type: Optional[TaskType] = None
    deadline_active: Optional[bool] = None
    plan_id: Optional[str] = None
    intent_text: Optional[str] = None
    scored_at: Optional[datetime] = None
    features: SessionEventFeatures = Field(default_factory=SessionEventFeatures)
    score: SessionEventScore
    possible_trigger: Optional[str] = None


class SessionEventsRequest(BaseModel):
    events: list[SessionEvent] = Field(default_factory=list)


class SessionEventsResponse(BaseModel):
    accepted: int
    persisted: int
    failed: int


class HistoryPoint(BaseModel):
    scored_at: datetime
    agency_score: int
    agency_band: str


class HistoryResponse(BaseModel):
    scores: list[HistoryPoint] = Field(default_factory=list)
    trend_direction: Literal["up", "down", "flat"] = "flat"


class TriggerCount(BaseModel):
    trigger_type: str
    count: int


class InsightsResponse(BaseModel):
    top_drift_triggers: list[TriggerCount] = Field(default_factory=list)
    decision_composition: dict[str, int] = Field(default_factory=dict)
    baseline_delta: float = 0.0
    avg_by_task_type: dict[str, float] = Field(default_factory=dict)


class NordProtectWebhookPayload(BaseModel):
    user_id: str


@asynccontextmanager
async def _lifespan(app: FastAPI):
    app.state.neon_repo = None
    dsn = os.getenv("NEON_CONNECTION_STR", "").strip()

    if dsn:
        repo = NeonRepository(dsn, init_schema=_env_flag("INIT_DB_SCHEMA", True))
        try:
            await repo.connect()
            app.state.neon_repo = repo
            logger.info("NEON repository connected")
        except Exception as exc:  # pragma: no cover - runtime integration
            logger.warning("NEON unavailable; backend persistence disabled: %s", exc)

    yield

    repo = getattr(app.state, "neon_repo", None)
    if repo is not None:
        await repo.close()


app = FastAPI(title="Agency Scorer API", version="0.2.0", lifespan=_lifespan)


def _cors_allow_origins() -> list[str]:
    raw = os.getenv("CORS_ALLOW_ORIGINS", "").strip()
    if raw:
        return [origin.strip() for origin in raw.split(",") if origin.strip()]

    return [
        "http://127.0.0.1:5173",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://localhost:3000",
    ]


app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_allow_origins(),
    allow_origin_regex=r"chrome-extension://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _env_flag(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() not in {"0", "false", "no", "off"}


def _model_dump(model: BaseModel) -> dict[str, Any]:
    if hasattr(model, "model_dump"):  # pydantic v2
        return model.model_dump()
    return model.dict()  # pydantic v1


def _model_copy(model: BaseModel, *, update: dict[str, Any]) -> BaseModel:
    if hasattr(model, "model_copy"):  # pydantic v2
        return model.model_copy(update=update)
    return model.copy(update=update)  # pydantic v1


def _compute_score(payload: EventPayload) -> ScoreResponse:
    event = _model_dump(payload)
    features = extract_features(event)

    text_scores: dict[str, Optional[float]] = {}
    if _env_flag("USE_TEXT_ANALYSIS", True):
        try:
            text_scores = analyze_text_scores(
                ai_text=features.ai_text,
                final_text=features.final_text,
                intent_text=features.intent_text,
                edit_distance_ratio=features.edit_distance_ratio,
                manual_addition_ratio=features.manual_addition_ratio,
                delete_ratio=features.delete_ratio,
                adoption_ratio=features.adoption_ratio,
            )
        except Exception:
            # Text analysis is additive; scorer must still return a valid result.
            text_scores = {}

    reliance = score_heuristic(features, text_scores=text_scores or None)
    agency = compute_agency_score(
        f=features,
        reliance_risk=reliance["reliance_risk"],
        text_scores=text_scores or None,
    )

    return ScoreResponse(
        agency_score=agency["agency_score"],
        agency_band=agency["agency_band"],
        reliance_risk=reliance["reliance_risk"],
        reliance_band=reliance["reliance_band"],
        decision_type=reliance["decision_type"],
        drivers=reliance["drivers"],
        text_scores=text_scores,
        components=agency["components"],
        band=agency["agency_band"],
        behavioral_reliance_risk=reliance["reliance_risk"],
        component_breakdown=agency["components"],
    )


def score(payload: EventPayload) -> ScoreResponse:
    """Compatibility entrypoint used by tests and local invocation."""
    return _compute_score(payload)


def _get_repo_or_none() -> NeonRepository | None:
    return getattr(app.state, "neon_repo", None)


def _get_required_repo() -> NeonRepository:
    repo = _get_repo_or_none()
    if repo is None:
        raise HTTPException(
            status_code=503,
            detail="NEON backend is not configured. Set NEON_CONNECTION_STR and restart the API.",
        )
    return repo


def _risk_band_from_score(risk: float) -> str:
    if risk > 0.75:
        return "high"
    if risk > 0.45:
        return "medium"
    return "low"


async def _persist_score_and_triggers(
    *,
    repo: NeonRepository,
    payload: EventPayload,
    response: ScoreResponse,
) -> None:
    if not payload.session_id:
        return

    saved = await repo.persist_score(
        session_id=payload.session_id,
        agency_score=response.agency_score,
        agency_band=response.agency_band,
        reliance_risk=response.reliance_risk,
        decision_type=response.decision_type,
        components=response.components,
        drivers=response.drivers,
    )

    now_utc = datetime.now(timezone.utc)

    if should_trigger_low_score(
        agency_band=response.agency_band,
        reliance_risk=response.reliance_risk,
    ):
        await _create_trigger_if_allowed(
            repo=repo,
            user_id=saved.user_id,
            session_id=payload.session_id,
            trigger_type="low_score",
            severity="high",
            message="Low agency pattern detected. Pause and revise before sending.",
            now_utc=now_utc,
        )

    recent_scores = await repo.get_recent_session_scores(session_id=payload.session_id, limit=3)
    goal = await repo.get_user_goal(saved.user_id)

    if should_trigger_goal_drift(latest_scores=recent_scores, agency_goal=goal):
        await _create_trigger_if_allowed(
            repo=repo,
            user_id=saved.user_id,
            session_id=payload.session_id,
            trigger_type="goal_drift",
            severity="medium",
            message="Recent agency average is below your goal. Consider using Plan Mode.",
            now_utc=now_utc,
        )


async def _create_trigger_if_allowed(
    *,
    repo: NeonRepository,
    user_id: str,
    session_id: str,
    trigger_type: str,
    severity: str,
    message: str,
    now_utc: datetime,
) -> None:
    in_cooldown = await repo.is_trigger_in_cooldown(
        user_id=user_id,
        session_id=session_id,
        trigger_type=trigger_type,
        now_utc=now_utc,
    )
    if in_cooldown:
        return

    await repo.create_drift_trigger(
        user_id=user_id,
        session_id=session_id,
        trigger_type=trigger_type,
        severity=severity,
        message=message,
        cooldown_minutes=10,
    )


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "ml_enabled": _env_flag("USE_ML_SCORER", False),
    }


@app.post("/session/start", response_model=SessionStartResponse)
async def session_start(payload: SessionStartRequest) -> SessionStartResponse:
    repo = _get_required_repo()

    try:
        session = await repo.create_session(
            user_id=payload.user_id,
            task_type=payload.task_type,
            deadline_active=payload.deadline_active,
            intent_text=payload.intent_text,
            plan_id=payload.plan_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return SessionStartResponse(
        session_id=session["session_id"],
        started_at=session["started_at"],
    )


@app.post("/session/events", response_model=SessionEventsResponse)
async def session_events(payload: SessionEventsRequest) -> SessionEventsResponse:
    repo = _get_required_repo()
    accepted = len(payload.events)
    persisted = 0
    failed = 0

    for event in payload.events:
        try:
            session_id = event.session_id
            if not session_id:
                if not event.user_id:
                    raise ValueError("session_id or user_id is required")
                session = await repo.create_session(
                    user_id=event.user_id,
                    task_type=event.task_type or "study",
                    deadline_active=bool(event.deadline_active),
                    intent_text=event.intent_text,
                    plan_id=event.plan_id,
                )
                session_id = session["session_id"]

            event_payload = EventPayload(
                session_id=session_id,
                user_id=event.user_id,
                task_type=event.task_type,
                deadline_active=event.deadline_active,
                intent_text=event.intent_text,
                latency_ms=event.features.latency_ms,
                accept_count=event.features.accept_count,
                reject_count=event.features.reject_count,
                regen_count=event.features.regen_count,
                accepted=event.features.accept_count > 0,
                rejected=event.features.reject_count > 0,
            )

            reliance_band = event.score.reliance_band or _risk_band_from_score(
                event.score.reliance_risk
            )
            decision_type = event.score.decision_type or "mixed"
            components = event.score.components or {}

            score_response = ScoreResponse(
                agency_score=event.score.agency_score,
                agency_band=event.score.agency_band,
                reliance_risk=event.score.reliance_risk,
                reliance_band=reliance_band,
                decision_type=decision_type,
                drivers=event.score.drivers,
                text_scores={},
                components=components,
                band=event.score.agency_band,
                behavioral_reliance_risk=event.score.reliance_risk,
                component_breakdown=components,
            )

            await _persist_score_and_triggers(
                repo=repo,
                payload=event_payload,
                response=score_response,
            )
            persisted += 1
        except Exception as exc:  # pragma: no cover - runtime integration
            failed += 1
            logger.warning("Session event persistence failed: %s", exc)

    return SessionEventsResponse(accepted=accepted, persisted=persisted, failed=failed)


@app.post("/score", response_model=ScoreResponse)
async def score_endpoint(payload: EventPayload) -> ScoreResponse:
    repo = _get_repo_or_none()

    # If intent_text is missing but a plan is attached to this session, pull it for I-component enrichment.
    if repo is not None and payload.session_id and not payload.intent_text:
        try:
            intent_text = await repo.get_session_intent_text(payload.session_id)
            if intent_text:
                payload = _model_copy(payload, update={"intent_text": intent_text})
        except Exception:
            # Scoring should still work even if backend context lookup fails.
            pass

    response = _compute_score(payload)

    if repo is not None and payload.session_id:
        try:
            await _persist_score_and_triggers(repo=repo, payload=payload, response=response)
        except Exception as exc:
            logger.warning("Score persistence skipped due to backend error: %s", exc)

    return response


@app.get("/history", response_model=HistoryResponse)
async def history(
    user_id: str = Query(...),
    period: Period = Query("week"),
) -> HistoryResponse:
    repo = _get_required_repo()

    try:
        score_rows = await repo.get_history(user_id=user_id, period=period)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    scores = [HistoryPoint(**row) for row in score_rows]
    trend = trend_direction([point.agency_score for point in scores])

    return HistoryResponse(scores=scores, trend_direction=trend)


@app.get("/insights", response_model=InsightsResponse)
async def insights(
    user_id: str = Query(...),
    period: Period = Query("week"),
) -> InsightsResponse:
    repo = _get_required_repo()

    try:
        result = await repo.get_insights(user_id=user_id, period=period)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return InsightsResponse(
        top_drift_triggers=[TriggerCount(**item) for item in result["top_drift_triggers"]],
        decision_composition=result["decision_composition"],
        baseline_delta=result["baseline_delta"],
        avg_by_task_type=result["avg_by_task_type"],
    )


@app.post("/webhook/nordprotect")
async def webhook_nordprotect(payload: NordProtectWebhookPayload) -> dict[str, bool]:
    repo = _get_required_repo()
    await repo.set_breach_alert(payload.user_id)
    return {"acknowledged": True}
