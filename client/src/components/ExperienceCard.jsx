import { Link } from "react-router-dom";
import { useTranslation } from "../hooks/useTranslation";
import { formatDate, formatPrice } from "../utils/format";

function ExperienceCard({ experience }) {
  const { lang, t } = useTranslation();
  const seatsLeft = experience.seatsTotal - experience.seatsBooked;

  return (
    <Link
      to={`/experiences/${experience._id}`}
      className="flex flex-col overflow-hidden rounded-lg border"
      style={{ borderColor: "var(--border)" }}
    >
      {experience.photos?.[0] && (
        <img
          src={experience.photos[0]}
          alt=""
          className="h-40 w-full object-cover"
        />
      )}
      <div className="flex flex-col gap-1 p-3">
        <h3 className="font-semibold">{experience.title}</h3>
        <p>{experience.recipeName}</p>
        {experience.host && (
          <p>
            {experience.host.displayName} — {experience.host.city}
          </p>
        )}
        <p>{formatDate(experience.date, lang)}</p>
        <p>{formatPrice(experience.price, lang)}</p>
        <p>
          {seatsLeft} {t("experiences.seatsLeft")}
        </p>
      </div>
    </Link>
  );
}

export default ExperienceCard;
