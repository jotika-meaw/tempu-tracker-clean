import { useState, type FormEvent, type ReactNode } from "react";
import { login } from "../api/client";
import type { AuthSession } from "../api/types";
import { t, type UiLanguage } from "../i18n";
import { describeApiError } from "../lib/errors";
import { DEMO_ACCOUNTS, type DemoAccount } from "../routes";
import { Banner } from "./Banner";
import { Icon } from "./Icon";
import { TempuIcon } from "./TempuIcon";

type LoginPageProps = {
  language: UiLanguage;
  languageSelect: ReactNode;
  onSignedIn: (session: AuthSession) => void;
};

export function LoginPage({ language, languageSelect, onSignedIn }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function signIn(name: string, secret: string) {
    setLoading(true);
    setError("");
    try {
      onSignedIn(await login(name.trim(), secret));
    } catch (loginError) {
      setError(describeApiError(loginError, language));
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!username.trim() || !password) {
      setError(t(language, "loginRequired"));
      return;
    }
    void signIn(username, password);
  }

  function signInWithDemo(account: DemoAccount) {
    setUsername(account.username);
    setPassword(account.password);
    void signIn(account.username, account.password);
  }

  return (
    <div className="login-shell">
      <header className="login-topbar">
        <div className="brand">
          <span className="brand-icon" aria-hidden="true">
            <TempuIcon size={30} />
          </span>
          <span>
            <strong>tempu</strong>
            <small>{t(language, "brandTagline")}</small>
          </span>
        </div>
        {languageSelect}
      </header>

      <main className="login-main" id="main-content">
        <section className="login-hero" aria-labelledby="login-hero-title">
          <h2 id="login-hero-title">{t(language, "loginHeroTitle")}</h2>
          <p>{t(language, "loginHeroBody")}</p>
          <ul>
            <li>
              <Icon name="route" size={18} /> {t(language, "loginHeroPoint1")}
            </li>
            <li>
              <Icon name="sparkles" size={18} /> {t(language, "loginHeroPoint2")}
            </li>
            <li>
              <Icon name="pulse" size={18} /> {t(language, "loginHeroPoint3")}
            </li>
          </ul>
          <div className="login-hero-art" aria-hidden="true">
            <span className="hero-road" />
            <TempuIcon size={190} className="hero-tempu" />
          </div>
        </section>

        <div className="login-panels">
        <section className="card login-card" aria-labelledby="login-title">
          <h1 id="login-title">{t(language, "loginTitle")}</h1>
          <p className="login-subtitle">{t(language, "loginSubtitle")}</p>

          <form className="login-form" onSubmit={handleSubmit}>
            <label className="trip-field">
              <span>{t(language, "loginUsername")}</span>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
              />
            </label>
            <label className="trip-field">
              <span>{t(language, "loginPassword")}</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              />
            </label>
            <button className="button button-primary" type="submit" disabled={loading}>
              {loading ? t(language, "loginSigningIn") : t(language, "loginSubmit")}
            </button>
          </form>

          {error ? (
            <Banner tone="danger" title={t(language, "loginFailedTitle")}>
              {error}
            </Banner>
          ) : null}
        </section>

        <section className="card login-demo" aria-labelledby="login-demo-title">
          <h2 id="login-demo-title">{t(language, "loginDemoTitle")}</h2>
          <p>{t(language, "loginDemoBody")}</p>

          <div className="login-demo-list">
            {DEMO_ACCOUNTS.map((account) => (
              <article className="login-demo-account" key={account.username}>
                <span className="login-demo-icon" aria-hidden="true">
                  <Icon name={account.role === "driver" ? "steering" : "user"} size={20} />
                </span>
                <h3>
                  {account.role === "driver"
                    ? t(language, "loginDemoDriver")
                    : t(language, "loginDemoPassenger")}
                </h3>
                <p className="login-demo-role">
                  {account.role === "driver"
                    ? t(language, "loginDemoDriverBody")
                    : t(language, "loginDemoPassengerBody")}
                </p>
                <dl>
                  <dt>{t(language, "loginUsername")}</dt>
                  <dd>
                    <code>{account.username}</code>
                  </dd>
                  <dt>{t(language, "loginPassword")}</dt>
                  <dd>
                    <code>{account.password}</code>
                  </dd>
                </dl>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => signInWithDemo(account)}
                  disabled={loading}
                >
                  {account.role === "driver"
                    ? t(language, "loginAsDriver")
                    : t(language, "loginAsPassenger")}{" "}
                  <span aria-hidden="true">→</span>
                </button>
              </article>
            ))}
          </div>

          <p className="assistant-footnote">{t(language, "loginDemoNote")}</p>
        </section>
        </div>
      </main>
    </div>
  );
}
