import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useTranslation } from "../hooks/useTranslation";
import { apiErrorKey } from "../utils/apiError";

function Register() {
  const { register } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError(t("auth.errors.passwordTooShort"));
      return;
    }

    try {
      await register(name, email, password);
      navigate("/login", { state: { email } });
    } catch (err) {
      setError(
        t(
          apiErrorKey(err, {
            400: "auth.errors.missingFields",
            409: "auth.errors.emailTaken",
            defaultKey: "auth.errors.generic",
          }),
        ),
      );
    }
  }

  return (
    <section className="mx-auto w-full max-w-sm px-4 py-section-y">
      <h1 className="mt-0 mb-1 text-center">{t("auth.register.title")}</h1>
      <p className="mb-6 text-center text-text-secondary">
        {t("auth.register.subtitle")}
      </p>
      <div className="rounded-card border border-dashed border-border bg-surface p-card shadow-card">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="form-label">
            {t("auth.register.name")}
            <input
              type="text"
              className="field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label className="form-label">
            {t("auth.register.email")}
            <input
              type="email"
              className="field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="form-label">
            {t("auth.register.password")}
            <input
              type="password"
              className="field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn-primary w-full">
            {t("auth.register.submit")}
          </button>
        </form>
      </div>
      <p className="mt-4 text-center text-sm">
        <Link to="/login" className="text-accent underline">
          {t("nav.login")}
        </Link>
      </p>
    </section>
  );
}

export default Register;
