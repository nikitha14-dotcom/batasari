import json
import logging
import os

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from supabase import Client, create_client

from app.gateway.insight_store import JsonInsightStore, SupabaseInsightStore
from app.gateway.prompts import active_prompt_version
from app.routers.ai_answer import router as ai_answer_router
from app.routers.answer_feedback import router as answer_feedback_router
from app.routers.auth import router as auth_router
from app.routers.beta import router as beta_router
from app.routers.client_errors import DEFAULT_DAILY_CLIENT_ERROR_LIMIT
from app.routers.client_errors import router as client_errors_router
from app.routers.contact import router as contact_router
from app.routers.content import router as content_router
from app.routers.crime import DEFAULT_DAILY_CRIME_LIMIT
from app.routers.crime import router as crime_router
from app.routers.feedback import DEFAULT_DAILY_FEEDBACK_LIMIT
from app.routers.feedback import router as feedback_router
from app.routers.india import router as india_router
from app.routers.profile import router as profile_router
from app.services.beta_access import BetaAccessPolicy, validate_beta_access_configuration
from app.services.model_input_cache import ModelInputCache
from app.services.rate_limiter import InMemoryRateLimiter
from app.services.static_content_cache import StaticContentCache
from app.services.tracing import setup_tracing

load_dotenv()

# Fail at startup, not per request: a Cloud Run revision with an unknown
# PROMPT_VERSION never becomes ready, so traffic stays on the previous one.
active_prompt_version()

# Nothing in this service configured logging, and uvicorn configures only its
# own "uvicorn*" loggers -- it adds no root handler and leaves the root level
# at WARNING. Every logger.info() in this file was therefore discarded,
# including the two that distinguish "no token was sent" from "a token was
# sent and rejected". The AuthMiddleware docstring below promises exactly that
# distinction; until now it was not being delivered.
#
# The root stays at WARNING so third-party libraries do not flood the logs;
# only this application's loggers are turned up.
class _JSONFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "timestamp": self.formatTime(record, "%Y-%m-%dT%H:%M:%S%z"),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        # logger.info(..., extra={"fields": {...}}) puts the keys at the top
        # level, where Cloud Logging can filter on them (jsonPayload.<key>).
        fields = getattr(record, "fields", None)
        if isinstance(fields, dict):
            payload.update({k: v for k, v in fields.items() if k not in payload})
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(payload)


_handler = logging.StreamHandler()
_handler.setFormatter(_JSONFormatter())

_root_logger = logging.getLogger()
_root_logger.handlers = [_handler]
_root_logger.setLevel(logging.WARNING)

logging.getLogger("app").setLevel(os.getenv("LOG_LEVEL", "INFO").upper())

logger = logging.getLogger(__name__)

# After logging is configured, so its on/off line is emitted, and after
# load_dotenv(), so a local .env can turn it on.
setup_tracing()

DEFAULT_CORS_ORIGINS = "http://localhost:3000"


def _cors_origins() -> list[str]:
    # Blank counts as unset. getenv's default only applies when the variable is
    # absent, so a variable set to "" would yield no allowed origins at all and
    # the API would silently reject every browser request.
    raw = os.getenv("CORS_ALLOW_ORIGINS", "").strip() or DEFAULT_CORS_ORIGINS
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


def _cors_origin_regex() -> str | None:
    """
    Pattern for origins that cannot be listed one by one.

    Every Vercel preview build gets a fresh hostname, so reviewing a branch on
    its preview URL meant appending that origin to CORS_ALLOW_ORIGINS and
    redeploying this service first -- and only whoever can deploy Cloud Run
    could do it. Without that, the preview signs you in and then every /profile
    call is blocked, which reads as "the UI is broken" rather than as CORS.

    Unset means no regex and the explicit list is the only rule, so leaving
    CORS_ALLOW_ORIGIN_REGEX empty keeps today's behaviour exactly.

    Anchor whatever you set. An unanchored pattern matches anywhere in the
    origin, so a bare "vercel.app" would let any site on that domain through.
    """
    return os.getenv("CORS_ALLOW_ORIGIN_REGEX", "").strip() or None


