# ruff: noqa: E501
from app.gateway import link_filter as lf


def test_a_blocked_domain_and_its_subdomains_are_recognised():
    assert lf.is_blocked_url("https://ircc.com/study")
    assert lf.is_blocked_url("https://www.ircc.com/study")
    assert lf.is_blocked_url("HTTP://IRCC.COM")
    assert not lf.is_blocked_url("https://www.canada.ca/en/immigration-refugees-citizenship.html")
    assert not lf.is_blocked_url("https://notircc.com/")
    assert not lf.is_blocked_url("https://ircc.com.example.org/")
    assert not lf.is_blocked_url("not a url")


def test_a_link_to_a_blocked_domain_becomes_plain_text():
    text = "Apply through [IRCC](https://ircc.com/apply) or [the real site](https://www.canada.ca/en.html)."
    cleaned, _, removed = lf.clean_answer(text, [])
    assert cleaned == "Apply through IRCC or [the real site](https://www.canada.ca/en.html)."
    assert removed == 1


def test_a_bare_blocked_url_is_removed():
    cleaned, _, removed = lf.clean_answer("See https://ircc.com/x for details.", [])
    assert "ircc.com" not in cleaned
    assert removed == 1


def test_blocked_sources_are_dropped_and_the_others_kept():
    sources = [{"url": "https://ircc.com/a", "title": "IRCC"}, {"url": "https://www.canada.ca/b", "title": "Canada"}]
    _, kept, removed = lf.clean_answer("text", sources)
    assert kept == [sources[1]]
    assert removed == 1


def test_an_answer_without_blocked_links_is_unchanged():
    text = "A [link](https://www.ontario.ca/page) and https://www.canada.ca/x."
    sources = [{"url": "https://www.ontario.ca/page", "title": "t"}]
    assert lf.clean_answer(text, sources) == (text, sources, 0)
