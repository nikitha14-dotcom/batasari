import importlib

import dotenv

import app.main as main


def _origins(monkeypatch, value):
    # Reloading app.main re-runs its module-level load_dotenv(), which reads the
    # developer's real .env and overwrites whatever this test just set. Anyone
    # with CORS_ALLOW_ORIGINS in .env -- the normal way to allow a preview
    # origin locally -- would otherwise see this test fail for no reason they
    # could act on. Neutralising load_dotenv keeps the test about the code.
    monkeypatch.setattr(dotenv, "load_dotenv", lambda *args, **kwargs: None)

    if value is None:
        monkeypatch.delenv("CORS_ALLOW_ORIGINS", raising=False)
    else:
        monkeypatch.setenv("CORS_ALLOW_ORIGINS", value)
    return importlib.reload(main)._cors_origins()


def test_unset_falls_back_to_the_default(monkeypatch):
    assert _origins(monkeypatch, None) == ["http://localhost:3000"]


def test_blank_falls_back_instead_of_allowing_nothing(monkeypatch):
    # getenv's default only applies when the variable is absent. A variable set
    # to "" used to produce an empty allow-list, which rejects every browser
    # request while the service still reports healthy.
    assert _origins(monkeypatch, "") == ["http://localhost:3000"]
    assert _origins(monkeypatch, "   ") == ["http://localhost:3000"]


def test_configured_origins_are_split_and_trimmed(monkeypatch):
    assert _origins(monkeypatch, "https://a.example, https://b.example") == [
        "https://a.example",
        "https://b.example",
    ]

