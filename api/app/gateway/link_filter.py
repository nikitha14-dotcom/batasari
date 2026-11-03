"""Remove links to known lookalike domains from an answer and its sources.

The DS prompts already tell the model never to cite these, but a model can still
write one from memory. This is a small blocklist, not URL validation: every other
link is left exactly as the model or the search returned it.
"""
import re
from urllib.parse import urlparse

# Domains that imitate an official site (ircc.com imitates the real IRCC, which
# is on canada.ca). Matches the domain and any subdomain. Add new ones here.
BLOCKED_DOMAINS = frozenset({"ircc.com"})

_MARKDOWN_LINK = re.compile(r"\[([^\]]+)\]\(\s*<?([^)\s>]+)>?(?:\s+[^)]*)?\)")
_BARE_URL = re.compile(r"https?://[^\s<>()\[\]\"']+", re.IGNORECASE)


def is_blocked_url(url: str) -> bool:
    try:
        host = (urlparse(str(url).strip()).hostname or "").lower().rstrip(".")
    except ValueError:
        return False
    return any(host == domain or host.endswith("." + domain) for domain in BLOCKED_DOMAINS)


def clean_answer(text: str, sources: list) -> tuple[str, list, int]:
    """Return the text without blocked links, the sources without blocked ones,
    and how many links were removed. A blocked markdown link keeps its words."""
    removed = 0

    def _link(match):
        nonlocal removed
        if is_blocked_url(match.group(2)):
            removed += 1
            return match.group(1)
        return match.group(0)

    def _bare(match):
        nonlocal removed
        if is_blocked_url(match.group(0)):
            removed += 1
            return ""
        return match.group(0)

    cleaned = _MARKDOWN_LINK.sub(_link, text or "")
    cleaned = _BARE_URL.sub(_bare, cleaned)

    kept = []
    for source in sources or []:
        url = source.get("url", "") if isinstance(source, dict) else ""
        if url and is_blocked_url(url):
            removed += 1
            continue
        kept.append(source)
    return cleaned, kept, removed
