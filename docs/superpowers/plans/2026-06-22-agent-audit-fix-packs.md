# Agent Audit Fix Packs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the public product to Agent Audit and add canonical `fixPacks` that turn prioritized audit issues into coding-agent implementation packs.

**Architecture:** Keep `prioritizedIssues` as the audit-oriented source of truth and derive `fixPacks` from it after report prioritization. Add a focused fix-pack builder module, extend the strict report schema, render a dedicated Markdown section, and update release-facing docs and examples to use `agent-audit`.

**Tech Stack:** TypeScript 6, Vitest, MCP SDK, Lighthouse, Node.js 20, npm package metadata.

---

## File Structure

- Create `src/fix-packs.ts`: deterministic conversion from `PrioritizedIssue[]` to `AgentFixPack[]`.
- Create `test/fix-packs.test.ts`: unit coverage for fix-pack IDs, search hints, empty evidence, and verification fields.
- Modify `src/report-schema.ts`: schema version bump, `AgentFixPack` types, output schema, and top-level report field.
- Modify `src/report-builder.ts`: derive `fixPacks` from the already-capped `prioritizedIssues`.
- Modify `src/markdown.ts`: render `## Agent Fix Packs` before `## Prioritized Issues`.
- Modify `test/report-schema.test.ts`: assert schema version `1.2`, top-level `fixPacks`, strict nested shape, and typed report examples.
- Modify `test/report-builder.test.ts`: assert one fix pack per prioritized issue and ordering.
- Modify `test/markdown.test.ts`: assert fix-pack section rendering and empty state.
- Modify `package.json`: rename package/bin from `mcp-server-lighthouse` to `agent-audit`, update description and keywords.
- Modify `README.md`, `CONTRIBUTING.md`, examples, and release validation scripts to reflect Agent Audit naming and the new report contract.

---

### Task 1: Add Fix-Pack Types To The Report Contract

**Files:**
- Modify: `src/report-schema.ts`
- Test: `test/report-schema.test.ts`

- [ ] **Step 1: Write the failing schema tests**

Add these expectations to `test/report-schema.test.ts`:

```ts
it("publishes a strict fix pack output schema", () => {
  expect(REPORT_SCHEMA_VERSION).toBe("1.2");
  expect(lighthouseReportOutputSchema.required).toContain("fixPacks");
  expect(lighthouseReportOutputSchema.properties.fixPacks.maxItems).toBe(10);

  const fixPackSchema = lighthouseReportOutputSchema.properties.fixPacks.items;

  expect(fixPackSchema.additionalProperties).toBe(false);
  expect(fixPackSchema.required).toEqual([
    "id",
    "priority",
    "sourceIssueIds",
    "goal",
    "category",
    "severity",
    "affectedProfiles",
    "repoSearchHints",
    "implementationSteps",
    "acceptanceCriteria",
    "verification",
  ]);
  expect(fixPackSchema.properties.repoSearchHints.maxItems).toBe(8);
  expect(fixPackSchema.properties.implementationSteps.maxItems).toBe(6);
  expect(fixPackSchema.properties.acceptanceCriteria.maxItems).toBe(6);
  expect(fixPackSchema.properties.verification.required).toEqual([
    "rerunMode",
    "expectedAuditIds",
  ]);
});
```

Update the typed report object in `allows typed reports to omit site intelligence details with null`:

```ts
fixPacks: [],
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
npm test -- --run test/report-schema.test.ts
```

Expected: fail because `REPORT_SCHEMA_VERSION` is still `1.1` and `fixPacks` is missing from the output schema.

- [ ] **Step 3: Add report types and schema fields**

In `src/report-schema.ts`, change:

```ts
export const REPORT_SCHEMA_VERSION = "1.1" as const;
```

to:

```ts
export const REPORT_SCHEMA_VERSION = "1.2" as const;
```

Add the new interfaces after `PrioritizedIssue`:

