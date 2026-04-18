"""Expanded evaluation set for scorer behavior validation."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import pytest

from scorer.features import normalize
from scorer.scorer_api import EventPayload, score
import scorer.text_analysis as text_analysis


@dataclass(frozen=True)
class EvalCase:
    name: str
    payload: dict[str, Any]
    expected_agency_band: str | None = None
    expected_reliance_band: str | None = None
    expected_driver_substrings: tuple[str, ...] = ()
    forbidden_driver_substrings: tuple[str, ...] = ()
    use_text_analysis: bool = True


EVAL_CASES: tuple[EvalCase, ...] = (
    # Group A - anchors
    EvalCase(
        name="case_01_exact_copy_instant_accept",
        payload={
            "ai_text": "Here is a polished extension request email that stays concise and professional.",
            "final_text": "Here is a polished extension request email that stays concise and professional.",
            "latency_ms": 800,
            "accepted": True,
            "regen_count": 0,
        },
        expected_agency_band="low",
        expected_reliance_band="high",
        expected_driver_substrings=("quick acceptance", "high ai adoption"),
    ),
    EvalCase(
        name="case_02_exact_copy_slow_review",
        payload={
            "ai_text": "Here is a polished extension request email that stays concise and professional.",
            "final_text": "Here is a polished extension request email that stays concise and professional.",
            "latency_ms": 18000,
            "accepted": True,
            "regen_count": 0,
        },
        expected_reliance_band="high",
        expected_driver_substrings=("high ai adoption",),
    ),
    EvalCase(
        name="case_03_major_manual_rewrite",
        payload={
            "ai_text": "The recommendation is to keep your response short and generic.",
            "final_text": "I disagree with this approach. I will present my own reasoning, tradeoffs, and concrete plan.",
            "latency_ms": 20000,
            "accepted": False,
            "rejected": True,
            "regen_count": 1,
            "intent_text": "I want this response to preserve my own reasoning.",
        },
        expected_agency_band="high",
        expected_reliance_band="low",
        expected_driver_substrings=("manual additions",),
    ),
    EvalCase(
        name="case_04_moderate_adaptation",
        payload={
            "ai_text": "Please send this brief project update to your team.",
            "final_text": "Please send this project update to your team, and include blockers and next steps.",
            "latency_ms": 7000,
            "accepted": True,
            "regen_count": 1,
        },
        expected_agency_band="medium",
        expected_reliance_band="medium",
    ),
    # Group B - thresholds and mixed behavior
    EvalCase(
        name="case_05_quick_accept_boundary_2990",
        payload={
            "ai_text": "Use this direct response template for your client update.",
            "final_text": "Use this direct response template for your client update.",
            "latency_ms": 2990,
            "accepted": True,
            "regen_count": 0,
        },
        expected_reliance_band="high",
    ),
    EvalCase(
        name="case_06_quick_accept_boundary_3010",
        payload={
            "ai_text": "Use this direct response template for your client update.",
            "final_text": "Use this direct response template for your client update.",
            "latency_ms": 3010,
            "accepted": True,
            "regen_count": 0,
        },
        expected_reliance_band="high",
    ),
    EvalCase(
        name="case_07_high_adoption_with_deletion",
        payload={
            "ai_text": "Draft status update includes timeline budget risk mitigation and next sprint planning details.",
            "final_text": "Draft status update includes timeline budget and planning.",
            "latency_ms": 8000,
            "accepted": True,
            "regen_count": 1,
        },
        expected_reliance_band="medium",
        expected_driver_substrings=("removed",),
    ),
    EvalCase(
        name="case_08_high_adoption_with_manual_additions",
        payload={
            "ai_text": "Please acknowledge the issue and promise a fix by Friday.",
            "final_text": (
                "Please acknowledge the issue and promise a fix by Friday. "
                "Also explain root cause, customer impact, and preventive steps."
            ),
            "latency_ms": 9000,
            "accepted": True,
            "regen_count": 1,
        },
        expected_agency_band="medium",
        expected_reliance_band="medium",
        expected_driver_substrings=("manual additions",),
    ),
    # Group C - intent preservation
    EvalCase(
        name="case_09_intent_preserved",
        payload={
            "ai_text": "Sorry for the delay. We can still deliver quickly.",
            "final_text": "I am sorry for the delay, and I remain confident we can deliver on time with your priorities covered.",
            "intent_text": "I want this email to sound apologetic but confident.",
            "latency_ms": 6000,
            "accepted": True,
            "regen_count": 1,
        },
        expected_reliance_band="medium",
    ),
    EvalCase(
        name="case_10_intent_violated",
        payload={
            "ai_text": "Project status update complete.",
            "final_text": "Project status update complete.",
            "intent_text": "I want this email to sound apologetic but confident.",
            "latency_ms": 6000,
            "accepted": True,
            "regen_count": 1,
        },
        expected_agency_band="medium",
        expected_reliance_band="high",
    ),
    EvalCase(
        name="case_11_missing_intent_text",
        payload={
            "ai_text": "Sorry for the delay. We can still deliver quickly.",
            "final_text": "I am sorry for the delay, and I remain confident we can deliver on time with your priorities covered.",
            "latency_ms": 6000,
            "accepted": True,
            "regen_count": 1,
        },
        expected_reliance_band="medium",
        forbidden_driver_substrings=("intent well-preserved",),
    ),
    # Group D - robustness
    EvalCase(
        name="case_12_empty_ai_text",
        payload={
            "ai_text": "",
            "final_text": "I wrote this message manually and provided my own reasoning and structure.",
            "latency_ms": 12000,
            "accepted": False,
            "rejected": True,
            "regen_count": 0,
        },
    ),
    EvalCase(
        name="case_13_empty_final_text",
        payload={
            "ai_text": "This is a full suggested answer that the user may choose to reject.",
            "final_text": "",
            "latency_ms": 15000,
            "accepted": False,
            "rejected": True,
            "regen_count": 0,
        },
    ),
    EvalCase(
        name="case_14_punctuation_and_case_only",
        payload={
            "ai_text": "Hello, WORLD!!",
            "final_text": "hello world",
            "latency_ms": 1000,
            "accepted": True,
            "regen_count": 0,
        },
        expected_agency_band="low",
        expected_reliance_band="high",
    ),
    EvalCase(
        name="case_15_text_analysis_unavailable",
        payload={
            "ai_text": "Please send this brief project update to your team.",
            "final_text": "Please send this project update to your team, and include blockers and next steps.",
            "latency_ms": 7000,
            "accepted": True,
            "regen_count": 1,
        },
        expected_agency_band="medium",
        expected_reliance_band="medium",
        use_text_analysis=False,
    ),
)


@pytest.fixture(autouse=True)
def deterministic_text_similarity(monkeypatch: pytest.MonkeyPatch) -> None:
    """Avoid network/model dependency by using deterministic lexical similarity."""

    def _fake_similarity(text_a: str, text_b: str) -> float | None:
        if not text_a or not text_b:
            return None
        tokens_a = set(normalize(text_a).split())
        tokens_b = set(normalize(text_b).split())
        if not tokens_a or not tokens_b:
            return 0.0
        return len(tokens_a & tokens_b) / max(len(tokens_a), len(tokens_b))

    monkeypatch.setattr(text_analysis, "_embedding_similarity", _fake_similarity)


def _score_payload(
    case: EvalCase,
    monkeypatch: pytest.MonkeyPatch,
) -> dict[str, Any]:
    monkeypatch.setenv("USE_TEXT_ANALYSIS", "true" if case.use_text_analysis else "false")
    result = score(EventPayload(**case.payload))
    return result.model_dump() if hasattr(result, "model_dump") else result.dict()


@pytest.mark.parametrize("case", EVAL_CASES, ids=[case.name for case in EVAL_CASES])
def test_evaluation_set_cases(case: EvalCase, monkeypatch: pytest.MonkeyPatch) -> None:
    result = _score_payload(case, monkeypatch)

    assert 0 <= result["agency_score"] <= 100
    assert 0.0 <= result["reliance_risk"] <= 1.0
    assert isinstance(result["drivers"], list)

    if case.expected_agency_band is not None:
        assert result["agency_band"] == case.expected_agency_band
    if case.expected_reliance_band is not None:
        assert result["reliance_band"] == case.expected_reliance_band

    driver_text = " | ".join(result["drivers"]).lower()
    for snippet in case.expected_driver_substrings:
        assert snippet.lower() in driver_text
    for snippet in case.forbidden_driver_substrings:
        assert snippet.lower() not in driver_text

    if not case.use_text_analysis:
        assert result["text_scores"] == {}


def test_evaluation_set_relative_comparisons(monkeypatch: pytest.MonkeyPatch) -> None:
    cases_by_name = {case.name: case for case in EVAL_CASES}
    results = {name: _score_payload(case, monkeypatch) for name, case in cases_by_name.items()}

    assert results["case_01_exact_copy_instant_accept"]["agency_score"] < results["case_02_exact_copy_slow_review"][
        "agency_score"
    ]
    assert results["case_03_major_manual_rewrite"]["agency_score"] > results["case_04_moderate_adaptation"][
        "agency_score"
    ]
    assert results["case_09_intent_preserved"]["agency_score"] > results["case_10_intent_violated"]["agency_score"]

    # Punctuation/case-only should behave close to exact-copy quick accept.
    score_delta = abs(
        results["case_14_punctuation_and_case_only"]["agency_score"]
        - results["case_01_exact_copy_instant_accept"]["agency_score"]
    )
    assert score_delta <= 10

    # Quick-accept threshold boundary should move risk in the expected direction.
    assert (
        results["case_05_quick_accept_boundary_2990"]["reliance_risk"]
        > results["case_06_quick_accept_boundary_3010"]["reliance_risk"]
    )
