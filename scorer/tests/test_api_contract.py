"""API contract tests for integration safety."""

from __future__ import annotations

import os

from scorer.scorer_api import EventPayload, health, score


def _dump(model):
    return model.model_dump() if hasattr(model, "model_dump") else model.dict()


def test_score_response_includes_decision_type_and_contract_aliases() -> None:
    payload = EventPayload(
        ai_text="Use this exact draft.",
        final_text="Use this exact draft.",
        latency_ms=800,
        accepted=True,
        regen_count=0,
    )
    result = _dump(score(payload))

    assert result["decision_type"] in {"ai_led", "mixed", "user_led"}
    assert result["band"] == result["agency_band"]
    assert result["behavioral_reliance_risk"] == result["reliance_risk"]
    assert result["component_breakdown"] == result["components"]


def test_health_exposes_ml_enabled_flag() -> None:
    os.environ["USE_ML_SCORER"] = "false"
    assert health() == {"status": "ok", "ml_enabled": False}

    os.environ["USE_ML_SCORER"] = "true"
    assert health() == {"status": "ok", "ml_enabled": True}


def test_legacy_request_field_names_are_supported() -> None:
    canonical_payload = EventPayload(
        ai_text="Please send this concise update.",
        final_text="Please send this concise update.",
        latency_ms=2500,
        accepted=True,
        regen_count=0,
    )
    legacy_payload = EventPayload(
        ai_text="Please send this concise update.",
        final_text="Please send this concise update.",
        accept_latency_ms=2500,
        was_accepted=True,
        num_regenerations=0,
    )

    canonical_result = _dump(score(canonical_payload))
    legacy_result = _dump(score(legacy_payload))
    assert legacy_result["reliance_risk"] == canonical_result["reliance_risk"]
    assert legacy_result["agency_score"] == canonical_result["agency_score"]

