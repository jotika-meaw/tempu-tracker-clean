import type { HealthResponse } from "../api/types";
import { t, formatTime, type UiLanguage } from "../i18n";
import { Banner } from "./Banner";

type HealthBannerProps = {
  health: HealthResponse | null;
  loading: boolean;
  error: boolean;
  lastChecked: Date | null;
  language: UiLanguage;
  onRetry: () => void;
};

export function HealthBanner({
  health,
  loading,
  error,
  lastChecked,
  language,
  onRetry,
}: HealthBannerProps) {
  const retryButton = (
    <button type="button" className="button button-secondary button-small" onClick={onRetry}>
      {t(language, "healthRetry")}
    </button>
  );

  if (!health) {
    if (error) {
      return (
        <Banner tone="danger" title={t(language, "healthOfflineTitle")} action={retryButton}>
          {t(language, "healthOfflineBody")}
        </Banner>
      );
    }
    return (
      <Banner tone="info" title={t(language, "healthCheckingTitle")} compact>
        {t(language, "healthCheckingBody")}
      </Banner>
    );
  }

  const database = health.services.database;
  const ai = health.services.ai;
  const databaseUnavailable =
    database.mode === "unavailable" ||
    (database.mode === "mongodb" && !database.connected);

  const chips = (
    <div className="health-chips">
      <span className={`health-chip ${databaseUnavailable ? "chip-danger" : "chip-ok"}`}>
        {databaseUnavailable
          ? t(language, "healthDbUnavailable")
          : database.mode === "mongodb"
            ? t(language, "healthDbMongo")
            : t(language, "healthDbMemory")}
      </span>
      <span className={`health-chip ${ai.configured ? "chip-ok" : "chip-muted"}`}>
        {ai.configured ? t(language, "healthAiReady") : t(language, "healthAiOffChip")}
      </span>
      {lastChecked ? (
        <span className="health-checked">
          {t(language, "healthUpdated", {
            time: formatTime(lastChecked.toISOString(), language),
          })}
        </span>
      ) : null}
    </div>
  );

  if (databaseUnavailable) {
    return (
      <Banner tone="danger" title={t(language, "healthUnavailableTitle")} action={retryButton}>
        <p>{t(language, "healthUnavailableBody")}</p>
        {chips}
      </Banner>
    );
  }

  if (error) {
    return (
      <Banner tone="warning" title={t(language, "healthOfflineTitle")} action={retryButton}>
        <p>{t(language, "healthOfflineBody")}</p>
        {chips}
      </Banner>
    );
  }

  if (database.mode === "memory-fallback") {
    return (
      <Banner tone="warning" title={t(language, "healthFallbackTitle")}>
        <p>{t(language, "healthFallbackBody")}</p>
        {chips}
      </Banner>
    );
  }

  if (database.mode === "memory") {
    return (
      <Banner tone="warning" title={t(language, "healthMemoryTitle")}>
        <p>{t(language, "healthMemoryBody")}</p>
        {chips}
      </Banner>
    );
  }

  if (!ai.configured) {
    return (
      <Banner tone="warning" title={t(language, "healthAiOffTitle")}>
        <p>{t(language, "healthAiOffBody")}</p>
        {chips}
      </Banner>
    );
  }

  return (
    <div className="health-ok" role="status">
      <span className="health-ok-dot" aria-hidden="true" />
      <span>
        <strong>{t(language, "healthOkTitle")}</strong> — {t(language, "healthOkBody")}
      </span>
      {loading ? <span className="health-refreshing">{t(language, "commonLoading")}</span> : null}
    </div>
  );
}
