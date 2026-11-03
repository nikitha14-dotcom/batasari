from datetime import date
from unittest.mock import AsyncMock, patch

import pytest

from app.gateway.extraction_builder import build_extraction_input
from app.gateway.extraction_prompts import EXTRACTION_PROMPTS
from app.gateway.extraction_service import extract_insights


@pytest.fixture
def _valid_extraction_response():
    return {
        "text": (
            '{"category": "Housing", "deltas": ['
            '{"field": "budget_range", "operation": "set", "value": "$2000 CAD"}], '
            '"confidence": 0.9}'
        ),
        "input_tokens": 500,
        "output_tokens": 50,
        "model": "claude-sonnet-4-6",
    }


@pytest.fixture
def _empty_extraction_response():
    return {
        "text": '{"category": "Housing", "deltas": [], "confidence": 1.0}',
        "input_tokens": 500,
        "output_tokens": 20,
        "model": "claude-sonnet-4-6",
    }


@pytest.fixture
def _markdown_wrapped_response():
    return {
        "text": (
            "```json\n"
            '{"category": "Housing", "deltas": ['
            '{"field": "budget_range", "operation": "set", "value": "$2000"}], '
            '"confidence": 0.9}\n'
            "```"
        ),
        "input_tokens": 500,
        "output_tokens": 50,
        "model": "claude-sonnet-4-6",
    }


class TestExtractInsights:
    @pytest.mark.anyio
    @patch("app.gateway.extraction_service.call_internal_model", new_callable=AsyncMock)
    async def test_successful_extraction(self, mock_claude, _valid_extraction_response):
        mock_claude.return_value = _valid_extraction_response

        result = await extract_insights(
            question="I'm looking for a place around $2000",
            category="Housing",
            current_insights={},
        )

        assert result is not None
        assert result.category == "Housing"
        assert len(result.deltas) == 1
        assert result.deltas[0].field == "budget_range"
        mock_claude.assert_called_once()

    @pytest.mark.anyio
    @patch("app.gateway.extraction_service.call_internal_model", new_callable=AsyncMock)
    async def test_empty_extraction(self, mock_claude, _empty_extraction_response):
        mock_claude.return_value = _empty_extraction_response

        result = await extract_insights(
            question="What documents do I need?",
            category="Housing",
            current_insights={},
        )

        assert result is not None
        assert result.deltas == []

    @pytest.mark.anyio
    @patch("app.gateway.extraction_service.call_internal_model", new_callable=AsyncMock)
    async def test_markdown_fences_stripped(self, mock_claude, _markdown_wrapped_response):
        mock_claude.return_value = _markdown_wrapped_response

        result = await extract_insights(
            question="Budget is $2000",
            category="Housing",
            current_insights={},
        )

        assert result is not None
        assert len(result.deltas) == 1

    @pytest.mark.anyio
    @patch("app.gateway.extraction_service.call_internal_model", new_callable=AsyncMock)
    async def test_invalid_json_returns_none(self, mock_claude):
        mock_claude.return_value = {
            "text": "I cannot extract insights from this.",
            "input_tokens": 100,
            "output_tokens": 20,
            "model": "claude-sonnet-4-6",
        }

        result = await extract_insights(
            question="test",
            category="Housing",
            current_insights={},
        )

        assert result is None

    @pytest.mark.anyio
    @patch("app.gateway.extraction_service.call_internal_model", new_callable=AsyncMock)
    async def test_network_error_returns_none(self, mock_claude):
        mock_claude.side_effect = ConnectionError("Network unreachable")

        result = await extract_insights(
            question="test",
            category="Housing",
            current_insights={},
        )

        assert result is None

    @pytest.mark.anyio
    @patch("app.gateway.extraction_service.call_internal_model", new_callable=AsyncMock)
    async def test_passes_current_insights(self, mock_claude, _valid_extraction_response):
        mock_claude.return_value = _valid_extraction_response

        existing = {"budget_range": "$1500 CAD", "preferred_neighbourhoods": ["Annex"]}

        await extract_insights(
            question="Change my budget to $2000",
            category="Housing",
            current_insights=existing,
        )

        # Verify current insights are included in the user message
        call_kwargs = mock_claude.call_args
        if call_kwargs.kwargs.get("question"):
            user_msg = call_kwargs.kwargs["question"]
        elif len(call_kwargs.args) > 1:
            user_msg = call_kwargs.args[1]
        else:
            user_msg = ""
        assert "$1500 CAD" in str(user_msg) or "Annex" in str(user_msg)

    def test_build_extraction_input_injects_current_date(self):
        fixed_date = date(2026, 9, 27)
        _, user_msg = build_extraction_input(
            question="I'm moving in November",
            category="Housing",
            current_insights={},
            today=fixed_date,
        )
        assert "<current_date>2026-09-27</current_date>" in user_msg

    @pytest.mark.anyio
    @patch("app.gateway.extraction_service.call_internal_model", new_callable=AsyncMock)
    async def test_extract_insights_passes_current_date(
        self, mock_claude, _valid_extraction_response
    ):
        mock_claude.return_value = _valid_extraction_response
        await extract_insights(
            question="I'm moving in November",
            category="Housing",
            current_insights={},
        )
        call_kwargs = mock_claude.call_args.kwargs
        user_msg = call_kwargs["question"]
        assert "<current_date>" in user_msg
        assert "</current_date>" in user_msg

    def test_prompt_rules_include_conditional_budget_and_date_anchor(self):
        prompt = EXTRACTION_PROMPTS["v1"]
        assert "hypothetical, speculative, or" in prompt
        assert "<current_date>" in prompt

