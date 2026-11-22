from datetime import UTC, datetime


def utc_now() -> datetime:
    """Return a timezone-aware timestamp in UTC."""
    return datetime.now(UTC)
