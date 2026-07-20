import { useTranslation } from "../hooks/useTranslation";
import logo from "../assets/logo.png";

function AuthHeader({ titleKey, subtitleKey }) {
  const { t } = useTranslation();

  return (
    <>
      <img
        src={logo}
        alt=""
        className="mx-auto mb-3 block h-16 w-16 mix-blend-multiply"
      />
      <h1 className="mt-0 mb-1 text-center">{t(titleKey)}</h1>
      <p className="mb-6 text-center text-text-secondary">{t(subtitleKey)}</p>
    </>
  );
}

export default AuthHeader;
