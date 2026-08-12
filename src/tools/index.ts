import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerDetectProjectVersions } from "./detectProjectVersions.js";
import { registerFindDocsUrls } from "./findDocsUrls.js";
import { registerGetFullstackDocs } from "./getFullstackDocs.js";
import { registerListSupportedPresets } from "./listSupportedPresets.js";

/** Register all MCP tools on the given server. */
export function registerTools(server: McpServer): void {
  // available dev docs presets
  registerListSupportedPresets(server);
  // get fullstack docs as clean markdown
  registerGetFullstackDocs(server);
  // detect project versions from package.json
  registerDetectProjectVersions(server);
  // find documentation website URLs, then fetch markdown
  registerFindDocsUrls(server);
}
