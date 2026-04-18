"""Tests for text-analysis module."""

from scorer.agency_formula import compute_agency_score
from scorer.heuristic_scorer import score_heuristic
from scorer.tests.fixtures import SCENARIO_AI_LED, SCENARIO_MIXED, SCENARIO_USER_LED
from scorer.text_analysis import (
    ai_origin_estimate,
    analyze_text_scores,
    intent_preservation_score,
    rewrite_depth_score,
)


def test_rewrite_depth_identical_texts() -> None:
    score = rewrite_depth_score(
        ai_text="same text",
        final_text="same text",
        edit_distance_ratio=0.0,
        manual_addition_ratio=0.0,
        delete_ratio=0.0,
    )
    assert score is not None
    assert score <= 0.10


def test_rewrite_depth_completely_different() -> None:
    score = rewrite_depth_score(
        ai_text="aaaaa",
        final_text="zzzzz entirely new",
        edit_distance_ratio=1.0,
        manual_addition_ratio=1.0,
        delete_ratio=1.0,
    )
    assert score is not None
    assert score >= 0.80


def test_intent_preservation_returns_none_when_no_intent() -> None:
    assert intent_preservation_score(None, "final text") is None


def test_ai_origin_high_adoption_low_rewrite() -> None:
    est = ai_origin_estimate(
        rewrite_depth=0.1,
        intent_preservation=None,
        adoption_ratio=0.95,
    )
    assert est is not None
    assert est > 0.70


def test_formula_unchanged_without_text_scores() -> None:
    baseline_bands = []
    for scenario in (SCENARIO_AI_LED, SCENARIO_MIXED, SCENARIO_USER_LED):
        reliance = score_heuristic(scenario, text_scores=None)
        agency = compute_agency_score(scenario, reliance["reliance_risk"], text_scores=None)
        baseline_bands.append(agency["agency_band"])

    for scenario in (SCENARIO_AI_LED, SCENARIO_MIXED, SCENARIO_USER_LED):
        text_scores = analyze_text_scores(
            ai_text=scenario.ai_text,
            final_text=scenario.final_text,
            intent_text=scenario.intent_text,
            edit_distance_ratio=scenario.edit_distance_ratio,
            manual_addition_ratio=scenario.manual_addition_ratio,
            delete_ratio=scenario.delete_ratio,
            adoption_ratio=scenario.adoption_ratio,
        )
        reliance = score_heuristic(scenario, text_scores=text_scores)
        agency = compute_agency_score(scenario, reliance["reliance_risk"], text_scores=text_scores)
        assert agency["agency_band"] in {"low", "medium", "high"}

    # Baseline bands are still the canonical expectations.
    assert baseline_bands == ["low", "medium", "high"]

