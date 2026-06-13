import { auditWebsite } from "../dist/audit.js";
import { renderReportMarkdown } from "../dist/markdown.js";
import { parseAuditMode } from "../dist/report-schema.js";

const target = process.argv[2] ?? "https://example.com";
const mode = parseAuditMode(process.argv[3] ?? "fast");
const report = await auditWebsite(new URL(target), mode);

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
process.stderr.write(`${renderReportMarkdown(report)}\n`);
