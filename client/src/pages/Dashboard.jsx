import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useTranslation } from "../hooks/useTranslation";

function Dashboard() {
  const { authFetch } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("bookings");
  const [profiles, setProfiles] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    authFetch("/api/v1/hosts/mine")
      .then((res) => {
        if (!res.ok)
          throw new Error(`Request failed with status ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (active) setProfiles(json);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [authFetch]);

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

      {activeTab === "bookings" && <p>{t("dashboard.bookings.empty")}</p>}

      {activeTab === "profiles" && (
        <div className="flex flex-col gap-3">
          {loading && <p>{t("common.loading")}</p>}
          {error && <p role="alert">{t("common.error")}</p>}
          {!loading && !error && profiles?.length === 0 && (
            <p>{t("dashboard.profiles.empty")}</p>
          )}
          {!loading && !error && profiles?.length > 0 && (
            <ul className="flex flex-col gap-3">
              {profiles.map((host) => (
                <li
                  key={host._id}
                  className="flex items-center justify-between gap-3"
                >
                  <Link to={`/hosts/${host._id}`}>
                    {host.displayName} — {host.city}
                  </Link>
                  <Link to={`/hosts/${host._id}/experiences/new`}>
                    {t("dashboard.profiles.addExperience")}
                  </Link>
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
