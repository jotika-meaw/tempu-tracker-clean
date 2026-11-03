import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { fetchActiveVehicles } from "./api/client";
import type {
  ActiveVehiclesResponse,
  PublicVehicle,
} from "./api/types";
import { tempuRoutes } from "./routes";
import {
  formatAge,
  formatTime,
  t,
  type UiLanguage,
} from "./i18n";
import {
  classifyFreshness,
  estimateAgeSeconds,
} from "./lib/freshness";
import { describeApiError } from "./lib/errors";
import { Banner } from "./components/Banner";
import { TempuIcon, VehicleIcon } from "./components/TempuIcon";
import { VEHICLE_SVGS } from "./components/vehicleSvgs";
import { DEMO_ROUTE_LINES, demoVehiclesAt } from "./lib/demoFleet";
import { setDemoVehiclesEnabled, useDemoVehiclesEnabled } from "./lib/demoMode";
import {
  VEHICLE_LABEL,
  VEHICLE_TYPES,
  vehicleTypeOf,
  type VehicleType,
} from "./lib/vehicles";

type Snapshot = {
  response: ActiveVehiclesResponse;
  fetchedAt: number;
};

type VehicleWithAge = PublicVehicle & {
  currentAge: number;
  /** Simulated demo vehicle, never from a driver's GPS. */
  demo?: true;
  nextStop?: string | null;
  facingRight?: boolean;
};

const CHATTOGRAM_CENTER: [number, number] = [22.3569, 91.7832];

const vehicleIcons = new Map<string, L.DivIcon>();

/** A map pin showing the vehicle's type, labelled with its route number. */
function createVehicleIcon(
  routeNumber: string,
  vehicleType: VehicleType,
  demo = false,
  facingRight = false
): L.DivIcon {
  const safeNumber = routeNumber.replace(/[^0-9]/g, "");
  const key = `${vehicleType}:${safeNumber}:${demo ? "demo" : "live"}:${facingRight ? "r" : "l"}`;
  const cached = vehicleIcons.get(key);
  if (cached) return cached;

  const icon = L.divIcon({
    className: `tempu-marker tempu-marker-${vehicleType}${demo ? " tempu-marker-demo" : ""}`,
    html: `<span class="tempu-pin${facingRight ? " tempu-pin-right" : ""}"><span class="tempu-pin-pulse"></span><span class="tempu-pin-body">${VEHICLE_SVGS[vehicleType]}</span><span class="tempu-pin-route">${safeNumber}</span>${demo ? '<span class="tempu-pin-demo">DEMO</span>' : ""}</span>`,
    iconSize: [60, 58],
    iconAnchor: [30, 56],
    popupAnchor: [0, -52],
  });
  vehicleIcons.set(key, icon);
  return icon;
}

/**
 * Leaflet measures its container once. Re-measure whenever the layout
 * changes size (sidebar, phone rotation, embedded cards) so tiles never
 * leave grey gaps.
 */
function KeepMapSized() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => map.invalidateSize({ animate: false }));
    observer.observe(container);
    const timer = window.setTimeout(() => map.invalidateSize({ animate: false }), 250);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, [map]);

  return null;
}

function FollowVehicles({
  vehicles,
  filterKey,
}: {
  vehicles: VehicleWithAge[];
  filterKey: string;
}) {
  const map = useMap();
  const fittedKeyRef = useRef("");

  useEffect(() => {
    const key = `${filterKey}:${vehicles
      .map((vehicle) => vehicle.publicId)
      .sort()
      .join(",")}`;

    if (key === fittedKeyRef.current) return;
    fittedKeyRef.current = key;

    if (vehicles.length === 0) return;

    if (vehicles.length === 1) {
      map.setView([vehicles[0].latitude, vehicles[0].longitude], 15, {
        animate: false,
      });
      return;
    }

    const bounds = L.latLngBounds(
      vehicles.map((vehicle) => [vehicle.latitude, vehicle.longitude])
    );
    map.fitBounds(bounds.pad(0.25), { animate: false, maxZoom: 15 });
  }, [map, vehicles, filterKey]);

  return null;
}

type LiveMapProps = {
  language: UiLanguage;
  embedded?: boolean;
};

