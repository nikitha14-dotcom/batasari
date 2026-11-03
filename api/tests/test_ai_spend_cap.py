import json
from unittest.mock import MagicMock, call

import pytest
from fastapi.testclient import TestClient

from app.gateway import runner
from app.main import app
from app.services import spend_cap


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "development")
    monkeypatch.delenv("AI_SPEND_CAP_USD", raising=False)
    monkeypatch.delenv("AI_SPEND_CAP_EXEMPT_USER_IDS", raising=False)
    monkeypatch.setattr(app.state, "rate_limiter", None, raising=False)
    return TestClient(app)


def _supabase_with_spend(spend):
    """A Supabase mock whose ai_spend_by_user lookup returns this spend (None = no row)."""
    sb = MagicMock()
    lookup = sb.table.return_value.select.return_value.eq.return_value.limit.return_value
    lookup.execute.return_value.data = [] if spend is None else [{"spend_usd": spend}]
    return sb


@pytest.fixture
def model_calls(monkeypatch):
    calls = []

    async def _ok(system_prompt, question):
        calls.append(question)
        return {
            "text": "answer",
            "input_tokens": 1,
            "output_tokens": 1,
            "model": "claude-sonnet-4-6",
        }

    monkeypatch.setattr(runner, "call_claude", _ok)
    return calls


def _ask(client):
    response = client.post(
        "/ai/answer",
        json={"question": "q", "category": "Housing", "subcategory": "Find Housing"},
        headers={"x-test-user-id": "u1"},
    )
    return response, response.text


def _error_event(text):
    errors = [e for e in text.split("\n\n") if e.startswith("event: error")]
    assert len(errors) == 1
    return json.loads(errors[0].split("data: ", 1)[1])


@pytest.mark.parametrize("spend", [1.00, 1.37])
def test_a_user_at_or_over_the_cap_gets_a_plain_message_and_no_model_call(
    client, monkeypatch, model_calls, spend
):
    monkeypatch.setattr(app.state, "supabase", _supabase_with_spend(spend), raising=False)

    response, text = _ask(client)

    assert response.status_code == 200
    error = _error_event(text)
    assert error["code"] == "spend_cap_reached"
    assert "free AI credit" in error["message"]
    assert model_calls == []


@pytest.mark.parametrize("spend", [None, 0.0, 0.999])
def test_a_user_under_the_cap_is_answered(client, monkeypatch, model_calls, spend):
    monkeypatch.setattr(app.state, "supabase", _supabase_with_spend(spend), raising=False)

    response, text = _ask(client)

    assert "event: complete" in text
    assert model_calls == ["q"]


def test_the_cap_reads_this_users_row_from_the_spend_view(client, monkeypatch, model_calls):
    sb = _supabase_with_spend(0.5)
    monkeypatch.setattr(app.state, "supabase", sb, raising=False)

    _ask(client)

    sb.table.assert_any_call("ai_spend_by_user")
    sb.table.return_value.select.return_value.eq.assert_any_call("user_id", "u1")


def test_a_failed_spend_lookup_still_answers(client, monkeypatch, model_calls):
    sb = _supabase_with_spend(0.0)
    lookup = sb.table.return_value.select.return_value.eq.return_value.limit.return_value
    lookup.execute.side_effect = RuntimeError("database unavailable")
    monkeypatch.setattr(app.state, "supabase", sb, raising=False)

    response, text = _ask(client)

    assert "event: complete" in text
    assert model_calls == ["q"]


def test_the_cap_is_configurable(client, monkeypatch, model_calls):
    monkeypatch.setattr(app.state, "supabase", _supabase_with_spend(0.30), raising=False)
    monkeypatch.setenv("AI_SPEND_CAP_USD", "0.25")

    _, text = _ask(client)

    assert _error_event(text)["code"] == "spend_cap_reached"
    assert model_calls == []


def test_spend_sent_as_a_string_is_read(client, monkeypatch, model_calls):
    monkeypatch.setattr(app.state, "supabase", _supabase_with_spend("1.20"), raising=False)

    _, text = _ask(client)

    assert _error_event(text)["code"] == "spend_cap_reached"


def test_exempt_user_skips_the_beta_and_spend_checks(client, monkeypatch, model_calls):
    sb = _supabase_with_spend(100.0)
    monkeypatch.setattr(app.state, "supabase", sb, raising=False)
    monkeypatch.setenv("AI_SPEND_CAP_EXEMPT_USER_IDS", "u1")

    _, text = _ask(client)

    assert "event: complete" in text
    assert model_calls == ["q"]
    assert call("ai_spend_by_user") not in sb.table.call_args_list


def test_an_unreadable_spend_value_counts_as_a_failed_lookup(monkeypatch):
    with pytest.raises(TypeError):
        spend_cap.user_spend_usd(_supabase_with_spend(MagicMock()), "u1")


def test_a_blank_cap_setting_falls_back_to_one_dollar(monkeypatch):
    monkeypatch.setenv("AI_SPEND_CAP_USD", "")
    assert spend_cap.spend_cap_usd() == 1.00


def test_local_dev_without_supabase_skips_the_cap(client, monkeypatch, model_calls):
    monkeypatch.setattr(app.state, "supabase", None, raising=False)

    _, text = _ask(client)

    assert "event: complete" in text


def test_exempt_user_id_skips_the_spend_lookup(client, monkeypatch, model_calls):
    monkeypatch.setenv("AI_SPEND_CAP_EXEMPT_USER_IDS", "u1")
    sb = _supabase_with_spend(5.00)
    monkeypatch.setattr(app.state, "supabase", sb, raising=False)

    _, text = _ask(client)

    assert "event: complete" in text
    assert model_calls == ["q"]
    assert call("ai_spend_by_user") not in sb.table.call_args_list

