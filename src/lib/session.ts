import type { AuthSession } from "../api/types";

const STORAGE_KEY = "tempu-tracker.session";

function isSession(value: unknown): value is AuthSession {
  const candidate = value as AuthSession | null;
  return (
    typeof candidate?.token === "string" &&
    typeof candidate.expiresAt === "string" &&
    (candidate.user?.role === "driver" || candidate.user?.role === "passenger") &&
    typeof candidate.user.username === "string"
  );
}

/** Read the saved sign-in, dropping it once expired. Storage can be unavailable. */
export function loadSession(now = Date.now()): AuthSession | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isSession(parsed) || Date.parse(parsed.expiresAt) <= now) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveSession(session: AuthSession): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Without storage the session lasts until the tab is closed.
  }
}

export function clearSession(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
}