```ts
export interface AgentFixPackVerification {
  rerunMode: "reliable";
  expectedAuditIds: string[];
}

export interface AgentFixPack {
  id: string;
  priority: number;
  sourceIssueIds: string[];
  goal: string;
  category: CategoryName;
  severity: Severity;
  affectedProfiles: ProfileName[];
  repoSearchHints: string[];
  implementationSteps: string[];
  acceptanceCriteria: string[];
  verification: AgentFixPackVerification;
}
```

Add `fixPacks` to `AgentReadyLighthouseReport` immediately after `prioritizedIssues`:

```ts
fixPacks: AgentFixPack[];
```

Define a schema before the top-level output schema:

```ts
const fixPackSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: { type: "string" },
    priority: { type: "integer", minimum: 1 },
    sourceIssueIds: {
      type: "array",
      minItems: 1,
      maxItems: 5,
      uniqueItems: true,
      items: { type: "string" },
    },
    goal: { type: "string" },
    category: { type: "string", enum: CATEGORIES },
    severity: { type: "string", enum: SEVERITIES },
    affectedProfiles: {
      type: "array",
      uniqueItems: true,
      items: { type: "string", enum: PROFILE_NAMES },
    },
    repoSearchHints: {
      type: "array",
      maxItems: 8,
      items: { type: "string" },
    },
    implementationSteps: {
      type: "array",
      minItems: 1,
      maxItems: 6,
      items: { type: "string" },
    },
    acceptanceCriteria: {
      type: "array",
      minItems: 1,
      maxItems: 6,
      items: { type: "string" },
    },
    verification: {
      type: "object",
      additionalProperties: false,
      properties: {
        rerunMode: { type: "string", enum: ["reliable"] },
        expectedAuditIds: {
          type: "array",
          minItems: 1,
          maxItems: 5,
          uniqueItems: true,
          items: { type: "string" },
        },
      },
      required: ["rerunMode", "expectedAuditIds"],
    },
  },
  required: [
    "id",
    "priority",
    "sourceIssueIds",
    "goal",
    "category",
    "severity",
    "affectedProfiles",
    "repoSearchHints",
    "implementationSteps",
    "acceptanceCriteria",
    "verification",
  ],
} as const;
```

Add this top-level property and required entry to `lighthouseReportOutputSchema`:

```ts
fixPacks: {
  type: "array",
  maxItems: 10,
  items: fixPackSchema,
},
```

- [ ] **Step 4: Run the focused schema test**

Run:

```bash
npm test -- --run test/report-schema.test.ts
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add src/report-schema.ts test/report-schema.test.ts
git commit -m "feat: add agent fix pack report contract"
```

---

### Task 2: Generate Fix Packs From Prioritized Issues

**Files:**
- Create: `src/fix-packs.ts`
- Modify: `src/report-builder.ts`
- Test: `test/fix-packs.test.ts`
- Test: `test/report-builder.test.ts`

- [ ] **Step 1: Write fix-pack builder tests**

