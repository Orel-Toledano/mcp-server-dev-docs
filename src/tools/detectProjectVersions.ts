import { readFile } from "node:fs/promises";
import path from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerDetectProjectVersions(server: McpServer): void {
  server.registerTool(
    "detect_project_versions",
    {
      title: "Detect project dependency versions",
      description:
        "Read package.json from the current working directory and return a JSON summary of dependencies and devDependencies with their declared versions.",
      inputSchema: {},
    },
    async () => {
      const packageJsonPath = path.join(process.cwd(), "package.json");

      try {
        const raw = await readFile(packageJsonPath, "utf8");
        let parsed: {
          name?: string;
          version?: string;
          dependencies?: Record<string, string>;
          devDependencies?: Record<string, string>;
        };

        try {
          parsed = JSON.parse(raw) as typeof parsed;
        } catch {
          return {
            isError: true,
            content: [
              {
                type: "text",
                text: `package.json at ${packageJsonPath} is not valid JSON.`,
              },
            ],
          };
        }

        const summary = {
          name: parsed.name ?? null,
          version: parsed.version ?? null,
          dependencies: parsed.dependencies ?? {},
          devDependencies: parsed.devDependencies ?? {},
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(summary, null, 2),
            },
          ],
        };
      } catch (error) {
        const code =
          error && typeof error === "object" && "code" in error
            ? String((error as { code?: unknown }).code)
            : undefined;

        if (code === "ENOENT") {
          return {
            isError: true,
            content: [
              {
                type: "text",
                text: `No package.json found in the current working directory (${process.cwd()}).`,
              },
            ],
          };
        }

        const message = error instanceof Error ? error.message : String(error);
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to read package.json: ${message}`,
            },
          ],
        };
      }
    }
  );
}
