import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useTranslation } from "../hooks/useTranslation";
import { formatDate } from "../utils/format";
import Avatar from "./Avatar.jsx";
import ReviewForm from "./ReviewForm.jsx";

const STATUS_BADGE = {
  pending: "bg-accent-soft text-accent",
  confirmed: "bg-success text-surface",
  cancelled: "border border-text-secondary text-text-secondary",
  completed: "border border-text-secondary text-text-secondary",
};

function ReceivedBookingCard({ booking, onChange }) {
  const { authFetchJSON } = useAuth();
  const { lang, t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleDecision(status) {
    setSubmitting(true);
    setError(null);
    try {
      await authFetchJSON(`/api/v1/bookings/${booking._id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      onChange();
    } catch {
      setError(t("forms.errors.generic"));
      setSubmitting(false);
    }
  }

  return (
    <li className="flex gap-3 rounded-card border border-dashed border-border p-3">
      <Link to={`/users/${booking.guest._id}`} className="shrink-0">
        <Avatar
          src={booking.guest.avatar}
          name={booking.guest.name}
          size="sm"
        />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Link
          to={`/users/${booking.guest._id}`}
          className="w-fit font-semibold no-underline hover:text-accent"
        >
          {booking.guest.name}
        </Link>
        <p className="text-sm text-text-secondary">
          {booking.experience.title} ·{" "}
          {formatDate(booking.experience.date, lang)} · {booking.seats}{" "}
          {t(
            booking.seats === 1
              ? "dashboard.bookings.seatsCount.one"
              : "dashboard.bookings.seatsCount.other",
          )}
        </p>

        <Link
          to={`/dashboard/hosts/${booking.experience.host._id}`}
          className="mt-1 flex w-fit items-center gap-2 no-underline hover:text-accent"
        >
          <Avatar
            src={booking.experience.host.photos?.[0]}
            name={booking.experience.host.displayName}
            size="sm"
          />
          <span className="text-sm">
            <span className="block text-xs uppercase text-text-secondary">
              {t("dashboard.bookings.receivedNonnaLabel")}
            </span>
            {booking.experience.host.displayName}
          </span>
        </Link>

        <p className="mt-1 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-pill px-3 py-1 text-sm font-medium ${STATUS_BADGE[booking.status]}`}
          >
            {t(`dashboard.bookings.status.${booking.status}`)}
          </span>
          {booking.status !== "cancelled" &&
            (booking.paid ? (
              <span className="text-sm font-medium text-success">
                {t("dashboard.bookings.paid")}
              </span>
            ) : (
              <span className="text-sm text-text-secondary">
                {t("dashboard.bookings.unpaid")}
              </span>
            ))}
        </p>

        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}

        {booking.status === "pending" && (
          <span className="mt-2 flex gap-3">
            <button
              type="button"
              className="btn-primary"
              disabled={submitting}
              onClick={() => handleDecision("confirmed")}
            >
              {t("dashboard.profiles.accept")}
            </button>
            <button
              type="button"
              className="btn-secondary"
              disabled={submitting}
              onClick={() => handleDecision("cancelled")}
            >
              {t("dashboard.profiles.decline")}
            </button>
          </span>
        )}
        {booking.reviewable && (
          <div className="mt-2">
            <ReviewForm bookingId={booking._id} onSubmitted={onChange} />
          </div>
        )}
      </div>
    </li>
  );
}

export default ReceivedBookingCard;