Create `test/fix-packs.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { buildFixPacks } from "../src/fix-packs.js";
import type { PrioritizedIssue } from "../src/report-schema.js";

describe("buildFixPacks", () => {
  it("creates one deterministic fix pack per prioritized issue", () => {
    const packs = buildFixPacks([
      issue({
        auditId: "link-name",
        title: "Links do not have a discernible name",
        category: "accessibility",
        severity: "critical",
        affectedProfiles: ["mobile", "desktop"],
        selector: "footer a.social",
        url: "https://example.com",
        snippet: '<a href="https://example.com"></a>',
      }),
    ]);

    expect(packs).toEqual([
      {
        id: "fix-link-name",
        priority: 1,
        sourceIssueIds: ["link-name"],
        goal: "Fix Links do not have a discernible name.",
        category: "accessibility",
        severity: "critical",
        affectedProfiles: ["mobile", "desktop"],
        repoSearchHints: [
          "Search for selector: footer a.social",
          "Search for URL/reference: https://example.com",
          'Search for snippet text: <a href="https://example.com"></a>',
        ],
        implementationSteps: [
          "Inspect the repository for the listed selectors, URLs, snippets, or related component text before editing.",
          "Apply the suggested issue actions while preserving existing behavior and accessibility.",
          "Keep the change focused on the source issue IDs listed in this fix pack.",
        ],
        acceptanceCriteria: [
          "All link elements pass the Lighthouse link-name audit.",
          "Raise the median accessibility score to at least 90/100.",
        ],
        verification: {
          rerunMode: "reliable",
          expectedAuditIds: ["link-name"],
        },
      },
    ]);
  });

  it("does not invent repo search hints when evidence is empty", () => {
    const packs = buildFixPacks([
      issue({
        auditId: "largest-contentful-paint-element",
        title: "Largest Contentful Paint element",
        category: "performance",
        severity: "high",
        affectedProfiles: ["mobile"],
        selector: null,
        url: null,
        snippet: null,
      }),
    ]);

    expect(packs[0]?.repoSearchHints).toEqual([
      "Search for user-visible content related to: Largest Contentful Paint element",
    ]);
    expect(packs[0]?.verification.expectedAuditIds).toEqual([
      "largest-contentful-paint-element",
    ]);
  });
});

function issue(
  overrides: {
    auditId: string;
    title: string;
    category: PrioritizedIssue["category"];
    severity: PrioritizedIssue["severity"];
    affectedProfiles: PrioritizedIssue["affectedProfiles"];
    selector: string | null;
    url: string | null;
    snippet: string | null;
  },
): PrioritizedIssue {
  return {
    auditId: overrides.auditId,
    title: overrides.title,
    category: overrides.category,
    severity: overrides.severity,
    affectedProfiles: overrides.affectedProfiles,
    description: `${overrides.title} description.`,
    profiles: {
      [overrides.affectedProfiles[0]]: {
        score: 0,
        displayValue: null,
        impact: {
          estimatedSavingsMs: null,
          estimatedSavingsBytes: null,
        },
        evidence: [
          {
            url: overrides.url,
            selector: overrides.selector,
            snippet: overrides.snippet,
            totalBytes: null,
            wastedBytes: null,
            wastedMs: null,
          },
        ],
      },
    },
    suggestedActions: [
      "Apply the suggested issue actions while preserving existing behavior and accessibility.",
    ],
    acceptanceCriteria: [
      overrides.auditId === "link-name"
        ? "All link elements pass the Lighthouse link-name audit."
        : "Keep median Largest Contentful Paint at or below 2,500 ms.",
      overrides.category === "accessibility"
        ? "Raise the median accessibility score to at least 90/100."
        : "Raise the median performance score to at least 90/100.",
    ],
    documentationUrl: null,
  };
}
```

Add this assertion to the first `test/report-builder.test.ts` test:

```ts
expect(report.fixPacks).toHaveLength(report.prioritizedIssues.length);
expect(report.fixPacks[0]?.priority).toBe(1);
expect(report.fixPacks[0]?.sourceIssueIds).toEqual([
  report.prioritizedIssues[0]?.auditId,
]);
```

- [ ] **Step 2: Run focused tests and verify they fail**

Run:

```bash
npm test -- --run test/fix-packs.test.ts test/report-builder.test.ts
```

Expected: fail because `src/fix-packs.ts` does not exist and reports do not include `fixPacks`.

- [ ] **Step 3: Implement the fix-pack builder**

Create `src/fix-packs.ts`:

