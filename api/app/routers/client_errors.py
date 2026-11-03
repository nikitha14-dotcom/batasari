"""Browser-side errors, reported by the frontend so they reach our logs.

Without this, a crash in someone's browser is only in their console. Each
report becomes one "Frontend error" log line, filterable in Cloud Logging.
Signed-out visitors can report too, because errors happen before sign-in.
"""

import logging
import re
from datetime import date
from typing import Literal

from fastapi import APIRouter, Request, Response
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

router = APIRouter(tags=["client-errors"])

# Per reporter per day. A crash loop in one tab should not be able to flood
# the logs, and a real session produces a handful of these at most.
DEFAULT_DAILY_CLIENT_ERROR_LIMIT = 50

# Error text can quote whatever the page was handling. Section 4 of the
# observability doc keeps emails, tokens and user values out of logs, so these
# are replaced before anything is written.
_REDACTIONS = (
    (re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+"), "[email]"),
    (re.compile(r"\beyJ[\w-]+\.[\w-]+\.[\w-]+"), "[token]"),
    (re.compile(r"(?i)bearer\s+[\w.~+/=-]+"), "Bearer [token]"),
    (re.compile(r"\b(sk|pk)[-_][\w-]{8,}"), "[key]"),
    (re.compile(r"\d{6,}"), "[number]"),
)


def _redact(text: str) -> str:
    for pattern, replacement in _REDACTIONS:
        text = pattern.sub(replacement, text)
    return text


def _path_only(page: str) -> str:
    # Query strings and fragments can carry addresses, tokens or search text.
    return page.split("?", 1)[0].split("#", 1)[0]


class ClientErrorReport(BaseModel):
    kind: Literal["render", "error", "unhandledrejection"]
    message: str = Field(default="", max_length=500)
    page: str = Field(default="", max_length=200)
    # Next's hash for a render error, which also appears in the server log.
    digest: str = Field(default="", max_length=100)


@router.post("/client-errors", status_code=204)
async def report_client_error(request: Request, body: ClientErrorReport) -> Response:
    # Intentionally available on login and Beta-expiry screens (ADR 0015).
    # Local dev gives every token-less request a stand-in user; that is not a
    # sign-in, and would put every visitor on one shared counter.
    signed_in_user = (
        getattr(request.state, "user_id", None)
        if getattr(request.state, "auth_source", "anonymous")
        not in ("anonymous", "local-dev-fallback")
        else None
    )
    reporter = signed_in_user or (request.client.host if request.client else "unknown")
    limiter = getattr(request.app.state, "client_error_limiter", None)
    if limiter is not None and not limiter.check_and_increment(reporter, date.today()):
        # Accepted and dropped: telling the browser to retry would only add load.
        return Response(status_code=204)

    logger.warning(
        "Frontend error",
        extra={
            "fields": {
                "error_kind": body.kind,
                "error_message": _redact(body.message),
                "page": _redact(_path_only(body.page)),
                "digest": body.digest,
                "signed_in": signed_in_user is not None,
            }
        },
    )
    return Response(status_code=204)

