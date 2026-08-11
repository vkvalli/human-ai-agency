"""Semantic intent classification for AI-assisted prompts.

Classifies a user's message against a growable bank of reference examples per
category, using sentence embeddings rather than keyword matching. New
confirmed examples can be added at runtime (see `add_example`), so accuracy
improves the more the system is corrected — a lightweight, explainable form
of learning that doesn't require a training pipeline or labeled dataset
up front.
"""

from __future__ import annotations

import json
import logging
import threading
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

EXAMPLES_PATH = Path(__file__).parent / "data" / "intent_examples.json"

POSITIVE_CATEGORIES = ("brainstorm", "explain", "feedback", "hint", "organize")
NEGATIVE_CATEGORIES = ("full_assignment",)

CONFIDENCE_THRESHOLD = 0.5

_SEED_EXAMPLES: dict[str, list[str]] = {
    "brainstorm": [
        "Can you give me some ideas for my project topic?",
        "What are some possible angles I could take for this essay?",
        "Suggest a few directions I could explore for this presentation.",
        "Help me think of ideas for my science fair project.",
        "What topics could I write about for this assignment?",
        "Can you brainstorm some names for my startup?",
        "What are some directions I could take for my thesis?",
        "Give me a few possible themes for my research paper.",
        "What angles haven't I considered for this report?",
        "Can you list some possible approaches to this problem?",
    ],
    "explain": [
        "Can you explain how recursion works?",
        "What does this concept mean in simple terms?",
        "How does photosynthesis work?",
        "Walk me through how neural networks learn.",
        "Can you clarify what this error message means?",
        "What's the difference between a stack and a queue?",
        "Can you break down why this happens?",
        "Help me understand this theorem step by step.",
        "Why does this error occur?",
        "Why is my code throwing this exception?",
        "What causes this behavior?",
    ],
    "feedback": [
        "Can you give me feedback on my essay introduction?",
        "What do you think of this paragraph I wrote?",
        "Please review my code and tell me what could be improved.",
        "Is this argument convincing? What's weak about it?",
        "Does this explanation make sense the way I wrote it?",
        "How can I improve my cover letter?",
        "Could you take a look at my draft and tell me what needs work?",
        "Can you check this and point out any issues?",
        "What's wrong with my approach here?",
        "Does my thesis statement hold up?",
    ],
    "hint": [
        "I'm stuck on this problem, can you give me a hint?",
        "Without giving me the answer, what should I try next?",
        "Can you nudge me in the right direction on this bug?",
        "Give me a small hint, not the full solution.",
        "What concept am I missing here? Just point me toward it.",
        "I don't want the answer, just a push in the right direction.",
        "I am completely stuck, nudge me toward the right approach without solving it.",
    ],
    "organize": [
        "Help me organize these notes into an outline.",
        "Can you help me structure my research into sections?",
        "Arrange these ideas into a logical order.",
        "Help me turn these scattered thoughts into a clear plan.",
        "Can you help me group these points by theme?",
        "Turn my bullet points into a structured outline.",
        "Turn this messy pile of notes into a clean structure.",
    ],
    "full_assignment": [
        "Write my entire essay for me.",
        "Can you do my homework for me tonight?",
        "Complete this assignment for me, I don't have time.",
        "Just write the whole report, I'll submit it as is.",
        "Write my whole thesis chapter for me, start to finish.",
        "Finish this take-home exam for me.",
        "Could you just finish this whole report for me by tonight?",
        "Write the full paper for me, I'll just submit it.",
        "Do this entire project for me, I don't want to do any of it.",
        "Can you just handle this whole essay from start to finish?",
        "Take care of this entire assignment for me.",
        "I need you to write all of it, not just help.",
    ],
}

_lock = threading.Lock()
_examples: dict[str, list[str]] = {}
_embeddings_cache: dict[str, list] = {}


def _polarity_of(category: str) -> str:
    return "negative" if category in NEGATIVE_CATEGORIES else "positive"


def _load_examples() -> dict[str, list[str]]:
    if EXAMPLES_PATH.exists():
        try:
            data = json.loads(EXAMPLES_PATH.read_text(encoding="utf-8"))
            merged = {k: list(v) for k, v in _SEED_EXAMPLES.items()}
            for category, texts in data.items():
                merged.setdefault(category, [])
                for text in texts:
                    if text not in merged[category]:
                        merged[category].append(text)
            return merged
        except Exception:  # pragma: no cover - corrupt file fallback
            logger.warning("Failed to read intent_examples.json, using seed set only")
    return {k: list(v) for k, v in _SEED_EXAMPLES.items()}


def _save_examples(examples: dict[str, list[str]]) -> None:
    EXAMPLES_PATH.parent.mkdir(parents=True, exist_ok=True)
    EXAMPLES_PATH.write_text(json.dumps(examples, indent=2), encoding="utf-8")


def _get_model():
    from scorer.text_analysis import _MODEL  # lazy import, shares the loaded model

    return _MODEL


def _ensure_loaded() -> None:
    global _examples
    with _lock:
        if not _examples:
            _examples = _load_examples()
            _embeddings_cache.clear()


def _embed_examples(model) -> dict[str, object]:
    with _lock:
        for category, texts in _examples.items():
            if not texts:
                continue
            if category not in _embeddings_cache:
                _embeddings_cache[category] = model.encode(texts, convert_to_tensor=True)
        return _embeddings_cache


def classify_intent(text: str) -> dict[str, Optional[object]]:
    """Classify a prompt's intent via nearest-neighbor semantic similarity."""
    normalized = (text or "").strip()
    if not normalized:
        return {"intent": None, "polarity": None, "confidence": 0.0}

    model = _get_model()
    if model is None:
        return {"intent": None, "polarity": None, "confidence": 0.0}

    from sentence_transformers import util

    _ensure_loaded()
    embeddings_by_category = _embed_examples(model)
    if not embeddings_by_category:
        return {"intent": None, "polarity": None, "confidence": 0.0}

    query = model.encode(normalized, convert_to_tensor=True)

    best_category: Optional[str] = None
    best_score = 0.0
    for category, embeddings in embeddings_by_category.items():
        scores = util.cos_sim(query, embeddings)[0]
        top = float(scores.max().item())
        if top > best_score:
            best_score = top
            best_category = category

    if best_category is None or best_score < CONFIDENCE_THRESHOLD:
        return {"intent": None, "polarity": None, "confidence": round(best_score, 3)}

    return {
        "intent": best_category,
        "polarity": _polarity_of(best_category),
        "confidence": round(best_score, 3),
    }


def add_example(category: str, text: str) -> bool:
    """Record a confirmed example, growing the reference bank for future calls."""
    normalized = (text or "").strip()
    if not normalized or category not in (*POSITIVE_CATEGORIES, *NEGATIVE_CATEGORIES):
        return False

    _ensure_loaded()
    with _lock:
        _examples.setdefault(category, [])
        if normalized in _examples[category]:
            return True
        _examples[category].append(normalized)
        _save_examples(_examples)
        _embeddings_cache.pop(category, None)
    return True