```ts
import type { AgentFixPack, PrioritizedIssue } from "./report-schema.js";

const MAX_FIX_PACKS = 10;
const MAX_SEARCH_HINTS = 8;
const MAX_STEPS = 6;
const MAX_ACCEPTANCE_CRITERIA = 6;

export function buildFixPacks(issues: PrioritizedIssue[]): AgentFixPack[] {
  return issues.slice(0, MAX_FIX_PACKS).map((issue, index) => ({
    id: `fix-${slugify(issue.auditId)}`,
    priority: index + 1,
    sourceIssueIds: [issue.auditId],
    goal: `Fix ${sentenceCase(issue.title)}.`,
    category: issue.category,
    severity: issue.severity,
    affectedProfiles: [...issue.affectedProfiles],
    repoSearchHints: buildRepoSearchHints(issue),
    implementationSteps: buildImplementationSteps(issue),
    acceptanceCriteria: issue.acceptanceCriteria.slice(
      0,
      MAX_ACCEPTANCE_CRITERIA,
    ),
    verification: {
      rerunMode: "reliable",
      expectedAuditIds: [issue.auditId],
    },
  }));
}

function buildRepoSearchHints(issue: PrioritizedIssue): string[] {
  const hints = new Set<string>();

  for (const profile of issue.affectedProfiles) {
    const data = issue.profiles[profile];
    if (!data) continue;

    for (const evidence of data.evidence) {
      if (evidence.selector) {
        hints.add(`Search for selector: ${evidence.selector}`);
      }
      if (evidence.url) {
        hints.add(`Search for URL/reference: ${evidence.url}`);
      }
      if (evidence.snippet) {
        hints.add(`Search for snippet text: ${evidence.snippet}`);
      }
      if (hints.size >= MAX_SEARCH_HINTS) {
        return [...hints].slice(0, MAX_SEARCH_HINTS);
      }
    }
  }

  if (hints.size === 0) {
    hints.add(`Search for user-visible content related to: ${issue.title}`);
  }

  return [...hints].slice(0, MAX_SEARCH_HINTS);
}

function buildImplementationSteps(issue: PrioritizedIssue): string[] {
  return [
    "Inspect the repository for the listed selectors, URLs, snippets, or related component text before editing.",
    ...issue.suggestedActions,
    "Keep the change focused on the source issue IDs listed in this fix pack.",
  ].slice(0, MAX_STEPS);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function sentenceCase(value: string): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length === 0) {
    return "issue";
  }
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}
```

- [ ] **Step 4: Wire fix packs into report building**

In `src/report-builder.ts`, import the builder:

```ts
import { buildFixPacks } from "./fix-packs.js";
```

Before the return object, replace the inline prioritized issue expression with:

```ts
const prioritizedIssues = [
  ...(input.siteIntelligence?.prioritizedIssues ?? []),
  ...mergeAndPrioritizeFindings(profileFindings),
].slice(0, 10);
```

Then set both fields in the return object:

```ts
prioritizedIssues,
fixPacks: buildFixPacks(prioritizedIssues),
agentInstructions: [...AGENT_INSTRUCTIONS],
```

- [ ] **Step 5: Run focused tests**

Run:

```bash
npm test -- --run test/fix-packs.test.ts test/report-builder.test.ts test/report-schema.test.ts
```

Expected: pass.

- [ ] **Step 6: Commit**

```bash
git add src/fix-packs.ts src/report-builder.ts test/fix-packs.test.ts test/report-builder.test.ts
git commit -m "feat: generate agent fix packs"
```

---

### Task 3: Render Fix Packs In Markdown

**Files:**
- Modify: `src/markdown.ts`
- Test: `test/markdown.test.ts`

- [ ] **Step 1: Write failing Markdown tests**

Add to `test/markdown.test.ts`:

```ts
it("renders agent fix packs before prioritized issues", () => {
  const report = buildAgentReadyReport({
    requestedUrl: "https://example.com",
    mode: "fast",
    generatedAt: new Date("2026-06-13T12:00:00.000Z"),
    profiles: {
      mobile: {
        attemptedRuns: 1,
        failures: [],
        runs: [makeLighthouseResult()],
      },
      desktop: {
        attemptedRuns: 1,
        failures: [],
        runs: [makeLighthouseResult({ formFactor: "desktop" })],
      },
    },
  });

  const markdown = renderReportMarkdown(report);

  expect(markdown.indexOf("## Agent Fix Packs")).toBeLessThan(
    markdown.indexOf("## Prioritized Issues"),
  );
  expect(markdown).toContain("### Fix Pack 1:");
  expect(markdown).toContain("- Source issues:");
  expect(markdown).toContain("- Repository search hints:");
  expect(markdown).toContain("- Implementation steps:");
  expect(markdown).toContain("- Verification: rerun this tool in `reliable` mode");
});

it("renders an empty fix-pack state", () => {
  const report = buildAgentReadyReport({
    requestedUrl: "https://example.com",
    mode: "fast",
    generatedAt: new Date("2026-06-13T12:00:00.000Z"),
    profiles: {
      mobile: {
        attemptedRuns: 1,
        failures: [],
        runs: [
          makeLighthouseResult({
            performance: 1,
            accessibility: 1,
            bestPractices: 1,
            seo: 1,
          }),
        ],
      },
      desktop: {
        attemptedRuns: 1,
        failures: [],
        runs: [
          makeLighthouseResult({
            formFactor: "desktop",
            performance: 1,
            accessibility: 1,
            bestPractices: 1,
            seo: 1,
          }),
        ],
      },
    },
  });

  report.prioritizedIssues = [];
  report.fixPacks = [];

  expect(renderReportMarkdown(report)).toContain(
    "No agent fix packs were generated.",
  );
});
```

