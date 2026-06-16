# Localhost Dev Mode And README Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add explicit localhost audit support for local development, improve MCP client setup documentation, and remove internal planning files from the public repository.

**Architecture:** Keep `src/url-policy.ts` as the single URL validation boundary. Add a narrow localhost mode controlled by `LIGHTHOUSE_MCP_ALLOW_LOCALHOST=true`, update server tests around the default validator, and revise public docs without changing the report schema.

**Tech Stack:** Node.js 20+, TypeScript, Vitest, MCP SDK, Lighthouse 12

---

### Task 1: Add Localhost URL Policy Tests

**Files:**
- Modify: `test/url-policy.test.ts`

- [ ] **Step 1: Write failing URL policy tests**

Add tests for:

```ts
it.each([
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://[::1]:3000",
  "http://app.localhost:3000",
])("allows localhost target in explicit local mode: %s", (value) => {
  expect(
    parseAuditTargetUrl(value, { allowLocalhost: true }).href,
  ).toBe(new URL(value).href);
});

it.each(["http://192.168.1.10", "http://10.0.0.1"])(
  "still rejects private network target in local mode: %s",
  (value) => {
    expect(() =>
      parseAuditTargetUrl(value, { allowLocalhost: true }),
    ).toThrow(/publicly routable/i);
  },
);

it("still rejects hostnames that resolve to private addresses in local mode", async () => {
  await expect(
    assertAuditTargetUrl(
      "https://internal.example",
      async () => [{ address: "10.0.0.4", family: 4 }],
      { allowLocalhost: true },
    ),
  ).rejects.toThrow(/publicly routable/i);
});

it.each([
  [{ LIGHTHOUSE_MCP_ALLOW_LOCALHOST: "true" }, true],
  [{ LIGHTHOUSE_MCP_ALLOW_LOCALHOST: "TRUE" }, false],
  [{ LIGHTHOUSE_MCP_ALLOW_LOCALHOST: "1" }, false],
  [{}, false],
])("reads localhost mode from env %#", (env, expected) => {
  expect(isLocalhostAllowedFromEnv(env)).toBe(expected);
});
```

- [ ] **Step 2: Run tests and verify RED**

Run:

```bash
npm test -- --run test/url-policy.test.ts
```

Expected: FAIL because `parseAuditTargetUrl`, `assertAuditTargetUrl`, and
`isLocalhostAllowedFromEnv` do not exist.

### Task 2: Implement Localhost-Only Dev Mode

**Files:**
- Modify: `src/url-policy.ts`
- Modify: `test/url-policy.test.ts`

- [ ] **Step 1: Implement policy options**

Add:

```ts
export interface UrlPolicyOptions {
  allowLocalhost?: boolean;
}

export function isLocalhostAllowedFromEnv(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return env.LIGHTHOUSE_MCP_ALLOW_LOCALHOST === "true";
}
```

- [ ] **Step 2: Add localhost detection**

Implement helpers that treat only these as local development targets:

- `localhost`;
- `localhost.localdomain`;
- hostnames ending in `.localhost`;
- IP addresses whose processed range is `loopback`.

- [ ] **Step 3: Add new parser and async validator**

Add:

```ts
export function parseAuditTargetUrl(
  input: unknown,
  options: UrlPolicyOptions = {},
): URL
```

and:

```ts
export async function assertAuditTargetUrl(
  input: unknown,
  resolveHostname: ResolveHostname = resolveAllAddresses,
  options: UrlPolicyOptions = {
    allowLocalhost: isLocalhostAllowedFromEnv(),
  },
): Promise<URL>
```

Localhost targets return only when `options.allowLocalhost === true`. Other
private ranges remain rejected.

- [ ] **Step 4: Preserve compatibility exports**

Keep:

```ts
export function parsePublicHttpUrl(input: unknown): URL {
  return parseAuditTargetUrl(input);
}

export async function assertPublicHttpUrl(
  input: unknown,
  resolveHostname: ResolveHostname = resolveAllAddresses,
): Promise<URL> {
  return assertAuditTargetUrl(input, resolveHostname);
}
```

- [ ] **Step 5: Run focused tests and verify GREEN**

Run:

```bash
npm test -- --run test/url-policy.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit policy change**

```bash
git add src/url-policy.ts test/url-policy.test.ts
git commit -m "feat: allow explicit localhost audits"
```

### Task 3: Add Server-Level Localhost Coverage

**Files:**
- Modify: `test/server.test.ts`

- [ ] **Step 1: Add failing server test**

Add a test that sets `process.env.LIGHTHOUSE_MCP_ALLOW_LOCALHOST = "true"`,
creates the server with an injected `auditWebsite`, calls
`analyze_website_performance` with `http://localhost:3000`, and asserts the
audit receives that URL.

