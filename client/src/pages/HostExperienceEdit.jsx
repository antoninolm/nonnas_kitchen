import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useAuthFetch } from "../hooks/useAuthFetch";
import { useTranslation } from "../hooks/useTranslation";
import ExperienceFields from "../components/ExperienceFields.jsx";
import {
  emptyExperienceValues,
  toExperienceFormValues,
  buildExperienceUpdatePayload,
} from "../utils/experiencePayload";

function errorKey(status) {
  if (status === 400) return "forms.errors.missingFields";
  if (status === 403) return "forms.errors.forbidden";
  return "forms.errors.generic";
}

function HostExperienceEdit() {
  const { id, experienceId } = useParams();
  const { authFetchJSON } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const {
    data: experiences,
    loading,
    error: loadError,
  } = useAuthFetch(`/api/v1/hosts/${id}/experiences`);
  const experience = experiences?.find((e) => e._id === experienceId);

  const [values, setValues] = useState(emptyExperienceValues);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (experience) setValues(toExperienceFormValues(experience));
  }, [experience]);

  function handleChange(field, value) {
    setValues({ ...values, [field]: value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await authFetchJSON(`/api/v1/experiences/${experienceId}`, {
        method: "PATCH",
        body: JSON.stringify(buildExperienceUpdatePayload(values)),
      });
      navigate(`/hosts/${id}`);
    } catch (err) {
      setError(t(errorKey(err.status)));
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <section className="mx-auto max-w-sm p-4">
        <p>{t("common.loading")}</p>
      </section>
    );
  }

  if (loadError || !experience) {
    return (
      <section className="mx-auto max-w-sm p-4">
        <p role="alert">{t("common.error")}</p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-sm p-4">
      <h1 className="mb-4 text-xl font-semibold">
        {t("hostExperienceEdit.title")}
      </h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <ExperienceFields values={values} onChange={handleChange} />
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={submitting}>
          {t("hostExperienceEdit.submit")}
        </button>
      </form>
    </section>
  );
}

export default HostExperienceEdit;
