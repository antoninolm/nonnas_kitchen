import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useTranslation } from "../hooks/useTranslation";
import { apiErrorKey } from "../utils/apiError";
import AuthHeader from "../components/AuthHeader.jsx";

function Login() {
  const { login } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(location.state?.email ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    try {
      await login(email, password);
      const from = location.state?.from;
      navigate(from ? `${from.pathname}${from.search ?? ""}` : "/");
    } catch (err) {
      setError(
        t(
          apiErrorKey(err, {
            400: "auth.errors.missingFields",
            401: "auth.errors.invalidCredentials",
            defaultKey: "auth.errors.generic",
          }),
        ),
      );
    }
  }

  return (
    <section className="mx-auto w-full max-w-sm px-4 py-section-y">
      <AuthHeader
        titleKey="auth.login.title"
        subtitleKey="auth.login.subtitle"
      />
      <div className="rounded-card border border-dashed border-border bg-surface p-card shadow-card">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="form-label">
            {t("auth.login.email")}
            <input
              type="email"
              className="field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="form-label">
            {t("auth.login.password")}
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
            {t("auth.login.submit")}
          </button>
        </form>
      </div>
      <p className="mt-4 text-center text-sm">
        <Link to="/register" className="text-accent underline">
          {t("nav.register")}
        </Link>
      </p>
    </section>
  );
}

export default Login;