- [ ] **Step 2: Run focused Markdown tests and verify they fail**

Run:

```bash
npm test -- --run test/markdown.test.ts
```

Expected: fail because `## Agent Fix Packs` is not rendered.

- [ ] **Step 3: Implement Markdown rendering**

In `src/markdown.ts`, import `AgentFixPack`:

```ts
import type {
  AgentFixPack,
  AgentReadyLighthouseReport,
  NumericDistribution,
  PrioritizedIssue,
  ProfileName,
} from "./report-schema.js";
```

Before the existing `lines.push("", "## Prioritized Issues");`, add:

```ts
appendFixPacks(lines, report);
```

Add this helper before `appendIssue`:

```ts
function appendFixPacks(
  lines: string[],
  report: AgentReadyLighthouseReport,
): void {
  lines.push("", "## Agent Fix Packs");

  if (report.fixPacks.length === 0) {
    lines.push("", "No agent fix packs were generated.");
    return;
  }

  for (const pack of report.fixPacks) {
    appendFixPack(lines, pack);
  }
}

function appendFixPack(lines: string[], pack: AgentFixPack): void {
  lines.push(
    "",
    `### Fix Pack ${pack.priority}: ${inline(pack.goal)}`,
    "",
    `- Severity: **${pack.severity}**`,
    `- Category: ${pack.category}`,
    `- Affected profiles: ${pack.affectedProfiles.join(", ")}`,
    `- Source issues: ${pack.sourceIssueIds.map((id) => `\`${inline(id)}\``).join(", ")}`,
    "- Repository search hints:",
  );
  for (const hint of pack.repoSearchHints) {
    lines.push(`  - ${inline(hint)}`);
  }
  lines.push("- Implementation steps:");
  for (const step of pack.implementationSteps) {
    lines.push(`  - ${inline(step)}`);
  }
  lines.push("- Acceptance criteria:");
  for (const criterion of pack.acceptanceCriteria) {
    lines.push(`  - ${inline(criterion)}`);
  }
  lines.push(
    `- Verification: rerun this tool in \`${pack.verification.rerunMode}\` mode and confirm these audit IDs improve or pass: ${pack.verification.expectedAuditIds.map((id) => `\`${inline(id)}\``).join(", ")}`,
  );
}
```

- [ ] **Step 4: Run focused Markdown tests**

Run:

```bash
npm test -- --run test/markdown.test.ts
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add src/markdown.ts test/markdown.test.ts
git commit -m "feat: render agent fix packs"
```

---

### Task 4: Rename Public Package Surface To Agent Audit

**Files:**
- Modify: `package.json`
- Modify: `src/server.ts`
- Modify: `README.md`
- Modify: `CONTRIBUTING.md`
- Modify: `scripts/release-validation.mjs`
- Test: `test/release-validation.test.ts`
- Test: `test/server.test.ts`

- [ ] **Step 1: Write failing release/server tests**

In `test/release-validation.test.ts`, update expectations so valid fixtures require:

```ts
packageJson: {
  name: "agent-audit",
  bin: {
    "agent-audit": "dist/index.js",
  },
  description: "Turn Lighthouse audits into coding-agent fix packs.",
  repository: { url: "git+https://github.com/fullstackdegen/lighthouse-mcp.git" },
  homepage: "https://github.com/fullstackdegen/lighthouse-mcp#readme",
  bugs: { url: "https://github.com/fullstackdegen/lighthouse-mcp/issues" },
  scripts: {
    prepublishOnly:
      "npm test && npm run check && npm run build && npm run validate:release",
  },
},
```

