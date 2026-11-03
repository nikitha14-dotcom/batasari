from unittest.mock import MagicMock, patch

import requests

from app.gateway.search_provider import TavilySearchProvider


def _mock_response(json_data, status_code=200):
    response = MagicMock()
    response.status_code = status_code
    response.json.return_value = json_data
    response.raise_for_status.side_effect = (
        None if status_code == 200
        else requests.exceptions.HTTPError(f"{status_code} error")
    )
    return response


def test_returns_no_results_when_api_key_missing():
    provider = TavilySearchProvider(api_key=None)
    results = provider.search("what is the ontario rent guideline")
    assert results == []


@patch("app.gateway.search_provider.requests.post")
def test_returns_shaped_results_on_success(mock_post):
    mock_post.return_value = _mock_response({
        "results": [
            {
                "url": "https://www.ontario.ca/rent-guideline",
                "title": "2026 Rent Increase Guideline",
                "content": "The 2026 guideline is 2.1%.",
                "published_date": "2026-01-15",
            }
        ]
    })

    provider = TavilySearchProvider(api_key="fake-key")
    results = provider.search("rent guideline 2026")

    assert len(results) == 1
    assert results[0]["url"] == "https://www.ontario.ca/rent-guideline"
    assert results[0]["title"] == "2026 Rent Increase Guideline"
    assert results[0]["passages"] == ["The 2026 guideline is 2.1%."]
    assert results[0]["published_at"] == "2026-01-15"
    assert results[0]["provider"] == "tavily"


@patch("app.gateway.search_provider.requests.post")
def test_passes_allowed_domains_as_include_domains(mock_post):
    mock_post.return_value = _mock_response({"results": []})

    provider = TavilySearchProvider(api_key="fake-key")
    provider.search("rent guideline", allowed_domains=["ontario.ca", "toronto.ca"])

    call_kwargs = mock_post.call_args.kwargs
    assert call_kwargs["json"]["include_domains"] == ["ontario.ca", "toronto.ca"]


@patch("app.gateway.search_provider.requests.post")
def test_open_web_search_omits_include_domains(mock_post):
    mock_post.return_value = _mock_response({"results": []})

    provider = TavilySearchProvider(api_key="fake-key")
    provider.search("rent guideline", allowed_domains=None)

    call_kwargs = mock_post.call_args.kwargs
    assert "include_domains" not in call_kwargs["json"]


@patch("app.gateway.search_provider.requests.post")
def test_returns_empty_list_on_network_failure(mock_post):
    mock_post.side_effect = requests.exceptions.ConnectionError("network down")

    provider = TavilySearchProvider(api_key="fake-key")
    results = provider.search("rent guideline")

    assert results == []


@patch("app.gateway.search_provider.requests.post")
def test_returns_empty_list_on_http_error(mock_post):
    mock_post.return_value = _mock_response({}, status_code=500)

    provider = TavilySearchProvider(api_key="fake-key")
    results = provider.search("rent guideline")

    assert results == []
