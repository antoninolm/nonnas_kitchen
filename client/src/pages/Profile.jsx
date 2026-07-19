import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useTranslation } from "../hooks/useTranslation";
import { useAuthFetch } from "../hooks/useAuthFetch";
import {
  toProfileFormValues,
  buildProfilePayload,
} from "../utils/profilePayload";
import { apiErrorKey } from "../utils/apiError";

function Profile() {
  const { user, authFetchJSON, updateUser } = useAuth();
  const { t } = useTranslation();
  const {
    data: me,
    loading,
    error: loadError,
  } = useAuthFetch("/api/v1/users/me");

  const [values, setValues] = useState(null);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (me) setValues(toProfileFormValues(me));
  }, [me]);

  function setField(field) {
    return (e) => setValues({ ...values, [field]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSubmitting(true);

    try {
      const updated = await authFetchJSON("/api/v1/users/me", {
        method: "PATCH",
        body: JSON.stringify(buildProfilePayload(values)),
      });
      updateUser(updated);
      setSaved(true);
    } catch (err) {
      setError(t(apiErrorKey(err, { 400: "forms.errors.missingFields" })));
    } finally {
      setSubmitting(false);
    }
  }

  if (loadError) {
    return (
      <section className="mx-auto w-full max-w-sm px-4 py-section-y">
        <p className="form-error" role="alert">
          {t("common.error")}
        </p>
      </section>
    );
  }

  if (loading || !values) {
    return (
      <section className="mx-auto w-full max-w-sm px-4 py-section-y">
        <p className="text-text-secondary">{t("common.loading")}</p>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-sm px-4 py-section-y">
      <h1 className="mt-0 mb-4">{t("profile.title")}</h1>

      <div className="mb-4 flex items-center gap-3 rounded-card border border-dashed border-border bg-surface p-card shadow-card">
        {user.avatar ? (
          <img
            src={user.avatar}
            alt=""
            className="h-16 w-16 shrink-0 rounded-full border border-dashed border-border object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-dashed border-border bg-accent-soft text-2xl font-semibold text-accent"
          >
            {user.name?.charAt(0)?.toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="m-0 font-semibold text-text-primary">{user.name}</p>
          <p className="m-0 truncate text-sm text-text-secondary">
            {user.email}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 rounded-card border border-dashed border-border bg-surface p-card shadow-card">
          <label className="form-label">
            {t("profile.name")}
            <input
              type="text"
              className="field"
              value={values.name}
              onChange={setField("name")}
              required
            />
          </label>
          <label className="form-label">
            {t("profile.avatar")}
            <input
              type="text"
              className="field"
              value={values.avatar}
              onChange={setField("avatar")}
            />
          </label>

          <h2 className="mt-2 mb-0">{t("profile.interests")}</h2>
          <p className="m-0 text-sm text-text-secondary">
            {t("profile.interestsHint")}
          </p>
          <label className="form-label">
            {t("profile.city")}
            <input
              type="text"
              className="field"
              value={values.city}
              onChange={setField("city")}
            />
          </label>
          <label className="form-label">
            {t("profile.budget")}
            <input
              type="number"
              min="0"
              step="0.01"
              className="field"
              value={values.budget}
              onChange={setField("budget")}
            />
          </label>
          <label className="form-label">
            {t("profile.tags")}
            <input
              type="text"
              className="field"
              placeholder={t("profile.tagsHint")}
              value={values.tags}
              onChange={setField("tags")}
            />
          </label>
        </div>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {saved && (
          <p className="m-0 text-sm font-semibold text-success" role="status">
            {t("profile.saved")}
          </p>
        )}

        <button type="submit" className="btn-primary" disabled={submitting}>
          {t("profile.save")}
        </button>
      </form>
    </section>
  );
}

export default Profile;