export function LiveMap({ language, embedded = false }: LiveMapProps) {
  const [filter, setFilter] = useState("");
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    let active = true;
    let requestId = 0;

    async function load() {
      const currentRequest = ++requestId;
      try {
        const response = await fetchActiveVehicles(filter || undefined);
        if (!active || currentRequest !== requestId) return;
        setSnapshot({ response, fetchedAt: Date.now() });
        setError(null);
        setLoading(false);
      } catch (requestError) {
        if (!active || currentRequest !== requestId) return;
        setError(requestError);
        setLoading(false);
      }
    }

    void load();
    const intervalId = window.setInterval(() => void load(), 5_000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [filter, reloadKey]);

  function refresh() {
    setLoading(true);
    setReloadKey((value) => value + 1);
  }

  function changeFilter(value: string) {
    setSnapshot(null);
    setLoading(true);
    setFilter(value);
  }

  const staleSeconds = snapshot?.response.staleSeconds ?? 30;
  const allVehicles = snapshot?.response.vehicles ?? [];
  const vehicles: VehicleWithAge[] = snapshot
    ? allVehicles
        .map((vehicle) => ({
          ...vehicle,
          currentAge: estimateAgeSeconds(
            vehicle.ageSeconds,
            snapshot.fetchedAt,
            now
          ),
        }))
        .filter(
          (vehicle) =>
            classifyFreshness(vehicle.currentAge, staleSeconds) !== "stale"
        )
    : [];
  const newlyStale = allVehicles.length - vehicles.length;
  const hiddenCount = (snapshot?.response.staleHidden ?? 0) + newlyStale;
  const errorMessage = error ? describeApiError(error, language) : "";
  const lastSuccess = snapshot ? new Date(snapshot.fetchedAt) : null;
  const showLoadingOverlay = loading && !snapshot;
  const showErrorOverlay = Boolean(error) && !snapshot && !loading;
  const showEmptyOverlay =
    Boolean(snapshot) && !error && !loading && vehicles.length === 0;
  const offlineAndStale =
    Boolean(error) && Boolean(snapshot) && vehicles.length === 0;

  const demoEnabled = useDemoVehiclesEnabled();
  const demoVehicles: VehicleWithAge[] = demoEnabled
    ? demoVehiclesAt(now)
        .filter((vehicle) => !filter || vehicle.routeNumber === filter)
        .map((vehicle) => ({ ...vehicle, currentAge: 0 }))
    : [];
  const mapVehicles = [...vehicles, ...demoVehicles];
  const showDemoNotice = demoVehicles.length > 0;

  return (
    <section
      className={embedded ? "live-map-section live-map-embedded" : "live-map-section"}
      aria-labelledby={embedded ? undefined : "live-map-title"}
      aria-label={embedded ? t(language, "mapTitle") : undefined}
    >
      {!embedded ? (
        <div className="page-heading">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-line" aria-hidden="true" />
              {t(language, "mapSource")}
            </div>
            <h1 id="live-map-title">{t(language, "mapTitle")}</h1>
            <p>{t(language, "mapSubtitle")}</p>
          </div>
          <div className="live-counter" aria-live="polite">
            <span className="live-dot" aria-hidden="true" />
            {t(language, "mapLiveCount", { count: vehicles.length })}
          </div>
        </div>
      ) : null}

      {error ? (
        <Banner
          tone="warning"
          title={t(language, "mapErrorTitle")}
          action={
            <button
              type="button"
              className="button button-secondary button-small"
              onClick={refresh}
            >
              {t(language, "commonRetry")}
            </button>
          }
        >
          <p>{errorMessage || t(language, "mapErrorBody")}</p>
          {lastSuccess ? (
            <p>
              {t(language, "mapOfflineNotice", {
                time: formatTime(lastSuccess.toISOString(), language),
              })}
            </p>
          ) : null}
        </Banner>
      ) : null}

      <div
        className={
          embedded ? "live-map-card live-map-card-embedded" : "card live-map-card"
        }
      >
        {!embedded ? (
          <div className="map-toolbar">
            <label htmlFor="map-route-filter">{t(language, "mapFilter")}</label>
            <select
              id="map-route-filter"
              value={filter}
              onChange={(event) => changeFilter(event.target.value)}
            >
              <option value="">{t(language, "mapAllRoutes")}</option>
              {tempuRoutes.map((route) => (
                <option key={route.number} value={route.number}>
                  {t(language, "routeNumberLabel", { number: route.number })} —{" "}
                  {route.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="button button-secondary button-small"
              onClick={refresh}
              disabled={loading}
            >
              {loading ? t(language, "commonLoading") : t(language, "mapRefresh")}
            </button>
            <label className="demo-toggle">
              <input
                type="checkbox"
                checked={demoEnabled}
                onChange={(event) => setDemoVehiclesEnabled(event.target.checked)}
              />
              <span>{t(language, "demoToggle")}</span>
            </label>
            {hiddenCount > 0 ? (
              <span className="stale-hint">
                {t(language, "mapStaleHidden", { count: hiddenCount })}
              </span>
            ) : null}
          </div>
        ) : null}

        <div
          className={embedded ? "map-frame map-frame-embedded" : "map-frame"}
          role="region"
          aria-label={t(language, "mapTitle")}
        >
          <MapContainer
            center={CHATTOGRAM_CENTER}
            zoom={13}
            scrollWheelZoom
            className="live-map-canvas"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <KeepMapSized />
            {demoEnabled
              ? DEMO_ROUTE_LINES.filter((line) => !filter || line.routeNumber === filter).map(
                  (line) => (
                    <Polyline
                      key={line.routeNumber}
                      positions={line.points}
                      interactive={false}
                      pathOptions={{
                        className: "demo-route-line",
                        color: "#0F5C43",
                        weight: 6,
                        opacity: 0.5,
                        lineCap: "round",
                        lineJoin: "round",
                      }}
                    />
                  )
                )
              : null}
            <FollowVehicles vehicles={mapVehicles} filterKey={`${filter}:${demoEnabled}`} />
            {mapVehicles.map((vehicle) => (
              <Marker
                key={vehicle.publicId}
                position={[vehicle.latitude, vehicle.longitude]}
                icon={createVehicleIcon(
                  vehicle.routeNumber,
                  vehicleTypeOf(vehicle.vehicleType),
                  Boolean(vehicle.demo),
                  Boolean(vehicle.facingRight)
                )}
              >
                <Popup autoPanPaddingTopLeft={[16, embedded ? 16 : 96]}>
                  {vehicle.demo ? (
                    <>
                      <span className="popup-demo-tag">{t(language, "demoTag")}</span>
                      <br />
                    </>
                  ) : null}
                  <strong>
                    {t(language, "routeNumberLabel", {
                      number: vehicle.routeNumber,
                    })}{" "}
                    — {vehicle.routeName}
                  </strong>
                  <br />
                  {vehicle.direction === "outbound"
                    ? t(language, "directionOutbound")
                    : t(language, "directionReturn")}
                  : {vehicle.startStop} → {vehicle.endStop}
                  <br />
                  {t(language, VEHICLE_LABEL[vehicleTypeOf(vehicle.vehicleType)])}
                  <br />
                  {vehicle.demo ? (
                    <>
                      {vehicle.nextStop
                        ? t(language, "demoNextStop", { stop: vehicle.nextStop })
                        : t(language, "demoAtTerminal")}
                      <br />
                      <em>{t(language, "demoNotReal")}</em>
                    </>
                  ) : (
                    <>
                      {t(language, "mapLastUpdate")}:{" "}
                      {formatAge(vehicle.currentAge, language)}
                      <br />
                      {t(language, "mapSource")}
                      <br />
                      <em>{t(language, "mapNotVerified")}</em>
                    </>
                  )}
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {!embedded ? (
            <div className="map-live-chip" aria-live="polite">
              <span className="live-dot" aria-hidden="true" />
              {t(language, "mapLiveCount", { count: vehicles.length })}
              {showDemoNotice ? (
                <span className="map-live-chip-demo">
                  {t(language, "demoCount", { count: demoVehicles.length })}
                </span>
              ) : null}
            </div>
          ) : null}

          {showDemoNotice ? (
            <div className="map-demo-flag" role="note">
              {t(language, "demoMapFlag")}
            </div>
          ) : null}

          {showLoadingOverlay ? (
            <div className="map-status" role="status">
              <span className="map-status-spinner" aria-hidden="true" />
              <div>
                <strong>{t(language, "mapLoadingTitle")}</strong>
                <p>{t(language, "mapLoadingBody")}</p>
              </div>
            </div>
          ) : null}

          {showErrorOverlay ? (
            <div className="map-overlay">
              <div className="map-overlay-card">
                <span className="map-overlay-icon" aria-hidden="true">
                  ×
                </span>
                <strong>{t(language, "mapErrorTitle")}</strong>
                <p>{errorMessage || t(language, "mapErrorBody")}</p>
              </div>
            </div>
          ) : null}

          {(showEmptyOverlay || offlineAndStale) && !showDemoNotice ? (
            <div
              className={offlineAndStale ? "map-status map-status-warning" : "map-status"}
              role="status"
            >
              <TempuIcon size={44} />
              <div>
                <strong>
                  {offlineAndStale
                    ? t(language, "mapErrorTitle")
                    : t(language, "mapEmptyTitle")}
                </strong>
                <p>
                  {offlineAndStale
                    ? t(language, "mapErrorBody")
                    : t(language, "mapEmptyBody")}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <ul className="vehicle-legend" aria-label={t(language, "vehicleLegend")}>
          {VEHICLE_TYPES.map((type) => (
            <li key={type}>
              <VehicleIcon type={type} size={40} />
              {t(language, VEHICLE_LABEL[type])}
            </li>
          ))}
        </ul>

        <div className="map-footer">
          <p>{t(language, "mapPrivacy")}</p>
          <p>{t(language, "mapNotVerified")}</p>
          <span className="map-tile-note">{t(language, "mapTileNote")}</span>
        </div>
      </div>

      {!embedded ? (
        <section
          className="vehicle-list-section"
          aria-labelledby="vehicle-list-title"
        >
        <div className="results-heading">
          <h2 id="vehicle-list-title">{t(language, "mapVehicleList")}</h2>
          <span className="results-meta">
            {t(language, "mapListHint")}
          </span>
        </div>

        {mapVehicles.length === 0 ? (
          <p className="empty-list-text">
            {error
              ? t(language, "mapErrorBody")
              : t(language, "mapEmptyBody")}
          </p>
        ) : (
          <ul className="vehicle-list">
            {mapVehicles.map((vehicle) => (
              <li
                className={vehicle.demo ? "vehicle-item vehicle-item-demo" : "vehicle-item"}
                key={vehicle.publicId}
              >
                <div className="vehicle-item-header">
                  <VehicleIcon
                    type={vehicleTypeOf(vehicle.vehicleType)}
                    size={44}
                    className="vehicle-item-icon"
                  />
                  <span className="route-badge">{vehicle.routeNumber}</span>
                  <div className="vehicle-title">
                    <strong>{vehicle.routeName}</strong>
                    <span>
                      {t(language, VEHICLE_LABEL[vehicleTypeOf(vehicle.vehicleType)])} ·{" "}
                      {vehicle.direction === "outbound"
                        ? t(language, "directionOutbound")
                        : t(language, "directionReturn")}
                    </span>
                  </div>
                  <span className="vehicle-age">
                    {vehicle.demo
                      ? t(language, "demoTag")
                      : `${error ? `${t(language, "mapLastKnown")} · ` : ""}${formatAge(
                          vehicle.currentAge,
                          language
                        )}`}
                  </span>
                </div>
                <p className="vehicle-path">
                  {vehicle.startStop} → {vehicle.endStop}
                </p>
                {vehicle.demo ? (
                  <div className="vehicle-meta">
                    <span>
                      {vehicle.nextStop
                        ? t(language, "demoNextStop", { stop: vehicle.nextStop })
                        : t(language, "demoAtTerminal")}
                    </span>
                    <span>{t(language, "demoNotReal")}</span>
                  </div>
                ) : (
                <div className="vehicle-meta">
                  <span>
                    {t(language, "mapVehicleLabel", {
                      id: vehicle.publicId.slice(0, 6),
                    })}
                  </span>
                  {vehicle.accuracy !== null ? (
                    <span>
                      {t(language, "mapAccuracy")}:{" "}
                      {Math.round(vehicle.accuracy)} m
                    </span>
                  ) : null}
                  <span>{t(language, "mapSource")}</span>
                  <span>
                    {t(language, "mapLastUpdate")}:{" "}
                    {formatTime(vehicle.lastLocationAt, language)}
                  </span>
                </div>
                )}
              </li>
            ))}
          </ul>
        )}
        </section>
      ) : null}
    </section>
  );
}
