# Agent Audit Documentation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh Agent Audit documentation and canonical repository links for the renamed GitHub repository.

**Architecture:** This is a documentation-only change plus package metadata link updates. Runtime code and report schema stay unchanged.

**Tech Stack:** Markdown, npm metadata, existing Vitest/release validation.

---

### Task 1: Canonical Links

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `SECURITY.md`
- Modify: `.github/ISSUE_TEMPLATE/config.yml`
- Rename: `docs/assets/lighthouse-mcp-overview.svg` to `docs/assets/agent-audit-overview.svg`

- [ ] Update repository, homepage, bugs, security advisory, and issue-template links to `https://github.com/fullstackdegen/agent-audit`.
- [ ] Update README asset references after the asset rename.
- [ ] Run stale-link search.

### Task 2: Human README

**Files:**
- Modify: `README.md`

- [ ] Rewrite README as a landing page with hero, quick start, example fix pack, MCP setup, local workflow, report contents, security model, limitations, roadmap, and development sections.
- [ ] Keep setup examples for Claude Desktop, Claude Code, Codex, VS Code/Copilot, Cursor, and generic MCP clients.

### Task 3: Agent Docs

**Files:**
- Create: `CLAUDE.md`
- Create: `AGENTS.md`
- Create: `docs/agent-workflow.md`
- Create: `examples/prompts/coding-agent-fix-packs.md`

- [ ] Document how agents should treat `structuredContent`, `fixPacks`, `repoSearchHints`, tests, and reliable reruns.
- [ ] Include copy-paste prompt text for applying fix packs.

### Task 4: Verification

**Files:**
- Modify only if validation exposes a concrete issue.

- [ ] Run `npm test`.
- [ ] Run `npm run check`.
- [ ] Run `npm run build`.
- [ ] Run `npm run validate:release`.
- [ ] Run stale-link search.
