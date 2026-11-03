import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { askAssistant, setAuthRejectedHandler, setAuthToken } from "../api/client";
import { clearSession, loadSession, saveSession } from "./session";

const session = {
  token: "payload.signature",
  user: { username: "passenger.demo", role: "passenger" as const, displayName: "Demo passenger" },
  expiresAt: "2026-11-04T00:00:00.000Z",
};

function memoryStorage(): Storage {
  const items = new Map<string, string>();
  return {
    get length() {
      return items.size;
    },
    clear: () => items.clear(),
    getItem: (key) => items.get(key) ?? null,
    key: (index) => [...items.keys()][index] ?? null,
    removeItem: (key) => void items.delete(key),
    setItem: (key, value) => void items.set(key, value),
  };
}

describe("session storage", () => {
  beforeEach(() => {
    vi.stubGlobal("window", { localStorage: memoryStorage() });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    setAuthToken(null);
    setAuthRejectedHandler(null);
  });

  it("round-trips a session until it expires", () => {
    saveSession(session);
    expect(loadSession(Date.parse("2026-11-03T12:00:00.000Z"))).toEqual(session);
    expect(loadSession(Date.parse("2026-11-04T00:00:01.000Z"))).toBeNull();
    // An expired session is removed, not kept around.
    expect(loadSession(Date.parse("2026-11-03T12:00:00.000Z"))).toBeNull();
  });

  it("ignores malformed data and storage failures", () => {
    window.localStorage.setItem("tempu-tracker.session", "{not json");
    expect(loadSession()).toBeNull();
    window.localStorage.setItem("tempu-tracker.session", JSON.stringify({ token: 1 }));
    expect(loadSession()).toBeNull();

    vi.stubGlobal("window", {
      localStorage: {
        getItem: () => {
          throw new Error("blocked");
        },
      },
    });
    expect(loadSession()).toBeNull();
    expect(() => clearSession()).not.toThrow();
  });

  it("sends the auth header and signs out when the server rejects it", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ error: { code: "AUTH_REQUIRED", message: "Sign in" } }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);
    const rejected = vi.fn();
    setAuthToken("payload.signature");
    setAuthRejectedHandler(rejected);

    await expect(askAssistant("প্রশ্ন", "bn")).rejects.toMatchObject({ code: "AUTH_REQUIRED" });
    const headers = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].headers as Record<string, string>;
    expect(headers["X-Tempu-Auth"]).toBe("payload.signature");
    expect(rejected).toHaveBeenCalledOnce();
  });
});
