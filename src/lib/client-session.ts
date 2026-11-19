import { PROFILE_ID_PATTERN, SESSION_HEADER } from "@/lib/photo";

const STORAGE_KEY = "health_runners_session";

export function getStoredSessionId(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value && PROFILE_ID_PATTERN.test(value) ? value : undefined;
  } catch { return undefined; }
}

export function storeSessionId(id?: string | null) {
  if (typeof window === "undefined" || !id || !PROFILE_ID_PATTERN.test(id)) return;
  try { window.localStorage.setItem(STORAGE_KEY, id); } catch { /* storage unavailable */ }
}

// Send the stored id so the session survives even when the browser blocks the
// cookie inside an embedded iframe (third-party context).
export function sessionHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const id = getStoredSessionId();
  return id ? { ...extra, [SESSION_HEADER]: id } : extra;
}
