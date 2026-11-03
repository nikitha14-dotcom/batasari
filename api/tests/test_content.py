from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.static_content_cache import StaticContentCache


class FakeResult:
    def __init__(self, data):
        self.data = data


class FakeStaticContentTable:
    def __init__(self, rows):
        self.rows = rows
        self.filters = {}
        self.execute_count = 0

    def select(self, *_args):
        return self

    def eq(self, field, value):
        self.filters[field] = value
        return self

    def order(self, field):
        self.orders = getattr(self, "orders", []) + [field]
        return self

    def execute(self):
        self.execute_count += 1
        rows = [
            row
            for row in self.rows
            if row["category"] == self.filters["category"]
            and row["subcategory"] == self.filters["subcategory"]
        ]
        for field in reversed(getattr(self, "orders", [])):
            rows.sort(key=lambda row: row.get(field, ""))
        return FakeResult(rows)


def _mock_supabase(rows):
    table = FakeStaticContentTable(rows)
    sb = MagicMock()
    sb.table.return_value = table
    return sb, table


@pytest.fixture(autouse=True)
def preserve_app_state():
    had_supabase = hasattr(app.state, "supabase")
    previous_supabase = getattr(app.state, "supabase", None)
    previous_cache = getattr(app.state, "static_content_cache", None)

    yield

    if had_supabase:
        app.state.supabase = previous_supabase
    elif hasattr(app.state, "supabase"):
        del app.state.supabase
    app.state.static_content_cache = previous_cache


def test_get_content_returns_ordered_sections():
    rows = [
        {
            "category": "Housing",
            "subcategory": "Find Housing",
            "section_key": "where-to-look",
            "title": "Where to look",
            "body_markdown": "Start with trusted sources.",
            "display_order": 2,
            "updated_at": "2026-09-08T00:00:00Z",
            "source": {
                "name": "City of Toronto",
                "url": "https://www.toronto.ca/",
                "authority_tier": "A",
                "jurisdiction": "Toronto",
            },
        },
        {
            "category": "Housing",
            "subcategory": "Find Housing",
            "section_key": "choose-housing-type",
            "title": "Choose the right type of housing",
            "body_markdown": "Compare temporary, short-term, and long-term options.",
            "display_order": 1,
            "updated_at": "2026-09-08T00:00:00Z",
            "source": None,
        },
    ]
    sb, table = _mock_supabase(rows)
    app.state.supabase = sb
    app.state.static_content_cache = StaticContentCache()
    client = TestClient(app)

    response = client.get("/content?category=Housing&subcategory=Find%20Housing")

    assert response.status_code == 200
    body = response.json()
    assert body["category"] == "Housing"
    assert body["subcategory"] == "Find Housing"
    assert [section["section_key"] for section in body["sections"]] == [
        "choose-housing-type",
        "where-to-look",
    ]
    assert body["sections"][1]["source"]["authority_tier"] == "A"
    assert table.orders == ["display_order", "section_key"]


def test_get_content_tie_breaks_by_section_key():
    rows = [
        {
            "category": "Housing",
            "subcategory": "Find Housing",
            "section_key": "beta",
            "title": "Beta",
            "body_markdown": "x",
            "display_order": 1,
            "updated_at": None,
            "source": None,
        },
        {
            "category": "Housing",
            "subcategory": "Find Housing",
            "section_key": "alpha",
            "title": "Alpha",
            "body_markdown": "y",
            "display_order": 1,
            "updated_at": None,
            "source": None,
        },
    ]
    sb, _table = _mock_supabase(rows)
    app.state.supabase = sb
    app.state.static_content_cache = StaticContentCache()
    client = TestClient(app)

    response = client.get("/content?category=Housing&subcategory=Find%20Housing")

    assert response.status_code == 200
    assert [section["section_key"] for section in response.json()["sections"]] == [
        "alpha",
        "beta",
    ]


def test_get_content_uses_cache_for_repeated_request():
    rows = [
        {
            "category": "Housing",
            "subcategory": "Compare",
            "section_key": "commute",
            "title": "Commute",
            "body_markdown": "Check commute options.",
            "display_order": 1,
            "updated_at": None,
            "source": None,
        }
    ]
    sb, table = _mock_supabase(rows)
    app.state.supabase = sb
    app.state.static_content_cache = StaticContentCache()
    client = TestClient(app)

    first = client.get("/content?category=Housing&subcategory=Compare")
    second = client.get("/content?category=Housing&subcategory=Compare")

    assert first.status_code == 200
    assert second.status_code == 200
    assert table.execute_count == 1


