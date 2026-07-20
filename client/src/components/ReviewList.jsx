import { Link } from "react-router-dom";
import Avatar from "./Avatar";
import StarRating from "./StarRating";
import { useTranslation } from "../hooks/useTranslation";
import { formatDate } from "../utils/format";

function ReviewList({ reviews }) {
  const { lang, t } = useTranslation();

  if (!reviews.length) {
    return <p className="text-text-secondary">{t("reviews.empty")}</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {reviews.map((review) => (
        <li
          key={review._id}
          className="flex flex-col gap-1 rounded-card border border-dashed border-border bg-surface p-card shadow-card"
        >
          <Link
            to={`/users/${review.author?._id}`}
            className="flex w-fit items-center gap-2 no-underline hover:text-accent"
          >
            <Avatar
              src={review.author?.avatar}
              name={review.author?.name}
              size="sm"
            />
            <div>
              <p className="font-semibold">{review.author?.name}</p>
              <p className="text-sm text-text-secondary">
                {formatDate(review.createdAt, lang)}
              </p>
            </div>
          </Link>
          <StarRating value={review.rating} />
          {review.text && <p>{review.text}</p>}
        </li>
      ))}
    </ul>
  );
}

export default ReviewList;
