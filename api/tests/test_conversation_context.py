from unittest.mock import MagicMock

from app.routers.ai_answer import MAX_CONTEXT_CHARS, _get_conversation_context


def _sb(rows):
    sb = MagicMock()
    chain = (
        sb.table.return_value.select.return_value.eq.return_value.eq.return_value
        .order.return_value.limit.return_value
    )
    chain.execute.return_value.data = rows
    return sb


def test_returns_recent_questions_oldest_first_without_answers():
    rows = [  # the database returns newest first
        {"question": "tips for viewing a place", "answer": "LONG ANSWER"},
        {"question": "no my budget is 1200", "answer": "LONG ANSWER"},
    ]
    text = _get_conversation_context(_sb(rows), "u1", "Housing")
    assert text == "- no my budget is 1200\n- tips for viewing a place"
    assert "LONG ANSWER" not in text


def test_long_questions_are_cut():
    rows = [{"question": "x" * 1000, "answer": ""}]
    text = _get_conversation_context(_sb(rows), "u1", "Housing")
    assert len(text) == len("- ") + MAX_CONTEXT_CHARS


def test_no_database_means_no_context():
    assert _get_conversation_context(None, "u1", "Housing") == ""


def test_a_failing_lookup_means_no_context():
    sb = MagicMock()
    sb.table.side_effect = RuntimeError("db down")
    assert _get_conversation_context(sb, "u1", "Housing") == ""
