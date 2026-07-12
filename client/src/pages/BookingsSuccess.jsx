import { useEffect, useState } from "react";
import { useSearchParams, useLocation, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useTranslation } from "../hooks/useTranslation";

function BookingsSuccess() {
  const { user, authFetchJSON } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("verifying");

  const sessionId = searchParams.get("session_id");
  const bookingId = searchParams.get("booking");

  useEffect(() => {
    if (!user) return;
    if (!sessionId || !bookingId) {
      setStatus("error");
      return;
    }

    let active = true;
    authFetchJSON("/api/v1/payments/verify", {
      method: "POST",
      body: JSON.stringify({ bookingId, sessionId }),
    })
      .then(() => {
        if (active) setStatus("success");
      })
      .catch(() => {
        if (active) setStatus("error");
      });

    return () => {
      active = false;
    };
  }, [user, authFetchJSON, sessionId, bookingId]);

  if (!user) {
    return (
      <section className="mx-auto max-w-sm p-4">
        <p>{t("bookingsSuccess.loginRequired")}</p>
        <Link to="/login" state={{ from: location }}>
          {t("nav.login")}
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-sm p-4">
      {status === "verifying" && <p>{t("common.loading")}</p>}
      {status === "success" && (
        <div>
          <p>{t("bookingsSuccess.success")}</p>
          <Link to="/dashboard">{t("bookingsSuccess.dashboardLink")}</Link>
        </div>
      )}
      {status === "error" && <p role="alert">{t("bookingsSuccess.error")}</p>}
    </section>
  );
}

export default BookingsSuccess;
