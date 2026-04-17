"""Optional calibration script for proxy-label reliance model."""

from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass
from datetime import datetime
from typing import Any

from scorer.features import InteractionFeatures, extract_features
from scorer.label_logic import derive_label

ACCEPTANCE_WINDOW_OPS = 15
ACCEPTANCE_WINDOW_MS = 8000


@dataclass
class CoAuthorOp:
    op_type: str
    text: str
    timestamp_ms: int


def reconstruct_final_text(ops: Iterable[CoAuthorOp], acceptance_ts_ms: int) -> str:
    """Approximate post-acceptance final text using bounded op window."""
    selected: list[str] = []
    op_count = 0
    end_ts = acceptance_ts_ms + ACCEPTANCE_WINDOW_MS

    for op in ops:
        if op.timestamp_ms < acceptance_ts_ms:
            continue
        if op.timestamp_ms > end_ts or op_count >= ACCEPTANCE_WINDOW_OPS:
            break
        if op.op_type == "insert" and op.text:
            selected.append(op.text)
        op_count += 1
    return "".join(selected)


def build_training_row(event: dict[str, Any]) -> tuple[InteractionFeatures, str]:
    """Create one training row with behavior-derived proxy label."""
    features = extract_features(event)
    # Proxy labels are derived from behavior heuristics, not human ground-truth annotations.
    label = derive_label(features)
    return features, label


def train_model_placeholder(events: list[dict[str, Any]]) -> dict[str, Any]:
    """Scaffold hook: replace with LR/RF training when data pipeline is ready."""
    rows = [build_training_row(e) for e in events]
    return {
        "created_at": datetime.utcnow().isoformat() + "Z",
        "rows_prepared": len(rows),
        "status": "placeholder_no_model_trained",
    }

