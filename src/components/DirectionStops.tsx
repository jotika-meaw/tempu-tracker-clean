import { getDirectionData, type Direction, type TempuRoute } from "../routes";
import { t, type UiLanguage } from "../i18n";
import { placeName, routeNote } from "../lib/placeNames";

type DirectionStopsProps = {
  route: TempuRoute;
  direction: Direction;
  matchedIndices?: number[];
  language: UiLanguage;
  compact?: boolean;
};

export function DirectionStops({
  route,
  direction,
  matchedIndices = [],
  language,
  compact = false,
}: DirectionStopsProps) {
  const data = getDirectionData(route, direction);
  const matched = new Set(matchedIndices);
  const label =
    direction === "outbound"
      ? t(language, "directionOutbound")
      : t(language, "directionReturn");

  return (
    <div className={`direction-block${compact ? " direction-compact" : ""}`}>
      <div className="direction-heading">
        <span className="direction-label">{label}</span>
        <span className="direction-count">
          {t(language, "routeStopsCount", { count: data.stops.length })}
        </span>
        {data.confidence === "partial" ? (
          <span className="badge badge-warning">{t(language, "confidencePartial")}</span>
        ) : (
          <span className="badge badge-ok">{t(language, "confidenceVerified")}</span>
        )}
      </div>

      <div className="stop-trail" role="list" aria-label={`${route.number} ${label}`}>
        {data.stops.map((stop, index) => (
          <span className="stop-trail-item" role="listitem" key={`${index}-${stop}`}>
            {index > 0 ? (
              <span className="stop-arrow" aria-hidden="true">
                →
              </span>
            ) : null}
            <span className={`stop-chip${matched.has(index) ? " stop-chip-matched" : ""}`}>
              {placeName(stop, language)}
            </span>
          </span>
        ))}
      </div>

      {data.via?.length ? (
        <p className="direction-note">
          <strong>{t(language, "viaRoads")}:</strong> {data.via.map((road) => placeName(road, language)).join(", ")}
        </p>
      ) : null}

      {data.note ? (
        <p className="direction-note">
          <strong>{t(language, "commonNote")}:</strong> {routeNote(data.note, language)}
        </p>
      ) : null}
    </div>
  );
}
