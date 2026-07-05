import { useTranslation } from "../hooks/useTranslation";

function Navbar() {
  const { lang, setLang, t } = useTranslation();

  return (
    <nav className="flex items-center justify-between p-4">
      <span className="font-semibold">{t("nav.brand")}</span>
      <a href="/experiences">{t("nav.experiences")}</a>
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
    </nav>
  );
}

export default Navbar;
