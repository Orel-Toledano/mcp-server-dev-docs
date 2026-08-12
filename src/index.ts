#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { PRESETS, PRESET_KEYS, type PresetKey } from "./presets.js";

const JINA_PREFIX = "https://r.jina.ai/";
const MAX_CHARS = 25_000;

const server = new McpServer({
  name: "mcp-server-dev-docs",
  version: "0.1.0",
});

/**
 * Fetch clean markdown for a documentation URL through r.jina.ai.
 * Returns the text (possibly truncated) or throws on network/HTTP failure.
 */
async function fetchDocs(targetUrl: string): Promise<string> {
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

server.registerTool(
  "list_supported_presets",
  {
    title: "List supported documentation presets",
    description:
      "List the built-in documentation preset keys, their target URLs, and descriptions. Use a preset key with `get_fullstack_docs`.",
    inputSchema: {},
  },
  async () => {
    const lines = (Object.keys(PRESETS) as PresetKey[]).map((key) => {
      const preset = PRESETS[key];
      return `- ${key}: ${preset.description}\n  ${preset.url}`;
    });

    const text = [
      "Supported documentation presets:",
      "",
      ...lines,
      "",
      "Usage: call `get_fullstack_docs` with a `preset` key above, or with a `customUrl` to fetch any documentation page as clean markdown.",
    ].join("\n");

    return {
      content: [{ type: "text", text }],
    };
  }
);

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

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Never write to stdout: it carries the JSON-RPC stream.
  console.error("mcp-server-dev-docs running on stdio");
}

main().catch((error) => {
  console.error("Fatal error starting mcp-server-dev-docs:", error);
  process.exit(1);
});
