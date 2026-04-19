"""Database integration layer for backend persistence."""

from scorer.database.neon_client import NeonRepository, ScorePersistenceRecord

__all__ = ["NeonRepository", "ScorePersistenceRecord"]
