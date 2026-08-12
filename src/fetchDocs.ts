const JINA_PREFIX = "https://r.jina.ai/";
const MAX_CHARS = 25_000;

/**
 * Fetch clean markdown for a documentation URL through r.jina.ai.
 * Returns the text (possibly truncated) or throws on network/HTTP failure.
 */
export async function fetchDocs(targetUrl: string): Promise<string> {
  const response = await fetch(JINA_PREFIX + targetUrl, {
    headers: {
      // Ask Jina Reader for markdown output.
      "X-Return-Format": "markdown",
      "User-Agent": "mcp-server-dev-docs",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch docs (HTTP ${response.status} ${response.statusText}) for ${targetUrl}`
    );
  }

  const text = await response.text();

  if (text.length > MAX_CHARS) {
    const omitted = text.length - MAX_CHARS;
    return (
      text.slice(0, MAX_CHARS) +
      `\n\n... [truncated, ${omitted} characters omitted. Fetch the source URL directly for the full document: ${targetUrl}]`
    );
  }

  return text;
}
