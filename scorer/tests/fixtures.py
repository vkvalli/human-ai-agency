"""Canonical scorer test fixtures."""

from __future__ import annotations

from scorer.features import InteractionFeatures


SCENARIO_AI_LED = InteractionFeatures(
    latency_ms=900,
    accept_count=1,
    reject_count=0,
    regen_count=0,
    confidence=0.95,
    ai_text="Here is a polished email asking for extension.",
    final_text="Here is a polished email asking for extension.",
    intent_text=None,
    adoption_ratio=0.95,
    manual_addition_ratio=0.03,
    delete_ratio=0.02,
    edit_distance_ratio=0.02,
    quick_accept=True,
)

SCENARIO_USER_LED = InteractionFeatures(
    latency_ms=22000,
    accept_count=0,
    reject_count=1,
    regen_count=2,
    confidence=0.70,
    ai_text="The strategy should be short and generic.",
    final_text="I will keep my own reasoning and explain tradeoffs in detail.",
    intent_text="I want this response to preserve my own reasoning.",
    adoption_ratio=0.18,
    manual_addition_ratio=0.66,
    delete_ratio=0.55,
    edit_distance_ratio=0.72,
    quick_accept=False,
)

SCENARIO_MIXED = InteractionFeatures(
    latency_ms=6500,
    accept_count=1,
    reject_count=0,
    regen_count=1,
    confidence=0.55,
    ai_text="Please accept this concise draft.",
    final_text="Please accept this draft, with my own explanation added.",
    intent_text="I want this to stay concise but still sound like me.",
    adoption_ratio=0.78,
    manual_addition_ratio=0.22,
    delete_ratio=0.12,
    edit_distance_ratio=0.20,
    quick_accept=False,
)
