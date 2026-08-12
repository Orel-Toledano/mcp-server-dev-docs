import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { fetchDocs } from "../fetchDocs.js";
import {
  buildFallbackQuery,
  buildPrimaryQuery,
  extractTopResultUrls,
  fetchSearchHtml,
} from "../search.js";

export function registerSearchDocs(server: McpServer): void {
  server.registerTool(
    "search_docs",
    {
      title: "Search documentation and fetch clean markdown",
      description:
        "Search documentation for a technology via DuckDuckGo (site-scoped when mapped, with an automatic relaxed fallback), then return clean markdown for up to the top 2 results through Jina Reader. Optionally scope by version.",
      inputSchema: {
        query: z
          .string()
          .min(1)
          .describe("The documentation search query, e.g. 'useEffect'."),
        technology: z
          .string()
          .min(1)
          .describe("Technology name, e.g. 'react', 'nextjs', or 'tailwind'."),
        version: z
          .string()
          .min(1)
          .optional()
          .describe(
            "Optional version to scope docs search, e.g. '15' or '19'."
          ),
      },
    },
    async ({ query, technology, version }) => {
      const primaryQuery = buildPrimaryQuery(technology, query, version);
      const fallbackQuery = buildFallbackQuery(technology, query, version);
      const triedQueries: string[] = [];

      let urls: string[] = [];

      try {
        if (primaryQuery) {
          triedQueries.push(primaryQuery);
          const primaryHtml = await fetchSearchHtml(primaryQuery);
          urls = extractTopResultUrls(primaryHtml, 2);
        }

        if (urls.length === 0) {
          triedQueries.push(fallbackQuery);
          const fallbackHtml = await fetchSearchHtml(fallbackQuery);
          urls = extractTopResultUrls(fallbackHtml, 2);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Documentation search request failed: ${message}`,
            },
          ],
        };
      }

      if (urls.length === 0) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `No documentation results found. Tried: ${triedQueries
                .map((q) => `"${q}"`)
                .join(" then ")}. Try a different query, technology, or version.`,
            },
          ],
        };
      }

      try {
        const markdowns = await Promise.all(urls.map((url) => fetchDocs(url)));
        const sections = urls.map((url, index) => {
          return `--- Result ${index + 1}: ${url} ---\n\n${markdowns[index]}`;
        });

        return {
          content: [
            {
              type: "text",
              text: sections.join("\n\n"),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Found docs result(s) at ${urls.join(", ")}, but failed to fetch clean markdown: ${message}`,
            },
          ],
        };
      }
    }
  );
}
