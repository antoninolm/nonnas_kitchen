import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useAuthFetch } from "../hooks/useAuthFetch";
import { useTranslation } from "../hooks/useTranslation";
import { formatDate } from "../utils/format";

function HostBookingRequests({ hostId }) {
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
    } catch {
      setActionError(t("forms.errors.generic"));
    }
  }

  return (
    <div className="mt-2 flex flex-col gap-2">
      <h3 className="font-semibold">
        {t("dashboard.profiles.bookingRequests")}
      </h3>
      {loading && <p>{t("common.loading")}</p>}
      {error && <p role="alert">{t("common.error")}</p>}
      {actionError && <p role="alert">{actionError}</p>}
      {!loading && !error && bookings?.length === 0 && (
        <p>{t("dashboard.profiles.noBookingRequests")}</p>
      )}
      {!loading && !error && bookings?.length > 0 && (
        <ul className="flex flex-col gap-2">
          {bookings.map((booking) => (
            <li
              key={booking._id}
              className="flex flex-wrap items-center justify-between gap-3"
            >
              <span>
                {booking.guest.name} — {booking.experience.title} —{" "}
                {formatDate(booking.experience.date, lang)} — {booking.seats}{" "}
                {t("dashboard.bookings.seatsCount")} —{" "}
                {booking.paid
                  ? t("dashboard.bookings.paid")
                  : t("dashboard.bookings.unpaid")}{" "}
                — {t(`dashboard.bookings.status.${booking.status}`)}
              </span>
              {booking.status === "pending" && (
                <span className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleDecision(booking._id, "confirmed")}
                  >
                    {t("dashboard.profiles.accept")}
                  </button>
                  <button
                    type="button"
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
