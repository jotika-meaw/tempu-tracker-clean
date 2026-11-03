import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import "./theme.css";
import { DriverPanel } from "./DriverPanel";
import { LiveMap } from "./LiveMap";
import { fetchHealth, setAuthRejectedHandler, setAuthToken } from "./api/client";
import type { AuthSession, HealthResponse } from "./api/types";
import { HealthBanner } from "./components/HealthBanner";
import { PassengerHome } from "./components/PassengerHome";
import { AssistantCard } from "./components/AssistantCard";
import { LoginPage } from "./components/LoginPage";
import { Icon, type IconName } from "./components/Icon";
import { TempuIcon } from "./components/TempuIcon";
import { t, type UiLanguage } from "./i18n";
import { clearSession, loadSession, saveSession } from "./lib/session";

type PassengerView = "explore" | "map" | "assistant";
type DriverView = "panel" | "map";

/** The hash a user asked for; which interface it opens depends on their role. */
type RouteState = {
  passengerView: PassengerView;
  driverView: DriverView;
};

const passengerNav: Array<{
  view: PassengerView;
  labelKey: "navSearch" | "navMap" | "navAssistant";
  icon: IconName;
}> = [
  { view: "explore", labelKey: "navSearch", icon: "search" },
  { view: "map", labelKey: "navMap", icon: "map" },
  { view: "assistant", labelKey: "navAssistant", icon: "sparkles" },
];

function routeFromHash(hash: string): RouteState {
  const normalized = hash.replace(/\/+$/, "");

  if (normalized === "#/map") {
    return { passengerView: "map", driverView: "map" };
  }
  if (normalized === "#/assistant") {
    return { passengerView: "assistant", driverView: "panel" };
  }

  // #/driver, #/explore and unknown hashes open each role's home view.
  return { passengerView: "explore", driverView: "panel" };
}

function getInitialSession(): AuthSession | null {
  const session = loadSession();
  // Set before the first render so child components' first requests carry it.
  setAuthToken(session?.token ?? null);
  return session;
}

function getInitialRoute(): RouteState {
  return routeFromHash(window.location.hash);
}

function getInitialLanguage(): UiLanguage {
  try {
    return window.localStorage.getItem("tempu-tracker.language") === "en"
      ? "en"
      : "bn";
  } catch {
    return "bn";
  }
}

