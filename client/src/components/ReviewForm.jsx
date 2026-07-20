import { useState } from "react";
import StarRating from "./StarRating";
import { useAuth } from "../hooks/useAuth";
import { useTranslation } from "../hooks/useTranslation";
import { apiErrorKey } from "../utils/apiError";

function ReviewForm({ bookingId, onSubmitted }) {
  const { authFetchJSON } = useAuth();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!open) {
    return (
      <button
        type="button"
        className="btn-secondary"
        onClick={() => setOpen(true)}
      >
        {t("reviews.cta")}
      </button>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!rating) return;
    setSubmitting(true);
    setError(null);
    try {
      await authFetchJSON(`/api/v1/bookings/${bookingId}/review`, {
        method: "POST",
        body: JSON.stringify({ rating, text: text || undefined }),
      });
      onSubmitted();
    } catch (err) {
      setError(
        t(
          apiErrorKey(err, {
            defaultKey: "forms.errors.generic",
            409: "reviews.errors.alreadyReviewed",
          }),
        ),
      );
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t("reviews.ratingLabel")}</span>
        <StarRating value={rating} onChange={setRating} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t("reviews.textLabel")}</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={1000}
          rows={3}
          className="rounded-card border border-dashed border-border bg-surface p-2"
        />
      </label>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <button
        type="submit"
        className="btn-primary self-start"
        disabled={submitting || !rating}
      >
        {t("reviews.submit")}
      </button>
    </form>
  );
}

export default ReviewForm;
