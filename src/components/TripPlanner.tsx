import { useMemo, useState, type FormEvent } from "react";
import { t, type UiLanguage } from "../i18n";
import { allTripStops, planTrip, type TripPlan } from "../routes";
import { Banner } from "./Banner";
import { Icon } from "./Icon";
import { VehicleIcon } from "./TempuIcon";
import { approachingDemoVehicle, demoVehiclesAt, DEMO_ROUTE_NUMBERS } from "../lib/demoFleet";
import { useDemoVehiclesEnabled, useTickingNow } from "../lib/demoMode";
import { VEHICLE_LABEL, vehicleTypeOf } from "../lib/vehicles";

type TripPlannerProps = {
  language: UiLanguage;
};

export function TripPlanner({ language }: TripPlannerProps) {
  const stops = useMemo(() => allTripStops(), []);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [plan, setPlan] = useState<TripPlan | null>(null);
  const demoEnabled = useDemoVehiclesEnabled();
  const now = useTickingNow(demoEnabled && Boolean(plan?.ok), 2_000);
  const demoVehicles = demoEnabled && plan?.ok ? demoVehiclesAt(now) : [];

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!from.trim() || !to.trim()) return;
    setPlan(planTrip(from, to));
  }

  function pickSuggestion(stop: string) {
    if (plan && !plan.ok && plan.code === "UNKNOWN_FROM") setFrom(stop);
    else setTo(stop);
    setPlan(null);
  }

  return (
    <section className="card trip-card" aria-labelledby="trip-title">
      <div className="section-heading">
        <div className="heading-icon" aria-hidden="true">
          <Icon name="route" size={20} />
        </div>
        <div>
          <h2 id="trip-title">{t(language, "tripTitle")}</h2>
          <p>{t(language, "tripSubtitle")}</p>
        </div>
      </div>

      <form className="trip-form" onSubmit={handleSubmit}>
        <label className="trip-field">
          <span>{t(language, "tripFrom")}</span>
          <input
            list="trip-stop-list"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            placeholder="লালদীঘি"
            autoComplete="off"
            required
          />
        </label>
        <button
          className="button button-secondary button-small trip-swap"
          type="button"
          onClick={() => {
            setFrom(to);
            setTo(from);
            setPlan(null);
          }}
          aria-label={t(language, "tripSwap")}
        >
          ⇅
        </button>
        <label className="trip-field">
          <span>{t(language, "tripTo")}</span>
          <input
            list="trip-stop-list"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            placeholder="সিডিএ"
            autoComplete="off"
            required
          />
        </label>
        <button className="button button-primary" type="submit">
          {t(language, "tripPlan")} <span aria-hidden="true">→</span>
        </button>
        <datalist id="trip-stop-list">
          {stops.map((stop) => (
            <option key={stop} value={stop} />
          ))}
        </datalist>
      </form>

      <div aria-live="polite">
        {plan && !plan.ok ? (
          <Banner tone="warning" title={t(language, plan.code === "SAME_STOP" ? "tripSameStop" : plan.code === "NO_ROUTE" ? "tripNoRoute" : "tripUnknownStop")}>
            {plan.suggestions.length > 0 ? (
              <span className="trip-suggestions">
                {t(language, "tripDidYouMean")}{" "}
                {plan.suggestions.map((stop) => (
                  <button
                    key={stop}
                    type="button"
                    className="suggestion-chip"
                    onClick={() => pickSuggestion(stop)}
                  >
                    {stop}
                  </button>
                ))}
              </span>
            ) : null}
          </Banner>
        ) : null}

        {plan && plan.ok ? (
          <ol className="trip-options">
            {plan.options.map((option, optionIndex) => (
              <li className="trip-option" key={optionIndex}>
                <div className="trip-option-header">
                  <span className="badge">
                    {option.transfers === 0
                      ? t(language, "tripDirect")
                      : t(language, "tripChanges", { count: option.transfers })}
                  </span>
                  <span className="trip-option-meta">
                    {t(language, "tripStops", { count: option.hops })}
                  </span>
                </div>
                <ol className="trip-legs">
                  {option.legs.map((leg, legIndex) => (
                    <li key={`${leg.routeNumber}-${legIndex}`} className="trip-leg">
                      <span className="route-badge">{leg.routeNumber}</span>
                      <div>
                        <p>
                          {t(language, "tripRide", {
                            route: leg.routeNumber,
                            direction: t(language, leg.direction === "outbound" ? "tripOutbound" : "tripReturn"),
                            from: leg.boardStop,
                            to: leg.alightStop,
                          })}
                        </p>
                        <p className="trip-leg-stops">{leg.stops.join(" → ")}</p>
                        {demoEnabled && DEMO_ROUTE_NUMBERS.includes(leg.routeNumber)
                          ? (() => {
                              const coming = approachingDemoVehicle(
                                demoVehicles,
                                leg.routeNumber,
                                leg.direction,
                                leg.boardStop
                              );
                              if (!coming) {
                                return (
                                  <p className="trip-demo trip-demo-none">
                                    {t(language, "demoNoneApproaching")}
                                  </p>
                                );
                              }
                              const type = vehicleTypeOf(coming.vehicle.vehicleType);
                              const label = t(language, VEHICLE_LABEL[type]);
                              return (
                                <p className="trip-demo" aria-live="polite">
                                  <VehicleIcon type={type} size={34} />
                                  {coming.stopsAway === 0
                                    ? t(language, "demoAtBoarding", {
                                        vehicle: label,
                                        stop: leg.boardStop,
                                      })
                                    : t(language, "demoApproaching", {
                                        vehicle: label,
                                        count: coming.stopsAway,
                                      })}
                                </p>
                              );
                            })()
                          : null}
                        {leg.confidence === "partial" ? (
                          <p className="trip-leg-partial">{t(language, "tripPartial")}</p>
                        ) : null}
                        {legIndex < option.legs.length - 1 ? (
                          <p className="trip-change">
                            {t(language, "tripChangeAt", { stop: leg.alightStop })}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ol>
              </li>
            ))}
          </ol>
        ) : null}
      </div>

      <p className="assistant-footnote">{t(language, "tripNote")}</p>
    </section>
  );
}
