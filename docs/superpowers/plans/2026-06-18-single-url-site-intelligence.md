# Single-URL Site Intelligence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a single-URL site intelligence layer to Lighthouse MCP that returns SEO, indexability, structured-data, asset, broken-link, and LLM visibility findings as agent-ready tasks.

**Architecture:** Keep Lighthouse execution unchanged and add a separate deterministic page-inspection pipeline. `src/audit.ts` coordinates both pipelines, `src/site-intelligence.ts` owns page intelligence, and `src/report-builder.ts` merges site findings into the existing `prioritizedIssues` backlog while also exposing a new strict `siteIntelligence` report section.

**Tech Stack:** TypeScript 6, Node.js 20 built-in `fetch`, Vitest, existing MCP SDK, existing Lighthouse result fixtures, existing URL policy.

---

## File Structure

- Create `src/site-intelligence.ts`
  - Orchestrates HTML fetch, fact extraction, well-known resource fetches, link/asset probing, finding generation, and `llms.txt` generation.
- Create `src/html-inspector.ts`
  - Dependency-free HTML fact extraction for title, metadata, headings, links, images, scripts, stylesheets, canonical, robots meta, and JSON-LD blocks.
- Create `src/resource-fetcher.ts`
  - Bounded same-policy fetch wrapper with timeout, byte limit, redirect limit, status summary, content-type summary, and redirect URL validation.
- Create `src/site-findings.ts`
  - Converts facts and fetch summaries into `SiteCheck[]` and `PrioritizedIssue[]` with stable `site-*` IDs.
- Create `src/llms-txt.ts`
  - Builds conservative `llms.txt` output from extracted page facts.
- Modify `src/report-schema.ts`
  - Add strict `siteIntelligence` schema and TypeScript interfaces. Bump `REPORT_SCHEMA_VERSION` to `"1.1"`.
- Modify `src/report-builder.ts`
  - Accept optional `siteIntelligence` and merge `siteIntelligence.prioritizedIssues` into existing Lighthouse issues, capped at 10.
- Modify `src/audit.ts`
  - Inject and call the site-intelligence analyzer once per requested URL, then pass the result into `buildAgentReadyReport`.
- Modify `src/markdown.ts`
  - Render compact site intelligence summary and generated `llms.txt` draft.
- Modify `src/server.ts`
  - Add injectable `analyzeSiteIntelligence` dependency for tests.
- Modify `README.md`, `examples/commalabs-fast-report.json`, and `examples/commalabs-fast-report.md`
  - Document the new report section and refresh examples.
- Add tests:
  - `test/html-inspector.test.ts`
  - `test/resource-fetcher.test.ts`
  - `test/site-findings.test.ts`
  - `test/llms-txt.test.ts`
  - `test/site-intelligence.test.ts`
  - extend `test/report-schema.test.ts`
  - extend `test/report-builder.test.ts`
  - extend `test/markdown.test.ts`
  - extend `test/server.test.ts`
  - extend `test/audit.test.ts`

## Task 1: Report Schema Contract

**Files:**
- Modify: `src/report-schema.ts`
- Modify: `test/report-schema.test.ts`

- [ ] **Step 1: Write failing schema tests**

Add this import to `test/report-schema.test.ts`:

```ts
import type { AgentReadyLighthouseReport } from "../src/report-schema.js";
```

Add these tests inside `describe("report contract", () => { ... })`:

```ts
  it("publishes site intelligence in schema version 1.1", () => {
    expect(REPORT_SCHEMA_VERSION).toBe("1.1");
    expect(lighthouseReportOutputSchema.required).toContain("siteIntelligence");
    expect(lighthouseReportOutputSchema.properties.siteIntelligence).toEqual({
      anyOf: [
        { type: "null" },
        expect.objectContaining({
          type: "object",
          additionalProperties: false,
          required: [
            "status",
            "inspectedUrl",
            "fetchedResources",
            "checks",
            "llmsTxt",
            "prioritizedIssues",
          ],
        }),
      ],
    });
  });

  it("types site intelligence as a nullable strict report section", () => {
    const report = {
      schemaVersion: REPORT_SCHEMA_VERSION,
      status: "complete",
      target: {
        requestedUrl: "https://example.com/",
        finalUrls: {
          mobile: "https://example.com/",
          desktop: "https://example.com/",
        },
      },
      environment: {
        generatedAt: "2026-06-18T00:00:00.000Z",
        lighthouseVersion: "12.6.1",
        userAgent: "test",
        mode: "fast",
        runsPerProfile: 1,
      },
      profiles: {} as AgentReadyLighthouseReport["profiles"],
      prioritizedIssues: [],
      agentInstructions: [],
      siteIntelligence: null,
    } satisfies AgentReadyLighthouseReport;

    expect(report.siteIntelligence).toBeNull();
  });
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
npm test -- --run test/report-schema.test.ts
```

Expected failure:

- `REPORT_SCHEMA_VERSION` is still `"1.0"`.
- `siteIntelligence` is missing from `lighthouseReportOutputSchema`.
- `AgentReadyLighthouseReport` has no `siteIntelligence` property.

- [ ] **Step 3: Implement schema types**

In `src/report-schema.ts`, change:

```ts
export const REPORT_SCHEMA_VERSION = "1.0" as const;
```

to:

```ts
export const REPORT_SCHEMA_VERSION = "1.1" as const;
```

Add these interfaces after `PrioritizedIssue`:

```ts
export type SiteIntelligenceStatus = "complete" | "incomplete" | "failed";
export type SiteCheckStatus = "pass" | "warn" | "fail";
export type SiteCheckCategory =
  | "broken-links"
  | "metadata"
  | "structured-data"
  | "indexability"
  | "images"
  | "assets"
  | "llms";

export interface FetchSummary {
  url: string;
  statusCode: number | null;
  ok: boolean;
  contentType: string | null;
  finalUrl: string;
  error: string | null;
}

export interface SiteCheck {
  id: string;
  category: SiteCheckCategory;
  status: SiteCheckStatus;
  title: string;
  evidence: ReportEvidence[];
}

export interface LlmsTxtReport {
  status: "generated" | "insufficient-content";
  text: string | null;
  evidence: string[];
}

export interface SiteIntelligenceReport {
  status: SiteIntelligenceStatus;
  inspectedUrl: string;
  fetchedResources: {
    html: FetchSummary;
    robotsTxt: FetchSummary | null;
    sitemapXml: FetchSummary | null;
  };
  checks: SiteCheck[];
  llmsTxt: LlmsTxtReport;
  prioritizedIssues: PrioritizedIssue[];
}
```

Add this property to `AgentReadyLighthouseReport`:

```ts
  siteIntelligence: SiteIntelligenceReport | null;
```

Add schemas before `lighthouseReportOutputSchema`:

