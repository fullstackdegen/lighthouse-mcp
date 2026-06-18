# Single-URL Site Intelligence Design

## Goal

Extend Lighthouse MCP from a Lighthouse-only audit into a single-URL SEO and
performance intelligence report that coding agents can turn into implementation
tasks.

The first release is intentionally scoped to one URL. It does not crawl a site,
write files, mutate Shopify or CMS data, create redirects, compress images, or
call external product APIs. It analyzes the requested page and a small set of
well-known same-origin resources, then returns evidence-backed findings.

## Product Positioning

This is not a TinyIMG clone or a Shopify admin panel. The product remains an MCP
server for coding agents. Its job is to convert page-level SEO, performance,
accessibility, and indexability signals into deterministic tasks with evidence,
suggested actions, and acceptance criteria.

The user-facing promise becomes:

> Run a mobile and desktop Lighthouse audit plus agent-ready SEO, indexability,
> asset, structured data, and LLM visibility checks for a single URL.

## Scope

The MVP covers these eight capabilities:

1. Broken link checker
2. Metadata and page SEO checker
3. JSON-LD validator
4. Sitemap, robots, and indexability checker
5. Image optimization findings
6. CSS and JavaScript optimization findings
7. LLMs.txt generator
8. Agent-ready fix plan output

## Non-Goals

- Multi-page crawling
- Sitemap-wide auditing
- Shopify API integration
- Google Search Console integration
- IndexNow submission
- Automatic redirect creation
- Automatic image compression or conversion
- Automatic CSS or JavaScript minification
- Writing generated files into the user's repository

## User Experience

The existing MCP tool remains the primary entry point:

```json
{
  "url": "https://example.com",
  "mode": "reliable"
}
```

The tool still returns canonical `structuredContent` and equivalent Markdown.
The report includes the existing Lighthouse profile summaries and a new
`siteIntelligence` section. Coding agents should still treat
`prioritizedIssues` as the primary backlog.

## Architecture

Add a deterministic page-inspection pipeline that runs alongside Lighthouse:

1. Validate the input URL with the existing URL policy.
2. Fetch the HTML document with redirect limits, timeout limits, byte limits,
   and the same public/localhost policy used for Lighthouse.
3. Parse the HTML into lightweight facts using dependency-free extraction where
   practical.
4. Fetch only bounded, explicit resources:
   - same-origin `robots.txt`
   - same-origin `sitemap.xml`
   - same-origin links and assets discovered on the audited page, up to strict
     per-kind limits
5. Convert facts into site-intelligence findings.
6. Merge those findings into the existing `prioritizedIssues` backlog.
7. Render the same canonical data as Markdown.

The implementation should keep Lighthouse collection and page-intelligence
collection separate. `src/audit.ts` coordinates both, but page intelligence
lives in dedicated modules so it can later support crawling without changing the
Lighthouse runner.

## Proposed Files

- `src/site-intelligence.ts`
  - Orchestrates single-URL page intelligence.
  - Exposes `analyzeSiteIntelligence(url, options)`.
- `src/html-inspector.ts`
  - Extracts document facts from HTML: title, meta tags, headings, links,
    images, scripts, stylesheets, canonical, robots meta, JSON-LD blocks.
- `src/resource-fetcher.ts`
  - Provides bounded fetch helpers with timeout, byte limit, redirect limit, and
    URL policy checks.
- `src/site-findings.ts`
  - Converts document/resource facts into canonical findings and agent-ready
    actions.
- `src/llms-txt.ts`
  - Builds a conservative `llms.txt` draft from title, description, canonical
    URL, headings, and prominent same-origin links.
- `src/report-schema.ts`
  - Adds `siteIntelligence` to the structured report schema and increments
    `REPORT_SCHEMA_VERSION` to `1.1`.
- `src/report-builder.ts`
  - Accepts optional site-intelligence data and merges its findings into
    `prioritizedIssues`.
- `src/markdown.ts`
  - Adds a compact site-intelligence section and includes generated
    `llms.txt` draft when available.
- Tests mirror these modules under `test/`.

## Data Model

Add these report-level fields:

```ts
interface SiteIntelligenceReport {
  status: "complete" | "incomplete" | "failed";
  inspectedUrl: string;
  fetchedResources: {
    html: FetchSummary;
    robotsTxt: FetchSummary | null;
    sitemapXml: FetchSummary | null;
  };
  checks: SiteCheck[];
  llmsTxt: {
    status: "generated" | "insufficient-content";
    text: string | null;
    evidence: string[];
  };
}

interface SiteCheck {
  id: string;
  category:
    | "broken-links"
    | "metadata"
    | "structured-data"
    | "indexability"
    | "images"
    | "assets"
    | "llms";
  status: "pass" | "warn" | "fail";
  title: string;
  evidence: ReportEvidence[];
}
```

`AgentReadyLighthouseReport` gains:

```ts
siteIntelligence: SiteIntelligenceReport | null;
```

