import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useAuthFetch } from "../hooks/useAuthFetch";
import { useTranslation } from "../hooks/useTranslation";
import { formatDate } from "../utils/format";

const STATUS_BADGE = {
  draft: "border border-text-secondary text-text-secondary",
  published: "bg-success text-surface",
  completed: "border border-text-secondary text-text-secondary",
  cancelled: "border border-text-secondary text-text-secondary",
};

function HostExperienceList({ hostId }) {
  const { authFetch } = useAuth();
  const { lang, t } = useTranslation();
  const {
    data: experiences,
    loading,
    error,
    refetch,
  } = useAuthFetch(`/api/v1/hosts/${hostId}/experiences`);
  const [actionError, setActionError] = useState(null);

  async function handleDelete(experience) {
    const confirmKey =
      experience.status === "draft"
        ? "dashboard.profiles.deleteConfirmDraft"
        : "dashboard.profiles.deleteConfirmPublished";
    if (!window.confirm(t(confirmKey))) return;

    setActionError(null);
    try {
      const res = await authFetch(`/api/v1/experiences/${experience._id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
      refetch();
    } catch {
      setActionError(t("forms.errors.generic"));
    }
  }

  return (
    <div className="mt-4 flex flex-col gap-2 border-t border-dashed border-border pt-4">
      <h3 className="font-semibold">{t("dashboard.profiles.experiences")}</h3>
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
      {!loading && !error && experiences?.length === 0 && (
        <p className="text-text-secondary">
          {t("dashboard.profiles.noExperiences")}
        </p>
      )}
      {!loading && !error && experiences?.length > 0 && (
        <ul className="flex flex-col divide-y divide-dashed divide-border">
          {experiences.map((experience) => (
            <li
              key={experience._id}
              className="flex flex-wrap items-center justify-between gap-3 py-2"
            >
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{experience.title}</span>
                <span className="text-sm text-text-secondary">
                  {formatDate(experience.date, lang)} · {experience.seatsBooked}
                  /{experience.seatsTotal} {t("dashboard.profiles.seatsCount")}
                </span>
                <span
                  className={`rounded-pill px-3 py-1 text-sm font-medium ${STATUS_BADGE[experience.status]}`}
                >
                  {t(`dashboard.profiles.status.${experience.status}`)}
                </span>
              </span>
              <span className="flex gap-2">
                <Link
                  to={`/hosts/${hostId}/experiences/${experience._id}/edit`}
                  className="btn-secondary"
                >
                  {t("dashboard.profiles.edit")}
                </Link>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => handleDelete(experience)}
                >
                  {t("dashboard.profiles.delete")}
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default HostExperienceList;
