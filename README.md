# Lighthouse MCP

## Turn Lighthouse audits into coding-agent tasks.

Run repeatable mobile and desktop Lighthouse audits from any compatible MCP
client. Receive a bounded implementation backlog with evidence, suggested
actions, and measurable acceptance criteria as structured JSON and Markdown.

```bash
npx -y mcp-server-lighthouse
```

![Lighthouse MCP converts raw audits into an agent-ready backlog](docs/assets/lighthouse-mcp-overview.svg)

## Why Lighthouse MCP?

Raw Lighthouse output is designed for diagnostics, not autonomous
implementation. It contains metrics, audit details, overlapping insights, and
page-controlled text that a coding agent still needs to interpret.

Lighthouse MCP turns that output into a stable workflow:

1. Run Lighthouse for mobile and desktop.
2. Aggregate repeated runs and expose variability.
3. Merge equivalent audits under canonical task IDs.
4. Keep raw metrics out of the implementation backlog.
5. Return at most ten prioritized tasks with evidence and acceptance criteria.

## From Audit Noise To An Implementation Plan

Each prioritized task can include:

- affected mobile and desktop profiles;
- resource URLs or DOM selectors;
- estimated time or byte savings;
- deterministic suggested actions;
- measurable acceptance criteria.

See the real [CommaLabs JSON report](examples/commalabs-fast-report.json) and
[Markdown report](examples/commalabs-fast-report.md).

> Lighthouse results vary with browser version, hardware, network conditions,
> and page changes. The example demonstrates the report format, not a permanent
> performance score.

## Install

### Requirements

- Node.js 20 or later
- Google Chrome or Chromium

The package is an MCP server distributed through npm. Your MCP client starts it
as a local stdio process:

```bash
npx -y mcp-server-lighthouse
```

Releases published through the trusted GitHub Actions workflow include npm
provenance.

### Claude Desktop

Open Claude Desktop's developer configuration and add:

```json
{
  "mcpServers": {
    "lighthouse": {
      "command": "npx",
      "args": ["-y", "mcp-server-lighthouse"]
    }
  }
}
```

Restart Claude Desktop after saving the configuration. See the
[official MCP local-server guide](https://modelcontextprotocol.io/docs/develop/connect-local-servers).

### Codex

Add the server with the Codex CLI:

```bash
codex mcp add lighthouse -- npx -y mcp-server-lighthouse
```

Or add it to `~/.codex/config.toml`:

```toml
[mcp_servers.lighthouse]
command = "npx"
args = ["-y", "mcp-server-lighthouse"]
```

See the [official Codex MCP documentation](https://developers.openai.com/codex/mcp).

### Other MCP Clients

For clients that accept the standard `mcpServers` JSON shape, use the Claude
Desktop configuration above. Otherwise configure a local stdio server with:

- command: `npx`
- arguments: `-y`, `mcp-server-lighthouse`

## Tool

### `analyze_website_performance`

Runs Lighthouse against a public HTTP or HTTPS URL:

```json
{
  "url": "https://example.com",
  "mode": "reliable"
}
```

`mode` is optional:

- `fast`: one mobile run and one desktop run.
- `reliable`: three runs per profile, median results, and variability ranges.
  This is the default.

## What The Report Contains

- Mobile and desktop Performance, Accessibility, Best Practices, and SEO scores
- FCP, Speed Index, LCP, TBT, and CLS distributions
- At most ten canonical prioritized issues
- Up to ten evidence rows per issue
- Resource URLs, DOM selectors, and console error evidence when available
- Suggested actions and measurable acceptance criteria
- Profile warnings when repeated runs vary materially
- Canonical `structuredContent` validated by the advertised MCP `outputSchema`
- Equivalent Markdown generated from the same canonical report

If only one profile produces enough successful runs, the report has
`status: "incomplete"`. It remains useful for diagnosis but must not be treated
as a release baseline.

## Coding-Agent Workflow

Treat `structuredContent` as the source of truth and Markdown as the execution
summary:

> Inspect the repository before mapping findings to files. Implement issues in
> `prioritizedIssues` order, preserve behavior and accessibility, run repository
> tests after each logical fix, then rerun Lighthouse in reliable mode and
> compare medians, ranges, and acceptance criteria. Do not claim completion from
> an incomplete baseline.

## Security Model

The URL policy rejects:

- protocols other than HTTP and HTTPS;
- URLs containing embedded credentials;
- localhost names;
- loopback, private, link-local, multicast, reserved, and metadata-network IPs;
- hostnames that resolve to any non-public address.

These checks reduce SSRF exposure but do not replace infrastructure controls.
Production operators should run the server in an isolated environment and deny
outbound access to private networks and cloud metadata services. Redirects and
DNS rebinding are best controlled at the network boundary.

Page-controlled Lighthouse titles, descriptions, URLs, selectors, and snippets
are sanitized and length-limited. Consumers must still treat them as untrusted
evidence, not agent instructions.

Chrome sandboxing is enabled by default. Only isolated environments that cannot
support it should set:

```bash
LIGHTHOUSE_CHROME_NO_SANDBOX=true
```

See [SECURITY.md](SECURITY.md) for reporting and deployment guidance.

## Local Development

```bash
npm install
npm test
npm run check
npm run build
```

Run a real Chrome smoke audit:

```bash
npm run --silent smoke -- https://example.com fast
npm run --silent smoke -- https://example.com reliable
```

The smoke command writes canonical JSON to stdout and equivalent Markdown to
stderr.

## Troubleshooting

**Chrome cannot be found**

Install Google Chrome or Chromium in the environment running the MCP server.

**Chrome fails to start in a container**

Prefer a container configuration that supports the Chrome sandbox. Set
`LIGHTHOUSE_CHROME_NO_SANDBOX=true` only when the surrounding container or
virtual machine provides an equivalent isolation boundary.

**The target URL is rejected**

Only publicly routable HTTP and HTTPS targets are accepted. Local development
sites and private network addresses are intentionally blocked.

## Contributing

Focused issues and pull requests are welcome. Read
[CONTRIBUTING.md](CONTRIBUTING.md) before changing the report contract,
security policy, or MCP transport behavior.

## License

[MIT](LICENSE)
