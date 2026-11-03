from types import SimpleNamespace

from app.gateway.insight_store import SupabaseInsightStore


class Query:
    def __init__(self, data=None):
        self.data = data or []
        self.operations = []

    def select(self, columns):
        self.operations.append(("select", columns))
        return self

    def eq(self, column, value):
        self.operations.append(("eq", column, value))
        return self

    def limit(self, value):
        self.operations.append(("limit", value))
        return self

    def order(self, column):
        self.operations.append(("order", column))
        return self

    def upsert(self, row, *, on_conflict):
        self.operations.append(("upsert", row, on_conflict))
        return self

    def delete(self):
        self.operations.append(("delete",))
        return self

    def execute(self):
        self.operations.append(("execute",))
        return SimpleNamespace(data=self.data)


class Supabase:
    def __init__(self, data=None):
        self.query = Query(data)
        self.tables = []

    def table(self, name):
        self.tables.append(name)
        return self.query


def test_loads_and_saves_durable_insights():
    supabase = Supabase([{"insights": {"housing": "condo"}}])
    store = SupabaseInsightStore(supabase)

    assert store.load_insights("u1", "Housing") == {"housing": "condo"}
    store.save_insights("u1", "Housing", {"housing": "house"})

    assert supabase.tables == ["user_insights", "user_insights"]
    assert (
        "upsert",
        {"user_id": "u1", "category": "Housing", "insights": {"housing": "house"}},
        "user_id,category",
    ) in supabase.query.operations


def test_deletes_all_or_one_category_of_insights():
    supabase = Supabase()
    store = SupabaseInsightStore(supabase)

    store.delete_insights("u1", category="Housing")

    assert ("delete",) in supabase.query.operations
    assert ("eq", "user_id", "u1") in supabase.query.operations
    assert ("eq", "category", "Housing") in supabase.query.operations


def test_reads_conversation_rows_without_creating_a_second_raw_message_store():
    supabase = Supabase(
        [
            {
                "question": "Where should I live?",
                "answer": "Start with your commute.",
                "created_at": "2026-09-29T12:00:00Z",
            }
        ]
    )
    store = SupabaseInsightStore(supabase)

    messages = store.load_conversation("u1", "Housing", "conversation-1")
    before = list(supabase.query.operations)
    store.save_message("u1", "Housing", "conversation-1", "user", "duplicate")

    assert messages == [
        {"role": "user", "content": "Where should I live?", "metadata": {}},
        {"role": "assistant", "content": "Start with your commute.", "metadata": {}},
    ]
    assert supabase.query.operations == before

