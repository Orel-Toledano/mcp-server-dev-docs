import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerDetectProjectVersions } from "./detectProjectVersions.js";
import { registerGetFullstackDocs } from "./getFullstackDocs.js";
import { registerListSupportedPresets } from "./listSupportedPresets.js";
import { registerSearchDocs } from "./searchDocs.js";

/** Register all MCP tools on the given server. */
export function registerTools(server: McpServer): void {
  // available dev docs presets
  registerListSupportedPresets(server);
  // get fullstack docs as clean markdown
  registerGetFullstackDocs(server);
  // detect project versions from package.json
  registerDetectProjectVersions(server);
  // search docs urls on the web
  registerSearchDocs(server);
}
