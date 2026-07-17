import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuthFetch } from "../hooks/useAuthFetch";
import { useTranslation } from "../hooks/useTranslation";
import BookingCard from "../components/BookingCard.jsx";
import HostBookingRequests from "../components/HostBookingRequests.jsx";
import HostExperienceList from "../components/HostExperienceList.jsx";

function Dashboard() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("bookings");

  const {
    data: bookings,
    loading: bookingsLoading,
    error: bookingsError,
    refetch: refetchBookings,
  } = useAuthFetch("/api/v1/bookings/me");

  const {
    data: profiles,
    loading: profilesLoading,
    error: profilesError,
  } = useAuthFetch("/api/v1/hosts/mine");

  return (
    <section className="mx-auto max-w-2xl p-4">
      <h1 className="mb-4 text-xl font-semibold">{t("dashboard.title")}</h1>

      <div className="mb-4 flex gap-3">
        <button type="button" onClick={() => setActiveTab("bookings")}>
          {t("dashboard.tabs.bookings")}
        </button>
        <button type="button" onClick={() => setActiveTab("profiles")}>
          {t("dashboard.tabs.profiles")}
        </button>
      </div>

      {activeTab === "bookings" && (
        <div className="flex flex-col gap-3">
          {bookingsLoading && <p>{t("common.loading")}</p>}
          {bookingsError && (
            <p role="alert">{t("common.error")}</p>
          )}
          {!bookingsLoading && !bookingsError && bookings?.length === 0 && (
            <p>{t("dashboard.bookings.empty")}</p>
          )}
          {!bookingsLoading && !bookingsError && bookings?.length > 0 && (
            <ul className="flex flex-col gap-3">
              {bookings.map((booking) => (
                <BookingCard
                  key={booking._id}
                  booking={booking}
                  onChange={refetchBookings}
                />
              ))}
            </ul>
          )}
        </div>
      )}

      {activeTab === "profiles" && (
        <div className="flex flex-col gap-3">
          {profilesLoading && <p>{t("common.loading")}</p>}
          {profilesError && <p role="alert">{t("common.error")}</p>}
          {!profilesLoading && !profilesError && profiles?.length === 0 && (
            <p>{t("dashboard.profiles.empty")}</p>
          )}
          {!profilesLoading && !profilesError && profiles?.length > 0 && (
            <ul className="flex flex-col gap-3">
              {profiles.map((host) => (
                <li key={host._id} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <Link to={`/hosts/${host._id}`}>
                      {host.displayName} — {host.city}
                    </Link>
                    <Link to={`/hosts/${host._id}/experiences/new`}>
                      {t("dashboard.profiles.addExperience")}
                    </Link>
                  </div>
                  <HostExperienceList hostId={host._id} />
                  <HostBookingRequests hostId={host._id} />
                </li>
              ))}
            </ul>
          )}
          <Link to="/hosts/new">{t("dashboard.profiles.createNew")}</Link>
        </div>
      )}
    </section>
  );
}

export default Dashboard;
