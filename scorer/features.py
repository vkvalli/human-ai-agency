"""Behavioral feature extraction for the agency scorer."""

from __future__ import annotations

from collections import Counter
from dataclasses import dataclass
import re
from typing import Any, Mapping, Optional


@dataclass(frozen=True)
class InteractionFeatures:
    """Features derived from a single interaction event."""

    latency_ms: int
    accept_count: int
    reject_count: int
    regen_count: int
    confidence: Optional[float]
    ai_text: str
    final_text: str
    intent_text: Optional[str]
    adoption_ratio: float
    manual_addition_ratio: float
    delete_ratio: float
    edit_distance_ratio: float
    quick_accept: bool


def _clamp01(value: float) -> float:
    return min(max(value, 0.0), 1.0)


def normalize(text: Optional[str]) -> str:
    """Normalize text before token-level comparisons."""
    text = (text or "").lower()
    text = re.sub(r"[^\w\s]", "", text)
    return " ".join(text.split())


def _tokenize(text: Optional[str]) -> list[str]:
    normalized = normalize(text)
    if not normalized:
        return []
    return normalized.split(" ")


def _levenshtein_distance(a: str, b: str) -> int:
    if a == b:
        return 0
    if not a:
        return len(b)
    if not b:
        return len(a)

    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, start=1):
        curr = [i]
        for j, cb in enumerate(b, start=1):
            insert_cost = curr[j - 1] + 1
            delete_cost = prev[j] + 1
            replace_cost = prev[j - 1] + (0 if ca == cb else 1)
            curr.append(min(insert_cost, delete_cost, replace_cost))
        prev = curr
    return prev[-1]


def compute_edit_distance_ratio(ai_text: Optional[str], final_text: Optional[str]) -> float:
    a = normalize(ai_text)
    b = normalize(final_text)
    denom = max(len(a), len(b), 1)
    dist = _levenshtein_distance(a, b)
    return round(_clamp01(dist / denom), 3)


def compute_adoption_ratio(ai_text: Optional[str], final_text: Optional[str]) -> float:
    ai_tokens = _tokenize(ai_text)
    final_tokens = _tokenize(final_text)
    if not ai_tokens:
        return 0.0

    ai_counter = Counter(ai_tokens)
    final_counter = Counter(final_tokens)
    retained = sum(min(ai_counter[t], final_counter[t]) for t in ai_counter)
    return round(_clamp01(retained / max(len(ai_tokens), 1)), 3)


def compute_manual_addition_ratio(ai_text: Optional[str], final_text: Optional[str]) -> float:
    ai_tokens = _tokenize(ai_text)
    final_tokens = _tokenize(final_text)
    if not final_tokens:
        return 0.0

    ai_counter = Counter(ai_tokens)
    final_counter = Counter(final_tokens)
    novel = sum(max(final_counter[t] - ai_counter[t], 0) for t in final_counter)
    return round(_clamp01(novel / max(len(final_tokens), 1)), 3)


def compute_delete_ratio(ai_text: Optional[str], final_text: Optional[str]) -> float:
    ai_tokens = _tokenize(ai_text)
    final_tokens = _tokenize(final_text)
    if not ai_tokens:
        return 0.0

    ai_counter = Counter(ai_tokens)
    final_counter = Counter(final_tokens)
    deleted = sum(max(ai_counter[t] - final_counter[t], 0) for t in ai_counter)
    return round(_clamp01(deleted / max(len(ai_tokens), 1)), 3)


def _coalesce_int(event: Mapping[str, Any], *keys: str, default: int = 0) -> int:
    for key in keys:
        value = event.get(key)
        if value is None:
            continue
        try:
            return int(value)
        except (TypeError, ValueError):
            continue
    return default


def _coalesce_float(event: Mapping[str, Any], *keys: str) -> Optional[float]:
    for key in keys:
        value = event.get(key)
        if value is None:
            continue
        try:
            return float(value)
        except (TypeError, ValueError):
            continue
    return None


def extract_features(event: Mapping[str, Any]) -> InteractionFeatures:
    """Build normalized feature set from event payload."""
    ai_text = str(event.get("ai_text", "") or "")
    final_text = str(event.get("final_text", "") or "")
    intent_text_raw = event.get("intent_text")
    intent_text = str(intent_text_raw) if intent_text_raw is not None else None

    latency_ms = _coalesce_int(
        event,
        "latency_ms",
        "accept_latency_ms",
        "decision_latency_ms",
        "time_to_decision_ms",
    )
    accept_count = _coalesce_int(event, "accept_count", "accepted_count")
    reject_count = _coalesce_int(event, "reject_count", "rejected_count")
    regen_count = _coalesce_int(event, "regen_count", "regeneration_count", "num_regenerations")

    if accept_count == 0 and bool(event.get("accepted") or event.get("was_accepted")):
        accept_count = 1
    if reject_count == 0 and bool(event.get("rejected") or event.get("was_rejected")):
        reject_count = 1

    confidence = _coalesce_float(event, "confidence", "self_confidence")
    if confidence is not None:
        confidence = _clamp01(confidence)

    adoption_ratio = compute_adoption_ratio(ai_text, final_text)
    manual_addition_ratio = compute_manual_addition_ratio(ai_text, final_text)
    delete_ratio = compute_delete_ratio(ai_text, final_text)
    edit_distance_ratio = compute_edit_distance_ratio(ai_text, final_text)

    quick_accept = bool(accept_count > 0 and regen_count == 0 and latency_ms <= 3000)

    return InteractionFeatures(
        latency_ms=latency_ms,
        accept_count=accept_count,
        reject_count=reject_count,
        regen_count=regen_count,
        confidence=confidence,
        ai_text=ai_text,
        final_text=final_text,
        intent_text=intent_text,
        adoption_ratio=adoption_ratio,
        manual_addition_ratio=manual_addition_ratio,
        delete_ratio=delete_ratio,
        edit_distance_ratio=edit_distance_ratio,
        quick_accept=quick_accept,
    )
