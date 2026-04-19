"""Contract checks for extension flush endpoint."""

import asyncio

import pytest
from fastapi import HTTPException

from scorer.scorer_api import SessionEventsRequest, session_events


def test_session_events_requires_neon_repo() -> None:
    with pytest.raises(HTTPException) as exc:
        asyncio.run(session_events(SessionEventsRequest(events=[])))

    assert exc.value.status_code == 503
    assert "NEON backend is not configured" in str(exc.value.detail)
