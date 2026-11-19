export const APP_NAME = "Health Runners";
export const DEFAULT_GROUP_CODE = "HEALTHRUNNERS";

// Keep the existing database key so memberships and previously shared links remain valid.
export const LEGACY_GROUP_CODE = "RATSDOBEM";

export function publicGroupCode(code: string) {
  return code === LEGACY_GROUP_CODE ? DEFAULT_GROUP_CODE : code;
}

export function storedGroupCode(code: string) {
  return code === DEFAULT_GROUP_CODE ? LEGACY_GROUP_CODE : code;
}
