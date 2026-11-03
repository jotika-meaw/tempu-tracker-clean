import { useEffect, useMemo, useRef, useState } from "react";
import {
  isApiCode,
  describeApiError,
} from "./lib/errors";
import {
  ApiClientError,
  sendLocation,
  startTracking,
  stopTracking,
  stopTrackingOnPageHide,
} from "./api/client";
import type { StartTrackingResponse } from "./api/types";
import {
  findRoute,
  getDirectionData,
  validateJourney,
} from "../shared/journey";
import { tempuRoutes, type Direction } from "../shared/routes";
import { t, formatDateTime, formatTime, type UiLanguage } from "./i18n";
import { Banner } from "./components/Banner";
import { DirectionStops } from "./components/DirectionStops";
import { VehicleIcon } from "./components/TempuIcon";
import {
  DEFAULT_VEHICLE_TYPE,
  VEHICLE_HINT,
  VEHICLE_LABEL,
  VEHICLE_TYPES,
  vehicleTypeOf,
  type VehicleType,
} from "./lib/vehicles";

type Phase = "idle" | "locating" | "starting" | "live";

type Feedback = {
  tone: "info" | "success" | "warning" | "danger";
  text: string;
};

type LastFix = {
  at: Date;
  accuracy: number | null;
};

type DriverPanelProps = {
  language: UiLanguage;
  onOpenMap: () => void;
};

function isGeolocationError(value: unknown): value is GeolocationPositionError {
  return (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    "PERMISSION_DENIED" in value
  );
}

function geolocationErrorMessage(
  error: GeolocationPositionError,
  language: UiLanguage
): string {
  if (error.code === error.PERMISSION_DENIED) {
    return t(language, "driverPermissionDenied");
  }
  if (error.code === error.TIMEOUT) {
    return t(language, "driverTimeout");
  }
  return t(language, "driverPositionUnavailable");
}

