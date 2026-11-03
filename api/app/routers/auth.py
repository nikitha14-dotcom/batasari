import logging
import re
import threading
import time
from collections import deque

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field, field_validator

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me")
async def me(request: Request):
    """
    Echo back who the backend thinks is calling.

    This exists for verification, not for the product: it is the fastest way to
    tell "the browser never sent a token" apart from "the token was sent and
    Supabase rejected it", which otherwise look identical from a 401 on
    /profile. auth_source names which branch of AuthMiddleware matched. It is
    intentionally available after Beta expiry so support and sign-out flows can
    still identify the authenticated session (ADR 0015).
    """
    user_id = getattr(request.state, "user_id", None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")

    return {
        "user_id": user_id,
        "email": getattr(request.state, "user_email", None),
        "auth_source": getattr(request.state, "auth_source", "unknown"),
    }


# --- Sign Up: "is this email already registered?" -----------------------------
#
# Answering this reveals whether an address has an account (account
# enumeration). The product needs the answer to route existing users to Login,
# so the endpoint exists, but it is rate-limited per client so it can't be used
# to test lists of addresses. The limiter is in-memory: per Cloud Run instance,
# and max-instances bounds the total.

EMAIL_STATUS_LIMIT = 10  # requests
EMAIL_STATUS_WINDOW_SECONDS = 60
MAX_EMAIL_LENGTH = 254  # RFC 5321

# Same deliberately loose shape as the web app (web/lib/auth/email.ts).
_EMAIL_SHAPE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


class EmailStatusRequest(BaseModel):
    email: str = Field(max_length=MAX_EMAIL_LENGTH)

    @field_validator("email")
    @classmethod
    def _shape(cls, value: str) -> str:
        value = value.strip()
        if not _EMAIL_SHAPE.match(value):
            raise ValueError("must be an email address")
        return value


class _SlidingWindowLimiter:
    def __init__(self, limit: int, window_seconds: float):
        self.limit = limit
        self.window = window_seconds
        self._hits: dict[str, deque[float]] = {}
        self._lock = threading.Lock()

    def allow(self, key: str) -> bool:
        now = time.monotonic()
        with self._lock:
            hits = self._hits.setdefault(key, deque())
            while hits and now - hits[0] > self.window:
                hits.popleft()
            if len(hits) >= self.limit:
                return False
            hits.append(now)
            # Drop idle keys so the dict can't grow without bound.
            if len(self._hits) > 10_000:
                for k in [k for k, v in self._hits.items() if not v]:
                    del self._hits[k]
            return True

    def reset(self) -> None:
        with self._lock:
            self._hits.clear()


email_status_limiter = _SlidingWindowLimiter(EMAIL_STATUS_LIMIT, EMAIL_STATUS_WINDOW_SECONDS)


def _client_key(request: Request) -> str:
    # Cloud Run puts the real client first in X-Forwarded-For.
    forwarded = request.headers.get("x-forwarded-for", "")
    first = forwarded.split(",")[0].strip()
    if first:
        return first
    return request.client.host if request.client else "unknown"


@router.post("/email-status")
async def email_status(body: EmailStatusRequest, request: Request):
    """Return {"registered": bool} so Sign Up can send existing users to Login."""
    if not email_status_limiter.allow(_client_key(request)):
        raise HTTPException(status_code=429, detail="Too many requests. Try again in a minute.")

    supabase = getattr(request.app.state, "supabase", None)
    if supabase is None:
        raise HTTPException(status_code=503, detail="Supabase is not configured")

    try:
        result = supabase.rpc("is_email_registered", {"p_email": body.email}).execute()
    except Exception:
        # Never log the address itself.
        logger.warning("is_email_registered RPC failed")
        raise HTTPException(status_code=503, detail="Could not check that email right now.")

    return {"registered": bool(result.data)}