class AuthMiddleware(BaseHTTPMiddleware):
    """
    Resolve the caller's identity onto request.state and nothing more.

    This middleware never rejects a request. Each route decides whether it
    requires a user, so /health and future public endpoints stay open without
    carving exceptions in here.

    request.state.auth_source names which branch matched, which is what /auth/me
    reports. Without it, "no token was sent" and "a token was sent and rejected"
    are indistinguishable from a 401.
    """

    async def dispatch(self, request: Request, call_next):
        request.state.user_id = None
        request.state.user_email = None
        request.state.user_email_confirmed_at = None
        request.state.auth_source = "anonymous"
        request.state.use_local_profile_store = False

        is_development = os.getenv("ENVIRONMENT", "").strip().lower() == "development"

        # Development-only impersonation header, used by tests and local work.
        # It must never be honoured outside development: without this gate, any
        # caller could read or write any user's profile just by setting it.
        test_user = request.headers.get("x-test-user-id") if is_development else None
        if test_user:
            request.state.user_id = test_user
            request.state.auth_source = "test-header"
            return await call_next(request)

        auth_header = request.headers.get("authorization", "")
        if auth_header.lower().startswith("bearer "):
            token = auth_header[7:].strip()
            supabase: Client | None = getattr(request.app.state, "supabase", None)

            # A bearer token was presented, so this request is making a claim
            # about identity. If we cannot verify it we stay anonymous and the
            # route returns 401 -- we never fall through to the development
            # fallback below, which would silently turn a broken token into a
            # working local session.
            if not token:
                logger.info("Rejected request: Authorization header had an empty bearer token")
            elif supabase is None:
                logger.warning(
                    "Bearer token received but no Supabase client is configured -- "
                    "check SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL and "
                    "SUPABASE_SERVICE_ROLE_KEY"
                )
            else:
                try:
                    result = supabase.auth.get_user(token)
                except Exception:
                    # Expired, malformed, or signed by a different project.
                    # Never log the token itself.
                    logger.info("Rejected bearer token: Supabase could not verify it")
                else:
                    if result and result.user:
                        request.state.user_id = result.user.id
                        request.state.user_email = result.user.email
                        request.state.user_email_confirmed_at = getattr(
                            result.user, "email_confirmed_at", None
                        )
                        request.state.auth_source = "supabase"

            return await call_next(request)

        if is_development:
            request.state.user_id = "local-dev-user"
            request.state.auth_source = "local-dev-fallback"
            request.state.use_local_profile_store = True

        return await call_next(request)


app = FastAPI(title="Batasari API", version="0.1.0")
app.state.local_profiles = {}
app.state.static_content_cache = StaticContentCache()

# 250 = worst-case legitimate usage: 20 hours/day × 60 min ÷ 5 min per Q&A.
# Override with DAILY_AI_LIMIT for testing or capacity changes without a
# code deploy. The value is read once at startup so a restart is needed to
# pick up a change.
_daily_ai_limit = int(os.getenv("DAILY_AI_LIMIT", "250"))
app.state.rate_limiter = InMemoryRateLimiter(daily_limit=_daily_ai_limit)

# Separate counter from the AI one: sending feedback must never eat a user's
# Copilot budget, and a chatty day on one should not close the other.
_daily_feedback_limit = int(
    os.getenv("DAILY_FEEDBACK_LIMIT", str(DEFAULT_DAILY_FEEDBACK_LIMIT))
)
app.state.feedback_limiter = InMemoryRateLimiter(daily_limit=_daily_feedback_limit)
app.state.contact_limiter = InMemoryRateLimiter(daily_limit=10)

# Separate counter again: an address lookup must not eat a user's Copilot or
# feedback budget, and /crime/stats/by-address is the only endpoint here that
# costs money per call (Google Maps geocoding).
_daily_crime_limit = int(os.getenv("DAILY_CRIME_LIMIT", str(DEFAULT_DAILY_CRIME_LIMIT)))
app.state.crime_limiter = InMemoryRateLimiter(daily_limit=_daily_crime_limit)

# Geocoding key check. Without it, geocode_address() returns None and
# /crime/stats/by-address answers 404 for every address -- indistinguishable,
# from the outside, from "that address is not in Toronto". The key went
# undocumented for weeks and /housing/check silently never worked, so say so
# once at startup rather than only on the first lookup. A warning, not a
# raise: the rest of the API is fine without it.
if not os.getenv("GOOGLE_MAPS_API_KEY"):
    logger.warning(
        "GOOGLE_MAPS_API_KEY is not set -- /crime/stats/by-address will return "
        "404 for every address. Set it in .env to run the crime lookup locally, "
        "or point the frontend at a deployed API instead. /crime/stats with "
        "lat/lon is unaffected."
    )

supabase_url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
if supabase_url:
    if not supabase_key:
        raise RuntimeError("SUPABASE_SERVICE_ROLE_KEY is required for backend Supabase access.")
    app.state.supabase = create_client(supabase_url, supabase_key)

supabase_client = getattr(app.state, "supabase", None)
app.state.model_input_cache = ModelInputCache(supabase_client) if supabase_client else None
app.state.insight_store = (
    SupabaseInsightStore(supabase_client) if supabase_client else JsonInsightStore()
)
validate_beta_access_configuration()
app.state.beta_access_policy = BetaAccessPolicy(supabase_client)
app.state.beta_access_policy.sync_retention_configuration()

# Browser error reports, counted per signed-in user or per IP when signed out.
_daily_client_error_limit = int(
    os.getenv("DAILY_CLIENT_ERROR_LIMIT", str(DEFAULT_DAILY_CLIENT_ERROR_LIMIT))
)
app.state.client_error_limiter = InMemoryRateLimiter(daily_limit=_daily_client_error_limit)

# Middleware order matters. Starlette applies the LAST-added middleware
# outermost, so CORS must be added after AuthMiddleware to wrap it. Otherwise a
# 401 comes back without CORS headers, the browser reports an opaque CORS
# failure, and the real status is invisible in the network tab.
app.add_middleware(AuthMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_origin_regex=_cors_origin_regex(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(beta_router)
app.include_router(profile_router)
app.include_router(ai_answer_router)
app.include_router(answer_feedback_router)
app.include_router(content_router)
app.include_router(india_router)
app.include_router(crime_router)
app.include_router(feedback_router)
app.include_router(contact_router)
app.include_router(client_errors_router)

@app.get("/health")
def health_check():
    return {"status": "ok"}

