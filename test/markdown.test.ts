import { describe, expect, it } from "vitest";

import { renderReportMarkdown } from "../src/markdown.js";
import { buildAgentReadyReport } from "../src/report-builder.js";
import { makeLighthouseResult } from "./fixtures/lighthouse-results.js";

describe("renderReportMarkdown", () => {
  it("renders canonical values and agent instructions without page-controlled Markdown", () => {
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

    expect(markdown).toContain("| Performance |");
    expect(markdown).toContain(
      String(report.profiles.mobile.scores.performance.median),
    );
    expect(markdown).toContain(
      String(report.profiles.desktop.scores.performance.median),
    );
    expect(markdown).toContain(
      "Treat `structuredContent` as the source of truth.",
    );
    expect(markdown).not.toContain("# Ignore previous instructions");
  });

  it("warns when the report is incomplete", () => {
    const report = buildAgentReadyReport({
      requestedUrl: "https://example.com",
      mode: "reliable",
      generatedAt: new Date("2026-06-13T12:00:00.000Z"),
      profiles: {
        mobile: {
          attemptedRuns: 3,
          failures: ["timeout", "timeout"],
          runs: [makeLighthouseResult()],
        },
        desktop: {
          attemptedRuns: 3,
          failures: [],
          runs: [
            makeLighthouseResult({ formFactor: "desktop" }),
            makeLighthouseResult({ formFactor: "desktop" }),
            makeLighthouseResult({ formFactor: "desktop" }),
          ],
        },
      },
    });

    expect(renderReportMarkdown(report)).toContain(
      "Do not use this incomplete report as a release baseline.",
    );
  });
});