```ts
const fetchSummarySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    url: { type: "string" },
    statusCode: nullableNumberSchema,
    ok: { type: "boolean" },
    contentType: nullableStringSchema,
    finalUrl: { type: "string" },
    error: nullableStringSchema,
  },
  required: ["url", "statusCode", "ok", "contentType", "finalUrl", "error"],
} as const;

const siteCheckSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: { type: "string" },
    category: {
      type: "string",
      enum: [
        "broken-links",
        "metadata",
        "structured-data",
        "indexability",
        "images",
        "assets",
        "llms",
      ],
    },
    status: { type: "string", enum: ["pass", "warn", "fail"] },
    title: { type: "string" },
    evidence: {
      type: "array",
      maxItems: 10,
      items: evidenceSchema,
    },
  },
  required: ["id", "category", "status", "title", "evidence"],
} as const;

const llmsTxtSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    status: { type: "string", enum: ["generated", "insufficient-content"] },
    text: nullableStringSchema,
    evidence: { type: "array", maxItems: 10, items: { type: "string" } },
  },
  required: ["status", "text", "evidence"],
} as const;

const siteIntelligenceSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    status: { type: "string", enum: ["complete", "incomplete", "failed"] },
    inspectedUrl: { type: "string" },
    fetchedResources: {
      type: "object",
      additionalProperties: false,
      properties: {
        html: fetchSummarySchema,
        robotsTxt: { anyOf: [fetchSummarySchema, { type: "null" }] },
        sitemapXml: { anyOf: [fetchSummarySchema, { type: "null" }] },
      },
      required: ["html", "robotsTxt", "sitemapXml"],
    },
    checks: { type: "array", maxItems: 50, items: siteCheckSchema },
    llmsTxt: llmsTxtSchema,
    prioritizedIssues: {
      type: "array",
      maxItems: 10,
      items: prioritizedIssueSchema,
    },
  },
  required: [
    "status",
    "inspectedUrl",
    "fetchedResources",
    "checks",
    "llmsTxt",
    "prioritizedIssues",
  ],
} as const;
```

`prioritizedIssueSchema` currently exists inline in `lighthouseReportOutputSchema`. Extract it into a named `const prioritizedIssueSchema = { ... } as const;` without changing its fields. Use the named constant in both top-level `prioritizedIssues.items` and `siteIntelligence.prioritizedIssues.items`.

Add `siteIntelligence` to top-level `lighthouseReportOutputSchema.properties`:

```ts
    siteIntelligence: { anyOf: [siteIntelligenceSchema, { type: "null" }] },
```

Add `"siteIntelligence"` to the top-level `required` array.

- [ ] **Step 4: Run schema tests**

Run:

```bash
npm test -- --run test/report-schema.test.ts
```

Expected: all tests in `test/report-schema.test.ts` pass.

- [ ] **Step 5: Commit**

```bash
git add src/report-schema.ts test/report-schema.test.ts
git commit -m "feat: add site intelligence report schema"
```

## Task 2: HTML Fact Extraction

**Files:**
- Create: `src/html-inspector.ts`
- Create: `test/html-inspector.test.ts`

- [ ] **Step 1: Write failing tests**

Create `test/html-inspector.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { inspectHtml } from "../src/html-inspector.js";

describe("inspectHtml", () => {
  it("extracts SEO metadata, links, images, scripts, stylesheets, and JSON-LD", () => {
    const facts = inspectHtml(
      `<!doctype html>
      <html>
        <head>
          <title> Example Product | Demo </title>
          <meta name="description" content="A concise product summary.">
          <meta name="robots" content="index,follow">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <link rel="canonical" href="/products/example">
          <link rel="stylesheet" href="/assets/app.css">
          <script src="/assets/app.js"></script>
          <script type="application/ld+json">
            {"@context":"https://schema.org","@type":"Product","name":"Example"}
          </script>
        </head>
        <body>
          <h1>Example Product</h1>
          <a href="/collections/frontpage">Frontpage</a>
          <a href="mailto:support@example.com">Email</a>
          <img src="/cdn/product.jpg" alt="Product photo" width="1600" height="1200">
        </body>
      </html>`,
      new URL("https://example.com/products/example"),
    );

    expect(facts.title).toBe("Example Product | Demo");
    expect(facts.description).toBe("A concise product summary.");
    expect(facts.robotsMeta).toBe("index,follow");
    expect(facts.viewport).toBe("width=device-width, initial-scale=1");
    expect(facts.canonicalUrl).toBe("https://example.com/products/example");
    expect(facts.headings.h1).toEqual(["Example Product"]);
    expect(facts.links).toContainEqual({
      url: "https://example.com/collections/frontpage",
      text: "Frontpage",
      kind: "http",
    });
    expect(facts.links).toContainEqual({
      url: "mailto:support@example.com",
      text: "Email",
      kind: "unsupported",
    });
    expect(facts.images[0]).toMatchObject({
      src: "https://example.com/cdn/product.jpg",
      alt: "Product photo",
      width: 1600,
      height: 1200,
    });
    expect(facts.scripts[0]).toEqual("https://example.com/assets/app.js");
    expect(facts.stylesheets[0]).toEqual("https://example.com/assets/app.css");
    expect(facts.jsonLdBlocks[0]?.raw).toContain('"@type":"Product"');
  });

  it("decodes basic HTML entities and length-limits page-controlled text", () => {
    const facts = inspectHtml(
      `<title>SEO &amp; Speed</title><h1>${"x".repeat(600)}</h1>`,
      new URL("https://example.com/"),
    );

    expect(facts.title).toBe("SEO & Speed");
    expect(facts.headings.h1[0]).toHaveLength(300);
  });
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
npm test -- --run test/html-inspector.test.ts
```

Expected failure: module `../src/html-inspector.js` does not exist.

- [ ] **Step 3: Implement `src/html-inspector.ts`**

Create `src/html-inspector.ts`:

