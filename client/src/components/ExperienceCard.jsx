import { Link } from "react-router-dom";
import { useTranslation } from "../hooks/useTranslation";
import { formatDate, formatPrice } from "../utils/format";

function ExperienceCard({ experience }) {
  const { lang, t } = useTranslation();
  const seatsLeft = experience.seatsTotal - experience.seatsBooked;

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-card border border-dashed border-border bg-surface shadow-card transition-transform duration-150 hover:-translate-y-0.5">
      <Link to={`/experiences/${experience._id}`} className="no-underline">
        {experience.photos?.[0] && (
          <img
            src={experience.photos[0]}
            alt=""
            className="h-40 w-full border-b border-dashed border-border object-cover"
          />
        )}
        <div className="flex flex-col gap-1 p-card pb-0">
          <h3 className="font-semibold leading-snug text-text-primary group-hover:text-accent">
            {experience.title}
          </h3>
          <p className="text-sm italic text-text-secondary">
            {experience.recipeName}
          </p>
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-1 p-card">
        {experience.host && (
          <p className="text-sm text-text-secondary">
            <Link
              to={`/hosts/${experience.host._id}`}
              className="text-accent no-underline hover:underline"
            >
              {experience.host.displayName}
            </Link>{" "}
            — {experience.host.city}
          </p>
        )}
        <p className="text-sm text-text-secondary">
          {formatDate(experience.date, lang)}
        </p>
        <div className="mt-auto flex items-baseline justify-between pt-2">
          <p className="font-semibold">{formatPrice(experience.price, lang)}</p>
          <p className="text-sm font-medium text-success">
            {seatsLeft}{" "}
            {t(
              seatsLeft === 1
                ? "experiences.seatsLeft.one"
                : "experiences.seatsLeft.other",
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

export default ExperienceCard;
