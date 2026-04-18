"""Tests for scorer and formula composition."""

from scorer.agency_formula import compute_agency_score
from scorer.heuristic_scorer import score_heuristic
from scorer.tests.fixtures import SCENARIO_AI_LED, SCENARIO_MIXED, SCENARIO_USER_LED


def _score_bundle(features, text_scores=None) -> dict:
    reliance = score_heuristic(features, text_scores=text_scores)
    agency = compute_agency_score(
        f=features,
        reliance_risk=reliance["reliance_risk"],
        text_scores=text_scores,
    )
    return {"reliance": reliance, "agency": agency}


def test_canonical_bands_without_text_scores() -> None:
    ai_led = _score_bundle(SCENARIO_AI_LED)
    user_led = _score_bundle(SCENARIO_USER_LED)
    mixed = _score_bundle(SCENARIO_MIXED)

    assert ai_led["agency"]["agency_band"] == "low"
    assert user_led["agency"]["agency_band"] == "high"
    assert mixed["agency"]["agency_band"] == "medium"


def test_agency_score_is_bounded() -> None:
    for scenario in (SCENARIO_AI_LED, SCENARIO_MIXED, SCENARIO_USER_LED):
        result = _score_bundle(scenario)
        assert 0 <= result["agency"]["agency_score"] <= 100

