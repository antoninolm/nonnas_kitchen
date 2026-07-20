import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useTranslation } from "../hooks/useTranslation";
import ExperienceFields from "../components/ExperienceFields.jsx";
import {
  emptyExperienceValues,
  buildExperiencePayload,
} from "../utils/experiencePayload";
import { apiErrorKey } from "../utils/apiError";

function HostExperienceNew() {
  const { id } = useParams();
  const { authFetchJSON } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [values, setValues] = useState(emptyExperienceValues);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(field, value) {
    setValues({ ...values, [field]: value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const experience = await authFetchJSON("/api/v1/experiences", {
        method: "POST",
        body: JSON.stringify(buildExperiencePayload(values, id)),
      });
      await authFetchJSON(`/api/v1/experiences/${experience._id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "published" }),
      });
      navigate(`/dashboard/hosts/${id}`);
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

  return (
    <section className="mx-auto w-full max-w-sm px-4 py-section-y">
      <h1 className="mt-0 mb-4">{t("hostExperienceNew.title")}</h1>
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
          {t("hostExperienceNew.submit")}
        </button>
      </form>
    </section>
  );
}

export default HostExperienceNew;
