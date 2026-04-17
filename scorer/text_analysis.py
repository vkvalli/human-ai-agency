"""Shared text-analysis layer for intent and rewrite signals."""

from __future__ import annotations

from typing import Optional


def _clamp01(value: float) -> float:
    return min(max(value, 0.0), 1.0)


try:
    from sentence_transformers import SentenceTransformer, util

    _MODEL = SentenceTransformer("all-MiniLM-L6-v2")
except Exception:
    _MODEL = None
    util = None


def _embedding_similarity(text_a: str, text_b: str) -> Optional[float]:
    if not text_a or not text_b or _MODEL is None or util is None:
        return None
    embeddings = _MODEL.encode([text_a, text_b], convert_to_tensor=True)
    cosine = float(util.cos_sim(embeddings[0], embeddings[1]).item())
    return _clamp01((cosine + 1.0) / 2.0)


def intent_preservation_score(intent_text: Optional[str], final_text: Optional[str]) -> Optional[float]:
    if not intent_text or not final_text:
        return None
    sim = _embedding_similarity(intent_text, final_text)
    if sim is None:
        return None
    return round(sim, 3)


def rewrite_depth_score(
    ai_text: Optional[str],
    final_text: Optional[str],
    edit_distance_ratio: float,
    manual_addition_ratio: float,
    delete_ratio: float,
) -> Optional[float]:
    if not ai_text or not final_text:
        return round(_clamp01(edit_distance_ratio), 3)

    sim = _embedding_similarity(ai_text, final_text)
    sem_diff = 1.0 - sim if sim is not None else _clamp01(edit_distance_ratio)
    len_sim = min(len(ai_text), len(final_text)) / max(len(ai_text), len(final_text), 1)
    len_diff = 1.0 - len_sim

    score = (
        0.35 * sem_diff
        + 0.25 * _clamp01(edit_distance_ratio)
        + 0.20 * _clamp01(manual_addition_ratio)
        + 0.10 * _clamp01(delete_ratio)
        + 0.10 * _clamp01(len_diff)
    )
    return round(_clamp01(score), 3)


def ai_origin_estimate(
    rewrite_depth: Optional[float],
    intent_preservation: Optional[float],
    adoption_ratio: float,
) -> Optional[float]:
    if rewrite_depth is None:
        return None

    base = (1.0 - _clamp01(rewrite_depth)) * 0.5 + _clamp01(adoption_ratio) * 0.5
    if intent_preservation is not None:
        base = base * 0.8 + (1.0 - _clamp01(intent_preservation)) * 0.2
    return round(_clamp01(base), 3)


def analyze_text_scores(
    *,
    ai_text: Optional[str],
    final_text: Optional[str],
    intent_text: Optional[str],
    edit_distance_ratio: float,
    manual_addition_ratio: float,
    delete_ratio: float,
    adoption_ratio: float,
) -> dict[str, Optional[float]]:
    """Return additive text-analysis scores; never raise for missing text."""
    intent = intent_preservation_score(intent_text, final_text)
    rewrite = rewrite_depth_score(
        ai_text=ai_text,
        final_text=final_text,
        edit_distance_ratio=edit_distance_ratio,
        manual_addition_ratio=manual_addition_ratio,
        delete_ratio=delete_ratio,
    )
    origin = ai_origin_estimate(
        rewrite_depth=rewrite,
        intent_preservation=intent,
        adoption_ratio=adoption_ratio,
    )
    return {
        "intent_preservation": intent,
        "rewrite_depth": rewrite,
        "ai_origin": origin,
    }

