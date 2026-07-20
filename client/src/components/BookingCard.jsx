import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useTranslation } from "../hooks/useTranslation";
import { formatDate, formatPrice } from "../utils/format";
import ReviewForm from "./ReviewForm.jsx";

const STATUS_BADGE = {
  pending: "bg-accent-soft text-accent",
  confirmed: "bg-success text-surface",
  cancelled: "border border-text-secondary text-text-secondary",
  completed: "border border-text-secondary text-text-secondary",
};

function BookingCard({ booking, onChange }) {
  const { authFetchJSON } = useAuth();
  const { lang, t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [address, setAddress] = useState(null);
  const [addressLoading, setAddressLoading] = useState(false);

  async function cancelBooking(confirmKey) {
    if (!window.confirm(t(confirmKey))) return;
    setSubmitting(true);
    setError(null);
    try {
      await authFetchJSON(`/api/v1/bookings/${booking._id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "cancelled" }),
      });
      onChange();
    } catch {
      setError(t("forms.errors.generic"));
      setSubmitting(false);
    }
  }

  async function handlePayNow() {
    setSubmitting(true);
    setError(null);
    try {
      const { url } = await authFetchJSON("/api/v1/payments/checkout-session", {
        method: "POST",
        body: JSON.stringify({ bookingId: booking._id }),
      });
      window.location.href = url;
    } catch {
      setError(t("forms.errors.generic"));
      setSubmitting(false);
    }
  }

  async function handleShowAddress() {
    setAddressLoading(true);
    setError(null);
    try {
      const data = await authFetchJSON(
        `/api/v1/bookings/${booking._id}/address`,
      );
      setAddress(data.address);
    } catch {
      setError(t("forms.errors.generic"));
    } finally {
      setAddressLoading(false);
    }
  }

  const total = booking.experience.price * booking.seats;

  return (
    <li className="flex flex-col gap-1 rounded-card border border-dashed border-border bg-surface p-card shadow-card">
      <p className="font-semibold">{booking.experience.title}</p>
      <p className="text-sm text-text-secondary">
        {formatDate(booking.experience.date, lang)}
      </p>
      <p className="text-sm text-text-secondary">
        {booking.seats}{" "}
        {t(
          booking.seats === 1
            ? "dashboard.bookings.seatsCount.one"
            : "dashboard.bookings.seatsCount.other",
        )}{" "}
        —{" "}
        {formatPrice(total, lang)}
      </p>
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

      <div className="mt-2 flex flex-wrap gap-3">
        {booking.status === "pending" && (
          <button
            type="button"
            className="btn-secondary"
            onClick={() => cancelBooking("dashboard.bookings.withdrawConfirm")}
            disabled={submitting}
          >
            {t("dashboard.bookings.withdraw")}
          </button>
        )}
        {booking.status === "confirmed" && !booking.paid && (
          <button
            type="button"
            className="btn-primary"
            onClick={handlePayNow}
            disabled={submitting}
          >
            {t("dashboard.bookings.payNow")}
          </button>
        )}
        {booking.status === "confirmed" && booking.paid && !address && (
          <button
            type="button"
            className="btn-primary"
            onClick={handleShowAddress}
            disabled={addressLoading}
          >
            {t("dashboard.bookings.showAddress")}
          </button>
        )}
        {booking.status === "confirmed" && (
          <button
            type="button"
            className="btn-secondary"
            onClick={() => cancelBooking("dashboard.bookings.cancelConfirm")}
            disabled={submitting}
          >
            {t("dashboard.bookings.cancel")}
          </button>
        )}
        {booking.reviewable && (
          <ReviewForm bookingId={booking._id} onSubmitted={onChange} />
        )}
      </div>

      {address && (
        <p className="mt-2 rounded-card bg-accent-soft p-card font-medium text-accent">
          {address}
        </p>
      )}
    </li>
  );
}

export default BookingCard;
