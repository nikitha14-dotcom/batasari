from app.services.spend_cap import is_spend_exempt, spend_cap_exempt_user_ids


def test_listed_ids_are_exempt(monkeypatch):
    monkeypatch.setenv("AI_SPEND_CAP_EXEMPT_USER_IDS", " AAA-1 , bbb-2 ,")
    assert is_spend_exempt("aaa-1")
    assert is_spend_exempt("BBB-2")
    assert spend_cap_exempt_user_ids() == frozenset({"aaa-1", "bbb-2"})


def test_unlisted_ids_are_not_exempt(monkeypatch):
    monkeypatch.setenv("AI_SPEND_CAP_EXEMPT_USER_IDS", "aaa-1")
    assert not is_spend_exempt("ccc-3")


def test_empty_or_missing_list_exempts_nobody(monkeypatch):
    monkeypatch.delenv("AI_SPEND_CAP_EXEMPT_USER_IDS", raising=False)
    assert not is_spend_exempt("aaa-1")
    monkeypatch.setenv("AI_SPEND_CAP_EXEMPT_USER_IDS", "")
    assert not is_spend_exempt("aaa-1")

