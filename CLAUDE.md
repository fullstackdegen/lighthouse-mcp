# Claude Code Instructions

Use this file when Claude Code is working on Agent Audit or applying an Agent
Audit report to another repository.

## MCP Setup

```bash
claude mcp add agent-audit -- npx -y @fullstackdegen/agent-audit
```

For local development apps:

```bash
claude mcp add agent-audit-local -- npx -y @fullstackdegen/agent-audit --local
```

## How To Use Reports

- Use `structuredContent` as the source of truth.
- Execute `fixPacks` in priority order.
- Use `repoSearchHints` as search hints, not as guaranteed file paths.
- Inspect the repository before editing.
- Keep changes focused on the active fix pack.
- Run tests after each logical fix.
- Rerun Agent Audit in `reliable` mode before claiming completion.

## Suggested Claude Prompt

```text
Read the Agent Audit structuredContent. Treat fixPacks as the implementation
queue. For each fix pack, inspect the repository using repoSearchHints, map the
evidence to real files, implement the smallest safe fix, run tests, and then
rerun Agent Audit in reliable mode. Do not claim completion from an incomplete
rerun or from unmet acceptance criteria.
```

## Working In This Repository

When changing Agent Audit itself:

```bash
npm test
npm run check
npm run build
npm run validate:release
```

Do not change the report schema without updating:

- `src/report-schema.ts`
- report-builder tests
- Markdown renderer tests
- example JSON and Markdown reports
- release validation