The report remains strict: no additional properties and bounded evidence arrays.

## Finding Strategy

Site-intelligence findings become regular `PrioritizedIssue` items with stable
audit IDs prefixed by `site-`, for example:

- `site-broken-link`
- `site-missing-meta-description`
- `site-invalid-json-ld`
- `site-blocked-by-robots`
- `site-image-missing-alt`
- `site-render-blocking-asset`
- `site-llms-txt-missing`

This keeps coding-agent execution simple: one backlog, one prioritization
order, one set of acceptance criteria.

## Capability Details

### Broken Link Checker

Inspect anchor links and page asset references discovered in the HTML. For the
MVP, check only HTTP and HTTPS URLs that pass URL policy. Skip `mailto:`,
`tel:`, fragments, JavaScript URLs, data URLs, and unsupported schemes.

Limits:

- Maximum 25 links
- Maximum 20 assets
- Maximum 5 seconds per request
- Maximum 3 redirects

Fail on 4xx and 5xx status codes. Warn on network timeout or unsupported but
visible HTTP URL policy rejections.

### Metadata And Page SEO Checker

Inspect:

- document title
- meta description
- canonical link
- viewport meta
- robots meta
- `h1` count
- obvious duplicate or empty metadata

Generate findings for missing, empty, overly short, overly long, duplicate, or
conflicting signals. Use conservative thresholds to avoid noisy reports.

### JSON-LD Validator

Parse every `<script type="application/ld+json">` block. Findings:

- invalid JSON
- empty JSON-LD
- no recognizable `@type`
- multiple parse failures

Do not perform remote schema validation in the MVP.

### Sitemap, Robots, And Indexability Checker

Fetch same-origin `/robots.txt` and `/sitemap.xml`. Findings:

- robots.txt not found: warn, not fail
- sitemap.xml not found: warn, not fail
- robots syntax blocks the audited path: fail
- page has `noindex`: fail
- canonical points to a different origin: warn
- sitemap contains the audited URL: pass evidence

The MVP uses simple robots parsing for `User-agent: *` and `Disallow` rules.

### Image Optimization Findings

Inspect HTML images and Lighthouse image audits together. Findings:

- missing alt on informative-looking images
- oversized image evidence from Lighthouse
- non-modern image formats from Lighthouse
- lazy-loaded LCP image from Lighthouse

No image files are downloaded or transformed.

### CSS And JavaScript Optimization Findings

Use Lighthouse audits plus HTML facts. Findings:

- render-blocking stylesheets/scripts
- unused JavaScript
- unused CSS
- legacy JavaScript
- third-party script cost
- missing preload candidate for LCP resource when Lighthouse exposes it

No minification is performed. The report tells the coding agent what to change.

### LLMs.txt Generator

Generate a conservative draft when enough page facts exist:

```txt
# <site or page title>

> <meta description or concise summary>

## Pages
- [<label>](<canonical or inspected URL>)
- [<same-origin link label>](<same-origin URL>)
```

If title and description are both missing, return `insufficient-content` with
evidence instead of hallucinating content.

### Agent-Ready Fix Plan Output

All findings must include:

- stable ID
- category
- severity
- affected profile when Lighthouse-specific, otherwise both profiles
- evidence
- suggested actions
- measurable acceptance criteria
- documentation URL when available

The top-level `prioritizedIssues` remains capped at 10. Site-intelligence
findings compete with Lighthouse findings by severity and estimated impact.

## Security And Reliability

The page-inspection fetcher must reuse the existing URL policy. It must not
become an SSRF bypass.

Required controls:

- HTTP and HTTPS only
- reject embedded credentials
- enforce public URL policy unless localhost mode is explicitly enabled
- validate every redirect target
- validate every DNS-resolved target
- request timeout
- response byte limit
- max redirects
- no cookies
- no credentials
- no custom user-provided headers in MVP

Page-controlled text must be sanitized and length-limited before entering
structured output or Markdown.

## Testing Strategy

Use TDD. Add focused unit tests for:

- HTML fact extraction
- bounded fetch behavior with mocked fetch
- metadata findings
- JSON-LD findings
- robots and sitemap findings
- broken-link findings
- `llms.txt` generation
- schema strictness
- Markdown rendering
- server tool output with injected page-intelligence dependency

Add integration-style tests with fixture HTML and fake network responses. Avoid
real network access in unit tests.

## Release Strategy

Ship as `0.2.0` because this expands the structured report contract to
`schemaVersion: "1.1"` and adds a substantial new report section.

Documentation updates:

- README feature list
- report contract summary
- security notes for bounded fetching
- example JSON and Markdown reports

## Future Work

After the single-URL MVP is stable:

1. Add optional same-origin crawl with page limit and depth limit.
2. Add sitemap-driven audit mode.
3. Add Google Search Console import as a separate tool.
4. Add IndexNow submission as an explicit opt-in action.
5. Add repository file-edit helpers only if the MCP client can safely expose a
   workspace.
