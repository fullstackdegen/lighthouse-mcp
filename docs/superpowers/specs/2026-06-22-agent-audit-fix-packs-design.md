# Agent Audit Fix Packs Design

## Decision

Rename the product from Lighthouse MCP to Agent Audit and add a dedicated
`fixPacks` section to the canonical report. The package should position itself
as an MCP server that turns Lighthouse and site-intelligence findings into
coding-agent implementation packs.

The npm package and CLI command should become `agent-audit`, while the report
can still identify Lighthouse as the underlying audit engine.

## Goals

- Make the product easier to understand from the name alone.
- Preserve the existing Lighthouse and site-intelligence report contract.
- Add a coding-agent-specific handoff format that is more actionable than raw
  prioritized issues.
- Keep the first implementation deterministic and evidence-backed.
- Avoid framework guessing in this release.

## Non-Goals

- Do not add Semrush, Conductor, analytics, or external marketing-data
  integrations in this change.
- Do not crawl whole sites.
- Do not infer repository file paths from URL assets.
- Do not make the tool edit code directly.

## Report Contract

The existing `prioritizedIssues` array remains the audit-oriented source of
truth. A new top-level `fixPacks` array provides the implementation-oriented
view for coding agents.

Each fix pack should include:

- `id`: stable identifier derived from the source issue.
- `priority`: one-based ordering for execution.
- `sourceIssueIds`: audit or site-intelligence issue IDs included in the pack.
- `goal`: short implementation goal.
- `category`: performance, accessibility, best-practices, or seo.
- `severity`: critical, high, medium, or low.
- `affectedProfiles`: mobile, desktop, or both.
- `repoSearchHints`: concrete strings/selectors/URLs for repository search.
- `implementationSteps`: deterministic coding steps.
- `acceptanceCriteria`: measurable success checks copied or refined from the
  source issue.
- `verification`: rerun guidance and expected audit IDs to check.

The first release should generate one fix pack per prioritized issue. Later
versions can merge related issues when the evidence proves they share the same
source change.

## Markdown Output

Markdown should gain a dedicated `## Agent Fix Packs` section before
`## Prioritized Issues`. The section should be concise enough to paste directly
into Claude Code, Codex, Cursor, or another coding agent.

Each pack should render:

- priority and goal;
- severity, category, affected profiles;
- source issue IDs;
- repository search hints;
- implementation steps;
- acceptance criteria;
- verification command guidance.

## Naming And Documentation

The public product name becomes `Agent Audit`.

Update documentation and examples to prefer:

```bash
npx -y agent-audit
```

MCP configuration examples should use the server key `agent-audit` and the npm
package `agent-audit`. Existing Lighthouse references should remain where they
describe the audit engine.

The README headline should communicate the core promise:

> Turn Lighthouse audits into coding-agent fix packs.

## Data Flow

1. Lighthouse and site-intelligence findings are collected as they are today.
2. `prioritizedIssues` is built from those findings.
3. `fixPacks` is derived from `prioritizedIssues`.
4. The MCP response returns both structured JSON and Markdown generated from the
   same canonical report.

## Error Handling

If no prioritized issues exist, `fixPacks` should be an empty array and Markdown
should state that no fix packs were generated.

If a source issue has no evidence, the fix pack should still include
implementation steps and acceptance criteria, but `repoSearchHints` should avoid
inventing file paths or framework-specific instructions.

## Testing

Add or update tests for:

- report schema validation for `fixPacks`;
- deterministic fix-pack generation from representative issues;
- Markdown rendering of the `Agent Fix Packs` section;
- server output schema compatibility;
- package metadata and release validation for the `agent-audit` binary.

Run the existing verification suite:

```bash
npm test
npm run check
npm run build
npm run validate:release
```

## Open Release Constraint

The package rename still requires npm publishing permissions for `agent-audit`.
If npm publishing is blocked, the code can be merged but public installation
must wait until ownership or authentication is resolved.
