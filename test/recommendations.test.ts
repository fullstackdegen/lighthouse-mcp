import { describe, expect, it } from "vitest";

import { getRecommendation } from "../src/recommendations.js";

describe("recommendations", () => {
  it("returns deterministic guidance for known audit IDs", () => {
    const result = getRecommendation("unused-javascript", "mobile");

    expect(result.suggestedActions).toContain(
      "Remove unused modules and split non-critical JavaScript into on-demand chunks.",
    );
    expect(result.acceptanceCriteria).toContain(
      "Reduce the reported wasted JavaScript bytes.",
    );
    expect(result.documentationUrl).toMatch(
      /^https:\/\/developer\.chrome\.com\//,
    );
  });

  it("returns repository-inspection guidance for unknown audits", () => {
    const result = getRecommendation("custom-audit", "desktop");

    expect(result.suggestedActions[0]).toMatch(/Inspect the affected resource/i);
    expect(result.documentationUrl).toBeNull();
  });
});
