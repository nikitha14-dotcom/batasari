"""Describe a model provider's error without its response body.

str() of an Anthropic or OpenAI SDK error embeds the provider's full response
body, e.g. "Error code: 400 - {'type': 'error', 'error': {...}}". Section 4 of
the observability doc keeps unsanitized provider payloads out of logs and
traces, and a validation error from an OpenAI-compatible host can quote the
request back. So only fixed fields are kept: the class, the HTTP status, the
provider's error type and the request id.
"""

import re

import anthropic
import openai

PROVIDER_ERRORS = (anthropic.APIError, openai.APIError)

# Error types and request ids are short identifiers. Anything else is dropped
# rather than risk passing free text through.
_SAFE_TOKEN = re.compile(r"^[A-Za-z0-9_.:-]{1,80}$")


def is_provider_error(exc: BaseException) -> bool:
    return isinstance(exc, PROVIDER_ERRORS)


def _error_kind(body: object) -> str | None:
    # Anthropic keeps the whole body: {"type": "error", "error": {"type": ...}}.
    # The OpenAI SDK keeps only the inner "error" object: {"type"/"code": ...}.
    if not isinstance(body, dict):
        return None
    inner = body.get("error") if isinstance(body.get("error"), dict) else body
    for key in ("type", "code"):
        value = inner.get(key)
        if isinstance(value, str) and value != "error" and _SAFE_TOKEN.match(value):
            return value
    return None


def describe_provider_error(exc: BaseException) -> str:
    """E.g. "AuthenticationError status=401 type=authentication_error request_id=req_1"."""
    parts = [type(exc).__name__]
    status = getattr(exc, "status_code", None)
    if isinstance(status, int):
        parts.append(f"status={status}")
    kind = _error_kind(getattr(exc, "body", None))
    if kind:
        parts.append(f"type={kind}")
    request_id = getattr(exc, "request_id", None)
    if isinstance(request_id, str) and _SAFE_TOKEN.match(request_id):
        parts.append(f"request_id={request_id}")
    return " ".join(parts)
