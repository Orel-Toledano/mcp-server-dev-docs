/**
 * Built-in documentation presets.
 *
 * Each preset maps a short key (e.g. `react`) to a canonical documentation URL
 * and a human-readable description. The URL is fetched through r.jina.ai to
 * produce clean, LLM-ready markdown.
 */

export interface DocPreset {
  /** Canonical documentation URL to fetch. */
  url: string;
  /** Short description of what this preset covers. */
  description: string;
}

export const PRESETS = {
  react: {
    url: "https://react.dev/reference/react",
    description: "React 19 reference (hooks, components, APIs).",
  },
  nextjs: {
    url: "https://nextjs.org/docs",
    description: "Next.js documentation (App Router, rendering, routing).",
  },
  typescript: {
    url: "https://www.typescriptlang.org/docs/handbook/intro.html",
    description: "TypeScript handbook.",
  },
  tailwind: {
    url: "https://tailwindcss.com/docs/installation",
    description: "Tailwind CSS documentation.",
  },
  zustand: {
    url: "https://zustand.docs.pmnd.rs/getting-started/introduction",
    description: "Zustand state-management docs.",
  },
  "tanstack-query": {
    url: "https://tanstack.com/query/latest/docs/framework/react/overview",
    description: "TanStack Query v5 (React) overview and guides.",
  },
  nodejs: {
    url: "https://nodejs.org/docs/latest/api/",
    description: "Node.js API documentation.",
  },
  prisma: {
    url: "https://www.prisma.io/docs/orm",
    description: "Prisma ORM documentation.",
  },
  express: {
    url: "https://expressjs.com/en/4x/api.html",
    description: "Express 4.x API reference.",
  },
} as const satisfies Record<string, DocPreset>;

export type PresetKey = keyof typeof PRESETS;

/** All available preset keys, as a readonly tuple usable by zod enums. */
export const PRESET_KEYS = Object.keys(PRESETS) as [PresetKey, ...PresetKey[]];
