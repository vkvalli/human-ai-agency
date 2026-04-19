"""Unit tests for backend trend and trigger rules."""

from scorer.backend_logic import (
    should_trigger_goal_drift,
    should_trigger_low_score,
    trend_direction,
)


def test_trend_direction_up_down_flat() -> None:
    assert trend_direction([60, 62, 66]) == "up"
    assert trend_direction([70, 67, 64]) == "down"
    assert trend_direction([70, 71, 70]) == "flat"


def test_low_score_trigger_rule() -> None:
    assert should_trigger_low_score(agency_band="low", reliance_risk=0.66)
    assert not should_trigger_low_score(agency_band="medium", reliance_risk=0.9)
    assert not should_trigger_low_score(agency_band="low", reliance_risk=0.65)


def test_goal_drift_trigger_rule() -> None:
    assert should_trigger_goal_drift(latest_scores=[60, 62, 63], agency_goal=70)
    assert not should_trigger_goal_drift(latest_scores=[75, 73, 71], agency_goal=70)
    assert not should_trigger_goal_drift(latest_scores=[60, 62], agency_goal=70)
