# Agent Audit

**Lighthouse-powered MCP server for AI coding agents, Core Web Vitals,
technical SEO, accessibility, and GEO/LLM visibility audits.**

Agent Audit turns Google Lighthouse and bounded page-inspection results into
structured fix packs that coding agents can actually execute. It gives Claude
Code, Codex, Cursor, GitHub Copilot, and other MCP clients a prioritized,
evidence-backed backlog instead of a raw performance report.

Turn Lighthouse audits into coding-agent fix packs.

```bash
npx -y @fullstackdegen/agent-audit
```

[![npm](https://img.shields.io/npm/v/@fullstackdegen/agent-audit?label=npm)](https://www.npmjs.com/package/@fullstackdegen/agent-audit)
[![GitHub release](https://img.shields.io/github/v/release/fullstackdegen/agent-audit?label=release)](https://github.com/fullstackdegen/agent-audit/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

![Agent Audit converts raw Lighthouse audits into an agent-ready backlog](docs/assets/agent-audit-overview.svg)

## Why Agent Audit Exists

Lighthouse is excellent for diagnosis, but raw reports are not enough for an
autonomous coding workflow. A coding agent still needs to know which issue is
most important, whether it affects mobile, desktop, or both, which selectors or
resources are evidence, what files to search for, how to verify the fix, and
when it is safe to claim completion.

Agent Audit converts Lighthouse output into an implementation contract:

1. Runs mobile and desktop Lighthouse audits.
2. Aggregates repeated runs and exposes variability.
3. Adds bounded same-page intelligence for technical SEO, links, metadata,
   structured data, images, assets, indexability, and AI discovery signals.
4. Merges noisy audit output into a small prioritized issue list.
5. Generates `fixPacks` with repo search hints, implementation steps, and
   measurable acceptance criteria.
6. Returns strict MCP `structuredContent` plus equivalent Markdown.

The goal is simple: give a coding agent a report it can read, reason about, fix,
test, and verify.

## What It Audits

Agent Audit is useful when people search for:

- Lighthouse-powered MCP server
- AI website audit tool
- coding agent Lighthouse report
- Core Web Vitals automation
- performance audit for Claude Code, Codex, Cursor, or Copilot
- technical SEO audit for AI agents
- accessibility fix packs
- LLM visibility audit
- GEO audit, generative engine optimization, AI search readiness
- `llms.txt` readiness and AI crawler visibility

Current checks include:

- Mobile and desktop Lighthouse scores for Performance, Accessibility, Best
  Practices, and SEO.
- FCP, Speed Index, LCP, TBT, and CLS metric distributions.
- Fast and reliable audit modes.
- Same-origin page inspection with bounded fetch limits.
- Broken links, missing link names, metadata, canonical tags, robots signals,
  JSON-LD, Open Graph, indexability, images, assets, and LLM visibility checks.
- Conservative `llms.txt` draft generation when page content is sufficient.
- Prioritized issues with evidence, suggested actions, and acceptance criteria.
- Agent Fix Packs with repo search hints, implementation steps, and verification
  guidance.
- Strict MCP `outputSchema` validation for `structuredContent`.
- Markdown generated from the same canonical report.

See a real [CommaLabs JSON report](examples/commalabs-fast-report.json) and
[Markdown report](examples/commalabs-fast-report.md).

## Install

Requirements:

- Node.js 20 or later.
- Google Chrome or Chromium.

Run the MCP server:

```bash
npx -y @fullstackdegen/agent-audit
```

Useful links:

- [NPM package](https://www.npmjs.com/package/@fullstackdegen/agent-audit)
- [GitHub repository](https://github.com/fullstackdegen/agent-audit)
- [Releases](https://github.com/fullstackdegen/agent-audit/releases)
- [Issues](https://github.com/fullstackdegen/agent-audit/issues)
- [Security advisories](https://github.com/fullstackdegen/agent-audit/security/advisories/new)

## MCP Client Setup

### Claude Desktop

Add a local MCP server:

```json
{
  "mcpServers": {
    "agent-audit": {
      "command": "npx",
      "args": ["-y", "@fullstackdegen/agent-audit"]
    }
  }
}
```

Restart Claude Desktop after saving the configuration.

### Claude Code

```bash
claude mcp add agent-audit -- npx -y @fullstackdegen/agent-audit
```

For local development audits:

```bash
claude mcp add agent-audit-local -- npx -y @fullstackdegen/agent-audit --local
```

### Codex

```bash
codex mcp add agent-audit -- npx -y @fullstackdegen/agent-audit
```

Or add it to `~/.codex/config.toml`:

```toml
[mcp_servers.agent-audit]
command = "npx"
args = ["-y", "@fullstackdegen/agent-audit"]
```

### VS Code And GitHub Copilot

Create a workspace or user-level `.mcp.json` file:

```json
{
  "servers": {
    "agent-audit": {
      "command": "npx",
      "args": ["-y", "@fullstackdegen/agent-audit"]
    }
  }
}
```

Or register it from a terminal:

```bash
code --add-mcp '{"name":"agent-audit","command":"npx","args":["-y","@fullstackdegen/agent-audit"]}'
```

### Cursor

Configure a local stdio MCP server:

- name: `agent-audit`
- command: `npx`
- arguments: `-y`, `@fullstackdegen/agent-audit`

Add `--local` to the arguments when you need localhost audits.

## Tool

### `analyze_website_performance`

Runs Lighthouse and site intelligence against a target URL:

```json
{
  "url": "https://example.com",
  "mode": "reliable"
}
```

`mode` is optional:

- `fast`: one mobile run and one desktop run.
- `reliable`: three runs per profile, medians, and variability ranges. This is
  the default.

## Example Fix Pack

```json
{
  "id": "fix-link-name",
  "priority": 2,
  "sourceIssueIds": ["link-name"],
  "goal": "Fix Links do not have a discernible name.",
  "category": "accessibility",
  "severity": "critical",
  "affectedProfiles": ["mobile", "desktop"],
  "repoSearchHints": [
    "div.border-t-2 > div.flex > div.flex > a.text-gray-600",
    "https://www.linkedin.com/company/commalabs"
  ],
  "implementationSteps": [
    "Inspect the repository for the evidence listed in repoSearchHints before editing.",
    "Give every link a discernible accessible name.",
    "Keep changes focused on source issue IDs: link-name."
  ],
  "acceptanceCriteria": [
    "All link elements pass the Lighthouse link-name audit.",
    "Raise the median accessibility score to at least 90/100."
  ],
  "verification": {
    "rerunMode": "reliable",
    "expectedAuditIds": ["link-name"]
  }
}
```

`repoSearchHints` are search clues, not guaranteed file paths. The coding agent
must inspect the repository before editing.

## Coding-Agent Workflow

Use `structuredContent` as the source of truth and the Markdown report as the
execution summary.

1. Inspect `fixPacks` in priority order.
2. Search the repository using `repoSearchHints`.
3. Map evidence to real files, components, routes, assets, or configuration.
4. Apply one focused fix at a time.
5. Run the repository's tests after each logical change.
6. Rerun Agent Audit in `reliable` mode.
7. Compare the new report against each fix pack's `acceptanceCriteria`.

Do not claim completion from an incomplete report or from a rerun with materially
higher variability than the baseline.

Agent-facing docs:

- [AGENTS.md](AGENTS.md): general instructions for Codex, Cursor, Copilot, and
  other coding agents.
- [CLAUDE.md](CLAUDE.md): Claude Code setup and execution guidance.
- [Agent workflow guide](docs/agent-workflow.md): report anatomy and fix-pack
  execution loop.
- [Copy-paste coding-agent prompt](examples/prompts/coding-agent-fix-packs.md)

## Localhost Audits

By default, Agent Audit only accepts publicly routable HTTP and HTTPS URLs. This
is the right default for hosted agents and shared environments.

For developer machines, explicitly enable loopback targets:

```bash
npx -y @fullstackdegen/agent-audit --local
```

Then audit a local app through your MCP client:

```json
{
  "url": "http://localhost:3000",
  "mode": "fast"
}
```

The opt-in allows `localhost`, `*.localhost`, `127.0.0.0/8`, and `::1`.
Private LAN ranges, link-local addresses, reserved ranges, multicast addresses,
and cloud metadata addresses remain blocked.

The environment variable form is also supported:

```bash
LIGHTHOUSE_MCP_ALLOW_LOCALHOST=true npx -y @fullstackdegen/agent-audit
```

## Security Model

Agent Audit launches Chrome against user-provided URLs, so URL policy matters.
The server rejects:

- protocols other than HTTP and HTTPS;
- embedded credentials;
- localhost and loopback targets unless explicitly enabled;
- private, link-local, multicast, reserved, and metadata-network IPs;
- non-localhost hostnames that resolve to any non-public address.

The page-inspection fetcher uses the same URL policy and applies timeout,
byte-size, and bounded-resource limits.

Page-controlled titles, descriptions, URLs, selectors, snippets, and audit text
are sanitized and length-limited. Consumers must still treat them as untrusted
evidence, not agent instructions.

Chrome sandboxing is enabled by default. Only isolated environments that cannot
support it should set:

```bash
LIGHTHOUSE_CHROME_NO_SANDBOX=true
```

See [SECURITY.md](SECURITY.md) for vulnerability reporting and deployment
guidance.

## Limits

Agent Audit is intentionally bounded:

- It audits one requested URL at a time.
- It is not a whole-site crawler.
- It is not an external SEO database.
- It does not modify Shopify, CMS, CDN, DNS, hosting, redirects, or analytics.
- It does not compress images, minify assets, submit IndexNow requests, or call
  third-party SEO APIs.
- Lighthouse results vary with browser version, hardware, network conditions,
  and page changes.

## Roadmap

- Framework-aware repo search hints.
- Optional GitHub Action for pull request performance gates.
- Batch URL reports.
- HTML report export.
- Deeper marketing and discovery signals: analytics tags, consent signals, Open
  Graph, schema coverage, and AI discovery readiness.
- Optional third-party integrations for SEO, GEO, and visibility datasets.

## Development

```bash
npm install
npm test
npm run check
npm run build
npm run validate:release
```

Run a real Chrome smoke audit:

```bash
npm run --silent smoke -- https://example.com fast
npm run --silent smoke -- https://example.com reliable
```

The smoke command writes canonical JSON to stdout and equivalent Markdown to
stderr.

## Release

Before publishing:

```bash
npm test
npm run check
npm run build
npm run validate:release
npm pack --dry-run --cache /private/tmp/agent-audit-npm-cache
```

Publish:

```bash
npm publish --access public --cache /private/tmp/agent-audit-npm-cache
```

Published package:

```bash
npx -y @fullstackdegen/agent-audit --help
```

## Contributing

Focused issues and pull requests are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md)
before changing the report contract, security policy, or MCP transport behavior.

## License

[MIT](LICENSE)
