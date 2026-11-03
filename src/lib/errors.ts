import { ApiClientError } from "../api/client";
import { t, type MessageKey, type UiLanguage } from "../i18n";

const codeToKey: Record<string, MessageKey> = {
  NETWORK_ERROR: "errorNetwork",
  TIMEOUT: "errorTimeout",
  RATE_LIMITED: "errorRateLimited",
  UPDATE_TOO_FREQUENT: "errorTooFrequent",
  UNAUTHORIZED_SESSION: "errorUnauthorizedSession",
  TRACKING_STORE_UNAVAILABLE: "errorTrackingUnavailable",
  AI_NOT_CONFIGURED: "errorAiNotConfigured",
  AI_RATE_LIMITED: "errorAiRateLimited",
  AI_TIMEOUT: "errorAiTimeout",
  AI_UNAVAILABLE: "errorAiUnavailable",
  AI_AUTH_FAILED: "errorAiAuth",
  CONSENT_REQUIRED: "errorConsentRequired",
  UNKNOWN_ROUTE: "errorUnknownRoute",
  INVALID_DIRECTION: "errorInvalidJourney",
  INVALID_INDEX: "errorInvalidJourney",
  SAME_STOP: "errorInvalidJourney",
  END_BEFORE_START: "errorInvalidJourney",
  INVALID_COORDINATES: "errorInvalidCoordinates",
  INVALID_ACCURACY: "errorInvalidCoordinates",
  INVALID_REQUEST: "errorInvalidRequest",
  INVALID_AI_REQUEST: "errorInvalidRequest",
  INVALID_JSON: "errorInvalidRequest",
  CORS_NOT_ALLOWED: "errorCors",
  INVALID_RESPONSE: "errorInvalidResponse",
  PAYLOAD_TOO_LARGE: "errorInvalidRequest",
  INVALID_AUDIO: "errorVoiceAudio",
  INVALID_CREDENTIALS: "errorInvalidCredentials",
  AUTH_REQUIRED: "errorAuthRequired",
  ROLE_NOT_ALLOWED: "errorRoleNotAllowed",
  TRANSCRIPT_EMPTY: "errorVoiceEmpty",
  AI_REQUEST_REJECTED: "errorAiUnavailable",
};

export function describeApiError(
  error: unknown,
  language: UiLanguage
): string {
  if (error instanceof ApiClientError) {
    const key = codeToKey[error.code];
    if (key) return t(language, key);
    if (error.status >= 500) return t(language, "errorServer");
    return t(language, "errorGeneric");
  }

  return t(language, "errorGeneric");
}

export function isApiCode(error: unknown, code: string): boolean {
  return error instanceof ApiClientError && error.code === code;
}
