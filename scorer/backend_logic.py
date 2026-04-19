"""Pure backend rules for trend and trigger evaluation."""

from __future__ import annotations


def trend_direction(scores: list[int]) -> str:
    """Compute simple trend direction from ordered scores."""
    if len(scores) < 2:
        return "flat"

    delta = scores[-1] - scores[0]
    if delta >= 3:
        return "up"
    if delta <= -3:
        return "down"
    return "flat"


def should_trigger_low_score(*, agency_band: str, reliance_risk: float) -> bool:
    return agency_band == "low" and reliance_risk > 0.65


def should_trigger_goal_drift(*, latest_scores: list[int], agency_goal: int) -> bool:
    if len(latest_scores) < 3:
        return False
    avg = sum(latest_scores[:3]) / 3.0
    return avg < agency_goal
