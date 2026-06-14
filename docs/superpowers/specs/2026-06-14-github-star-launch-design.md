# GitHub Star Launch Design

## Goal

Present Lighthouse MCP as a useful open-source developer product that visitors
can understand in seconds, install in under a minute, and trust enough to try
or star.

The launch surface must communicate one clear promise:

> Turn Lighthouse audits into coding-agent tasks.

GitHub is the primary discovery and community surface. npm is the installation
channel. Neither surface should depend on claims that cannot be reproduced.

## Audience

The primary audience is developers using Claude Desktop, Codex, Cursor, or
another MCP client to improve websites. Secondary audiences are MCP server
authors, performance engineers, and open-source maintainers.

## Positioning

The README uses a product-led structure:

1. State the outcome.
2. Show the one-command installation path.
3. Prove the transformation with a real report.
4. Explain supported clients and workflows.
5. Provide technical and security details for evaluation.

The primary heading is:

> Turn Lighthouse audits into coding-agent tasks.

The supporting description explains that the server runs repeatable mobile and
desktop Lighthouse audits and returns a bounded, evidence-backed implementation
backlog as structured JSON and Markdown.

## README Structure

The README follows this order:

1. Product name, outcome-focused heading, concise description, and badges.
2. Quick install command using `npx`.
3. A visual before-and-after block:
   - raw Lighthouse contains many metrics, diagnostics, and overlapping audits;
   - Lighthouse MCP returns at most ten canonical tasks with evidence,
     suggested actions, and acceptance criteria.
4. A real CommaLabs report excerpt showing mobile and desktop scores, an
   affected selector or resource, a suggested action, and an acceptance
   criterion.
5. MCP configuration examples for Claude Desktop, Codex, Cursor, and a generic
   MCP client where the configuration format is known and stable.
6. Explanation of fast and reliable modes.
7. Coding-agent workflow using structured JSON as the source of truth.
8. Output contract and representative JSON.
9. Security model and operational limitations.
10. Local development, contributing, and license.

The README remains concise. Detailed report fixtures and full output examples
live in `examples/` and are linked rather than embedded in full.

## Demo Assets

The repository includes:

- `examples/commalabs-fast-report.json`: sanitized canonical structured output.
- `examples/commalabs-fast-report.md`: equivalent Markdown output.
- one readable repository-native SVG or generated PNG that summarizes the
  report transformation.

The example identifies CommaLabs as a real public target. A note states that
Lighthouse scores vary with browser version, hardware, network conditions, and
page changes. The example is evidence of output shape, not a permanent
performance claim.

The visual uses the selected product-led direction:

- dark technical background;
- strong outcome-focused headline;
- mobile and desktop context;
- concise score and task summaries;
- no decorative complexity that obscures the product.

## Package And Repository Metadata

`package.json` includes:

- `repository`;
- `homepage`;
- `bugs`;
- expanded MCP, agent, Core Web Vitals, web performance, and audit keywords;
- `prepublishOnly` running tests, type checking, and build.

Repository URLs are inserted only after the GitHub owner and repository name
are known. No placeholder URLs may be committed.

The package remains named `mcp-server-lighthouse` unless npm availability
changes before publication. Publication uses version `0.1.0`.

## Community Files

The repository includes:

- a current `CONTRIBUTING.md` using the ten-task limit;
- bug report and feature request issue forms;
- a pull request template;
- CI for Node.js 20 and 22;
- a release workflow that verifies the package before npm publication;
- `SECURITY.md` with private reporting guidance.

GitHub Actions use minimal permissions. npm publication should use trusted
publishing with provenance when the repository and npm package are connected.
The release workflow must not contain a long-lived npm token if trusted
publishing is available.

## Badges

The README may show:

- CI status;
- npm version;
- npm downloads;
- license;
- supported Node.js version.

Badges requiring a repository URL are added only after the GitHub repository is
created. Broken or placeholder badges are not acceptable.

## Claims And Tone

Documentation is professional, direct, and fully English.

Allowed claims are backed by implementation or tests:

- mobile and desktop profiles;
- fast and reliable modes;
- structured JSON and equivalent Markdown;
- at most ten prioritized tasks;
- evidence extraction and deterministic recommendations;
- SSRF-oriented public-network URL policy;
- Node.js 20 and 22 CI coverage after CI succeeds.

The README does not claim guaranteed score improvements, complete SSRF
prevention, universal client compatibility, or endorsement by Anthropic,
Google, OpenAI, Cursor, or CommaLabs.

## Verification

Before launch:

1. Run the complete test suite, type check, build, production dependency audit,
   and package dry run.
2. Generate a fresh CommaLabs fast report.
3. Validate example JSON against the output schema.
4. Confirm Markdown is generated from the same report.
5. Check README commands against a clean package installation.
6. Verify CI on Node.js 20 and 22.
7. Verify `npx mcp-server-lighthouse` after npm publication.
8. Confirm all badges and repository links resolve.

## Launch Sequence

1. Implement the repository showcase and metadata that do not require a remote
   URL.
2. Create the public GitHub repository.
3. Insert repository metadata and badges.
4. Push the feature branch and open a pull request.
5. Confirm CI and merge to `main`.
6. Configure npm trusted publishing.
7. Publish `0.1.0`.
8. Create a GitHub release with the core value proposition, install command,
   report screenshot, and known operational limitations.

## Success Criteria

- A new visitor can identify the product outcome within ten seconds.
- The install command is visible without scrolling through architecture.
- A coding-agent user can find a supported MCP configuration quickly.
- The real report example demonstrates evidence, actions, and acceptance
  criteria.
- Repository and npm metadata contain no placeholders or broken links.
- All local and hosted verification gates pass.
- The launch materials make starring and sharing the repository a natural
  response without using manipulative calls to action.
