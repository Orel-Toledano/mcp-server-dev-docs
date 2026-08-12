#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTools } from "./tools/index.js";

const server = new McpServer({
  name: "mcp-server-dev-docs",
  version: "0.1.0",
});

registerTools(server);

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
