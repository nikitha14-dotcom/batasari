from datetime import date

from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel

from app.crime.crime_data_pipeline import (
    CrimeDataUnavailable,
    CrimeYearUnavailable,
    get_crime_data,
    get_crime_data_by_address,
)
from app.services.beta_access import require_active_beta

router = APIRouter(prefix="/crime", tags=["crime"])

# Longest address we will hand to the geocoder. Canada Post's addressing
# guidelines top out well under this; anything longer is either a mistake or
# someone probing, and there is no reason to forward it to a paid API or to
# put it in our logs.
MAX_ADDRESS = 200

# Per-user lookups per calendar day.
#
# /crime/stats/by-address spends money on every call: it geocodes through the
# Google Maps API before touching our own data. Until now the endpoint took no
# token and counted nothing, so anyone who knew the URL could loop it and run
# the bill -- or the quota -- to zero, which also takes the feature down for
# real users. CORS does not help here; it constrains browsers, not curl.
#
# 50 is far above a genuine session (a person checks a handful of addresses)
# and far below what a script produces in a second.
DEFAULT_DAILY_CRIME_LIMIT = 50


def _get_user_id(request: Request) -> str:
    """Identify the caller, or refuse.

    Both crime endpoints are reached only from /housing/check, which already
    sits behind RequireSession, so requiring a token costs real users nothing.
    """
    user_id = getattr(request.state, "user_id", None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Sign in to look up an address.")
    return user_id


def _enforce_daily_limit(request: Request, *, user_id: str) -> None:
    limiter = getattr(request.app.state, "crime_limiter", None)
    if limiter is None:
        return
    if not limiter.check_and_increment(user_id, date.today()):
        raise HTTPException(
            status_code=429,
            detail="You have reached today's address lookup limit. Try again tomorrow.",
        )


def _raise_for_crime_failure(exc: Exception) -> None:
    """
    Translate a pipeline failure into a status code that means what it says.

    Until now every failure became the same 404 "no neighbourhood found",
    so a dataset missing from the image was indistinguishable from an
    address outside Toronto -- which is exactly how the missing crime data
    survived in staging unnoticed (#63). 404 now means only a real miss.
    """
    if isinstance(exc, CrimeYearUnavailable):
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    raise HTTPException(status_code=503, detail=str(exc)) from exc


class CrimeStatsResponse(BaseModel):
    neighbourhood: dict
    crime_markers: list[dict]
    total_incidents_found: int


@router.get("/stats", response_model=CrimeStatsResponse)
async def crime_stats(
    request: Request,
    lat: float = Query(..., ge=-90, le=90, description="Latitude"),
    lon: float = Query(..., ge=-180, le=180, description="Longitude"),
    rate_year: int = Query(2025, description="Which year's crime rate data to use"),
):
    """
    Returns crime stats for the Toronto neighbourhood containing (lat, lon).
    """
    # Authenticate first so a missing session returns 401 before the Beta gate.
    user_id = _get_user_id(request)
    require_active_beta(request)
    _enforce_daily_limit(request, user_id=user_id)

    try:
        result = get_crime_data(lat=lat, lon=lon, rate_year=rate_year)
    except (CrimeDataUnavailable, CrimeYearUnavailable) as exc:
        _raise_for_crime_failure(exc)

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="No Toronto neighbourhood found for the given coordinates.",
        )

    return result


@router.get("/stats/by-address", response_model=CrimeStatsResponse)
async def crime_stats_by_address(
    request: Request,
    address: str = Query(
        ..., min_length=1, max_length=MAX_ADDRESS, description="Toronto street address"
    ),
    rate_year: int = Query(2025, description="Which year's crime rate data to use"),
):
    """
    Address to coordinates, then return crime stats for its Toronto neighbourhood.
    """
    # Authenticate first so a missing session returns 401 before the Beta gate.
    user_id = _get_user_id(request)
    require_active_beta(request)
    _enforce_daily_limit(request, user_id=user_id)

    try:
        result = get_crime_data_by_address(address=address, rate_year=rate_year)
    except (CrimeDataUnavailable, CrimeYearUnavailable) as exc:
        _raise_for_crime_failure(exc)

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Could not resolve that address to a Toronto neighbourhood.",
        )

    return result

