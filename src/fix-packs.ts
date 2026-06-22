import {
  PROFILE_NAMES,
  type AgentFixPack,
  type PrioritizedIssue,
  type ReportEvidence,
} from "./report-schema.js";

const MAX_FIX_PACKS = 10;
const MAX_REPO_SEARCH_HINTS = 8;
const MAX_IMPLEMENTATION_STEPS = 6;
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
  const hints = unique(
    evidenceForIssue(issue).flatMap((evidence) => [
      evidence.selector,
      evidence.url,
      evidence.snippet,
    ]),
  ).slice(0, MAX_REPO_SEARCH_HINTS);

  if (hints.length > 0) {
    return hints;
  }

  return [`Search for user-visible content related to: ${issue.title}`];
}

function buildImplementationSteps(issue: PrioritizedIssue): string[] {
  const inspectStep =
    "Inspect the repository for the evidence listed in repoSearchHints before editing.";
  const focusStep = `Keep changes focused on source issue IDs: ${issue.auditId}.`;
  const actionLimit = MAX_IMPLEMENTATION_STEPS - 2;

  return [
    inspectStep,
    ...issue.suggestedActions.slice(0, actionLimit),
    focusStep,
  ];
}

function evidenceForIssue(issue: PrioritizedIssue): ReportEvidence[] {
  return PROFILE_NAMES.flatMap(
    (profile) => issue.profiles[profile]?.evidence ?? [],
  );
}

function unique(values: Array<string | null>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const normalized = value?.trim();
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    result.push(normalized);
  }

  return result;
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "issue"
  );
}

function sentenceCase(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "issue";
  }

  return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1).toLowerCase()}`;
}