export function DriverPanel({ language, onOpenMap }: DriverPanelProps) {
  const [routeNumber, setRouteNumber] = useState("");
  const [direction, setDirection] = useState<Direction>("outbound");
  const [startIndex, setStartIndex] = useState<number | "">("");
  const [endIndex, setEndIndex] = useState<number | "">("");
  const [consent, setConsent] = useState(false);
  const [vehicleType, setVehicleType] = useState<VehicleType>(DEFAULT_VEHICLE_TYPE);
  const [phase, setPhase] = useState<Phase>("idle");
  const [session, setSession] = useState<StartTrackingResponse | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [lastFix, setLastFix] = useState<LastFix | null>(null);
  const [lastSentAt, setLastSentAt] = useState<string | null>(null);

  const sessionTokenRef = useRef<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const sendInFlightRef = useRef(false);
  const lastSentAtRef = useRef(0);

  const route = useMemo(
    () => (routeNumber ? findRoute(routeNumber) : undefined),
    [routeNumber]
  );
  const directionData = route
    ? getDirectionData(route, direction)
    : undefined;
  const stops = directionData?.stops ?? [];

  const hasValidSelection =
    typeof startIndex === "number" &&
    typeof endIndex === "number" &&
    validateJourney(routeNumber, direction, startIndex, endIndex).ok;

  const selectedIndices =
    typeof startIndex === "number" &&
    typeof endIndex === "number" &&
    endIndex > startIndex
      ? Array.from(
          { length: endIndex - startIndex + 1 },
          (_, offset) => startIndex + offset
        )
      : [];

  const formLocked = phase !== "idle";
  const busy = phase === "locating" || phase === "starting";

  function clearWatch() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }

  function changeRoute(value: string) {
    setRouteNumber(value);
    setDirection("outbound");
    setStartIndex("");
    setEndIndex("");
    setFeedback(null);
  }

  function changeDirection(value: Direction) {
    setDirection(value);
    setStartIndex("");
    setEndIndex("");
    setFeedback(null);
  }

  function changeStart(value: string) {
    if (!value) {
      setStartIndex("");
      setEndIndex("");
      return;
    }
    const index = Number(value);
    setStartIndex(index);
    if (typeof endIndex !== "number" || endIndex <= index) {
      setEndIndex(index + 1 < stops.length ? index + 1 : "");
    }
  }

  function expireSession() {
    clearWatch();
    sessionTokenRef.current = null;
    setSession(null);
    setPhase("idle");
    setFeedback({ tone: "danger", text: t(language, "driverSessionExpired") });
  }

  function beginWatch(token: string) {
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        if (!mountedRef.current || sessionTokenRef.current !== token) return;

        const accuracy = Number.isFinite(position.coords.accuracy)
          ? position.coords.accuracy
          : null;
        setLastFix({
          at: new Date(position.timestamp || Date.now()),
          accuracy,
        });

        const now = Date.now();
        if (now - lastSentAtRef.current < 5_000) return;
        if (sendInFlightRef.current) return;

        lastSentAtRef.current = now;
        sendInFlightRef.current = true;

        void sendLocation(token, {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy,
        })
          .then((response) => {
            if (!mountedRef.current || sessionTokenRef.current !== token) return;
            setLastSentAt(response.vehicle.lastLocationAt);
          })
          .catch((error: unknown) => {
            if (!mountedRef.current || sessionTokenRef.current !== token) return;

            if (isApiCode(error, "UNAUTHORIZED_SESSION")) {
              expireSession();
              return;
            }
            if (isApiCode(error, "UPDATE_TOO_FREQUENT")) {
              return;
            }
            setFeedback({
              tone: "warning",
              text: describeApiError(error, language),
            });
          })
          .finally(() => {
            sendInFlightRef.current = false;
          });
      },
      (error) => {
        if (!mountedRef.current || sessionTokenRef.current !== token) return;

        if (error.code === error.PERMISSION_DENIED) {
          const currentToken = sessionTokenRef.current;
          clearWatch();
          sessionTokenRef.current = null;
          setSession(null);
          setPhase("idle");
          setFeedback({
            tone: "danger",
            text: t(language, "driverPermissionDenied"),
          });
          if (currentToken) {
            void stopTracking(currentToken).catch(() => undefined);
          }
          return;
        }

        setFeedback({
          tone: "warning",
          text: geolocationErrorMessage(error, language),
        });
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5_000,
        timeout: 20_000,
      }
    );
  }

  useEffect(() => {
    mountedRef.current = true;

    const handlePageHide = () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      const token = sessionTokenRef.current;
      sessionTokenRef.current = null;
      if (token) stopTrackingOnPageHide(token);
    };

    window.addEventListener("pagehide", handlePageHide);

    return () => {
      mountedRef.current = false;
      window.removeEventListener("pagehide", handlePageHide);
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      const token = sessionTokenRef.current;
      sessionTokenRef.current = null;
      if (token) stopTrackingOnPageHide(token);
    };
  }, []);

  async function handleStart() {
    if (busy || phase === "live") return;

    if (!routeNumber || !hasValidSelection) {
      setFeedback({
        tone: "danger",
        text: t(language, "driverSelectJourney"),
      });
      return;
    }

    if (!consent) {
      setFeedback({
        tone: "danger",
        text: t(language, "driverConsentRequired"),
      });
      return;
    }

    if (!navigator.geolocation) {
      setFeedback({
        tone: "danger",
        text: t(language, "driverGpsUnsupported"),
      });
      return;
    }

    setFeedback(null);
    setPhase("locating");

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 20_000,
          });
        }
      );

      if (!mountedRef.current) return;

      const accuracy = Number.isFinite(position.coords.accuracy)
        ? position.coords.accuracy
        : null;
      setLastFix({
        at: new Date(position.timestamp || Date.now()),
        accuracy,
      });
      setPhase("starting");

      const started = await startTracking({
        routeNumber,
        direction,
        startIndex: startIndex as number,
        endIndex: endIndex as number,
        vehicleType,
        consent: true,
        initialLocation: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy,
        },
      });

      if (!mountedRef.current) {
        stopTrackingOnPageHide(started.sessionToken);
        return;
      }

      sessionTokenRef.current = started.sessionToken;
      setSession(started);
      setLastSentAt(started.startedAt);
      lastSentAtRef.current = Date.now();
      setPhase("live");
      beginWatch(started.sessionToken);
    } catch (error) {
      if (!mountedRef.current) return;

      setPhase("idle");
      if (isGeolocationError(error)) {
        setFeedback({
          tone: "danger",
          text: geolocationErrorMessage(error, language),
        });
      } else if (error instanceof ApiClientError) {
        setFeedback({
          tone: "danger",
          text: describeApiError(error, language),
        });
      } else {
        setFeedback({
          tone: "danger",
          text: t(language, "driverStartError"),
        });
      }
    }
  } 

  async function handleStop() {
    clearWatch();
    const token = sessionTokenRef.current;
    sessionTokenRef.current = null;
    sendInFlightRef.current = false;
    setSession(null);
    setPhase("idle");
    setLastSentAt(null);
    setFeedback({ tone: "info", text: t(language, "driverStatusIdle") });

    if (!token) return;

    try {
      await stopTracking(token);
      if (mountedRef.current) {
        setFeedback({ tone: "success", text: t(language, "driverStopped") });
      }
    } catch {
      if (mountedRef.current) {
        setFeedback({ tone: "warning", text: t(language, "driverStopError") });
      }
    }
  }

  const startButtonLabel =
    phase === "locating"
      ? t(language, "driverLocating")
      : phase === "starting"
        ? t(language, "driverStarting")
        : t(language, "driverStartButton");

  return (
    <section className="driver-page" aria-labelledby="driver-title">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" aria-hidden="true" />
            {t(language, "roleDriver")}
          </div>
          <h1 id="driver-title">{t(language, "driverTitle")}</h1>
          <p>{t(language, "driverSubtitle")}</p>
        </div>
      </div>

      <Banner tone="info" title={t(language, "driverNoVerify")} compact>
        {t(language, "driverNotVerifiedNote")}
      </Banner>

      <div className="driver-layout">
        <section className="card driver-form-card" aria-labelledby="driver-form-title">
          <div className="section-heading">
            <div className="heading-icon" aria-hidden="true">
              ⌖
            </div>
            <div>
              <h2 id="driver-form-title">{t(language, "driverJourney")}</h2>
              <p>{t(language, "driverRouteHelp")}</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="driver-route">{t(language, "driverRoute")}</label>
              <select
                id="driver-route"
                value={routeNumber}
                onChange={(event) => changeRoute(event.target.value)}
                disabled={formLocked}
              >
                <option value="">{t(language, "driverRoutePlaceholder")}</option>
                {tempuRoutes.map((item) => (
                  <option key={item.number} value={item.number}>
                    {t(language, "routeNumberLabel", { number: item.number })} —{" "}
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="driver-direction">{t(language, "driverDirection")}</label>
              <select
                id="driver-direction"
                value={direction}
                onChange={(event) =>
                  changeDirection(event.target.value as Direction)
                }
                disabled={formLocked || !route}
              >
                <option value="outbound">{t(language, "directionOutbound")}</option>
                <option value="return">{t(language, "directionReturn")}</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="driver-start">{t(language, "driverStart")}</label>
              <select
                id="driver-start"
                value={startIndex}
                onChange={(event) => changeStart(event.target.value)}
                disabled={formLocked || stops.length < 2}
              >
                <option value="">{t(language, "driverStartPlaceholder")}</option>
                {stops.map((stop, index) =>
                  index < stops.length - 1 ? (
                    <option key={`${index}-${stop}`} value={index}>
                      {stop}
                    </option>
                  ) : null
                )}
              </select>
            </div>

            <div className="field">
              <label htmlFor="driver-end">{t(language, "driverEnd")}</label>
              <select
                id="driver-end"
                value={endIndex}
                onChange={(event) =>
                  setEndIndex(
                    event.target.value === "" ? "" : Number(event.target.value)
                  )
                }
                disabled={formLocked || typeof startIndex !== "number"}
              >
                <option value="">{t(language, "driverEndPlaceholder")}</option>
                {stops.map((stop, index) =>
                  typeof startIndex === "number" && index > startIndex ? (
                    <option key={`${index}-${stop}`} value={index}>
                      {stop}
                    </option>
                  ) : null
                )}
              </select>
            </div>
          </div>

          {route && directionData ? (
            <div className="driver-route-preview">
              <div className="route-result-header compact-header">
                <span className="route-badge">{route.number}</span>
                <h3>{route.name}</h3>
              </div>
              {directionData.confidence === "partial" ? (
                <p className="inline-notice inline-notice-warning" role="note">
                  {t(language, "driverPartialWarning")}
                </p>
              ) : null}
              <DirectionStops
                route={route}
                direction={direction}
                matchedIndices={selectedIndices}
                language={language}
                compact
              />
              {hasValidSelection ? (
                <p className="selected-stops">
                  <strong>{t(language, "driverSelectedStops")}:</strong>{" "}
                  {stops[startIndex as number]} → {stops[endIndex as number]}
                </p>
              ) : null}
            </div>
          ) : null}

          <fieldset className="vehicle-picker" disabled={formLocked}>
            <legend>{t(language, "vehicleTypeLabel")}</legend>
            <div className="vehicle-picker-options">
              {VEHICLE_TYPES.map((type) => (
                <label
                  key={type}
                  className={vehicleType === type ? "vehicle-option selected" : "vehicle-option"}
                >
                  <input
                    type="radio"
                    name="vehicle-type"
                    value={type}
                    checked={vehicleType === type}
                    onChange={() => setVehicleType(type)}
                  />
                  <VehicleIcon type={type} size={76} />
                  <span className="vehicle-option-name">{t(language, VEHICLE_LABEL[type])}</span>
                  <span className="vehicle-option-hint">{t(language, VEHICLE_HINT[type])}</span>
                </label>
              ))}
            </div>
            <p className="field-note">{t(language, "vehicleTypeNote")}</p>
          </fieldset>

          <div className="consent-box">
            <h3>{t(language, "driverConsentTitle")}</h3>
            <p>{t(language, "driverConsentBody")}</p>
            <label className="checkbox-row" htmlFor="driver-consent">
              <input
                id="driver-consent"
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                disabled={formLocked}
              />
              <span>{t(language, "driverConsentCheckbox")}</span>
            </label>
          </div>

          {feedback ? (
            <div
              className={`inline-notice inline-notice-${feedback.tone}`}
              role={feedback.tone === "danger" ? "alert" : "status"}
            >
              {feedback.text}
            </div>
          ) : null}

          {phase !== "live" ? (
            <button
              type="button"
              className="button button-primary button-wide"
              onClick={() => void handleStart()}
              disabled={busy || formLocked}
            >
              {startButtonLabel}
            </button>
          ) : (
            <button
              type="button"
              className="button button-danger button-wide"
              onClick={() => void handleStop()}
            >
              {t(language, "driverStopButton")}
            </button>
          )}
        </section>

        <aside className="driver-side">
          {session ? (
            <section className="card driver-live-card" aria-labelledby="driver-live-title">
              <div className="live-heading">
                <span className="live-dot" aria-hidden="true" />
                <h2 id="driver-live-title">{t(language, "driverLiveTitle")}</h2>
              </div>
              <div className="driver-live-vehicle">
                <VehicleIcon type={vehicleTypeOf(session.journey.vehicleType)} size={64} />
                <span>{t(language, VEHICLE_LABEL[vehicleTypeOf(session.journey.vehicleType)])}</span>
              </div>
              <p>{t(language, "driverLiveBody")}</p>

              <dl className="driver-stats">
                <div>
                  <dt>{t(language, "driverSession")}</dt>
                  <dd>#{session.publicId.slice(0, 6)}</dd>
                </div>
                <div>
                  <dt>{t(language, "driverLastFix")}</dt>
                  <dd>
                    {lastFix
                      ? formatTime(lastFix.at.toISOString(), language)
                      : t(language, "driverGpsSearching")}
                  </dd>
                </div>
                <div>
                  <dt>{t(language, "driverAccuracy")}</dt>
                  <dd>
                    {lastFix?.accuracy !== null && lastFix?.accuracy !== undefined
                      ? t(language, "driverMeters", {
                          value: Math.round(lastFix.accuracy),
                        })
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt>{t(language, "mapLastUpdate")}</dt>
                  <dd>
                    {lastSentAt
                      ? formatTime(lastSentAt, language)
                      : t(language, "driverGpsSearching")}
                  </dd>
                </div>
                <div>
                  <dt>{t(language, "driverExpires")}</dt>
                  <dd>{formatDateTime(session.expiresAt, language)}</dd>
                </div>
              </dl>

              <p className="driver-live-privacy">{t(language, "driverLivePrivacy")}</p>
              <p className="field-note">{t(language, "driverMapHint")}</p>

              <button
                type="button"
                className="button button-secondary button-wide"
                onClick={onOpenMap}
              >
                {t(language, "driverOpenMap")}
              </button>
              <p className="field-note">{t(language, "driverOpenMapHint")}</p>
            </section>
          ) : (
            <section className="card driver-idle-card">
              <span className="driver-idle-icon" aria-hidden="true">
                ◎
              </span>
              <h2>{t(language, "driverStatusIdle")}</h2>
              <p>{t(language, "driverNoVerify")}</p>
              <p className="field-note">{t(language, "driverMapHint")}</p>
            </section>
          )}

          <section className="card driver-privacy-card">
            <h3>{t(language, "privacyTitle")}</h3>
            <ul>
              <li>{t(language, "privacyPoint1")}</li>
              <li>{t(language, "privacyPoint2")}</li>
              <li>{t(language, "privacyPoint3")}</li>
              <li>{t(language, "privacyPoint4")}</li>
            </ul>
          </section>
        </aside>
      </div>
    </section>
  );
}
