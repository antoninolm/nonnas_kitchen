import { Link } from "react-router-dom";
import { useTranslation } from "../hooks/useTranslation";
import { useAuth } from "../hooks/useAuth";

function Navbar() {
  const { lang, setLang, t } = useTranslation();
  const { user, logout } = useAuth();

  return (
    <nav className="flex items-center justify-between p-4">
      <span className="font-semibold">{t("nav.brand")}</span>
      <Link to="/experiences">{t("nav.experiences")}</Link>
      <div className="flex items-center gap-3">
        {user ? (
          <>
            <span>
              {t("nav.hi")}, {user.name}
            </span>
            <Link to="/dashboard">{t("nav.dashboard")}</Link>
            <button type="button" onClick={logout}>
              {t("nav.logout")}
            </button>
          </>
        ) : (
          <>
            <Link to="/login">{t("nav.login")}</Link>
            <Link to="/register">{t("nav.register")}</Link>
          </>
        )}
        <div
          role="group"
          aria-label={t("common.switchLanguage")}
          className="flex gap-2"
        >
          <button
            type="button"
            onClick={() => setLang("en")}
            aria-pressed={lang === "en"}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLang("it")}
            aria-pressed={lang === "it"}
          >
            IT
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
