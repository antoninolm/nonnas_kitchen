import { useTranslation } from "../hooks/useTranslation";

// The "signature" badge — one of the three allowed uses of Caveat
// (logo, page titles, verified-nonna badge).
function VerifiedBadge() {
  const { t } = useTranslation();

  return (
    <span className="inline-block rounded-pill bg-accent-soft px-3 py-0.5 font-display text-xl font-semibold leading-none text-accent">
      {t("experiences.detail.verified")}
    </span>
  );
}

export default VerifiedBadge;
