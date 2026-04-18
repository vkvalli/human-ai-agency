"""Tests for feature extraction and normalization."""

from scorer.features import (
    compute_adoption_ratio,
    compute_delete_ratio,
    compute_edit_distance_ratio,
    compute_manual_addition_ratio,
    extract_features,
    normalize,
)


def test_normalize_lowercases_strips_punctuation_and_collapses_whitespace() -> None:
    raw = "  Hello,   WORLD!!  "
    assert normalize(raw) == "hello world"


def test_token_ratios_are_reasonable_after_normalization() -> None:
    ai_text = "Hello, world."
    final_text = "hello world plus"
    assert compute_adoption_ratio(ai_text, final_text) == 1.0
    assert compute_manual_addition_ratio(ai_text, final_text) == 0.333
    assert compute_delete_ratio(ai_text, final_text) == 0.0


def test_edit_distance_ratio_is_bounded() -> None:
    ratio = compute_edit_distance_ratio("abc", "xyz")
    assert 0.0 <= ratio <= 1.0


def test_extract_features_sets_quick_accept() -> None:
    payload = {
        "ai_text": "alpha beta",
        "final_text": "alpha beta",
        "latency_ms": 1000,
        "accepted": True,
        "regen_count": 0,
    }
    features = extract_features(payload)
    assert features.quick_accept is True

