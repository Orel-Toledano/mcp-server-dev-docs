import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { fetchDocs } from "../fetchDocs.js";
import { PRESETS, PRESET_KEYS } from "../presets.js";

export function registerGetFullstackDocs(server: McpServer): void {
  server.registerTool(
    "get_fullstack_docs",
    {
      title: "Get fullstack docs as clean markdown",
      description:
        "Fetch live, clean, LLM-ready markdown documentation. Provide either a `preset` key (see `list_supported_presets`) or a `customUrl`. Exactly one must be supplied.",
      inputSchema: {
        preset: z
          .enum(PRESET_KEYS)
          .optional()
          .describe("A built-in preset key, e.g. 'react' or 'nextjs'."),
        customUrl: z
          .string()
          .url()
          .optional()
          .describe("A custom documentation URL to fetch as clean markdown."),
      },
    },
    async ({ preset, customUrl }) => {
      if (preset && customUrl) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: "Provide only one of `preset` or `customUrl`, not both.",
            },
          ],
        };
      }

      if (!preset && !customUrl) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: "You must provide either a `preset` key or a `customUrl`.",
            },
          ],
        };
      }

      const targetUrl = preset ? PRESETS[preset].url : (customUrl as string);

      try {
        const text = await fetchDocs(targetUrl);
        return {
          content: [
            {
              type: "text",
              text: `# Source: ${targetUrl}\n\n${text}`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          isError: true,
          content: [{ type: "text", text: message }],
        };
      }
    }
  );
}
