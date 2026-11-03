from typing import Any

from fastapi import APIRouter, HTTPException, Query, Request

from app.services.static_content_cache import StaticContentCache

router = APIRouter(prefix="/content", tags=["content"])


def _get_supabase(request: Request):
    if not hasattr(request.app.state, "supabase"):
        raise HTTPException(status_code=503, detail="Supabase is not configured")
    return request.app.state.supabase


def _get_cache(request: Request) -> StaticContentCache:
    # Initialized once at app startup in main.py; request handler only reads it.
    return request.app.state.static_content_cache


def _normalize_section(row: dict[str, Any]) -> dict[str, Any]:
    source = row.get("source")
    return {
        "section_key": row["section_key"],
        "title": row["title"],
        "body_markdown": row["body_markdown"],
        "display_order": row["display_order"],
        "updated_at": row.get("updated_at"),
        "source": source
        if source
        else None,
    }


@router.get("")
async def get_content(
    request: Request,
    category: str = Query(..., min_length=1),
    subcategory: str = Query(..., min_length=1),
):
    """Return static content sections for a category/subcategory.

    Matching is case-sensitive (Postgres ``eq``), so send the canonical casing
    the content was seeded with (e.g. ``Housing`` / ``Find Housing``). Sections
    come back ordered by ``display_order`` then ``section_key``. This route is
    intentionally public because the source content contains no user data;
    authenticated app access is enforced separately (ADR 0015).
    """
    category = category.strip()
    subcategory = subcategory.strip()
    if not category or not subcategory:
        raise HTTPException(status_code=400, detail="category and subcategory are required")

    cache = _get_cache(request)
    cached = cache.get(category, subcategory)
    if cached is not None:
        return cached

    sb = _get_supabase(request)
    result = (
        sb.table("static_content")
        .select(
            "section_key,title,body_markdown,display_order,updated_at,"
            "source:trusted_sources(name,url,authority_tier,jurisdiction)"
        )
        .eq("category", category)
        .eq("subcategory", subcategory)
        .order("display_order")
        .order("section_key")
        .execute()
    )

    sections = [_normalize_section(row) for row in result.data or []]
    response = {
        "category": category,
        "subcategory": subcategory,
        "sections": sections,
    }
    if sections:
        cache.set(category, subcategory, response)
    return response

