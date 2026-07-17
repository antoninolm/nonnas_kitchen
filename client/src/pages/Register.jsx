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
    <section className="mx-auto max-w-sm p-4">
      <h1 className="mb-4 text-xl font-semibold">{t("auth.register.title")}</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          {t("auth.register.name")}
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label className="flex flex-col gap-1">
          {t("auth.register.email")}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="flex flex-col gap-1">
          {t("auth.register.password")}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p role="alert">{error}</p>}
        <button type="submit">{t("auth.register.submit")}</button>
      </form>
      <p className="mt-3">
        <Link to="/login">{t("nav.login")}</Link>
      </p>
    </section>
  );
}

export default Register;