function App() {
  const [route, setRoute] = useState<RouteState>(getInitialRoute);
  const [session, setSession] = useState<AuthSession | null>(getInitialSession);
  const [language, setLanguage] = useState<UiLanguage>(getInitialLanguage);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState(false);
  const [healthLoading, setHealthLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const mainRef = useRef<HTMLElement | null>(null);
  const firstViewRender = useRef(true);

  const { passengerView, driverView } = route;
  const role = session?.user.role ?? null;
  const isDriver = role === "driver";

  const signOut = useCallback(() => {
    setAuthToken(null);
    clearSession();
    setSession(null);
  }, []);

  function handleSignedIn(next: AuthSession) {
    setAuthToken(next.token);
    saveSession(next);
    setSession(next);
    const home = next.user.role === "driver" ? "#/driver" : "#/explore";
    if (window.location.hash !== home && window.location.hash !== "#/map") {
      window.history.replaceState(null, "", home);
      setRoute(routeFromHash(home));
    }
  }

  useEffect(() => {
    setAuthRejectedHandler(signOut);
    return () => setAuthRejectedHandler(null);
  }, [signOut]);

  const loadHealth = useCallback(async () => {
    try {
      const response = await fetchHealth();
      setHealth(response);
      setHealthError(false);
      setLastChecked(new Date());
    } catch {
      setHealthError(true);
    } finally {
      setHealthLoading(false);
    }
  }, []);

  function retryHealth() {
    setHealthLoading(true);
    void loadHealth();
  }

  useEffect(() => {
    // This async function only updates state after the network response; the
    // first paint is intentionally allowed to show the checking state.
    // eslint-disable-next-line react/set-state-in-effect
    void loadHealth();
    const intervalId = window.setInterval(() => void loadHealth(), 30_000);
    return () => window.clearInterval(intervalId);
  }, [loadHealth]);

  useEffect(() => {
    const syncRouteFromHash = () => {
      setRoute(routeFromHash(window.location.hash));
    };
    window.addEventListener("hashchange", syncRouteFromHash);
    window.addEventListener("popstate", syncRouteFromHash);
    return () => {
      window.removeEventListener("hashchange", syncRouteFromHash);
      window.removeEventListener("popstate", syncRouteFromHash);
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    try {
      window.localStorage.setItem("tempu-tracker.language", language);
    } catch {
      // Language persistence is optional.
    }
  }, [language]);

  useEffect(() => {
    if (firstViewRender.current) {
      firstViewRender.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: "auto" });
    mainRef.current?.focus({ preventScroll: true });
  }, [role, passengerView, driverView]);

  const viewLabel = isDriver
    ? t(language, "driverDashboard")
    : passengerView === "explore"
      ? t(language, "navSearch")
      : passengerView === "map"
        ? t(language, "navMap")
        : t(language, "navAssistant");

  const aiConfigured = health ? health.services.ai.configured : null;

  function navigatePassenger(nextView: PassengerView) {
    setRoute({ passengerView: nextView, driverView: "panel" });
    const nextHash = `#/${nextView}`;
    if (window.location.hash !== nextHash) {
      window.history.pushState(null, "", nextHash);
    }
  }

  function openDriverPanel() {
    setRoute({ passengerView: "explore", driverView: "panel" });
    if (window.location.hash !== "#/driver") {
      window.history.pushState(null, "", "#/driver");
    }
  }

  function openMapInNewTab() {
    // Keep this driver tab alive so the GPS watch is not unmounted.
    const mapUrl = `${window.location.origin}${window.location.pathname}#/map`;
    window.open(mapUrl, "_blank", "noopener,noreferrer");
  }

  const languageSelect = (
    <label className="language-select" htmlFor="ui-language">
      <span className="sr-only">{t(language, "language")}</span>
      <select
        id="ui-language"
        value={language}
        onChange={(event) => setLanguage(event.target.value as UiLanguage)}
      >
        <option value="bn">{t(language, "languageBangla")}</option>
        <option value="en">{t(language, "languageEnglish")}</option>
      </select>
    </label>
  );

  const signOutButton = (
    <button
      type="button"
      className="button button-secondary button-small sign-out-button"
      onClick={signOut}
      title={session ? t(language, "signedInAs", { name: session.user.displayName }) : undefined}
    >
      <Icon name="logout" size={16} />
      <span className="sign-out-label">{t(language, "signOut")}</span>
    </button>
  );

  if (!session) {
    return (
      <LoginPage
        language={language}
        languageSelect={languageSelect}
        onSignedIn={handleSignedIn}
      />
    );
  }

  if (isDriver) {
    return (
      <div className="driver-interface">
        <a className="skip-link" href="#main-content">
          {t(language, "skipToContent")}
        </a>

        <header className="driver-interface-topbar">
          <button
            type="button"
            className="brand"
            onClick={openDriverPanel}
            aria-label="Tempu Tracker home"
          >
            <span className="brand-icon" aria-hidden="true">
              <TempuIcon size={30} />
            </span>
            <span>
              <strong>tempu</strong>
              <small>{t(language, "brandTagline")}</small>
            </span>
          </button>

          <div className="driver-topbar-right">
            {languageSelect}
            <span className="city-label">
              <span className="city-dot" aria-hidden="true" />
              {t(language, "city")}
            </span>
            {signOutButton}
          </div>
        </header>

        <main
          className="driver-interface-main"
          id="main-content"
          ref={mainRef}
          tabIndex={-1}
        >
          <div className="driver-main-nav">
            {driverView === "map" ? (
              <button
                type="button"
                className="button button-secondary driver-back-button"
                onClick={openDriverPanel}
              >
                ← {t(language, "driverPanelNav")}
              </button>
            ) : (
              <button
                type="button"
                className="button button-secondary driver-back-button"
                onClick={openMapInNewTab}
              >
                <Icon name="map" size={17} /> {t(language, "driverMapNav")}{" "}
                <Icon name="external" size={15} />
              </button>
            )}
            <span className="driver-main-nav-label">
              {t(language, "signedInAs", { name: session.user.displayName })}
            </span>
          </div>

          <div className="driver-mode-banner" role="status">
            {t(language, "driverModeNotice")}
          </div>

          <HealthBanner
            health={health}
            loading={healthLoading}
            error={healthError}
            lastChecked={lastChecked}
            language={language}
            onRetry={retryHealth}
          />

          {driverView === "map" ? (
            <LiveMap language={language} />
          ) : (
            <DriverPanel language={language} onOpenMap={openMapInNewTab} />
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        {t(language, "skipToContent")}
      </a>

      <aside className="sidebar">
        <button
          type="button"
          className="brand"
          onClick={() => navigatePassenger("explore")}
          aria-label="Tempu Tracker home"
        >
          <span className="brand-icon" aria-hidden="true">
            <TempuIcon size={30} />
          </span>
          <span>
            <strong>tempu</strong>
            <small>{t(language, "brandTagline")}</small>
          </span>
        </button>

        <div className="sidebar-label">{t(language, "menuPassenger")}</div>
        <nav className="navigation" aria-label={t(language, "menuPassenger")}>
          {passengerNav.map((item) => (
            <button
              key={item.view}
              type="button"
              className={
                passengerView === item.view ? "nav-item active" : "nav-item"
              }
              aria-current={passengerView === item.view ? "page" : undefined}
              onClick={() => navigatePassenger(item.view)}
            >
              <span className="nav-icon" aria-hidden="true">
                <Icon name={item.icon} size={19} />
              </span>
              {t(language, item.labelKey)}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <span className="help-icon" aria-hidden="true">
              <Icon name="sparkles" size={18} />
            </span>
            <strong>{t(language, "helpTitle")}</strong>
            <p>{t(language, "helpBody")}</p>
            <button
              type="button"
              onClick={() => navigatePassenger("assistant")}
            >
              {t(language, "helpAction")} <span aria-hidden="true">→</span>
            </button>
          </div>

          <div className="sidebar-footer">
            <span className="footer-dot" aria-hidden="true" />
            <span>{t(language, "city")}</span>
          </div>
        </div>
      </aside>

      <main className="main-content" id="main-content" ref={mainRef} tabIndex={-1}>
        <header className="topbar">
          <div className="breadcrumb">
            <span>Tempu Tracker</span>
            <span className="breadcrumb-separator" aria-hidden="true">
              /
            </span>
            <strong>{viewLabel}</strong>
          </div>

          <div className="topbar-right">
            {languageSelect}
            <span className="city-label">
              <span className="city-dot" aria-hidden="true" />
              {t(language, "city")}
            </span>
            {signOutButton}
            <div
              className="avatar"
              title={t(language, "signedInAs", { name: session.user.displayName })}
              aria-hidden="true"
            >
              <Icon name="user" size={18} />
            </div>
          </div>
        </header>

        <div className="dashboard">
          <HealthBanner
            health={health}
            loading={healthLoading}
            error={healthError}
            lastChecked={lastChecked}
            language={language}
            onRetry={retryHealth}
          />

          {passengerView === "explore" ? (
            <PassengerHome
              language={language}
              aiConfigured={aiConfigured}
              onOpenMap={() => navigatePassenger("map")}
            />
          ) : null}
          {passengerView === "map" ? <LiveMap language={language} /> : null}
          {passengerView === "assistant" ? (
            <div className="assistant-page">
              <h1 className="sr-only">{t(language, "assistantTitle")}</h1>
              <div className="assistant-layout">
                <AssistantCard
                  language={language}
                  aiConfigured={aiConfigured}
                />
                <aside className="assistant-side">
                  <section
                    className="card side-card"
                    aria-labelledby="ai-how-title"
                  >
                    <h2 id="ai-how-title">
                      {t(language, "assistantSideTitle")}
                    </h2>
                    <p>{t(language, "assistantSideBody")}</p>
                    <ul className="plain-list">
                      <li>{t(language, "assistantLiveNote")}</li>
                      <li>{t(language, "privacyPoint4")}</li>
                    </ul>
                  </section>

                  <section
                    className="card side-card"
                    aria-labelledby="ai-status-title"
                  >
                    <h2 id="ai-status-title">
                      {t(language, "aiStatusTitle")}
                    </h2>
                    {health ? (
                      <>
                        <span
                          className={
                            health.services.ai.configured
                              ? "status-pill pill-ok"
                              : "status-pill pill-muted"
                          }
                        >
                          {health.services.ai.configured
                            ? t(language, "aiStatusOn")
                            : t(language, "aiStatusOff")}
                        </span>
                        <p>
                          {t(language, "assistantModel", {
                            model: health.services.ai.model,
                          })}
                        </p>
                        <p>
                          {health.services.ai.configured
                            ? t(language, "assistantDisclaimer")
                            : t(language, "assistantOffBody")}
                        </p>
                      </>
                    ) : (
                      <p>{t(language, "healthCheckingBody")}</p>
                    )}
                  </section>

                  <section
                    className="card side-card"
                    aria-labelledby="ai-safety-title"
                  >
                    <h2 id="ai-safety-title">
                      {t(language, "privacyTitle")}
                    </h2>
                    <p>{t(language, "privacyPoint1")}</p>
                    <p>{t(language, "mapNotVerified")}</p>
                  </section>
                </aside>
              </div>
            </div>
          ) : null}

          <footer className="page-footer">
            <div className="footer-main">
              <strong>Tempu Tracker</strong>
              <p>{t(language, "footerNote")}</p>
            </div>

            <details className="privacy-disclosure">
              <summary>{t(language, "privacyTitle")}</summary>
              <ul>
                <li>{t(language, "privacyPoint1")}</li>
                <li>{t(language, "privacyPoint2")}</li>
                <li>{t(language, "privacyPoint3")}</li>
                <li>{t(language, "privacyPoint4")}</li>
              </ul>
            </details>

            <div className="footer-meta">
              <span>{t(language, "city")}</span>
              <span>{t(language, "mapTileNote")}</span>
            </div>
          </footer>
        </div>
      </main>

      <nav className="bottom-tabs" aria-label={t(language, "menuPassenger")}>
        {passengerNav.map((item) => (
          <button
            key={item.view}
            type="button"
            className={passengerView === item.view ? "bottom-tab active" : "bottom-tab"}
            aria-current={passengerView === item.view ? "page" : undefined}
            onClick={() => navigatePassenger(item.view)}
          >
            <Icon name={item.icon} size={22} />
            <span>{t(language, item.labelKey)}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default App;