```ts
export interface HtmlFacts {
  title: string | null;
  description: string | null;
  robotsMeta: string | null;
  viewport: string | null;
  canonicalUrl: string | null;
  headings: { h1: string[] };
  links: Array<{ url: string; text: string; kind: "http" | "unsupported" }>;
  images: Array<{
    src: string;
    alt: string | null;
    width: number | null;
    height: number | null;
  }>;
  scripts: string[];
  stylesheets: string[];
  jsonLdBlocks: Array<{ raw: string }>;
}

const TEXT_LIMIT = 300;

export function inspectHtml(html: string, baseUrl: URL): HtmlFacts {
  return {
    title: firstMatchText(html, /<title\b[^>]*>([\s\S]*?)<\/title>/i),
    description: metaContent(html, "description"),
    robotsMeta: metaContent(html, "robots"),
    viewport: metaContent(html, "viewport"),
    canonicalUrl: linkHref(html, "canonical", baseUrl),
    headings: { h1: allTagText(html, "h1") },
    links: extractLinks(html, baseUrl),
    images: extractImages(html, baseUrl),
    scripts: extractScriptSrcs(html, baseUrl),
    stylesheets: extractStylesheets(html, baseUrl),
    jsonLdBlocks: extractJsonLd(html),
  };
}

function firstMatchText(html: string, pattern: RegExp): string | null {
  const match = pattern.exec(html);
  return match?.[1] ? cleanText(match[1]) : null;
}

function allTagText(html: string, tag: string): string[] {
  return [...html.matchAll(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi"))]
    .map((match) => cleanText(match[1] ?? ""))
    .filter(Boolean);
}

function metaContent(html: string, name: string): string | null {
  for (const tag of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attrs = parseAttributes(tag[0]);
    if (attrs.name?.toLowerCase() === name) {
      return attrs.content ? cleanText(attrs.content) : null;
    }
  }
  return null;
}

function linkHref(html: string, rel: string, baseUrl: URL): string | null {
  for (const tag of html.matchAll(/<link\b[^>]*>/gi)) {
    const attrs = parseAttributes(tag[0]);
    const rels = attrs.rel?.toLowerCase().split(/\s+/) ?? [];
    if (rels.includes(rel) && attrs.href) {
      return resolveUrl(attrs.href, baseUrl);
    }
  }
  return null;
}

function extractLinks(
  html: string,
  baseUrl: URL,
): HtmlFacts["links"] {
  return [...html.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi)].map((match) => {
    const attrs = parseAttributes(match[0]);
    const href = attrs.href ?? "";
    const resolved = resolveUrl(href, baseUrl);
    return {
      url: resolved,
      text: cleanText(match[1] ?? ""),
      kind: isHttpUrl(resolved) ? "http" : "unsupported",
    };
  });
}

function extractImages(html: string, baseUrl: URL): HtmlFacts["images"] {
  return [...html.matchAll(/<img\b[^>]*>/gi)].map((match) => {
    const attrs = parseAttributes(match[0]);
    return {
      src: resolveUrl(attrs.src ?? "", baseUrl),
      alt: attrs.alt == null ? null : cleanText(attrs.alt),
      width: numericAttribute(attrs.width),
      height: numericAttribute(attrs.height),
    };
  });
}

function extractScriptSrcs(html: string, baseUrl: URL): string[] {
  return [...html.matchAll(/<script\b[^>]*>/gi)]
    .map((match) => parseAttributes(match[0]).src)
    .filter((src): src is string => Boolean(src))
    .map((src) => resolveUrl(src, baseUrl));
}

function extractStylesheets(html: string, baseUrl: URL): string[] {
  return [...html.matchAll(/<link\b[^>]*>/gi)]
    .filter((match) =>
      (parseAttributes(match[0]).rel ?? "").toLowerCase().split(/\s+/).includes("stylesheet"),
    )
    .map((match) => parseAttributes(match[0]).href)
    .filter((href): href is string => Boolean(href))
    .map((href) => resolveUrl(href, baseUrl));
}

function extractJsonLd(html: string): HtmlFacts["jsonLdBlocks"] {
  return [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => ({ raw: cleanText(match[1] ?? "", 5000) }));
}

function parseAttributes(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const match of tag.matchAll(/([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    attrs[match[1]!.toLowerCase()] = decodeEntities(match[2] ?? match[3] ?? match[4] ?? "");
  }
  return attrs;
}

function resolveUrl(value: string, baseUrl: URL): string {
  try {
    return new URL(value, baseUrl).href;
  } catch {
    return value;
  }
}

function numericAttribute(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function isHttpUrl(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://");
}

function cleanText(value: string, limit = TEXT_LIMIT): string {
  return decodeEntities(value.replace(/<[^>]+>/g, ""))
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
```

- [ ] **Step 4: Run tests**

Run:

```bash
npm test -- --run test/html-inspector.test.ts
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add src/html-inspector.ts test/html-inspector.test.ts
git commit -m "feat: extract page intelligence facts"
```

## Task 3: Bounded Resource Fetcher

**Files:**
- Create: `src/resource-fetcher.ts`
- Create: `test/resource-fetcher.test.ts`

- [ ] **Step 1: Write failing tests**

Create `test/resource-fetcher.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";

import { createResourceFetcher } from "../src/resource-fetcher.js";

describe("createResourceFetcher", () => {
  it("fetches text with limits and returns a summary", async () => {
    const fetcher = createResourceFetcher({
      fetch: vi.fn(async () => new Response("hello", {
        status: 200,
        headers: { "content-type": "text/html" },
      })),
      validateUrl: async (input) => new URL(String(input)),
      timeoutMs: 1000,
      maxBytes: 100,
      maxRedirects: 2,
    });

    const result = await fetcher.fetchText(new URL("https://example.com/"));

    expect(result.text).toBe("hello");
    expect(result.summary).toEqual({
      url: "https://example.com/",
      statusCode: 200,
      ok: true,
      contentType: "text/html",
      finalUrl: "https://example.com/",
      error: null,
    });
  });

  it("reports validation failures without fetching", async () => {
    const fetch = vi.fn();
    const fetcher = createResourceFetcher({
      fetch,
      validateUrl: async () => {
        throw new Error("blocked");
      },
      timeoutMs: 1000,
      maxBytes: 100,
      maxRedirects: 2,
    });

    const result = await fetcher.fetchText(new URL("http://127.0.0.1/"));

    expect(fetch).not.toHaveBeenCalled();
    expect(result.text).toBeNull();
    expect(result.summary.ok).toBe(false);
    expect(result.summary.error).toBe("blocked");
  });

  it("truncates responses over the byte limit", async () => {
    const fetcher = createResourceFetcher({
      fetch: vi.fn(async () => new Response("abcdef")),
      validateUrl: async (input) => new URL(String(input)),
      timeoutMs: 1000,
      maxBytes: 3,
      maxRedirects: 2,
    });

    const result = await fetcher.fetchText(new URL("https://example.com/"));

    expect(result.text).toBe("abc");
    expect(result.summary.error).toBe("Response exceeded 3 bytes and was truncated.");
  });
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
npm test -- --run test/resource-fetcher.test.ts
```

Expected failure: module `../src/resource-fetcher.js` does not exist.

- [ ] **Step 3: Implement `src/resource-fetcher.ts`**

Create `src/resource-fetcher.ts`:

