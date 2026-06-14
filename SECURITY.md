# Security Policy

## Reporting a Vulnerability

Do not disclose suspected vulnerabilities in a public issue. Use
[GitHub private vulnerability reporting](https://github.com/fullstackdegen/lighthouse-mcp/security/advisories/new).
Include reproduction steps, affected versions, and the expected security
impact.

## Deployment Guidance

This server launches a browser against user-provided URLs. Application-level URL
validation is defense in depth, not a complete isolation boundary. Production
deployments should:

- Deny egress to loopback, private, link-local, and cloud metadata networks.
- Run the process with the least operating-system privileges available.
- Keep Chrome sandboxing enabled whenever the environment supports it.
- Update the MCP SDK, Lighthouse, Chrome launcher, and Chrome regularly.
- Avoid exposing the stdio process through an unauthenticated network service.

Lighthouse titles, descriptions, resource URLs, selectors, and snippets are
controlled by the audited page. The report pipeline sanitizes and length-limits
these fields, but consumers must continue treating them as untrusted evidence,
not instructions. Only the report's `agentInstructions` field is server-owned.

The maintainers will document remediation and release information after a
reported issue has been investigated.
