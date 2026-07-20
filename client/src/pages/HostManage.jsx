import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuthFetch } from "../hooks/useAuthFetch";
import { useTranslation } from "../hooks/useTranslation";
import HostExperienceList from "../components/HostExperienceList.jsx";
import HostBookingRequests from "../components/HostBookingRequests.jsx";
import VerifiedBadge from "../components/VerifiedBadge.jsx";

function HostManage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const [refreshKey, setRefreshKey] = useState(0);

  // The manager check is by ownership, not by role: this fetch only returns
  // hosts the user manages, so a missing id means "not yours" (or not there).
  // The API enforces the same rule again with 403s — this gate is UX only.
  const { data: profiles, loading, error } = useAuthFetch("/api/v1/hosts/mine");
  const host = profiles?.find((h) => h._id === id);

  if (loading) {
    return (
      <section className="mx-auto w-full max-w-3xl px-4 py-section-y">
        <p className="text-text-secondary">{t("common.loading")}</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mx-auto w-full max-w-3xl px-4 py-section-y">
        <p role="alert" className="font-medium text-accent">
          {t("common.error")}
        </p>
      </section>
    );
  }

  if (!host) {
    return (
      <section className="mx-auto w-full max-w-3xl px-4 py-section-y">
        <div className="flex flex-col items-center gap-4 rounded-card border border-dashed border-border bg-surface px-card py-section-y text-center shadow-card">
          <p>{t("dashboard.host.notFound")}</p>
          <Link to="/dashboard" className="btn-secondary">
            {t("dashboard.host.back")}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-section-y">
      <Link
        to="/dashboard"
        className="text-sm text-text-secondary no-underline hover:text-accent"
      >
        ← {t("dashboard.host.back")}
      </Link>

      {host.photos?.[0] && (
        <img
          src={host.photos[0]}
          alt=""
          className="mt-4 mb-4 h-48 w-full rounded-card border border-dashed border-border object-cover shadow-card sm:h-64"
        />
      )}
      <h1 className="mt-4 mb-0">{host.displayName}</h1>
      <p className="mb-4 flex flex-wrap items-center gap-2 text-text-secondary">
        {host.city}
        {host.neighborhood && ` — ${host.neighborhood}`}
        {host.verified && <VerifiedBadge />}
      </p>

      <Link to={`/hosts/${id}/experiences/new`} className="btn-secondary">
        {t("dashboard.profiles.addExperience")}
      </Link>

      <div className="mt-4 rounded-card border border-dashed border-border bg-surface p-card shadow-card">
        <HostExperienceList key={`${id}-${refreshKey}`} hostId={id} />
        <HostBookingRequests
          hostId={id}
          onChange={() => setRefreshKey((k) => k + 1)}
        />
      </div>
    </section>
  );
}

export default HostManage;
