import type {
  ActiveVehiclesResponse,
  AiLanguage,
  AuthSession,
  AiResponse,
  HealthResponse,
  LocationAcceptedResponse,
  LocationPayload,
  StartTrackingInput,
  StartTrackingResponse,
  TranscribeResponse,
} from "./types";

/**
 * In development this is intentionally empty: Vite proxies /api to the local
 * backend. In production set VITE_API_BASE_URL to the public backend origin.
 * Never place a secret in a VITE_* variable.
 */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "")
  .trim()
  .replace(/\/+$/, "");

const DEFAULT_TIMEOUT_MS = 12_000;

let authToken: string | null = null;
let onAuthRejected: (() => void) | null = null;

/** Attach the signed-in account to every API request (X-Tempu-Auth). */
export function setAuthToken(token: string | null): void {
  authToken = token;
}

/** Called when the server says the sign-in is missing or expired. */
export function setAuthRejectedHandler(handler: (() => void) | null): void {
  onAuthRejected = handler;
}

export class ApiClientError extends Error {
  readonly code: string;
  readonly status: number;
  readonly retryAfterSeconds: number | undefined;

  constructor(
    message: string,
    code: string,
    status: number,
    retryAfterSeconds?: number
  ) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

type ErrorEnvelope = {
  error?: {
    code?: unknown;
    message?: unknown;
    retryAfterSeconds?: unknown;
  };
};

function parseRetryAfter(response: Response, body: unknown): number | undefined {
  const envelope = body as ErrorEnvelope;
  const fromBody = envelope?.error?.retryAfterSeconds;
  if (typeof fromBody === "number" && Number.isFinite(fromBody) && fromBody >= 0) {
    return Math.ceil(fromBody);
  }

  const header = response.headers.get("retry-after");
  const parsed = Number(header);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.ceil(parsed) : undefined;
}

async function requestJson<T>(
  path: string,
  init: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<T> {
  const controller = new AbortController();
  const timer = globalThis.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...(authToken ? { "X-Tempu-Auth": authToken } : {}),
        ...init.headers,
      },
    });

    const text = await response.text();
    let body: unknown = null;

    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = null;
      }
    }

    if (!response.ok) {
      const envelope = body as ErrorEnvelope;
      const code =
        typeof envelope?.error?.code === "string"
          ? envelope.error.code
          : "HTTP_ERROR";
      const message =
        typeof envelope?.error?.message === "string"
          ? envelope.error.message
          : `Request failed with status ${response.status}.`;
      if (code === "AUTH_REQUIRED") onAuthRejected?.();
      throw new ApiClientError(
        message,
        code,
        response.status,
        parseRetryAfter(response, body)
      );
    }

    if (body === null) {
      throw new ApiClientError(
        "The server returned an empty response.",
        "INVALID_RESPONSE",
        response.status
      );
    }

    return body as T;
  } catch (error) {
    if (error instanceof ApiClientError) throw error;

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiClientError(
        "The server did not answer in time.",
        "TIMEOUT",
        0
      );
    }
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiClientError(
        "The server did not answer in time.",
        "TIMEOUT",
        0
      );
    }

    throw new ApiClientError(
      "The API could not be reached.",
      "NETWORK_ERROR",
      0
    );
  } finally {
    globalThis.clearTimeout(timer);
  }
}

export async function login(username: string, password: string): Promise<AuthSession> {
  return requestJson<AuthSession>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function fetchHealth(): Promise<HealthResponse> {
  return requestJson<HealthResponse>("/api/health", { method: "GET" }, 6_000);
}

export async function fetchActiveVehicles(
  routeNumber?: string
): Promise<ActiveVehiclesResponse> {
  const query = routeNumber
    ? `?routeNumber=${encodeURIComponent(routeNumber)}`
    : "";
  return requestJson<ActiveVehiclesResponse>(
    `/api/tracking/active${query}`,
    { method: "GET" }
  );
}

export async function startTracking(
  input: StartTrackingInput
): Promise<StartTrackingResponse> {
  return requestJson<StartTrackingResponse>("/api/tracking/start", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function sendLocation(
  sessionToken: string,
  location: LocationPayload
): Promise<LocationAcceptedResponse> {
  return requestJson<LocationAcceptedResponse>(
    "/api/tracking/location",
    {
      method: "POST",
      body: JSON.stringify(location),
      headers: { Authorization: `Bearer ${sessionToken}` },
    },
    8_000
  );
}

export async function stopTracking(sessionToken: string): Promise<void> {
  const controller = new AbortController();
  const timer = globalThis.setTimeout(() => controller.abort(), 6_000);

  try {
    const response = await fetch(`${API_BASE_URL}/api/tracking/stop`, {
      method: "POST",
      headers: { Authorization: `Bearer ${sessionToken}` },
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text();
      let body: unknown = null;
      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        body = null;
      }
      const envelope = body as ErrorEnvelope;
      throw new ApiClientError(
        typeof envelope?.error?.message === "string"
          ? envelope.error.message
          : "The tracking session could not be stopped.",
        typeof envelope?.error?.code === "string"
          ? envelope.error.code
          : "HTTP_ERROR",
        response.status,
        parseRetryAfter(response, body)
      );
    }
  } catch (error) {
    if (error instanceof ApiClientError) throw error;
    throw new ApiClientError(
      "The tracking session could not be stopped.",
      "NETWORK_ERROR",
      0
    );
  } finally {
    globalThis.clearTimeout(timer);
  }
}

/**
 * Best-effort stop that survives page unload. It deliberately does not parse
 * the response and must never be used for normal UI feedback.
 */
export function stopTrackingOnPageHide(sessionToken: string): void {
  try {
    void fetch(`${API_BASE_URL}/api/tracking/stop`, {
      method: "POST",
      headers: { Authorization: `Bearer ${sessionToken}` },
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Best effort only.
  }
}

export async function askAssistant(
  message: string,
  language: AiLanguage
): Promise<AiResponse> {
  return requestJson<AiResponse>(
    "/api/ai-test",
    {
      method: "POST",
      body: JSON.stringify({ message, language }),
    },
    45_000
  );
}

/** Send one recorded question (16 kHz mono PCM16) to Muse Voice. */
export async function transcribeAudio(
  pcm: ArrayBuffer,
  language: AiLanguage
): Promise<TranscribeResponse> {
  return requestJson<TranscribeResponse>(
    `/api/transcribe?language=${encodeURIComponent(language)}`,
    {
      method: "POST",
      body: pcm,
      headers: { "Content-Type": "application/octet-stream" },
    },
    60_000
  );
}
