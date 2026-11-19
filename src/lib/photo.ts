export const MAX_PROFILE_PHOTO_MB = 15;
export const MAX_PROFILE_PHOTO_BYTES = MAX_PROFILE_PHOTO_MB * 1024 * 1024;
export const MAX_PROFILE_PHOTO_PIXELS = 40_000_000;
export const PROFILE_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const PROFILE_PHOTO_ACCEPT = ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";
export const PROFILE_PHOTO_PATH = "/api/profile/photo/";
export const PROFILE_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const SESSION_HEADER = "x-session-id";
