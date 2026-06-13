import { desktopConfig, type Config } from "lighthouse";

import type { ProfileName } from "./report-schema.js";

export interface AuditProfile {
  name: ProfileName;
  config: Config | undefined;
}

const PROFILES: readonly AuditProfile[] = [
  { name: "mobile", config: undefined },
  { name: "desktop", config: desktopConfig },
];

export function getAuditProfiles(): readonly AuditProfile[] {
  return PROFILES;
}