- [ ] **Step 2: Run test and verify behavior**

Run:

```bash
npm test -- --run test/server.test.ts
```

Expected: PASS if Task 2 default validator reads the environment at call time.
If it fails, adjust only the default server validator wiring.

- [ ] **Step 3: Commit server test**

```bash
git add test/server.test.ts src/server.ts
git commit -m "test: cover localhost audit mode in server"
```

### Task 4: Update Public Documentation

**Files:**
- Modify: `README.md`
- Modify: `SECURITY.md`
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Bump package version**

Run:

```bash
npm version 0.1.1 --no-git-tag-version
```

- [ ] **Step 2: Add README local development audit section**

Document:

```bash
LIGHTHOUSE_MCP_ALLOW_LOCALHOST=true npx -y mcp-server-lighthouse
```

and the tool input:

```json
{
  "url": "http://localhost:3000",
  "mode": "fast"
}
```

State that LAN/private/metadata targets remain blocked.

- [ ] **Step 3: Expand README client setup**

Add sections for:

- Claude Desktop with `mcpServers`;
- Claude Code with `claude mcp add lighthouse -- npx -y mcp-server-lighthouse`;
- Codex with `codex mcp add lighthouse -- npx -y mcp-server-lighthouse` and TOML;
- VS Code with `mcp.json`:

```json
{
  "servers": {
    "lighthouse": {
      "command": "npx",
      "args": ["-y", "mcp-server-lighthouse"]
    }
  }
}
```

- Cursor with command `npx` and args `["-y", "mcp-server-lighthouse"]`, without
  claiming an exact file path;
- Generic MCP clients with stdio command and args.

- [ ] **Step 4: Update security docs**

Add to `SECURITY.md` that localhost mode is for developer machines only and
must not be enabled on shared servers unless the surrounding network is already
isolated.

- [ ] **Step 5: Validate docs and metadata**

Run:

```bash
rg -n "LIGHTHOUSE_MCP_ALLOW_LOCALHOST|Claude Code|VS Code|Cursor" README.md SECURITY.md
npm run validate:release
```

Expected: relevant docs present and validator passes.

- [ ] **Step 6: Commit docs**

```bash
git add README.md SECURITY.md package.json package-lock.json
git commit -m "docs: document localhost and MCP client setup"
```

### Task 5: Remove Internal Planning Files From Public Tree

**Files:**
- Delete: `docs/superpowers/`

- [ ] **Step 1: Remove internal docs**

Run:

```bash
git rm -r docs/superpowers
```

- [ ] **Step 2: Verify public docs remain**

Run:

```bash
test -f docs/assets/lighthouse-mcp-overview.svg
test -f examples/commalabs-fast-report.json
test -f examples/commalabs-fast-report.md
git status --short
```

- [ ] **Step 3: Commit cleanup**

```bash
git commit -m "docs: remove internal planning files"
```

### Task 6: Verify And Release 0.1.1

**Files:**
- No new source files

- [ ] **Step 1: Run full verification**

Run:

```bash
npm test -- --run
npm run check
npm run build
npm run validate:release
npm audit --omit=dev
npm_config_cache=/tmp/lighthouse-mcp-npm-cache npm pack --dry-run
```

Expected: all pass, package contains `dist`, `docs/assets`, `examples`,
`README.md`, and `LICENSE`.

- [ ] **Step 2: Run localhost smoke test**

Start a trivial local HTTP server and run:

```bash
LIGHTHOUSE_MCP_ALLOW_LOCALHOST=true npm run --silent smoke -- http://localhost:<port> fast
```

Expected: Lighthouse completes or returns a normal Lighthouse diagnostic report,
not an MCP InvalidParams localhost rejection.

- [ ] **Step 3: Push PR and wait for CI**

Push branch, open PR, and verify Node 20 and 22 CI pass.

- [ ] **Step 4: Merge and publish**

Merge to `main`, tag `v0.1.1`, let release workflow publish npm, and verify:

```bash
npm view mcp-server-lighthouse@0.1.1 version
npx -y mcp-server-lighthouse@0.1.1
```

- [ ] **Step 5: Create GitHub release**

Create release notes mentioning:

- explicit localhost audit mode;
- unchanged public default security;
- improved MCP client setup docs;
- removed internal planning files.
