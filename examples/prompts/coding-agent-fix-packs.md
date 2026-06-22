# Coding-Agent Fix Pack Prompt

Copy this prompt into Claude Code, Codex, Cursor, or another coding agent after
running Agent Audit.

```text
Read the Agent Audit structuredContent and use it as the source of truth.

Apply fixPacks in ascending priority order. For each fix pack:

1. Read the goal, severity, category, affectedProfiles, sourceIssueIds, and
   acceptanceCriteria.
2. Search the repository using repoSearchHints. Treat them as selectors, URLs,
   snippets, or search clues, not guaranteed file paths.
3. Inspect the relevant files before editing.
4. Implement the smallest safe change that satisfies the fix pack.
5. Preserve behavior, accessibility, and existing public APIs.
6. Run the repository's tests after each logical fix.
7. Rerun Agent Audit in reliable mode.
8. Confirm verification.expectedAuditIds improved or no longer appear and the
   acceptanceCriteria are satisfied.

Do not claim completion if the rerun is incomplete, materially more variable
than the baseline, or missing required acceptance criteria.
```
