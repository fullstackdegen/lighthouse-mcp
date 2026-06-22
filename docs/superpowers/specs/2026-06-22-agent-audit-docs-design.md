# Agent Audit Documentation Design

## Decision

Update the public documentation for the renamed `agent-audit` repository and add
agent-facing guidance files that explain how coding agents should consume Agent
Audit reports.

## Goals

- Make the README work as a GitHub landing page for humans.
- Make `CLAUDE.md` and `AGENTS.md` work as concise operating instructions for
  coding agents.
- Add a deeper workflow guide and copy-paste prompt for applying fix packs.
- Move canonical repository links from `fullstackdegen/lighthouse-mcp` to
  `fullstackdegen/agent-audit`.
- Keep release validation strict enough to catch stale canonical links.

## Non-Goals

- Do not change the report schema or runtime behavior.
- Do not add new MCP tools.
- Do not publish to npm in this change.

## Files

- `README.md`: human-facing product landing page, installation, examples,
  workflow, limitations, roadmap.
- `CLAUDE.md`: Claude Code instructions for working in this repository and
  applying Agent Audit reports.
- `AGENTS.md`: general coding-agent instructions for Codex, Cursor, Claude, and
  compatible agents.
- `docs/agent-workflow.md`: detailed report anatomy and execution workflow.
- `examples/prompts/coding-agent-fix-packs.md`: copy-paste prompt for coding
  agents.
- `package.json`, `package-lock.json`, `SECURITY.md`,
  `.github/ISSUE_TEMPLATE/config.yml`: canonical repository links.
- `docs/assets/agent-audit-overview.svg`: renamed overview asset.

## Validation

Run:

```bash
npm test
npm run check
npm run build
npm run validate:release
```

Also run a stale-link search for:

```bash
rg -n "fullstackdegen/lighthouse-mcp|lighthouse-mcp-overview" README.md package.json package-lock.json SECURITY.md .github docs examples scripts test
```
