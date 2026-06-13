import { describe, expect, it } from "vitest";

import { getAuditProfiles } from "../src/profiles.js";

describe("getAuditProfiles", () => {
  it("returns fixed mobile and desktop Lighthouse profiles", () => {
    const profiles = getAuditProfiles();

    expect(profiles.map((profile) => profile.name)).toEqual([
      "mobile",
      "desktop",
    ]);
    expect(profiles[0]?.config).toBeUndefined();
    expect(profiles[1]?.config).toBeDefined();
    expect(profiles[1]?.config?.settings?.formFactor).toBe("desktop");
  });
});
