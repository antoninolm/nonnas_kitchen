import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { useTranslation } from "../hooks/useTranslation";
import { useAuth } from "../hooks/useAuth";
import { formatDate, formatPrice } from "../utils/format";

function ExperienceDetail() {
  const { id } = useParams();
  const { lang, t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showComingSoon, setShowComingSoon] = useState(false);

  const {
    data: experience,
    loading,
    error,
  } = useFetch(`/api/v1/experiences/${id}`);

  function handleBook() {
    if (!user) {
      navigate("/login", { state: { from: location } });
      return;
    }
    setShowComingSoon(true);
  }

  if (loading) return <p className="p-4">{t("common.loading")}</p>;
  if (error)
    return (
      <p className="p-4" role="alert">
        {t("common.error")}
      </p>
    );
  if (!experience) return null;

  const seatsLeft = experience.seatsTotal - experience.seatsBooked;

  return (
    <section className="mx-auto max-w-2xl p-4">
      {experience.photos?.[0] && (
        <img
          src={experience.photos[0]}
          alt=""
          className="mb-4 h-64 w-full rounded-lg object-cover"
        />
      )}
      <h1 className="text-2xl font-semibold">{experience.title}</h1>
      <p className="mb-2">{experience.recipeName}</p>

      {experience.host && (
        <p className="mb-2">
          {experience.host.displayName} — {experience.host.city}
          {experience.host.verified && (
            <> · {t("experiences.detail.verified")}</>
          )}
        </p>
      )}

      <p>{formatDate(experience.date, lang)}</p>
      <p>{formatPrice(experience.price, lang)}</p>
      <p>
        {seatsLeft} {t("experiences.seatsLeft")}
      </p>

      {experience.tags?.length > 0 && (
        <p className="mt-2">{experience.tags.join(", ")}</p>
      )}

      {experience.story && <p className="mt-4">{experience.story}</p>}

      <button type="button" className="mt-6" onClick={handleBook}>
        {t("experiences.detail.book")}
      </button>
      {showComingSoon && (
        <p className="mt-2">{t("experiences.detail.bookComingSoon")}</p>
      )}
    </section>
  );
}

export default ExperienceDetail;
