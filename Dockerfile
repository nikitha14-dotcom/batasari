# Container image for the FastAPI backend (/api), deployed to Cloud Run.
#
# This lives at the repo root, not in /api, because /api is a uv workspace
# member and its lockfile is the root uv.lock. Built by Cloud Build from the
# repo root (`gcloud run deploy --source .`); .gcloudignore keeps /web and
# everything else the API doesn't need out of the upload.

FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

COPY --from=ghcr.io/astral-sh/uv:0.12.7 /uv /bin/uv

WORKDIR /app

# Dependencies first and on their own layer, so editing application code does
# not invalidate the (slow) dependency install on every rebuild. uv needs every
# workspace member's pyproject.toml to read the lock, even though only /api is
# installed.
COPY pyproject.toml uv.lock ./
COPY api/pyproject.toml api/pyproject.toml
COPY eval/pyproject.toml eval/pyproject.toml
RUN uv sync --frozen --no-dev --package moving-assistant-api --no-install-workspace

COPY api/app api/app
RUN uv sync --frozen --no-dev --package moving-assistant-api

# Cloud Run injects PORT and routes traffic to it. 8080 is the default it uses
# when the variable is absent, so this only matters for running the image
# locally.
ENV PORT=8080
EXPOSE 8080

# Don't run as root.
RUN useradd --create-home --uid 1000 appuser \
    && chown -R appuser:appuser /app
USER appuser

WORKDIR /app/api

# The venv's uvicorn directly, not `uv run`, which would re-check the
# environment on every cold start. `exec` so uvicorn is PID 1 and receives
# Cloud Run's SIGTERM directly -- otherwise shutdown waits for the 10s grace
# period on every revision.
CMD exec /app/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port ${PORT}

