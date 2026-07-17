import { Link } from "react-router-dom";
import { useTranslation } from "../hooks/useTranslation";
import { formatDate, formatPrice } from "../utils/format";

function ExperienceCard({ experience }) {
  const { lang, t } = useTranslation();
  const seatsLeft = experience.seatsTotal - experience.seatsBooked;

  return (
    <div
      className="flex flex-col overflow-hidden rounded-lg border"
      style={{ borderColor: "var(--border)" }}
    >
      <Link to={`/experiences/${experience._id}`}>
        {experience.photos?.[0] && (
          <img
            src={experience.photos[0]}
            alt=""
            className="h-40 w-full object-cover"
          />
        )}
        <div className="flex flex-col gap-1 p-3 pb-0">
          <h3 className="font-semibold">{experience.title}</h3>
          <p>{experience.recipeName}</p>
        </div>
      </Link>
      <div className="flex flex-col gap-1 p-3">
        {experience.host && (
          <p>
            <Link to={`/hosts/${experience.host._id}`}>
              {experience.host.displayName}
            </Link>{" "}
            — {experience.host.city}
          </p>
        )}
        <p>{formatDate(experience.date, lang)}</p>
        <p>{formatPrice(experience.price, lang)}</p>
        <p>
          {seatsLeft} {t("experiences.seatsLeft")}
        </p>
      </div>
    </div>
  );
}

export default ExperienceCard;
