import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { PRESETS, type PresetKey } from "../presets.js";

export function registerListSupportedPresets(server: McpServer): void {
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
}
