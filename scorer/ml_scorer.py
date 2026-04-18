"""Optional ML scorer placeholder (demoted from primary path)."""

from __future__ import annotations


def score_ml(*_args, **_kwargs) -> dict:
    return {
        "enabled": False,
        "message": "ML scorer is optional and not used in demo primary flow.",
    }

