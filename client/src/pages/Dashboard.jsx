import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useAuthFetch } from "../hooks/useAuthFetch";
import { useTranslation } from "../hooks/useTranslation";
import BookingCard from "../components/BookingCard.jsx";
import ReceivedBookingCard from "../components/ReceivedBookingCard.jsx";
import Avatar from "../components/Avatar.jsx";
import VerifiedBadge from "../components/VerifiedBadge.jsx";

function Dashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("bookings");
  const [bookingsSubTab, setBookingsSubTab] = useState("made");

  const {
    data: bookings,
    loading: bookingsLoading,
    error: bookingsError,
    refetch: refetchBookings,
  } = useAuthFetch("/api/v1/bookings/me");

  const {
    data: received,
    loading: receivedLoading,
    error: receivedError,
    refetch: refetchReceived,
  } = useAuthFetch("/api/v1/bookings/received");

  const {
    data: profiles,
    loading: profilesLoading,
    error: profilesError,
  } = useAuthFetch("/api/v1/hosts/mine");

  const tabClass = (tab) =>
    `-mb-px cursor-pointer rounded-t-card border border-dashed px-4 py-2 font-semibold ${
      activeTab === tab
        ? "border-border border-b-0 bg-surface text-accent"
        : "border-transparent bg-transparent text-text-secondary hover:text-accent"
    }`;

  const subTabClass = (tab) =>
    `cursor-pointer rounded-pill border border-dashed px-3 py-1 text-sm font-medium ${
      bookingsSubTab === tab
        ? "border-accent bg-accent-soft text-accent"
        : "border-border bg-transparent text-text-secondary hover:text-accent"
    }`;

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-section-y">
      <h1 className="mb-4">{t("dashboard.title")}</h1>

      <div
        role="tablist"
        className="mb-4 flex gap-2 border-b border-dashed border-border"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "bookings"}
          onClick={() => setActiveTab("bookings")}
          className={tabClass("bookings")}
        >
          {t("dashboard.tabs.bookings")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "profiles"}
          onClick={() => setActiveTab("profiles")}
          className={tabClass("profiles")}
        >
          {t("dashboard.tabs.profiles")}
        </button>
      </div>

      {activeTab === "bookings" && (
        <div className="flex flex-col gap-3">
          <div role="tablist" className="flex gap-2">
            <button
              type="button"
              role="tab"
              aria-selected={bookingsSubTab === "made"}
              onClick={() => setBookingsSubTab("made")}
              className={subTabClass("made")}
            >
              {t("dashboard.bookings.tabs.made")}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={bookingsSubTab === "received"}
              onClick={() => setBookingsSubTab("received")}
              className={subTabClass("received")}
            >
              {t("dashboard.bookings.tabs.received")}
            </button>
          </div>

          {bookingsSubTab === "made" && (
            <div className="flex flex-col gap-3">
              {bookingsLoading && (
                <p className="text-text-secondary">{t("common.loading")}</p>
              )}
              {bookingsError && (
                <p role="alert" className="font-medium text-accent">
                  {t("common.error")}
                </p>
              )}
              {!bookingsLoading && !bookingsError && bookings?.length === 0 && (
                <p className="text-text-secondary">
                  {t("dashboard.bookings.empty")}
                </p>
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

          {bookingsSubTab === "received" && (
            <div className="flex flex-col gap-3">
              {receivedLoading && (
                <p className="text-text-secondary">{t("common.loading")}</p>
              )}
              {receivedError && (
                <p role="alert" className="font-medium text-accent">
                  {t("common.error")}
                </p>
              )}
              {!receivedLoading && !receivedError && received?.length === 0 && (
                <p className="text-text-secondary">
                  {t("dashboard.profiles.noBookingRequests")}
                </p>
              )}
              {!receivedLoading && !receivedError && received?.length > 0 && (
                <ul className="flex flex-col gap-3">
                  {received.map((booking) => (
                    <ReceivedBookingCard
                      key={booking._id}
                      booking={booking}
                      onChange={refetchReceived}
                    />
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "profiles" && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 rounded-card border border-dashed border-border bg-surface p-card shadow-card">
            <Avatar src={user.avatar} name={user.name} size="lg" />
            <div className="min-w-0">
              <p className="m-0 text-sm text-text-secondary">
                {t("dashboard.profiles.personalTitle")}
              </p>
              <p className="m-0 font-semibold text-text-primary">{user.name}</p>
              <Link to="/profile" className="text-sm text-accent underline">
                {t("dashboard.profiles.personalLink")}
              </Link>
            </div>
          </div>

          {profilesLoading && (
            <p className="text-text-secondary">{t("common.loading")}</p>
          )}
          {profilesError && (
            <p role="alert" className="font-medium text-accent">
              {t("common.error")}
            </p>
          )}
          {!profilesLoading && !profilesError && profiles?.length === 0 && (
            <div className="flex flex-col items-center gap-4 rounded-card border border-dashed border-border bg-surface px-card py-section-y text-center shadow-card">
              <p>{t("dashboard.profiles.empty")}</p>
              <Link to="/hosts/new" className="btn-primary">
                {t("dashboard.profiles.emptyCta")}
              </Link>
            </div>
          )}
          {!profilesLoading && !profilesError && profiles?.length > 0 && (
            <>
              <ul className="flex flex-col gap-gap">
                {profiles.map((host) => (
                  <li key={host._id}>
                    <Link
                      to={`/dashboard/hosts/${host._id}`}
                      className="flex items-center gap-3 rounded-card border border-dashed border-border bg-surface p-card no-underline shadow-card transition-transform duration-150 hover:-translate-y-0.5"
                    >
                      <Avatar
                        src={host.photos?.[0]}
                        name={host.displayName}
                        size="lg"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="m-0 flex flex-wrap items-center gap-2 font-semibold text-text-primary">
                          {host.displayName}
                          {host.verified && <VerifiedBadge />}
                        </p>
                        <p className="m-0 text-sm text-text-secondary">
                          {host.city}
                          {host.neighborhood && ` — ${host.neighborhood}`}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-accent">
                        {t("dashboard.profiles.manage")} →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link to="/hosts/new" className="btn-secondary self-start">
                {t("dashboard.profiles.createNew")}
              </Link>
            </>
          )}
        </div>
      )}
    </section>
  );
}

export default Dashboard;
