import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useTranslation } from "../hooks/useTranslation";
import ExperienceFields from "../components/ExperienceFields.jsx";
import {
  emptyExperienceValues,
  buildExperiencePayload,
} from "../utils/experiencePayload";

function errorKey(status) {
  if (status === 400) return "forms.errors.missingFields";
  if (status === 403) return "forms.errors.forbidden";
  return "forms.errors.generic";
}

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
      setError(t(errorKey(err.status)));
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-sm p-4">
      <h1 className="mb-4 text-xl font-semibold">{t("hostNew.title")}</h1>

      {step === 1 && (
        <form onSubmit={handleNext} className="flex flex-col gap-3">
          <h2 className="font-semibold">{t("hostNew.step1.heading")}</h2>
          <label className="flex flex-col gap-1">
            {t("hostNew.step1.displayName")}
            <input
              type="text"
              value={hostValues.displayName}
              onChange={setHostField("displayName")}
              required
            />
          </label>
          <label className="flex flex-col gap-1">
            {t("hostNew.step1.city")}
            <input
              type="text"
              value={hostValues.city}
              onChange={setHostField("city")}
              required
            />
          </label>
          <label className="flex flex-col gap-1">
            {t("hostNew.step1.bio")}
            <textarea value={hostValues.bio} onChange={setHostField("bio")} />
          </label>
          <label className="flex flex-col gap-1">
            {t("hostNew.step1.neighborhood")}
            <input
              type="text"
              value={hostValues.neighborhood}
              onChange={setHostField("neighborhood")}
            />
          </label>
          <label className="flex flex-col gap-1">
            {t("hostNew.step1.photo")}
            <input
              type="text"
              value={hostValues.photo}
              onChange={setHostField("photo")}
            />
          </label>
          <button type="submit">{t("hostNew.next")}</button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleFinish} className="flex flex-col gap-3">
          <h2 className="font-semibold">{t("hostNew.step2.heading")}</h2>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
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

          {error && <p role="alert">{error}</p>}

          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(1)}>
              {t("hostNew.back")}
            </button>
            <button type="submit" disabled={submitting}>
              {t("hostNew.finish")}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

export default HostNew;