def test_get_content_cache_keeps_categories_separate():
    rows = [
        {
            "category": category,
            "subcategory": "Resources",
            "section_key": f"{category.lower()}-resources",
            "title": f"{category} resources",
            "body_markdown": "Start with trusted sources.",
            "display_order": 1,
            "updated_at": None,
            "source": None,
        }
        for category in ("Housing", "Work")
    ]
    sb, table = _mock_supabase(rows)
    app.state.supabase = sb
    app.state.static_content_cache = StaticContentCache()
    client = TestClient(app)

    housing = client.get("/content?category=Housing&subcategory=Resources")
    work = client.get("/content?category=Work&subcategory=Resources")
    work_again = client.get("/content?category=Work&subcategory=Resources")

    assert housing.json()["sections"][0]["section_key"] == "housing-resources"
    assert work.json()["sections"][0]["section_key"] == "work-resources"
    assert work_again.json() == work.json()
    assert table.execute_count == 2


def test_get_content_cache_is_case_sensitive_like_the_query():
    """Regression: the cache key used to casefold while Postgres eq() does not,
    so a lowercase-first request cached an EMPTY section list that then served
    proper-case requests for the whole TTL. Key and query must both be
    case-sensitive; a lowercase request is a cache miss and returns no rows."""
    rows = [
        {
            "category": "Housing",
            "subcategory": "Compare",
            "section_key": "commute",
            "title": "Commute",
            "body_markdown": "Check commute options.",
            "display_order": 1,
            "updated_at": None,
            "source": None,
        }
    ]
    sb, table = _mock_supabase(rows)
    app.state.supabase = sb
    app.state.static_content_cache = StaticContentCache()
    client = TestClient(app)

    proper = client.get("/content?category=Housing&subcategory=Compare")

    assert proper.status_code == 200
    assert len(proper.json()["sections"]) == 1
    assert table.execute_count == 1

    wrong_case = client.get("/content?category=housing&subcategory=compare")

    assert wrong_case.status_code == 200
    assert wrong_case.json()["sections"] == []
    assert table.execute_count == 2


def test_get_content_does_not_cache_empty_results():
    rows = [
        {
            "category": "Housing",
            "subcategory": "Compare Housing Options",
            "section_key": "commute",
            "title": "Commute",
            "body_markdown": "Check commute options.",
            "display_order": 1,
            "updated_at": None,
            "source": None,
        }
    ]
    sb, table = _mock_supabase(rows)
    app.state.supabase = sb
    app.state.static_content_cache = StaticContentCache()
    client = TestClient(app)

    first = client.get("/content?category=Housing&subcategory=Missing")
    second = client.get("/content?category=Housing&subcategory=Missing")

    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["sections"] == []
    assert second.json()["sections"] == []
    assert table.execute_count == 2


def test_cache_evicts_oldest_item_when_max_size_is_reached():
    cache = StaticContentCache(ttl_seconds=300, max_items=1)
    cache.set("Housing", "Find Housing", {"sections": [{"section_key": "a"}]})
    cache.set("Housing", "Compare Housing Options", {"sections": [{"section_key": "b"}]})

    assert cache.get("Housing", "Find Housing") is None
    assert cache.get("Housing", "Compare Housing Options") is not None


def test_cache_expiry_and_clear():
    cache = StaticContentCache(ttl_seconds=0)
    cache.set("Housing", "Compare", {"sections": []})
    assert cache.get("Housing", "Compare") is None

    cache2 = StaticContentCache(ttl_seconds=300)
    cache2.set("Housing", "Compare", {"sections": []})
    assert cache2.get("Housing", "Compare") is not None
    cache2.clear()
    assert cache2.get("Housing", "Compare") is None


def test_get_content_requires_supabase_when_not_cached():
    if hasattr(app.state, "supabase"):
        del app.state.supabase
    app.state.static_content_cache = StaticContentCache()
    client = TestClient(app)

    response = client.get("/content?category=Housing&subcategory=Compare")

    assert response.status_code == 503
    assert response.json()["detail"] == "Supabase is not configured"

