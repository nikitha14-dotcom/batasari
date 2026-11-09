"""Describe provider errors without logging raw request or response payloads.

Provider response messages are useful for diagnosing rejected requests, but raw
bodies can contain echoed user content. Keep only a short, sanitized message
alongside fixed status/type/request identifiers.
"""

import re

import anthropic
import openai

PROVIDER_ERRORS = (anthropic.APIError, openai.APIError)
_SAFE_TOKEN = re.compile(r"^[A-Za-z0-9_.:-]{1,80}$")
_SAFE_MESSAGE_CHARS = re.compile(r"[^A-Za-z0-9 _.,:;()'/-]")
_SECRET_LIKE = re.compile(r"(?i)(sk-ant-[A-Za-z0-9_-]+|sk-[A-Za-z0-9_-]+|Bearer\\s+\\S+)")


def is_provider_error(exc: BaseException) -> bool:
    return isinstance(exc, PROVIDER_ERRORS)


def _error_object(body: object) -> dict:
    if not isinstance(body, dict):
        return {}
    inner = body.get("error")
    return inner if isinstance(inner, dict) else body


def _error_kind(body: object) -> str | None:
    inner = _error_object(body)
    for key in ("type", "code"):
        value = inner.get(key)
        if isinstance(value, str) and value != "error" and _SAFE_TOKEN.match(value):
            return value
    return None


def _safe_error_message(body: object) -> str | None:
    """Return a bounded diagnostic, never a raw provider response body."""
    message = _error_object(body).get("message")
    if not isinstance(message, str):
        return None
    message = _SECRET_LIKE.sub("[redacted]", message)
    message = _SAFE_MESSAGE_CHARS.sub("", message)
    message = " ".join(message.split())[:180].strip()
    return message or None


def describe_provider_error(exc: BaseException) -> str:
    """Describe a provider error with safe diagnostics only."""
    parts = [type(exc).__name__]
    status = getattr(exc, "status_code", None)
    if isinstance(status, int):
        parts.append(f"status={status}")
    body = getattr(exc, "body", None)
    kind = _error_kind(body)
    if kind:
        parts.append(f"type={kind}")
    message = _safe_error_message(body)
    if message:
        parts.append(f"reason={message!r}")
    request_id = getattr(exc, "request_id", None)
    if isinstance(request_id, str) and _SAFE_TOKEN.match(request_id):
        parts.append(f"request_id={request_id}")
    return " ".join(parts)
