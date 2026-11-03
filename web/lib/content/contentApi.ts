import { safeExternalUrl } from "../copilot/safeUrl";
import { apiUrl } from "@/lib/api/apiBase";

/** section_key values with a fixed role, per the Housing and Work seeds. */
export const DESCRIPTION_KEY = "description";
export const TIP_KEY = "tip";

export type AuthorityTier = "A" | "B" | "C" | "D";

export interface ContentSource {
  name: string;
  /** Already checked: http(s)/mailto only, or null. Safe to put in an href. */
  url: string | null;
  authorityTier: AuthorityTier | null;
  jurisdiction: string | null;
}

export interface ContentSection {
  key: string;
  title: string;
  bodyMarkdown: string;
  source: ContentSource | null;
}

export interface SubcategoryContent {
  /** The section keyed "description", if the seed has one. */
  description: ContentSection | null;
  /** The section keyed "tip", if the seed has one. */
  tip: ContentSection | null;
  /** Everything else, in the order the API returned it (display_order). */
  items: ContentSection[];
}

export class ContentRequestError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
  ) {
    super(message);
    this.name = "ContentRequestError";
  }
}

const TIERS = new Set(["A", "B", "C", "D"]);

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function parseSource(raw: unknown): ContentSource | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const name = str(r.name);
  if (!name) return null;
  const tier = str(r.authority_tier);
  return {
    name,
    url: safeExternalUrl(r.url),
    authorityTier: tier && TIERS.has(tier) ? (tier as AuthorityTier) : null,
    jurisdiction: str(r.jurisdiction),
  };
}

function parseSection(raw: unknown): ContentSection | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const key = str(r.section_key);
  const title = str(r.title);
  if (!key || !title) return null;
  return {
    key,
    title,
    bodyMarkdown: typeof r.body_markdown === "string" ? r.body_markdown.trim() : "",
    source: parseSource(r.source),
  };
}

/** Splits the flat section list into the roles the page renders. */
export function toSubcategoryContent(sections: ContentSection[]): SubcategoryContent {
  let description: ContentSection | null = null;
  let tip: ContentSection | null = null;
  const items: ContentSection[] = [];
  for (const s of sections) {
    if (s.key === DESCRIPTION_KEY && !description) description = s;
    else if (s.key === TIP_KEY && !tip) tip = s;
    else items.push(s);
  }
  return { description, tip, items };
}

/**
 * GET /content for one subcategory.
 *
 * Returns empty content (not an error) when the API has no rows: that is the
 * normal state for a category whose seed has not landed yet.
 */
export async function fetchSubcategoryContent(
  category: string,
  subcategory: string,
  init?: { signal?: AbortSignal },
): Promise<SubcategoryContent> {
  const params = new URLSearchParams({ category, subcategory });
  let response: Response;
  try {
    response = await fetch(apiUrl(`/content?${params}`), {
      headers: { Accept: "application/json" },
      signal: init?.signal,
    });
  } catch (err) {
    if ((err as Error)?.name === "AbortError") throw err;
    throw new ContentRequestError("Could not reach the server.", null);
  }

  if (!response.ok) {
    throw new ContentRequestError(`The server returned ${response.status}.`, response.status);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ContentRequestError("The server sent an unreadable response.", response.status);
  }

  const raw = (body as { sections?: unknown })?.sections;
  const sections = Array.isArray(raw)
    ? raw.map(parseSection).filter((s): s is ContentSection => s !== null)
    : [];
  return toSubcategoryContent(sections);
}

export function isEmpty(content: SubcategoryContent): boolean {
  return !content.description && !content.tip && content.items.length === 0;
}

