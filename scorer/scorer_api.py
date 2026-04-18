"""FastAPI service for agency scoring."""

from __future__ import annotations

import os
from typing import Any, Optional

from fastapi import FastAPI
from pydantic import BaseModel, Field

from scorer.agency_formula import compute_agency_score
from scorer.features import extract_features
from scorer.heuristic_scorer import score_heuristic
from scorer.text_analysis import analyze_text_scores


def _env_flag(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() not in {"0", "false", "no", "off"}


def _model_dump(model: BaseModel) -> dict[str, Any]:
    if hasattr(model, "model_dump"):  # pydantic v2
        return model.model_dump()
    return model.dict()  # pydantic v1


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


app = FastAPI(title="Agency Scorer API", version="0.1.0")


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "ml_enabled": _env_flag("USE_ML_SCORER", False),
    }


@app.post("/score", response_model=ScoreResponse)
def score(payload: EventPayload) -> ScoreResponse:
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
