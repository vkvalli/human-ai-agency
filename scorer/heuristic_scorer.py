"""Primary heuristic scorer for reliance risk."""

from __future__ import annotations

from typing import Optional

from scorer.features import InteractionFeatures


def _clamp01(value: float) -> float:
    return min(max(value, 0.0), 1.0)


def _risk_band(reliance_risk: float) -> str:
    # Keep "high" reserved for clearer over-reliance patterns, not borderline mixed edits.
    if reliance_risk >= 0.75:
        return "high"
    if reliance_risk >= 0.34:
        return "medium"
    return "low"


def score_heuristic(
    f: InteractionFeatures,
    text_scores: Optional[dict] = None,
) -> dict:
    """Score reliance risk using behavior-first heuristics."""
    latency_factor = 1.0 - min(f.latency_ms / 60000.0, 1.0)
    regen_factor = 1.0 - min(f.regen_count / 3.0, 1.0)

    risk = (
        0.35 * f.adoption_ratio
        + 0.20 * (1.0 - f.manual_addition_ratio)
        + 0.15 * (1.0 - f.delete_ratio)
        + 0.15 * (1.0 if f.quick_accept else 0.0)
        + 0.10 * latency_factor
        + 0.05 * regen_factor
    )

    if f.reject_count > f.accept_count:
        risk -= 0.08

    drivers: list[str] = []
    if f.quick_accept:
        drivers.append("quick acceptance pattern detected")
    if f.adoption_ratio > 0.75:
        drivers.append("high AI adoption ratio")
    if f.manual_addition_ratio > 0.40:
        drivers.append("substantial manual additions")
    if f.delete_ratio > 0.25:
        drivers.append("user removed notable AI content")

    if text_scores:
        ai_origin = text_scores.get("ai_origin")
        rewrite_depth = text_scores.get("rewrite_depth")
        intent_preservation = text_scores.get("intent_preservation")

        if isinstance(ai_origin, (int, float)) and ai_origin > 0.80:
            risk += 0.08
            drivers.append("output closely mirrors AI suggestion")

        if isinstance(rewrite_depth, (int, float)) and rewrite_depth > 0.60:
            risk -= 0.10
            drivers.append("substantive rewrite detected")

        if isinstance(intent_preservation, (int, float)):
            if intent_preservation < 0.40:
                risk += 0.05
            if intent_preservation > 0.75:
                drivers.append("intent well-preserved despite AI suggestion")

    risk = round(_clamp01(risk), 3)
    return {
        "reliance_risk": risk,
        "reliance_band": _risk_band(risk),
        "drivers": drivers,
    }