Add validation assertions for wrong package name and missing binary:

```ts
expect(
  validateReleaseSurface({
    ...validInput,
    packageJson: { ...validInput.packageJson, name: "mcp-server-lighthouse" },
  }),
).toContain("package.json name must be agent-audit");

expect(
  validateReleaseSurface({
    ...validInput,
    packageJson: { ...validInput.packageJson, bin: {} },
  }),
).toContain("package.json must expose the agent-audit binary");
```

In `test/server.test.ts`, update the initialize/server metadata expectation to `agent-audit` if the test asserts the old server name.

- [ ] **Step 2: Run focused tests and verify they fail**

Run:

```bash
npm test -- --run test/release-validation.test.ts test/server.test.ts
```

Expected: fail because package metadata and possibly server metadata still use the old name.

- [ ] **Step 3: Update package metadata**

In `package.json`, change:

```json
"name": "agent-audit",
"version": "0.3.0",
"description": "Turn Lighthouse audits into coding-agent fix packs.",
"bin": {
  "agent-audit": "dist/index.js"
}
```

Keep repository URLs pointing to the existing GitHub repo unless the repository itself is renamed separately.

Add keywords:

```json
"agent-audit",
"fix-packs",
"coding-agent"
```

Keep existing relevant keywords such as `mcp`, `model-context-protocol`, `lighthouse`, `core-web-vitals`, `accessibility`, `seo`, `claude`, `codex`, and `cursor`.

- [ ] **Step 4: Update server metadata**

In `src/server.ts`, change the MCP server name metadata from the old package name to:

```ts
name: "agent-audit",
```

Leave the tool name `analyze_website_performance` unchanged for compatibility unless tests already cover a renamed tool.

- [ ] **Step 5: Update release validation**

In `scripts/release-validation.mjs`, add checks:

```js
requireValue(packageJson.name === "agent-audit", "package.json name must be agent-audit");
requireValue(
  packageJson.bin?.["agent-audit"] === "dist/index.js",
  "package.json must expose the agent-audit binary",
);
requireValue(
  packageJson.description === "Turn Lighthouse audits into coding-agent fix packs.",
  "package.json description must match the product promise",
);
requireValue(
  readme.includes("Turn Lighthouse audits into coding-agent fix packs."),
  "README must contain the product promise",
);
```

Replace the old README promise check:

```js
readme.includes("Turn Lighthouse audits into coding-agent tasks.")
```

- [ ] **Step 6: Update docs**

Update `README.md`:

```md
# Agent Audit

## Turn Lighthouse audits into coding-agent fix packs.
```

Replace install/config examples:

```bash
npx -y agent-audit
claude mcp add agent-audit -- npx -y agent-audit
claude mcp add agent-audit-local -- npx -y agent-audit --local
codex mcp add agent-audit -- npx -y agent-audit
```

Update JSON/TOML MCP keys to `agent-audit` and args to `agent-audit`.

Update `CONTRIBUTING.md` product references from Lighthouse MCP to Agent Audit where referring to the product, while retaining Lighthouse when referring to the audit engine.

- [ ] **Step 7: Run focused tests**

Run:

```bash
npm test -- --run test/release-validation.test.ts test/server.test.ts
```

Expected: pass.

- [ ] **Step 8: Commit**

```bash
git add package.json src/server.ts README.md CONTRIBUTING.md scripts/release-validation.mjs test/release-validation.test.ts test/server.test.ts
git commit -m "chore: rename package to agent audit"
```

---

### Task 5: Refresh Examples And Release Surface

**Files:**
- Modify: `examples/commalabs-fast-report.json`
- Modify: `examples/commalabs-fast-report.md`
- Modify: `scripts/release-validation.mjs`
- Test: `test/release-validation.test.ts`

- [ ] **Step 1: Write failing release validation for fix packs**

In `scripts/release-validation.mjs`, add these checks:

```js
requireValue(
  Array.isArray(exampleJson.fixPacks) &&
    exampleJson.fixPacks.length === exampleJson.prioritizedIssues.length,
  "Example report must include one fix pack per prioritized issue",
);
requireValue(
  exampleMarkdown.includes("## Agent Fix Packs"),
  "Example Markdown report must include agent fix packs",
);
```

In `test/release-validation.test.ts`, update valid fixtures to include:

```js
fixPacks: [
  {
    id: "fix-link-name",
    priority: 1,
    sourceIssueIds: ["link-name"],
    goal: "Fix Links do not have a discernible name.",
    category: "accessibility",
    severity: "critical",
    affectedProfiles: ["mobile", "desktop"],
    repoSearchHints: ["Search for selector: footer a.social"],
    implementationSteps: [
      "Inspect the repository for the listed selectors, URLs, snippets, or related component text before editing.",
    ],
    acceptanceCriteria: ["All link elements pass the Lighthouse link-name audit."],
    verification: {
      rerunMode: "reliable",
      expectedAuditIds: ["link-name"],
    },
  },
],
```

Update fixture `prioritizedIssues` to one matching item so lengths match.

- [ ] **Step 2: Run release validation and verify it fails**

Run:

```bash
npm run validate:release
```

Expected: fail because checked-in examples do not yet contain `fixPacks` or `## Agent Fix Packs`.

- [ ] **Step 3: Regenerate examples from built code**

After Task 1-4 code is complete, regenerate the example report through the existing smoke/example workflow. If there is no dedicated example script, run:

```bash
npm run build
npm run --silent smoke -- https://www.commalabs.co/tr fast > examples/commalabs-fast-report.json 2> examples/commalabs-fast-report.md
```

Expected: JSON includes top-level `fixPacks`, Markdown includes `## Agent Fix Packs`.

- [ ] **Step 4: Run release validation**

Run:

```bash
npm run validate:release
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add examples/commalabs-fast-report.json examples/commalabs-fast-report.md scripts/release-validation.mjs test/release-validation.test.ts
git commit -m "docs: refresh agent audit examples"
```

---

### Task 6: Full Verification And Publish Readiness

**Files:**
- Modify only if verification exposes a concrete bug.

- [ ] **Step 1: Run unit tests**

Run:

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 2: Run TypeScript check**

Run:

```bash
npm run check
```

Expected: no TypeScript errors.

- [ ] **Step 3: Run build**

Run:

```bash
npm run build
```

Expected: `dist/` builds successfully.

- [ ] **Step 4: Run release validation**

Run:

```bash
npm run validate:release
```

Expected: `Release surface is valid.`

- [ ] **Step 5: Run dry pack**

Run:

```bash
npm pack --dry-run
```

Expected: package name is `agent-audit`, binary is `agent-audit`, package contains `dist`, `docs/assets`, `examples`, `README.md`, and `LICENSE`.

- [ ] **Step 6: Run MCP smoke check**

Run:

```bash
node dist/index.js --help
```

Expected: help output mentions `--local`.

Run an initialize smoke request:

```bash
printf '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"smoke","version":"0.0.0"}}}\n' | node dist/index.js
```

Expected: response includes server name `agent-audit`.

- [ ] **Step 7: Commit verification fixes if needed**

If any bug fixes were required:

```bash
git status --short
git add src test scripts README.md CONTRIBUTING.md examples package.json
git commit -m "fix: stabilize agent audit release surface"
```

If no fixes were required, do not create an empty commit.

---

## Self-Review

- Spec coverage: The plan covers product rename, separate `fixPacks`, schema, Markdown, docs, examples, release validation, and verification.
- Scope check: The plan intentionally excludes marketing/GEO integrations, framework guessing, whole-site crawling, and direct code editing by the tool.
- Type consistency: The plan consistently uses `AgentFixPack`, `fixPacks`, `sourceIssueIds`, `repoSearchHints`, `implementationSteps`, `acceptanceCriteria`, and `verification.rerunMode`.
- Placeholder scan: No placeholder terms are used as required work items.
