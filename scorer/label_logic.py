"""Behavior-derived proxy labeling utilities."""

from __future__ import annotations

from scorer.features import InteractionFeatures


def derive_label(f: InteractionFeatures) -> str:
    """Derive coarse reliance label from behavioral features."""
    if f.adoption_ratio >= 0.80 and f.quick_accept:
        return "ai_led"
    if f.manual_addition_ratio >= 0.45 and f.delete_ratio >= 0.25:
        return "user_led"
    return "mixed"


def label_to_risk(label: str) -> float:
    mapping = {
        "ai_led": 0.80,
        "mixed": 0.50,
        "user_led": 0.20,
    }
    return mapping.get(label, 0.50)

