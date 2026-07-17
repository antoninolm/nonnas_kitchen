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

  return (
    <section className="mx-auto max-w-sm p-4">
      <h1 className="mb-4 text-xl font-semibold">
        {t("hostExperienceNew.title")}
      </h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <ExperienceFields values={values} onChange={handleChange} />
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={submitting}>
          {t("hostExperienceNew.submit")}
        </button>
      </form>
    </section>
  );
}

export default HostExperienceNew;
