import { tempuRoutes } from "../routes";
import { t, type UiLanguage } from "../i18n";
import { routeDisplayName } from "../lib/placeNames";
import { DirectionStops } from "./DirectionStops";

export function RouteDirectory({ language }: { language: UiLanguage }) {
  return (
    <section className="route-directory" aria-labelledby="all-routes-title">
      <div className="section-heading">
        <div className="heading-icon" aria-hidden="true">
          ≡
        </div>
        <div>
          <h2 id="all-routes-title">{t(language, "allRoutesTitle")}</h2>
          <p>{t(language, "allRoutesHint")}</p>
        </div>
      </div>

      <div className="route-directory-grid">
        {tempuRoutes.map((route) => (
          <details className="route-directory-item" key={route.number}>
            <summary>
              <span className="route-badge">{route.number}</span>
              <span className="route-summary-name">
                {routeDisplayName(route.name, language)}
              </span>
              <span className="route-summary-count">
                {t(language, "routeStopsCount", {
                  count: route.outbound.stops.length,
                })}
              </span>
              <span className="route-summary-chevron" aria-hidden="true">
                +
              </span>
            </summary>
            <div className="route-directory-body">
              <DirectionStops
                route={route}
                direction="outbound"
                language={language}
                compact
              />
              <DirectionStops
                route={route}
                direction="return"
                language={language}
                compact
              />
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
