import { Link } from "react-router-dom";
import { useTranslation } from "../hooks/useTranslation";
import { useAuth } from "../hooks/useAuth";
import logo from "../assets/logo.png";

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
    <nav className="flex flex-wrap items-center justify-between gap-x-gap gap-y-2 border-b border-dashed border-border bg-surface px-4 py-3 sm:px-section-x">
      <Link
        to="/"
        className="flex items-center gap-2 font-display text-3xl font-bold text-accent no-underline"
      >
        <img src={logo} alt="" className="h-8 w-8" />
        {t("nav.brand")}
      </Link>
      <Link
        to="/experiences"
        className="text-text-primary no-underline hover:text-accent"
      >
        {t("nav.experiences")}
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        {user ? (
          <>
            <Link
              to="/profile"
              className="text-text-secondary no-underline hover:text-accent"
            >
              {t("nav.hi")}, {user.name}
            </Link>
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
