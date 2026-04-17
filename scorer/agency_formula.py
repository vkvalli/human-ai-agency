"""Agency score formula with bounded output in [0, 100]."""

from __future__ import annotations

from typing import Optional

from scorer.features import InteractionFeatures


def _clamp(value: float, lo: float, hi: float) -> float:
    return min(max(value, lo), hi)


def _agency_band(score: int) -> str:
    if score >= 70:
        return "high"
    if score >= 40:
        return "medium"
    return "low"


def _confidence_alignment(confidence: Optional[float], reliance_risk: float) -> float:
    if confidence is None:
        return 0.5
    expected_confidence = 1.0 - reliance_risk
    return _clamp(1.0 - abs(confidence - expected_confidence), 0.0, 1.0)


def _edit_ratio_component(f: InteractionFeatures) -> float:
    return _clamp(
        (f.edit_distance_ratio + f.manual_addition_ratio + f.delete_ratio) / 3.0,
        0.0,
        1.0,
    )


def compute_agency_score(
    f: InteractionFeatures,
    reliance_risk: float,
    text_scores: Optional[dict] = None,
) -> dict:
    """Compute final agency score and band."""
    r = _clamp(reliance_risk, 0.0, 1.0)
    s = _clamp(f.adoption_ratio, 0.0, 1.0)
    q = 1.0 if f.quick_accept else 0.0
    c = _confidence_alignment(f.confidence, r)

    e_behavior = _edit_ratio_component(f)
    rewrite_depth = None
    if text_scores:
        rewrite_depth = text_scores.get("rewrite_depth")
    if isinstance(rewrite_depth, (int, float)):
        e = _clamp(0.6 * e_behavior + 0.4 * float(rewrite_depth), 0.0, 1.0)
    else:
        e = e_behavior

    intent_bonus_component = 0.0
    if text_scores:
        intent_preservation = text_scores.get("intent_preservation")
        if isinstance(intent_preservation, (int, float)) and intent_preservation > 0.70:
            intent_bonus_component = float(intent_preservation)

    raw = 100 - (40 * r) - (20 * s) - (15 * q) + (15 * e) + (10 * c) + (8 * intent_bonus_component)
    score = int(_clamp(raw, 0.0, 100.0))

    return {
        "agency_score": score,
        "agency_band": _agency_band(score),
        "raw_score": round(raw, 3),
        "components": {
            "R": round(r, 3),
            "S": round(s, 3),
            "Q": round(q, 3),
            "E": round(e, 3),
            "C": round(c, 3),
            "I": round(intent_bonus_component, 3),
        },
    }

