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
import { apiErrorKey } from "../utils/apiError";

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
      setError(
        t(
          apiErrorKey(err, {
            400: "forms.errors.missingFields",
            403: "forms.errors.forbidden",
          }),
        ),
      );
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
    <section className="mx-auto w-full max-w-sm px-4 py-section-y">
      <h1 className="mt-0 mb-4">{t("hostExperienceEdit.title")}</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="rounded-card border border-dashed border-border bg-surface p-card shadow-card">
          <ExperienceFields values={values} onChange={handleChange} />
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn-primary" disabled={submitting}>
          {t("hostExperienceEdit.submit")}
        </button>
      </form>
    </section>
  );
}

export default HostExperienceEdit;
