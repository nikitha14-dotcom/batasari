import pytest


@pytest.fixture(autouse=True)
def development_environment(monkeypatch):
    """Run every test as if in development.

    The `x-test-user-id` impersonation header is only honoured when
    ENVIRONMENT=development (see AuthMiddleware). Tests rely on that header, so
    they need the same environment. This is deliberately a fixture rather than a
    default in the app: the header must stay off unless something explicitly
    turns it on.
    """
    monkeypatch.setenv("ENVIRONMENT", "development")


@pytest.fixture(autouse=True)
def isolated_insight_store(monkeypatch):
    """Keep unit tests from reading or writing a configured shared Supabase."""
    from app.gateway.insight_store import InMemoryInsightStore
    from app.main import app

    monkeypatch.setattr(
        app.state,
        "insight_store",
        InMemoryInsightStore(),
        raising=False,
    )

