import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { fetchDocs } from "../fetchDocs.js";
import {
  buildFallbackQuery,
  buildPrimaryQuery,
  extractTopResultUrls,
  fetchSearchHtml,
} from "../search.js";

export function registerFindDocsUrls(server: McpServer): void {
  server.registerTool(
    "find_docs_urls",
    {
      title: "Find documentation URLs and fetch clean markdown",
      description:
        "Find documentation website URLs for a technology via DuckDuckGo (site-scoped when mapped, with an automatic relaxed fallback), then return clean markdown for up to the top 2 results through Jina Reader. Optionally scope by version.",
      inputSchema: {
        query: z
          .string()
          .min(1)
          .describe("Terms to find docs URLs for, e.g. 'useEffect'."),
        technology: z
          .string()
          .min(1)
          .describe("Technology name, e.g. 'react', 'nextjs', or 'tailwind'."),
        version: z
          .string()
          .min(1)
          .optional()
          .describe(
            "Optional version to scope docs URL search, e.g. '15' or '19'."
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
              text: `Documentation URL search request failed: ${message}`,
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
              text: `No documentation URLs found. Tried: ${triedQueries
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
              text: `Found docs URL(s) ${urls.join(", ")}, but failed to fetch clean markdown: ${message}`,
            },
          ],
        };
      }
    }
  );
}
