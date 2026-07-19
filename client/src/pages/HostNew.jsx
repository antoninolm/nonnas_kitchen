import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useTranslation } from "../hooks/useTranslation";
import ExperienceFields from "../components/ExperienceFields.jsx";
import {
  emptyExperienceValues,
  buildExperiencePayload,
} from "../utils/experiencePayload";
import { apiErrorKey } from "../utils/apiError";

function HostNew() {
  const { authFetchJSON } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [hostValues, setHostValues] = useState({
    displayName: "",
    city: "",
    bio: "",
    neighborhood: "",
    photo: "",
  });
  const [addExperience, setAddExperience] = useState(false);
  const [experienceValues, setExperienceValues] = useState(
    emptyExperienceValues,
  );

  function setHostField(field) {
    return (e) => setHostValues({ ...hostValues, [field]: e.target.value });
  }

  function setExperienceField(field, value) {
    setExperienceValues({ ...experienceValues, [field]: value });
  }

  function handleNext(e) {
    e.preventDefault();
    setStep(2);
  }

  async function handleFinish(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const host = await authFetchJSON("/api/v1/hosts", {
        method: "POST",
        body: JSON.stringify({
          displayName: hostValues.displayName,
          city: hostValues.city,
          bio: hostValues.bio || undefined,
          neighborhood: hostValues.neighborhood || undefined,
          photos: hostValues.photo ? [hostValues.photo] : [],
        }),
      });

      if (addExperience) {
        const experience = await authFetchJSON("/api/v1/experiences", {
          method: "POST",
          body: JSON.stringify(
            buildExperiencePayload(experienceValues, host._id),
          ),
        });
        await authFetchJSON(`/api/v1/experiences/${experience._id}`, {
          method: "PATCH",
          body: JSON.stringify({ status: "published" }),
        });
      }

      navigate(`/hosts/${host._id}`);
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
      <h1 className="mt-0 mb-4">{t("hostNew.title")}</h1>

      {step === 1 && (
        <form onSubmit={handleNext} className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-text-secondary">
            {t("hostNew.step1.label")}
          </p>
          <h2>{t("hostNew.step1.heading")}</h2>
          <div className="flex flex-col gap-3 rounded-card border border-dashed border-border bg-surface p-card shadow-card">
            <label className="form-label">
              {t("hostNew.step1.displayName")}
              <input
                type="text"
                className="field"
                value={hostValues.displayName}
                onChange={setHostField("displayName")}
                required
              />
            </label>
            <label className="form-label">
              {t("hostNew.step1.city")}
              <input
                type="text"
                className="field"
                value={hostValues.city}
                onChange={setHostField("city")}
                required
              />
            </label>
            <label className="form-label">
              {t("hostNew.step1.bio")}
              <textarea
                className="field min-h-24"
                value={hostValues.bio}
                onChange={setHostField("bio")}
              />
            </label>
            <label className="form-label">
              {t("hostNew.step1.neighborhood")}
              <input
                type="text"
                className="field"
                value={hostValues.neighborhood}
                onChange={setHostField("neighborhood")}
              />
            </label>
            <label className="form-label">
              {t("hostNew.step1.photo")}
              <input
                type="text"
                className="field"
                value={hostValues.photo}
                onChange={setHostField("photo")}
              />
            </label>
          </div>
          <button type="submit" className="btn-primary">
            {t("hostNew.next")}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleFinish} className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-text-secondary">
            {t("hostNew.step2.label")}
          </p>
          <h2>{t("hostNew.step2.heading")}</h2>
          <div className="flex flex-col gap-3 rounded-card border border-dashed border-border bg-surface p-card shadow-card">
            <label className="flex items-center gap-2 text-sm font-semibold text-text-secondary">
              <input
                type="checkbox"
                className="accent-accent"
                checked={addExperience}
                onChange={(e) => setAddExperience(e.target.checked)}
              />
              {t("hostNew.step2.addToggle")}
            </label>

            {addExperience && (
              <ExperienceFields
                values={experienceValues}
                onChange={setExperienceField}
              />
            )}
          </div>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setStep(1)}
            >
              {t("hostNew.back")}
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {t("hostNew.finish")}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

export default HostNew;
