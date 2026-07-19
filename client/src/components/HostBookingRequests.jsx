import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useAuthFetch } from "../hooks/useAuthFetch";
import { useTranslation } from "../hooks/useTranslation";
import { formatDate } from "../utils/format";

const STATUS_BADGE = {
  pending: "bg-accent-soft text-accent",
  confirmed: "bg-success text-surface",
  cancelled: "border border-text-secondary text-text-secondary",
  completed: "border border-text-secondary text-text-secondary",
};

function HostBookingRequests({ hostId, onChange = () => {} }) {
  const { authFetchJSON } = useAuth();
  const { lang, t } = useTranslation();
  const {
    data: bookings,
    loading,
    error,
    refetch,
  } = useAuthFetch(`/api/v1/hosts/${hostId}/bookings`);
  const [actionError, setActionError] = useState(null);

  async function handleDecision(bookingId, status) {
    setActionError(null);
    try {
      await authFetchJSON(`/api/v1/bookings/${bookingId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      refetch();
      onChange();
    } catch {
      setActionError(t("forms.errors.generic"));
    }
  }

  return (
    <div className="mt-4 flex flex-col gap-2 border-t border-dashed border-border pt-4">
      <h3 className="font-semibold">
        {t("dashboard.profiles.bookingRequests")}
      </h3>
      {loading && <p className="text-text-secondary">{t("common.loading")}</p>}
      {error && (
        <p role="alert" className="form-error">
          {t("common.error")}
        </p>
      )}
      {actionError && (
        <p role="alert" className="form-error">
          {actionError}
        </p>
      )}
      {!loading && !error && bookings?.length === 0 && (
        <p className="text-text-secondary">
          {t("dashboard.profiles.noBookingRequests")}
        </p>
      )}
      {!loading && !error && bookings?.length > 0 && (
        <ul className="flex flex-col gap-2">
          {bookings.map((booking) => (
            <li
              key={booking._id}
              className="flex flex-col gap-1 rounded-card border border-dashed border-border p-3"
            >
              <p className="font-semibold">{booking.guest.name}</p>
              <p className="text-sm text-text-secondary">
                {booking.experience.title} ·{" "}
                {formatDate(booking.experience.date, lang)} · {booking.seats}{" "}
                {t(
                  booking.seats === 1
                    ? "dashboard.bookings.seatsCount.one"
                    : "dashboard.bookings.seatsCount.other",
                )}
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-pill px-3 py-1 text-sm font-medium ${STATUS_BADGE[booking.status]}`}
                >
                  {t(`dashboard.bookings.status.${booking.status}`)}
                </span>
                {booking.paid ? (
                  <span className="text-sm font-medium text-success">
                    {t("dashboard.bookings.paid")}
                  </span>
                ) : (
                  <span className="text-sm text-text-secondary">
                    {t("dashboard.bookings.unpaid")}
                  </span>
                )}
              </p>
              {booking.status === "pending" && (
                <span className="mt-2 flex gap-3">
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => handleDecision(booking._id, "confirmed")}
                  >
                    {t("dashboard.profiles.accept")}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => handleDecision(booking._id, "cancelled")}
                  >
                    {t("dashboard.profiles.decline")}
                  </button>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default HostBookingRequests;
