import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useAuthFetch } from "../hooks/useAuthFetch";
import { useTranslation } from "../hooks/useTranslation";
import { formatDate } from "../utils/format";

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
    <div className="mt-2 flex flex-col gap-2">
      <h3 className="font-semibold">{t("dashboard.profiles.experiences")}</h3>
      {loading && <p>{t("common.loading")}</p>}
      {error && <p role="alert">{t("common.error")}</p>}
      {actionError && <p role="alert">{actionError}</p>}
      {!loading && !error && experiences?.length === 0 && (
        <p>{t("dashboard.profiles.noExperiences")}</p>
      )}
      {!loading && !error && experiences?.length > 0 && (
        <ul className="flex flex-col gap-2">
          {experiences.map((experience) => (
            <li
              key={experience._id}
              className="flex flex-wrap items-center justify-between gap-3"
            >
              <span>
                {experience.title} — {formatDate(experience.date, lang)} —{" "}
                {t(`dashboard.profiles.status.${experience.status}`)} —{" "}
                {experience.seatsBooked}/{experience.seatsTotal}{" "}
                {t("dashboard.profiles.seatsCount")}
              </span>
              <span className="flex gap-2">
                <Link
                  to={`/hosts/${hostId}/experiences/${experience._id}/edit`}
                >
                  {t("dashboard.profiles.edit")}
                </Link>
                <button type="button" onClick={() => handleDelete(experience)}>
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
