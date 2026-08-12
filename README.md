# mcp-server-dev-docs

An [MCP](https://modelcontextprotocol.io) server that provides **live, clean, LLM-ready markdown documentation** for popular fullstack technologies — and any custom documentation URL.

It fetches pages through [`https://r.jina.ai/`](https://jina.ai/reader/) under the hood to strip navigation, ads, and boilerplate, returning clean markdown. **No API key or authentication required.**

## Features

- Built-in presets for React 19, Next.js, TypeScript, Tailwind CSS, Zustand, TanStack Query v5, Node.js, Prisma, and Express.
- Fetch any arbitrary documentation URL as clean markdown.
- Search live docs by technology (and optional version) via DuckDuckGo, then return clean markdown for the top results through Jina Reader.
- Detect dependency versions from the current project's `package.json`.
- Automatic truncation of very large pages (> 25,000 characters) to keep responses LLM-friendly.
- Zero configuration and no API keys.

## Tools

### `list_supported_presets`

Lists the built-in preset keys, their target URLs, and descriptions. Takes no arguments.

### `get_fullstack_docs`

Fetches clean markdown documentation. Provide **exactly one** of:

| Argument     | Type     | Description                                                        |
| ------------ | -------- | ----------------------------------------------------------------- |
| `preset`     | `string` | A built-in preset key (see below), e.g. `react`.                  |
| `customUrl`  | `string` | Any documentation URL to fetch as clean markdown.                 |

### `detect_project_versions`

Reads `package.json` from the current working directory (`process.cwd()`) and returns a JSON summary of `dependencies` and `devDependencies` with their declared versions. Takes no arguments.

### `search_docs`

Searches documentation for a technology and returns clean markdown for up to the **top 2** DuckDuckGo results (fetched in parallel via Jina Reader).

| Argument       | Type     | Required | Description                                              |
| -------------- | -------- | -------- | -------------------------------------------------------- |
| `query`        | `string` | yes      | Search terms, e.g. `useActionState` or `app router`.     |
| `technology`   | `string` | yes      | Technology name, e.g. `react`, `nextjs`, `tailwind`.     |
| `version`      | `string` | no       | Optional version scope, e.g. `19` or `15`.               |

**Search behavior:**

1. **Primary query** (when the technology has a known docs domain):  
   `site:<domain> <technology> <version?> <query>`  
   Example: `site:react.dev react 19 useActionState`
2. **Fallback** if the primary search returns no links:  
   `<technology> <version?> docs <query>`
3. Extract up to two result URLs, fetch markdown for both with `Promise.all`, and return them as:

```text
--- Result 1: <url> ---

...

--- Result 2: <url> ---

...
```

Mapped domains include `react` → `react.dev`, `nextjs`/`next` → `nextjs.org`, `tailwind`/`tailwindcss` → `tailwindcss.com`, and `zustand` → `zustand-demo.pmnd.rs`.

> Note: DuckDuckGo may rate-limit or challenge automated HTML searches after many requests. If searches fail intermittently, wait and retry, or use `get_fullstack_docs` with a preset/`customUrl`.

### Supported presets

| Key              | Documentation                                     |
| ---------------- | ------------------------------------------------- |
| `react`          | React 19 reference                                |
| `nextjs`         | Next.js docs (App Router, rendering, routing)     |
| `typescript`     | TypeScript handbook                               |
| `tailwind`       | Tailwind CSS docs                                 |
| `zustand`        | Zustand state management                          |
| `tanstack-query` | TanStack Query v5 (React)                         |
| `nodejs`         | Node.js API                                       |
| `prisma`         | Prisma ORM                                        |
| `express`        | Express 4.x API reference                         |

## Installation & Usage

The server runs over stdio and is intended to be launched by an MCP client. The easiest way is via `npx` (no global install needed):

```bash
npx mcp-server-dev-docs
```

### Cursor

Add the server to your Cursor MCP config at `~/.cursor/mcp.json` (global) or `.cursor/mcp.json` (per-project):

```json
{
  "mcpServers": {
    "dev-docs": {
      "command": "npx",
      "args": ["-y", "mcp-server-dev-docs"]
    }
  }
}
```

Then reload Cursor. The tools `list_supported_presets`, `get_fullstack_docs`, `detect_project_versions`, and `search_docs` will be available to the agent.

### Claude Desktop

Add the server to `claude_desktop_config.json`:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "dev-docs": {
      "command": "npx",
      "args": ["-y", "mcp-server-dev-docs"]
    }
  }
}
```

Restart Claude Desktop to load the server.

## Local Development

Requires Node.js >= 18 and Yarn.

```bash
git clone https://github.com/Orel-Toledano/mcp-server-dev-docs.git
cd mcp-server-dev-docs
yarn install
yarn build      # compiles TypeScript to ./build and marks the entry executable
yarn start      # runs the compiled server over stdio
```

To point an MCP client at your local build, use an absolute path:

```json
{
  "mcpServers": {
    "dev-docs": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server-dev-docs/build/index.js"]
    }
  }
}
```

### Smoke test

You can exercise the JSON-RPC handshake without a full client:

```bash
printf '%s\n' \
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' \
  '{"jsonrpc":"2.0","method":"notifications/initialized"}' \
  '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' \
  | node build/index.js
```

Or use the MCP Inspector:

```bash
npx @modelcontextprotocol/inspector node build/index.js
```

## Publishing

This package builds automatically before publish via the `prepare` script.

```bash
# Inspect the tarball contents first (dry run)
yarn pack

# Authenticate with the npm registry
yarn login

# Publish (public access for unscoped/public packages)
yarn publish --access public
```

Only the compiled `build/` directory is published (see the `files` field in `package.json`).

## How it works

- `get_fullstack_docs` resolves a target URL (from a preset or `customUrl`) and requests `https://r.jina.ai/<target-url>` with `X-Return-Format: markdown`.
- `search_docs` finds candidate URLs via DuckDuckGo HTML search, then fetches each through the same Jina Reader path.
- Large pages are truncated at 25,000 characters to keep responses LLM-friendly.

## Project structure

```text
src/
  index.ts                 # MCP server entry (stdio)
  presets.ts               # Built-in documentation presets
  fetchDocs.ts             # Jina Reader fetch + truncation
  search.ts                # Domain map, DDG query/parse helpers
  tools/
    index.ts               # Registers all tools
    listSupportedPresets.ts
    getFullstackDocs.ts
    detectProjectVersions.ts
    searchDocs.ts
```

## License

[MIT](./LICENSE)