```ts
import type { FetchSummary } from "./report-schema.js";

export interface ResourceFetcherDependencies {
  fetch: typeof fetch;
  validateUrl: (input: unknown) => Promise<URL>;
  timeoutMs: number;
  maxBytes: number;
  maxRedirects: number;
}

export interface FetchTextResult {
  text: string | null;
  summary: FetchSummary;
}

export interface ResourceFetcher {
  fetchText: (url: URL) => Promise<FetchTextResult>;
}

export function createResourceFetcher(
  dependencies: ResourceFetcherDependencies,
): ResourceFetcher {
  return {
    async fetchText(url) {
      try {
        const validated = await dependencies.validateUrl(url.href);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), dependencies.timeoutMs);
        try {
          const response = await dependencies.fetch(validated, {
            redirect: "follow",
            signal: controller.signal,
          });
          const finalUrl = response.url || validated.href;
          await dependencies.validateUrl(finalUrl);
          const fullText = await response.text();
          const truncated = fullText.slice(0, dependencies.maxBytes);
          const wasTruncated = fullText.length > dependencies.maxBytes;
          return {
            text: truncated,
            summary: {
              url: validated.href,
              statusCode: response.status,
              ok: response.ok,
              contentType: response.headers.get("content-type"),
              finalUrl,
              error: wasTruncated
                ? `Response exceeded ${dependencies.maxBytes} bytes and was truncated.`
                : null,
            },
          };
        } finally {
          clearTimeout(timeout);
        }
      } catch (error) {
        return {
          text: null,
          summary: {
            url: url.href,
            statusCode: null,
            ok: false,
            contentType: null,
            finalUrl: url.href,
            error: errorMessage(error),
          },
        };
      }
    },
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown fetch failure.";
}
```

Note: Node `fetch` does not expose redirect count. The MVP enforces redirect
target validation after fetch and keeps `maxRedirects` in the dependency shape
so a manual redirect loop can replace the built-in fetch behavior in a focused
follow-up task if required by review. Do not add manual redirects in this task.

- [ ] **Step 4: Run tests**

Run:

```bash
npm test -- --run test/resource-fetcher.test.ts
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add src/resource-fetcher.ts test/resource-fetcher.test.ts
git commit -m "feat: add bounded resource fetcher"
```

## Task 4: LLMs.txt Generator

**Files:**
- Create: `src/llms-txt.ts`
- Create: `test/llms-txt.test.ts`

- [ ] **Step 1: Write failing tests**

Create `test/llms-txt.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { generateLlmsTxt } from "../src/llms-txt.js";
import type { HtmlFacts } from "../src/html-inspector.js";

describe("generateLlmsTxt", () => {
  it("generates a conservative llms.txt draft from page facts", () => {
    const report = generateLlmsTxt({
      title: "Example Store",
      description: "Premium example products.",
      canonicalUrl: "https://example.com/",
      headings: { h1: ["Example Store"] },
      links: [
        { url: "https://example.com/products/a", text: "Product A", kind: "http" },
        { url: "https://external.test/", text: "External", kind: "http" },
      ],
      images: [],
      scripts: [],
      stylesheets: [],
      robotsMeta: null,
      viewport: null,
      jsonLdBlocks: [],
    } satisfies HtmlFacts, new URL("https://example.com/"));

    expect(report.status).toBe("generated");
    expect(report.text).toContain("# Example Store");
    expect(report.text).toContain("> Premium example products.");
    expect(report.text).toContain("- [Product A](https://example.com/products/a)");
    expect(report.text).not.toContain("external.test");
  });

  it("returns insufficient-content instead of hallucinating", () => {
    const report = generateLlmsTxt({
      title: null,
      description: null,
      canonicalUrl: null,
      headings: { h1: [] },
      links: [],
      images: [],
      scripts: [],
      stylesheets: [],
      robotsMeta: null,
      viewport: null,
      jsonLdBlocks: [],
    } satisfies HtmlFacts, new URL("https://example.com/"));

    expect(report).toEqual({
      status: "insufficient-content",
      text: null,
      evidence: ["Missing document title.", "Missing meta description."],
    });
  });
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
npm test -- --run test/llms-txt.test.ts
```

Expected failure: module `../src/llms-txt.js` does not exist.

- [ ] **Step 3: Implement `src/llms-txt.ts`**

Create `src/llms-txt.ts`:

```ts
import type { HtmlFacts } from "./html-inspector.js";
import type { LlmsTxtReport } from "./report-schema.js";

export function generateLlmsTxt(
  facts: HtmlFacts,
  inspectedUrl: URL,
): LlmsTxtReport {
  const title = facts.title ?? facts.headings.h1[0] ?? null;
  const description = facts.description;
  const evidence: string[] = [];

  if (!title) evidence.push("Missing document title.");
  if (!description) evidence.push("Missing meta description.");
  if (!title && !description) {
    return { status: "insufficient-content", text: null, evidence };
  }

  const canonical = facts.canonicalUrl ?? inspectedUrl.href;
  const sameOriginLinks = facts.links
    .filter((link) => link.kind === "http")
    .filter((link) => {
      try {
        return new URL(link.url).origin === inspectedUrl.origin;
      } catch {
        return false;
      }
    })
    .slice(0, 5);

  const lines = [
    `# ${title ?? new URL(canonical).hostname}`,
    "",
    `> ${description ?? "Primary page for this site."}`,
    "",
    "## Pages",
    `- [${title ?? "Primary page"}](${canonical})`,
    ...sameOriginLinks.map(
      (link) => `- [${link.text || link.url}](${link.url})`,
    ),
  ];

  return {
    status: "generated",
    text: lines.join("\n"),
    evidence: [
      title ? "Used document title." : "Used inspected URL hostname as title fallback.",
      description ? "Used meta description." : "Used generic page summary fallback.",
    ],
  };
}
```

- [ ] **Step 4: Run tests**

Run:

```bash
npm test -- --run test/llms-txt.test.ts
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add src/llms-txt.ts test/llms-txt.test.ts
git commit -m "feat: generate llms txt draft"
```

## Task 5: Site Findings

**Files:**
- Create: `src/site-findings.ts`
- Create: `test/site-findings.test.ts`

- [ ] **Step 1: Write failing tests**

Create `test/site-findings.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { buildSiteFindings } from "../src/site-findings.js";
import type { FetchSummary, LlmsTxtReport } from "../src/report-schema.js";
import type { HtmlFacts } from "../src/html-inspector.js";

const okHtml: FetchSummary = {
  url: "https://example.com/",
  statusCode: 200,
  ok: true,
  contentType: "text/html",
  finalUrl: "https://example.com/",
  error: null,
};

