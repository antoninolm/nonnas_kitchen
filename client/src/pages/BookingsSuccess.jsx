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
      <section className="mx-auto w-full max-w-sm px-4 py-section-y">
        <h1 className="mt-0 mb-1 text-center">{t("bookingsSuccess.title")}</h1>
        <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border bg-surface p-card text-center shadow-card">
          <p>{t("bookingsSuccess.loginRequired")}</p>
          <Link
            to="/login"
            state={{ from: location }}
            className="text-accent underline"
          >
            {t("nav.login")}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-sm px-4 py-section-y">
      <h1 className="mt-0 mb-1 text-center">{t("bookingsSuccess.title")}</h1>
      <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border bg-surface p-card text-center shadow-card">
        {status === "verifying" && <p>{t("common.loading")}</p>}
        {status === "success" && (
          <>
            <p>{t("bookingsSuccess.success")}</p>
            <Link to="/dashboard" className="btn-primary">
              {t("bookingsSuccess.dashboardLink")}
            </Link>
          </>
        )}
        {status === "error" && <p role="alert">{t("bookingsSuccess.error")}</p>}
      </div>
    </section>
  );
}

export default BookingsSuccess;
