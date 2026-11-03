import { afterEach, describe, expect, it, vi } from "vitest";
import {
  askAssistant,
  fetchActiveVehicles,
  startTracking,
  stopTracking,
} from "./client";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const validStart = {
  routeNumber: "01",
  direction: "outbound" as const,
  startIndex: 0,
  endIndex: 3,
  vehicleType: "tempu" as const,
  consent: true as const,
  initialLocation: {
    latitude: 22.3569,
    longitude: 91.7832,
    accuracy: 12,
  },
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("API client", () => {
  it("posts a validated start request with explicit consent", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(
        {
          sessionToken: "a".repeat(43),
          publicId: "public-1",
          journey: { routeNumber: "01" },
          startedAt: "2026-01-01T00:00:00.000Z",
          expiresAt: "2026-01-01T01:00:00.000Z",
          staleSeconds: 30,
        },
        201
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await startTracking(validStart);
    expect(result.sessionToken).toHaveLength(43);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/tracking/start");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toMatchObject({
      routeNumber: "01",
      vehicleType: "tempu",
      consent: true,
    });
  });

  it("preserves structured server error codes and Retry-After", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          {
            error: {
              code: "UPDATE_TOO_FREQUENT",
              message: "Too frequent",
              retryAfterSeconds: 3,
            },
          },
          429
        )
      )
    );

    await expect(
      stopTracking("a".repeat(43))
    ).rejects.toMatchObject({
      name: "ApiClientError",
      code: "UPDATE_TOO_FREQUENT",
      status: 429,
      retryAfterSeconds: 3,
    });
  });

  it("maps a network failure to a safe client code", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("fetch failed"))
    );

    await expect(fetchActiveVehicles()).rejects.toEqual(
      expect.objectContaining({
        code: "NETWORK_ERROR",
        status: 0,
      })
    );
  });

  it("sends the session token only in the Authorization header", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    const token = "b".repeat(43);
    await stopTracking(token);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/tracking/stop");
    expect((init.headers as Record<string, string>).Authorization).toBe(
      `Bearer ${token}`
    );
    expect(String(init.body ?? "")).not.toContain(token);
  });

  it("encodes the route filter and sends the AI language", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          serverTime: "2026-01-01T00:00:00.000Z",
          staleSeconds: 30,
          staleHidden: 0,
          vehicles: [],
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({ answer: "উত্তর", model: "muse-spark-1.2-contributor" })
      );
    vi.stubGlobal("fetch", fetchMock);

    await fetchActiveVehicles("01");
    await askAssistant("রুট ০১?", "ctg");

    const [activeUrl] = fetchMock.mock.calls[0] as [string];
    expect(activeUrl).toBe("/api/tracking/active?routeNumber=01");

    const [aiUrl, aiInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(aiUrl).toBe("/api/ai-test");
    expect(JSON.parse(String(aiInit.body))).toEqual({
      message: "রুট ০১?",
      language: "ctg",
    });
  });
});