describe("buildSiteFindings", () => {
  it("creates checks and prioritized issues for metadata, JSON-LD, broken links, and llms.txt", () => {
    const facts: HtmlFacts = {
      title: "",
      description: null,
      robotsMeta: "noindex",
      viewport: null,
      canonicalUrl: "https://other.example/",
      headings: { h1: [] },
      links: [{ url: "https://example.com/missing", text: "Missing", kind: "http" }],
      images: [{ src: "https://example.com/a.jpg", alt: null, width: 2000, height: 1200 }],
      scripts: ["https://example.com/app.js"],
      stylesheets: ["https://example.com/app.css"],
      jsonLdBlocks: [{ raw: "{invalid" }],
    };
    const llmsTxt: LlmsTxtReport = {
      status: "insufficient-content",
      text: null,
      evidence: ["Missing document title.", "Missing meta description."],
    };

    const result = buildSiteFindings({
      inspectedUrl: new URL("https://example.com/"),
      facts,
      resources: {
        html: okHtml,
        robotsTxt: null,
        sitemapXml: null,
        probedUrls: [
          {
            url: "https://example.com/missing",
            statusCode: 404,
            ok: false,
            contentType: "text/html",
            finalUrl: "https://example.com/missing",
            error: null,
          },
        ],
      },
      llmsTxt,
    });

    expect(result.checks.map((check) => check.id)).toEqual(
      expect.arrayContaining([
        "site-missing-meta-description",
        "site-noindex",
        "site-invalid-json-ld",
        "site-broken-link",
        "site-image-missing-alt",
        "site-render-blocking-asset",
        "site-llms-txt-insufficient-content",
      ]),
    );
    expect(result.prioritizedIssues.map((issue) => issue.auditId)).toContain(
      "site-broken-link",
    );
    expect(result.prioritizedIssues[0]?.suggestedActions.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
npm test -- --run test/site-findings.test.ts
```

Expected failure: module `../src/site-findings.js` does not exist.

- [ ] **Step 3: Implement `src/site-findings.ts`**

Create `src/site-findings.ts` with these exports:

```ts
import type { HtmlFacts } from "./html-inspector.js";
import type {
  FetchSummary,
  LlmsTxtReport,
  PrioritizedIssue,
  ReportEvidence,
  SiteCheck,
} from "./report-schema.js";

export interface BuildSiteFindingsInput {
  inspectedUrl: URL;
  facts: HtmlFacts;
  resources: {
    html: FetchSummary;
    robotsTxt: FetchSummary | null;
    sitemapXml: FetchSummary | null;
    probedUrls: FetchSummary[];
  };
  llmsTxt: LlmsTxtReport;
}

export interface SiteFindingsResult {
  checks: SiteCheck[];
  prioritizedIssues: PrioritizedIssue[];
}

export function buildSiteFindings(
  input: BuildSiteFindingsInput,
): SiteFindingsResult {
  const checks: SiteCheck[] = [
    ...metadataChecks(input),
    ...structuredDataChecks(input),
    ...indexabilityChecks(input),
    ...brokenLinkChecks(input),
    ...imageChecks(input),
    ...assetChecks(input),
    ...llmsChecks(input),
  ];
  const prioritizedIssues = checks
    .filter((check) => check.status !== "pass")
    .map(checkToIssue)
    .slice(0, 10);

  return { checks, prioritizedIssues };
}
```

Implement helpers in the same file:

- `metadataChecks(input)` returns fail checks for missing/empty title, missing meta description, missing viewport, missing h1.
- `structuredDataChecks(input)` parses `facts.jsonLdBlocks`; invalid JSON produces `site-invalid-json-ld`; valid JSON without `@type` produces `site-json-ld-missing-type`.
- `indexabilityChecks(input)` returns fail for `robotsMeta` containing `noindex`; warn for canonical URL with a different origin; warn for missing robots/sitemap summaries.
- `brokenLinkChecks(input)` turns any probed `FetchSummary` with `ok === false` and a non-null `statusCode >= 400` into `site-broken-link`.
- `imageChecks(input)` returns `site-image-missing-alt` for images with `alt === null` or empty alt and `site-oversized-image` for width or height above 1600.
- `assetChecks(input)` returns `site-render-blocking-asset` when there is at least one stylesheet or script in facts.
- `llmsChecks(input)` returns `site-llms-txt-insufficient-content` when `llmsTxt.status === "insufficient-content"`.
- `checkToIssue(check)` maps:
  - `fail` to `high`
  - `warn` to `medium`
  - category to `seo`, except `images` and `assets` map to `performance`
  - affected profiles to `["mobile", "desktop"]`
  - evidence copied from the check
  - suggested action: `Fix ${check.title.toLowerCase()}.`
  - acceptance criteria: `${check.title} check passes in Lighthouse MCP site intelligence.`

Add small evidence helper:

```ts
function evidence(
  value: Partial<ReportEvidence>,
): ReportEvidence {
  return {
    url: value.url ?? null,
    selector: value.selector ?? null,
    snippet: value.snippet ?? null,
    totalBytes: value.totalBytes ?? null,
    wastedBytes: value.wastedBytes ?? null,
    wastedMs: value.wastedMs ?? null,
  };
}
```

- [ ] **Step 4: Run tests**

Run:

```bash
npm test -- --run test/site-findings.test.ts
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add src/site-findings.ts test/site-findings.test.ts
git commit -m "feat: build site intelligence findings"
```

## Task 6: Site Intelligence Orchestrator

**Files:**
- Create: `src/site-intelligence.ts`
- Create: `test/site-intelligence.test.ts`

- [ ] **Step 1: Write failing tests**

Create `test/site-intelligence.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";

import { createSiteIntelligenceAnalyzer } from "../src/site-intelligence.js";

describe("createSiteIntelligenceAnalyzer", () => {
  it("fetches the inspected page and well-known resources, then returns site intelligence", async () => {
    const fetchText = vi.fn(async (url: URL) => {
      if (url.pathname === "/robots.txt") {
        return {
          text: "User-agent: *\nAllow: /",
          summary: summary(url.href, 200, true),
        };
      }
      if (url.pathname === "/sitemap.xml") {
        return {
          text: "<urlset><url><loc>https://example.com/</loc></url></urlset>",
          summary: summary(url.href, 200, true),
        };
      }
      if (url.pathname === "/missing") {
        return { text: "not found", summary: summary(url.href, 404, false) };
      }
      return {
        text: `<title>Example</title>
          <meta name="description" content="Example page">
          <a href="/missing">Missing</a>`,
        summary: summary(url.href, 200, true),
      };
    });
    const analyzer = createSiteIntelligenceAnalyzer({
      fetcher: { fetchText },
      maxLinks: 25,
      maxAssets: 20,
    });

    const report = await analyzer(new URL("https://example.com/"));

    expect(report.status).toBe("complete");
    expect(report.inspectedUrl).toBe("https://example.com/");
    expect(report.fetchedResources.robotsTxt?.ok).toBe(true);
    expect(report.fetchedResources.sitemapXml?.ok).toBe(true);
    expect(report.checks.map((check) => check.id)).toContain("site-broken-link");
    expect(report.llmsTxt.status).toBe("generated");
    expect(fetchText).toHaveBeenCalledWith(new URL("https://example.com/"));
    expect(fetchText).toHaveBeenCalledWith(new URL("https://example.com/robots.txt"));
    expect(fetchText).toHaveBeenCalledWith(new URL("https://example.com/sitemap.xml"));
  });

  it("returns failed site intelligence when HTML cannot be fetched", async () => {
    const analyzer = createSiteIntelligenceAnalyzer({
      fetcher: {
        fetchText: vi.fn(async (url: URL) => ({
          text: null,
          summary: {
            url: url.href,
            statusCode: null,
            ok: false,
            contentType: null,
            finalUrl: url.href,
            error: "blocked",
          },
        })),
      },
      maxLinks: 25,
      maxAssets: 20,
    });

    const report = await analyzer(new URL("https://example.com/"));

    expect(report.status).toBe("failed");
    expect(report.fetchedResources.html.error).toBe("blocked");
    expect(report.prioritizedIssues).toEqual([]);
  });
});

function summary(url: string, statusCode: number, ok: boolean) {
  return {
    url,
    statusCode,
    ok,
    contentType: "text/html",
    finalUrl: url,
    error: null,
  };
}
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
npm test -- --run test/site-intelligence.test.ts
```

Expected failure: module `../src/site-intelligence.js` does not exist.

- [ ] **Step 3: Implement `src/site-intelligence.ts`**

Create `src/site-intelligence.ts`:

```ts
import { inspectHtml } from "./html-inspector.js";
import { generateLlmsTxt } from "./llms-txt.js";
import { createResourceFetcher, type ResourceFetcher } from "./resource-fetcher.js";
import { buildSiteFindings } from "./site-findings.js";
import type { SiteIntelligenceReport } from "./report-schema.js";
import { assertPublicHttpUrl } from "./url-policy.js";

export type AnalyzeSiteIntelligence = (
  url: URL,
) => Promise<SiteIntelligenceReport>;

export interface SiteIntelligenceAnalyzerDependencies {
  fetcher: ResourceFetcher;
  maxLinks: number;
  maxAssets: number;
}

export const analyzeSiteIntelligence = createSiteIntelligenceAnalyzer({
  fetcher: createResourceFetcher({
    fetch: globalThis.fetch,
    validateUrl: assertPublicHttpUrl,
    timeoutMs: 5000,
    maxBytes: 500_000,
    maxRedirects: 3,
  }),
  maxLinks: 25,
  maxAssets: 20,
});

export function createSiteIntelligenceAnalyzer(
  dependencies: SiteIntelligenceAnalyzerDependencies,
): AnalyzeSiteIntelligence {
  return async (url) => {
    const html = await dependencies.fetcher.fetchText(url);
    if (!html.text) {
      return {
        status: "failed",
        inspectedUrl: url.href,
        fetchedResources: {
          html: html.summary,
          robotsTxt: null,
          sitemapXml: null,
        },
        checks: [],
        llmsTxt: {
          status: "insufficient-content",
          text: null,
          evidence: ["HTML document could not be fetched."],
        },
        prioritizedIssues: [],
      };
    }

    const facts = inspectHtml(html.text, url);
    const robotsTxt = await dependencies.fetcher.fetchText(new URL("/robots.txt", url));
    const sitemapXml = await dependencies.fetcher.fetchText(new URL("/sitemap.xml", url));
    const probedUrls = await Promise.all(
      [...new Set([
        ...facts.links.filter((link) => link.kind === "http").map((link) => link.url),
        ...facts.images.map((image) => image.src),
        ...facts.scripts,
        ...facts.stylesheets,
      ])]
        .filter((candidate) => sameOrigin(candidate, url))
        .slice(0, dependencies.maxLinks + dependencies.maxAssets)
        .map((candidate) => dependencies.fetcher.fetchText(new URL(candidate))),
    );
    const llmsTxt = generateLlmsTxt(facts, url);
    const findings = buildSiteFindings({
      inspectedUrl: url,
      facts,
      resources: {
        html: html.summary,
        robotsTxt: robotsTxt.summary,
        sitemapXml: sitemapXml.summary,
        probedUrls: probedUrls.map((result) => result.summary),
      },
      llmsTxt,
    });

    return {
      status: "complete",
      inspectedUrl: url.href,
      fetchedResources: {
        html: html.summary,
        robotsTxt: robotsTxt.summary,
        sitemapXml: sitemapXml.summary,
      },
      checks: findings.checks,
      llmsTxt,
      prioritizedIssues: findings.prioritizedIssues,
    };
  };
}

function sameOrigin(value: string, baseUrl: URL): boolean {
  try {
    return new URL(value).origin === baseUrl.origin;
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Run tests**

Run:

```bash
npm test -- --run test/site-intelligence.test.ts
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add src/site-intelligence.ts test/site-intelligence.test.ts
git commit -m "feat: orchestrate single url site intelligence"
```

## Task 7: Report Builder Integration

**Files:**
- Modify: `src/report-builder.ts`
- Modify: `test/report-builder.test.ts`

- [ ] **Step 1: Write failing tests**

Add this import to `test/report-builder.test.ts`:

```ts
import type { SiteIntelligenceReport } from "../src/report-schema.js";
```

Add this test:

```ts
  it("includes site intelligence and merges site issues into the top-level backlog", () => {
    const siteIntelligence: SiteIntelligenceReport = {
      status: "complete",
      inspectedUrl: "https://example.com/",
      fetchedResources: {
        html: {
          url: "https://example.com/",
          statusCode: 200,
          ok: true,
          contentType: "text/html",
          finalUrl: "https://example.com/",
          error: null,
        },
        robotsTxt: null,
        sitemapXml: null,
      },
      checks: [],
      llmsTxt: {
        status: "generated",
        text: "# Example",
        evidence: ["Used document title."],
      },
      prioritizedIssues: [
        {
          auditId: "site-broken-link",
          category: "seo",
          severity: "high",
          affectedProfiles: ["mobile", "desktop"],
          title: "Broken link detected",
          description: "A linked URL returned an error status.",
          profiles: {},
          suggestedActions: ["Fix or remove the broken link."],
          acceptanceCriteria: ["The broken-link check passes."],
          documentationUrl: null,
        },
      ],
    };

    const report = buildAgentReadyReport({
      requestedUrl: "https://example.com",
      mode: "fast",
      generatedAt: new Date("2026-06-13T12:00:00.000Z"),
      siteIntelligence,
      profiles: {
        mobile: { attemptedRuns: 1, failures: [], runs: [makeLighthouseResult()] },
        desktop: {
          attemptedRuns: 1,
          failures: [],
          runs: [makeLighthouseResult({ formFactor: "desktop" })],
        },
      },
    });

    expect(report.siteIntelligence).toBe(siteIntelligence);
    expect(report.prioritizedIssues.map((issue) => issue.auditId)).toContain(
      "site-broken-link",
    );
    expect(report.prioritizedIssues).toHaveLength(10);
  });
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
npm test -- --run test/report-builder.test.ts
```

Expected failure: `siteIntelligence` is not accepted by `BuildReportInput`, output has no `siteIntelligence`, and top-level issues do not include `site-broken-link`.

- [ ] **Step 3: Implement builder integration**

In `src/report-builder.ts`:

- Import `type SiteIntelligenceReport`.
- Add optional `siteIntelligence?: SiteIntelligenceReport | null;` to `BuildReportInput`.
- Replace:

```ts
    prioritizedIssues: mergeAndPrioritizeFindings(profileFindings),
```

with:

```ts
    prioritizedIssues: [
      ...(input.siteIntelligence?.prioritizedIssues ?? []),
      ...mergeAndPrioritizeFindings(profileFindings),
    ].slice(0, 10),
    siteIntelligence: input.siteIntelligence ?? null,
```

- [ ] **Step 4: Run tests**

Run:

```bash
npm test -- --run test/report-builder.test.ts test/report-schema.test.ts
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add src/report-builder.ts test/report-builder.test.ts
git commit -m "feat: merge site intelligence into report"
```

## Task 8: Audit And Server Wiring

**Files:**
- Modify: `src/audit.ts`
- Modify: `src/server.ts`
- Modify: `test/audit.test.ts`
- Modify: `test/server.test.ts`

- [ ] **Step 1: Write failing tests**

In `test/audit.test.ts`, add a test that injects an analyzer and expects its output in the final report:

```ts
  it("runs site intelligence once for the requested URL", async () => {
    const siteIntelligence = makeSiteIntelligence();
    const analyzeSiteIntelligence = vi.fn(async () => siteIntelligence);
    const auditor = createWebsiteAuditor({
      launchChrome: async () => ({ port: 9222, kill: vi.fn() }),
      runLighthouse: async () => ({ lhr: makeLighthouseResult() }),
      validateUrl: async (input) => new URL(String(input)),
      now: () => new Date("2026-06-13T12:00:00.000Z"),
      analyzeSiteIntelligence,
    });

    const report = await auditor(new URL("https://example.com/"), "fast");

    expect(analyzeSiteIntelligence).toHaveBeenCalledOnce();
    expect(analyzeSiteIntelligence).toHaveBeenCalledWith(
      new URL("https://example.com/"),
    );
    expect(report.siteIntelligence).toBe(siteIntelligence);
  });
```

Add helper in the same file:

```ts
function makeSiteIntelligence() {
  return {
    status: "complete",
    inspectedUrl: "https://example.com/",
    fetchedResources: {
      html: {
        url: "https://example.com/",
        statusCode: 200,
        ok: true,
        contentType: "text/html",
        finalUrl: "https://example.com/",
        error: null,
      },
      robotsTxt: null,
      sitemapXml: null,
    },
    checks: [],
    llmsTxt: {
      status: "generated",
      text: "# Example",
      evidence: ["Used document title."],
    },
    prioritizedIssues: [],
  } as const;
}
```

In `test/server.test.ts`, update the `makeReport()` helper so every generated
report includes `siteIntelligence: null` through the `buildAgentReadyReport`
input. Keep the existing server assertions unchanged except where they compare
the full structured report.

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
npm test -- --run test/audit.test.ts test/server.test.ts
```

Expected failure: `WebsiteAuditorDependencies` has no `analyzeSiteIntelligence` dependency and the final report never receives the injected site intelligence.

- [ ] **Step 3: Implement audit wiring**

In `src/audit.ts`:

- Import:

```ts
import {
  analyzeSiteIntelligence as runSiteIntelligence,
  type AnalyzeSiteIntelligence,
} from "./site-intelligence.js";
```

- Add to `WebsiteAuditorDependencies`:

```ts
  analyzeSiteIntelligence: AnalyzeSiteIntelligence;
```

- Add to `auditWebsite = createWebsiteAuditor({ ... })`:

```ts
  analyzeSiteIntelligence: runSiteIntelligence,
```

- In the returned auditor, before `buildAgentReadyReport`, run:

```ts
    const siteIntelligence = await dependencies.analyzeSiteIntelligence(requestedUrl);
```

- Pass `siteIntelligence` into `buildAgentReadyReport`.

In `src/server.ts`, no new public input is needed. Keep the server tool contract unchanged.

- [ ] **Step 4: Run tests**

Run:

```bash
npm test -- --run test/audit.test.ts test/server.test.ts
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add src/audit.ts src/server.ts test/audit.test.ts test/server.test.ts
git commit -m "feat: run site intelligence with audits"
```

## Task 9: Markdown Rendering

**Files:**
- Modify: `src/markdown.ts`
- Modify: `test/markdown.test.ts`

- [ ] **Step 1: Write failing tests**

In `test/markdown.test.ts`, add a report fixture with `siteIntelligence` and this assertion:

```ts
  it("renders site intelligence summary and llms txt draft", () => {
    const report = buildAgentReadyReport({
      requestedUrl: "https://example.com",
      mode: "fast",
      generatedAt: new Date("2026-06-13T12:00:00.000Z"),
      siteIntelligence: {
        status: "complete",
        inspectedUrl: "https://example.com/",
        fetchedResources: {
          html: {
            url: "https://example.com/",
            statusCode: 200,
            ok: true,
            contentType: "text/html",
            finalUrl: "https://example.com/",
            error: null,
          },
          robotsTxt: null,
          sitemapXml: null,
        },
        checks: [
          {
            id: "site-broken-link",
            category: "broken-links",
            status: "fail",
            title: "Broken link detected",
            evidence: [],
          },
        ],
        llmsTxt: {
          status: "generated",
          text: "# Example\n\n> Example page",
          evidence: ["Used document title."],
        },
        prioritizedIssues: [],
      },
      profiles: {
        mobile: { attemptedRuns: 1, failures: [], runs: [makeLighthouseResult()] },
        desktop: {
          attemptedRuns: 1,
          failures: [],
          runs: [makeLighthouseResult({ formFactor: "desktop" })],
        },
      },
    });

    const markdown = renderReportMarkdown(report);

    expect(markdown).toContain("## Site Intelligence");
    expect(markdown).toContain("- Status: **complete**");
    expect(markdown).toContain("Broken link detected");
    expect(markdown).toContain("```txt\n# Example\n\n> Example page\n```");
  });
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
npm test -- --run test/markdown.test.ts
```

Expected failure: markdown does not render `Site Intelligence`.

- [ ] **Step 3: Implement markdown section**

In `src/markdown.ts`, add a renderer that runs after key metrics and before prioritized issues:

```ts
function renderSiteIntelligence(report: AgentReadyLighthouseReport): string[] {
  if (!report.siteIntelligence) return [];
  const site = report.siteIntelligence;
  const lines = [
    "## Site Intelligence",
    "",
    `- Status: **${site.status}**`,
    `- Inspected URL: ${site.inspectedUrl}`,
    `- Checks: ${site.checks.length}`,
    "",
  ];

  for (const check of site.checks.filter((item) => item.status !== "pass").slice(0, 10)) {
    lines.push(`- **${check.status.toUpperCase()}** ${check.title} (${check.id})`);
  }

  if (site.llmsTxt.text) {
    lines.push("", "### Generated llms.txt Draft", "", "```txt", site.llmsTxt.text, "```", "");
  }

  return lines;
}
```

Call it from the main markdown array:

```ts
    ...renderSiteIntelligence(report),
```

- [ ] **Step 4: Run tests**

Run:

```bash
npm test -- --run test/markdown.test.ts
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add src/markdown.ts test/markdown.test.ts
git commit -m "feat: render site intelligence markdown"
```

## Task 10: Documentation, Examples, Version

**Files:**
- Modify: `README.md`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `examples/commalabs-fast-report.json`
- Modify: `examples/commalabs-fast-report.md`

- [ ] **Step 1: Update version**

Run:

```bash
npm version 0.2.0 --no-git-tag-version
```

Expected: `package.json` and `package-lock.json` version become `0.2.0`.

- [ ] **Step 2: Update README**

In README:

- Update the short feature list under "What The Report Contains" to include:

```md
- Single-URL site intelligence for broken links, metadata, JSON-LD, indexability, images, assets, and LLM visibility
- Generated `llms.txt` draft when page content is sufficient
```

- Add a short subsection after "What The Report Contains":

```md
## Site Intelligence

In addition to Lighthouse, the tool inspects the requested page and bounded same-origin resources. It reports broken links, page metadata issues, JSON-LD syntax issues, robots/sitemap/indexability signals, image optimization findings, CSS/JavaScript optimization findings, and a conservative `llms.txt` draft.

The MVP is single-URL by design. It does not crawl the whole site, modify Shopify or CMS settings, compress images, minify code, create redirects, or submit IndexNow requests.
```

- Extend security wording:

```md
The page-inspection fetcher uses the same URL policy as Lighthouse navigation and applies timeout, byte-size, and bounded-resource limits.
```

- [ ] **Step 3: Refresh examples**

Run the existing smoke command against `https://www.commalabs.co/tr` in fast mode and overwrite examples:

```bash
npm run --silent smoke -- https://www.commalabs.co/tr fast > examples/commalabs-fast-report.json 2> examples/commalabs-fast-report.md
```

Expected: JSON example contains `"schemaVersion": "1.1"` and `"siteIntelligence"`.

- [ ] **Step 4: Run focused validation**

Run:

```bash
npm test -- --run test/report-schema.test.ts test/report-builder.test.ts test/markdown.test.ts
npm run validate:release
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add README.md package.json package-lock.json examples/commalabs-fast-report.json examples/commalabs-fast-report.md
git commit -m "docs: document site intelligence report"
```

## Task 11: Full Verification And Release Prep

**Files:**
- No source edits expected.

- [ ] **Step 1: Run complete test suite**

```bash
npm test -- --run
```

Expected: all test files pass.

- [ ] **Step 2: Run typecheck and build**

```bash
npm run check
npm run build
```

Expected: both commands exit 0.

- [ ] **Step 3: Validate release surface**

```bash
npm run validate:release
npm_config_cache=/tmp/lighthouse-mcp-npm-cache npm pack --dry-run
```

Expected:

- `Release surface is valid.`
- tarball includes `dist`, `docs/assets`, `examples`, `README.md`, `LICENSE`, and no `docs/superpowers`.

- [ ] **Step 4: Run npm audit**

```bash
npm audit --omit=dev
```

Expected: `found 0 vulnerabilities`.

- [ ] **Step 5: Run published-style local CLI smoke against built dist**

```bash
node dist/index.js --help
```

Expected: usage output includes `--local`.

Run MCP initialize smoke:

```bash
node -e 'const { spawn } = require("node:child_process"); const child = spawn("node", ["dist/index.js", "--local"], { stdio: ["pipe", "pipe", "pipe"] }); let out=""; let done=false; function finish(code){ if(done) return; done=true; clearTimeout(timer); if(child.exitCode===null) child.kill("SIGTERM"); console.log(out); process.exit(code); } child.stdout.on("data", d => { out += d; if (out.includes("\"serverInfo\"")) finish(0); }); const msg={jsonrpc:"2.0",id:1,method:"initialize",params:{protocolVersion:"2025-06-18",capabilities:{},clientInfo:{name:"smoke",version:"0.0.0"}}}; child.stdin.write(JSON.stringify(msg)+"\n"); const timer=setTimeout(()=>finish(1), 15000);'
```

Expected: output includes `"name":"mcp-server-lighthouse"`.

- [ ] **Step 6: Remove internal plan/spec docs before public PR**

The final public tree should not include `docs/superpowers`.

```bash
git rm -r docs/superpowers
git commit -m "docs: remove internal planning files"
```

Expected: `docs/assets/lighthouse-mcp-overview.svg`, `examples/commalabs-fast-report.json`, and `examples/commalabs-fast-report.md` remain.

- [ ] **Step 7: Push PR**

```bash
git push -u origin codex/site-intelligence-mvp
gh pr create --base main --head codex/site-intelligence-mvp --title "Add single-url site intelligence report" --body "## Summary
- add single-URL site intelligence for broken links, metadata, JSON-LD, indexability, images, assets, and LLM visibility
- merge site findings into the agent-ready prioritized issue backlog
- add a strict siteIntelligence report section and bump schemaVersion to 1.1
- refresh README and example reports for 0.2.0

## Verification
- npm test -- --run
- npm run check
- npm run build
- npm run validate:release
- npm audit --omit=dev
- npm_config_cache=/tmp/lighthouse-mcp-npm-cache npm pack --dry-run
- node dist/index.js --help
- node dist/index.js --local initialize smoke"
```

Expected: PR opens and CI starts.

- [ ] **Step 8: Merge and publish**

After CI passes:

```bash
gh pr merge <PR_NUMBER> --merge --delete-branch
git fetch origin main --tags
git switch --detach origin/main
npm publish --access public --auth-type=legacy
git tag v0.2.0
git push origin v0.2.0
gh release create v0.2.0 --title "v0.2.0" --notes "## What's changed
- Added single-URL site intelligence reports.
- Added broken-link, metadata, JSON-LD, indexability, image, asset, and LLM visibility findings.
- Added generated llms.txt draft output.
- Bumped report schema to 1.1.

## Verification
- CI passed on Node 20 and Node 22.
- Published npm package: mcp-server-lighthouse@0.2.0."
```

Expected:

- npm publishes `mcp-server-lighthouse@0.2.0`.
- GitHub release exists for `v0.2.0`.
- tag-triggered Release workflow succeeds and skips npm publish if version already exists.

## Self-Review

- Spec coverage:
  - Broken link checker: Task 5 and Task 6.
  - Metadata/page SEO checker: Task 2 and Task 5.
  - JSON-LD validator: Task 2 and Task 5.
  - Sitemap/robots/indexability: Task 6 and Task 5.
  - Image optimization findings: Task 5 plus Lighthouse merge in Task 7.
  - CSS/JS findings: Task 5 plus Lighthouse merge in Task 7.
  - LLMs.txt generator: Task 4 and Task 9.
  - Agent-ready fix plan output: Task 5 and Task 7.
- Incomplete-marker scan:
  - No incomplete implementation markers or incomplete file references.
  - Each code-producing task includes concrete tests, implementation shape, commands, and commit instructions.
- Type consistency:
  - `SiteIntelligenceReport`, `SiteCheck`, `FetchSummary`, `LlmsTxtReport`, and `PrioritizedIssue` names match across schema, implementation tasks, and tests.
  - `siteIntelligence` is nullable at top level and non-null inside the analyzer output.
