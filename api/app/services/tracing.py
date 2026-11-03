"""Model-call tracing to Arize AX, with every piece of user text hidden.

Off unless ARIZE_SPACE_ID and ARIZE_API_KEY are set, so tests and local dev
send nothing anywhere.
"""

import logging
import os

from opentelemetry.sdk.trace import SpanProcessor
from opentelemetry.trace import Status

from app.gateway.provider_errors import describe_provider_error, is_provider_error

logger = logging.getLogger(__name__)

# Section 4 of the observability doc, and the privacy statement: no raw
# questions or answers, onboarding values or saved insights in telemetry. The
# system prompt carries the user's onboarding answers and insights, so every
# text-bearing field is hidden, not only the question and the answer. Token
# counts, model, timings and status are still recorded.
_HIDE_ALL_TEXT = {
    "hide_inputs": True,
    "hide_outputs": True,
    "hide_input_messages": True,
    "hide_output_messages": True,
    "hide_input_text": True,
    "hide_output_text": True,
    "hide_prompts": True,
    "hide_choices": True,
    "hide_embeddings_text": True,
}


def trace_config():
    from openinference.instrumentation import TraceConfig

    return TraceConfig(**_HIDE_ALL_TEXT)


class HideProviderErrorText(SpanProcessor):
    """Keep provider response bodies out of traces (observability doc, section 4).

    TraceConfig hides inputs and outputs but not errors: on a failed call the
    instrumentors put str(exception) into the span status and record the
    exception with its message and traceback, and str() of a provider error is
    its raw response body. This swaps both at the source, on every span, so
    nothing is left to scrub at export time.
    """

    def on_start(self, span, parent_context=None):
        record_exception = span.record_exception
        set_status = span.set_status

        def safe_record_exception(exception, attributes=None, timestamp=None, escaped=False):
            if not is_provider_error(exception):
                return record_exception(exception, attributes, timestamp, escaped)
            span.add_event(
                "exception",
                {
                    "exception.type": type(exception).__name__,
                    "exception.message": describe_provider_error(exception),
                    "exception.escaped": str(escaped),
                },
                timestamp,
            )

        def safe_set_status(status, description=None):
            # Nothing of ours sets a description; the instrumentors set it to
            # str(exception). The exception event above says what failed.
            code = status.status_code if isinstance(status, Status) else status
            set_status(Status(code))

        span.record_exception = safe_record_exception
        span.set_status = safe_set_status


def setup_tracing() -> bool:
    """Send model-call traces to Arize if it is configured. Never raises."""
    space_id = (os.getenv("ARIZE_SPACE_ID") or "").strip()
    api_key = (os.getenv("ARIZE_API_KEY") or "").strip()
    if not (space_id and api_key):
        logger.info("Tracing is off: ARIZE_SPACE_ID and ARIZE_API_KEY are not set")
        return False

    try:
        from arize.otel import register
        from openinference.instrumentation.anthropic import AnthropicInstrumentor
        from openinference.instrumentation.google_genai import GoogleGenAIInstrumentor
        from openinference.instrumentation.openai import OpenAIInstrumentor

        project = f"moving-assistant-{os.getenv('ENVIRONMENT', 'local').strip() or 'local'}"
        # Extra processors MUST go through register(span_processors=...). arize's
        # TracerProvider.add_span_processor() deletes its default exporting
        # processor the first time it is called, so adding one afterwards
        # silently stops every span from reaching Arize -- no error, no log.
        provider = register(
            space_id=space_id,
            api_key=api_key,
            project_name=project,
            verbose=False,
            # Send each span as it ends, inside the request. Cloud Run (request-
            # based billing, scale to zero) throttles CPU between requests and
            # stops idle instances, so a background batch queue can be lost.
            # Costs ~30-200 ms per span, measured on staging Oct 5.
            batch=False,
            span_processors=[HideProviderErrorText()],
        )
        config = trace_config()
        # Anthropic covers Sonnet; the OpenAI one covers the fallback, which
        # goes through DeepInfra's OpenAI-compatible API.
        AnthropicInstrumentor().instrument(tracer_provider=provider, config=config)
        OpenAIInstrumentor().instrument(tracer_provider=provider, config=config)
        # Gemini answers, router and extraction all go through google-genai.
        GoogleGenAIInstrumentor().instrument(tracer_provider=provider, config=config)
    except Exception:
        # Tracing is diagnostics; a problem here must not take the API down.
        logger.warning("Could not start tracing; answering without it", exc_info=True)
        return False

    logger.info("Tracing model calls to Arize project %s", project)
    return True

