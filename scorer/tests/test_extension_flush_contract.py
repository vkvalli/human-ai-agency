"""Extension flush contract tests."""

from __future__ import annotations

import asyncio
import os

from fastapi import HTTPException

os.environ.setdefault("HF_HUB_OFFLINE", "1")
os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")

from scorer.scorer_api import SessionEventsRequest, session_events


def test_session_events_requires_backend_when_neon_missing() -> None:
    payload = SessionEventsRequest(
        events=[
            {
                "session_id": "00000000-0000-0000-0000-000000000001",
                "scored_at": "2026-04-19T07:40:00.000Z",
                "features": {
                    "latency_ms": 2000,
                    "adoption_ratio": 0.91,
                    "manual_addition_ratio": 0.07,
                    "delete_ratio": 0.03,
                    "edit_distance_ratio": 0.08,
                    "quick_accept": True,
                    "regen_count": 0,
                    "accept_count": 1,
                    "reject_count": 0,
                },
                "score": {
                    "agency_score": 34,
                    "agency_band": "low",
                    "reliance_risk": 0.81,
                    "reliance_band": "high",
                    "decision_type": "ai_led",
                    "drivers": [
                        "quick acceptance pattern detected",
                        "high AI adoption ratio",
                    ],
                    "components": {
                        "R": 0.81,
                        "S": 0.6,
                        "Q": 1.0,
                        "E": 0.08,
                        "C": 0.2,
                        "I": 0.0,
                    },
                },
            }
        ]
    )

    try:
        asyncio.run(session_events(payload))
        assert False, "Expected HTTPException 503 when NEON backend is missing"
    except HTTPException as exc:
        assert exc.status_code == 503
        assert "NEON backend is not configured" in str(exc.detail)
