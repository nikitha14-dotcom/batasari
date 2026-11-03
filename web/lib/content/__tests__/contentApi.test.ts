import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ContentRequestError,
  fetchSubcategoryContent,
  isEmpty,
  toSubcategoryContent,
} from "../contentApi";
import { STATIC_CATEGORIES, getCategoryBySlug } from "../categories";

function row(key: string, title: string, extra: Record<string, unknown> = {}) {
  return { section_key: key, title, body_markdown: `${title} body`, display_order: 0, ...extra };
}

function stubFetch(impl: (url: string) => Promise<unknown>) {
  const fn = vi.fn(impl);
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => vi.unstubAllGlobals());

describe("fetchSubcategoryContent", () => {
  it("calls GET /content with both names URL-encoded", async () => {
    const fetchMock = stubFetch(async () => ({ ok: true, json: async () => ({ sections: [] }) }));
    await fetchSubcategoryContent("Moving & Shipping", "Couriers & International Customs Clearance");

    const url = new URL(fetchMock.mock.calls[0][0] as string);
    expect(url.pathname).toBe("/content");
    expect(url.searchParams.get("category")).toBe("Moving & Shipping");
    expect(url.searchParams.get("subcategory")).toBe("Couriers & International Customs Clearance");
  });

  it("splits description and tip out of the items, keeping API order", async () => {
    stubFetch(async () => ({
      ok: true,
      json: async () => ({
        sections: [
          row("description", "Intro"),
          row("tip", "Tip"),
          row("ohip", "OHIP"),
          row("uhip", "UHIP"),
        ],
      }),
    }));
    const c = await fetchSubcategoryContent("Health", "X");
    expect(c.description?.title).toBe("Intro");
    expect(c.tip?.title).toBe("Tip");
    expect(c.items.map((i) => i.key)).toEqual(["ohip", "uhip"]);
  });

  it("treats no rows as empty content, not an error (seed not landed yet)", async () => {
    stubFetch(async () => ({ ok: true, json: async () => ({ category: "Health", sections: [] }) }));
    expect(isEmpty(await fetchSubcategoryContent("Health", "X"))).toBe(true);
  });

  it("throws a ContentRequestError with the status on a non-2xx response", async () => {
    stubFetch(async () => ({ ok: false, status: 503, json: async () => ({}) }));
    await expect(fetchSubcategoryContent("Health", "X")).rejects.toMatchObject({
      name: "ContentRequestError",
      status: 503,
    });
  });

  it("throws a ContentRequestError when the network fails", async () => {
    stubFetch(async () => {
      throw new TypeError("Failed to fetch");
    });
    const err = await fetchSubcategoryContent("Health", "X").catch((e) => e);
    expect(err).toBeInstanceOf(ContentRequestError);
    expect(err.status).toBeNull();
  });

  it("lets an abort through unchanged", async () => {
    stubFetch(async () => {
      throw new DOMException("aborted", "AbortError");
    });
    await expect(fetchSubcategoryContent("Health", "X")).rejects.toMatchObject({ name: "AbortError" });
  });

  it("drops a javascript: source URL but keeps the source name", async () => {
    stubFetch(async () => ({
      ok: true,
      json: async () => ({
        sections: [
          row("bad", "Bad", { source: { name: "Evil", url: "javascript:alert(1)", authority_tier: "A" } }),
        ],
      }),
    }));
    const c = await fetchSubcategoryContent("Health", "X");
    expect(c.items[0].source).toMatchObject({ name: "Evil", url: null, authorityTier: "A" });
  });

  it("ignores malformed rows and unknown tiers", async () => {
    stubFetch(async () => ({
      ok: true,
      json: async () => ({
        sections: [
          null,
          { title: "no key" },
          row("ok", "Ok", { source: { name: "S", url: "https://x.ca", authority_tier: "Z" } }),
        ],
      }),
    }));
    const c = await fetchSubcategoryContent("Health", "X");
    expect(c.items).toHaveLength(1);
    expect(c.items[0].source?.authorityTier).toBeNull();
  });
});

describe("toSubcategoryContent", () => {
  it("keeps a second 'tip' as an ordinary item rather than dropping it", () => {
    const s = (key: string) => ({ key, title: key, bodyMarkdown: "", source: null });
    const c = toSubcategoryContent([s("tip"), s("tip")]);
    expect(c.tip).not.toBeNull();
    expect(c.items).toHaveLength(1);
  });
});

describe("STATIC_CATEGORIES", () => {
  it("has exactly the seven static categories, with unique slugs", () => {
    expect(STATIC_CATEGORIES.map((c) => c.category)).toEqual([
      "Finance",
      "Daily Needs",
      "Health",
      "Immigration",
      "Education & Family",
      "The City",
      "Moving & Shipping",
    ]);
    expect(new Set(STATIC_CATEGORIES.map((c) => c.slug)).size).toBe(7);
  });

  it("has no blank or padded subcategory names (they are exact DB keys)", () => {
    for (const c of STATIC_CATEGORIES) {
      expect(c.subcategories.length).toBeGreaterThan(0);
      for (const s of c.subcategories) expect(s).toBe(s.trim());
    }
  });

  it("flags only Immigration for the official-sources notice", () => {
    expect(STATIC_CATEGORIES.filter((c) => c.officialSourcesNotice).map((c) => c.slug)).toEqual([
      "immigration",
    ]);
  });

  it("looks categories up by slug", () => {
    expect(getCategoryBySlug("the-city")?.category).toBe("The City");
    expect(getCategoryBySlug("education-family")?.subcategories).toHaveLength(11);
    expect(getCategoryBySlug("education-family")?.subcategoryGroups?.map((group) => group.title)).toEqual([
      "Child Care",
      "Schools in Canada",
      "Colleges & Universities",
      "ESL Classes",
      "Trade Schools & Certifications",
    ]);
    expect(getCategoryBySlug("finance")?.subcategories).toEqual([
      "Banking & Moving Money",
      "Credit & Borrowing",
      "Taxes, Benefits & Pay",
    ]);
    expect(getCategoryBySlug("nope")).toBeUndefined();
  });
});

