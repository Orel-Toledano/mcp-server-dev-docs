import * as cheerio from "cheerio";

export const DDG_SEARCH_URL = "https://html.duckduckgo.com/html/";

export const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

/** Domain mapping for common technologies used by `find_docs_urls`. */
export const DOMAIN_MAP: Record<string, string> = {
  nextjs: "nextjs.org",
  next: "nextjs.org",
  react: "react.dev",
  tailwind: "tailwindcss.com",
  tailwindcss: "tailwindcss.com",
  zustand: "zustand-demo.pmnd.rs",
};

/**
 * Primary targeted query using root domain only (no `/docs/<version>` in site:).
 * Returns null when the technology has no mapped domain (caller should use fallback).
 */
export function buildPrimaryQuery(
  technology: string,
  query: string,
  version?: string
): string | null {
  const domain = DOMAIN_MAP[technology.toLowerCase()];
  if (!domain) {
    return null;
  }

  const parts = [`site:${domain}`, technology];
  if (version) {
    parts.push(version);
  }
  parts.push(query);
  return parts.join(" ");
}

/** Relaxed query without the site: constraint. */
export function buildFallbackQuery(
  technology: string,
  query: string,
  version?: string
): string {
  const parts = [technology];
  if (version) {
    parts.push(version);
  }
  parts.push("docs", query);
  return parts.join(" ");
}

/**
 * Normalize a DuckDuckGo result href into an absolute destination URL.
 * Unwraps `/l/?uddg=` redirect links when present.
 */
function normalizeResultUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  let absolute = trimmed;
  if (trimmed.startsWith("//")) {
    absolute = `https:${trimmed}`;
  } else if (trimmed.startsWith("/")) {
    absolute = `https://duckduckgo.com${trimmed}`;
  }

  try {
    const url = new URL(absolute);
    const uddg = url.searchParams.get("uddg");
    if (uddg) {
      return decodeURIComponent(uddg);
    }
    return url.toString();
  } catch {
    return null;
  }
}

/** Extract up to `limit` unique documentation result URLs from DDG HTML. */
export function extractTopResultUrls(html: string, limit = 2): string[] {
  const $ = cheerio.load(html);
  const urls: string[] = [];
  const seen = new Set<string>();

  const push = (raw: string | undefined | null) => {
    if (!raw || urls.length >= limit) {
      return;
    }
    const normalized = normalizeResultUrl(raw);
    if (!normalized || seen.has(normalized)) {
      return;
    }
    seen.add(normalized);
    urls.push(normalized);
  };

  $("a.result__a[href]").each((_, el) => {
    push($(el).attr("href"));
  });

  if (urls.length < limit) {
    $("a.result__url").each((_, el) => {
      push($(el).attr("href"));
      if (urls.length < limit) {
        push($(el).text());
      }
    });
  }

  return urls;
}

/** Fetch DuckDuckGo HTML search results with a browser User-Agent. */
export async function fetchSearchHtml(q: string): Promise<string> {
  const searchUrl = `${DDG_SEARCH_URL}?q=${encodeURIComponent(q)}`;
  const response = await fetch(searchUrl, {
    headers: {
      "User-Agent": BROWSER_UA,
      Accept: "text/html",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Documentation search failed (HTTP ${response.status} ${response.statusText})`
    );
  }

  return response.text();
}
