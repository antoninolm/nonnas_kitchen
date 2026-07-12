import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useTranslation } from "../hooks/useTranslation";

function errorKey(status) {
  if (status === 401) return "auth.errors.invalidCredentials";
  if (status === 400) return "auth.errors.missingFields";
  return "auth.errors.generic";
}

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
      setError(t(errorKey(err.status)));
    }
  }

  return (
    <section className="mx-auto max-w-sm p-4">
      <h1 className="mb-4 text-xl font-semibold">{t("auth.login.title")}</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          {t("auth.login.email")}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="flex flex-col gap-1">
          {t("auth.login.password")}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p role="alert">{error}</p>}
        <button type="submit">{t("auth.login.submit")}</button>
      </form>
      <p className="mt-3">
        <Link to="/register">{t("nav.register")}</Link>
      </p>
    </section>
  );
}

export default Login;
