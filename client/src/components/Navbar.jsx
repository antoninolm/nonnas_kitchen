import { Link } from "react-router-dom";
import { useTranslation } from "../hooks/useTranslation";
import { useAuth } from "../hooks/useAuth";

function Navbar() {
  const { lang, setLang, t } = useTranslation();
  const { user, logout } = useAuth();

  const langButton = (code) =>
    `rounded-pill px-3 py-1 text-sm cursor-pointer border-none ${
      lang === code
        ? "bg-accent-soft font-semibold text-accent"
        : "bg-transparent text-text-secondary hover:text-accent"
    }`;

  return (
    <nav className="flex items-center justify-between gap-gap border-b border-dashed border-border bg-surface px-section-x py-3">
      <Link
        to="/"
        className="font-display text-3xl font-bold text-accent no-underline"
      >
        {t("nav.brand")}
      </Link>
      <Link
        to="/experiences"
        className="text-text-primary no-underline hover:text-accent"
      >
        {t("nav.experiences")}
      </Link>
      <div className="flex items-center gap-3">
        {user ? (
          <>
            <span className="text-text-secondary">
              {t("nav.hi")}, {user.name}
            </span>
            <Link
              to="/dashboard"
              className="text-text-primary no-underline hover:text-accent"
            >
              {t("nav.dashboard")}
            </Link>
            <button type="button" onClick={logout} className="btn-secondary">
              {t("nav.logout")}
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="text-text-primary no-underline hover:text-accent"
            >
              {t("nav.login")}
            </Link>
            <Link to="/register" className="btn-primary">
              {t("nav.register")}
            </Link>
          </>
        )}
        <div
          role="group"
          aria-label={t("common.switchLanguage")}
          className="flex gap-1"
        >
          <button
            type="button"
            onClick={() => setLang("en")}
            aria-pressed={lang === "en"}
            className={langButton("en")}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLang("it")}
            aria-pressed={lang === "it"}
            className={langButton("it")}
          >
            IT
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
