import { useState } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { useTranslation } from "../hooks/useTranslation";
import { useAuth } from "../hooks/useAuth";
import { formatDate, formatPrice } from "../utils/format";
import { apiErrorKey } from "../utils/apiError";
import VerifiedBadge from "../components/VerifiedBadge.jsx";

// Local field style (not a global class: forms/auth/dashboard keep
// their own styling until their restyle task).
const fieldClass =
  "rounded-card border border-border bg-background px-3 py-2 font-body text-base text-text-primary focus:border-accent focus:outline-none";

function ExperienceDetail() {
  const { id } = useParams();
  const { lang, t } = useTranslation();
  const { user, authFetchJSON } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showForm, setShowForm] = useState(false);
  const [seats, setSeats] = useState(1);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [requestError, setRequestError] = useState(null);
  const [success, setSuccess] = useState(false);

  const {
    data: experience,
    loading,
    error,
    refetch,
  } = useFetch(`/api/v1/experiences/${id}`);

  function handleBook() {
    if (!user) {
      navigate("/login", { state: { from: location } });
      return;
    }
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setRequestError(null);
    setSubmitting(true);

    try {
      await authFetchJSON("/api/v1/bookings", {
        method: "POST",
        body: JSON.stringify({ experience: experience._id, seats, message }),
      });
      setSuccess(true);
      refetch();
    } catch (err) {
      setRequestError(
        t(
          apiErrorKey(err, {
            400: "experiences.detail.errors.missingMessage",
            403: "experiences.detail.errors.ownHost",
            409: (e) =>
              e.message?.includes("already have a booking")
                ? "experiences.detail.errors.duplicate"
                : "experiences.detail.errors.soldOut",
          }),
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading)
    return <p className="p-4 text-text-secondary">{t("common.loading")}</p>;
  if (error)
    return (
      <p className="p-4 font-medium text-accent" role="alert">
        {t("common.error")}
      </p>
    );
  if (!experience) return null;

  const seatsLeft = experience.seatsTotal - experience.seatsBooked;

  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-section-y">
      {experience.photos?.[0] && (
        <img
          src={experience.photos[0]}
          alt=""
          className="mb-4 h-64 w-full rounded-card border border-dashed border-border object-cover shadow-card sm:h-80"
        />
      )}
      <h1 className="my-0">{experience.title}</h1>
      <p className="mb-3 text-lg italic text-text-secondary">
        {experience.recipeName}
      </p>

      {experience.host && (
        <p className="mb-2 flex flex-wrap items-center gap-2 text-text-secondary">
          <Link
            to={`/hosts/${experience.host._id}`}
            className="font-semibold text-accent no-underline hover:underline"
          >
            {experience.host.displayName}
          </Link>
          — {experience.host.city}
          {experience.host.verified && <VerifiedBadge />}
        </p>
      )}

      {experience.tags?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {experience.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-pill bg-accent-soft px-3 py-1 text-sm text-accent"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {experience.story && (
        <p className="mt-5 leading-relaxed whitespace-pre-line">
          {experience.story}
        </p>
      )}

      <div className="mt-6 rounded-card border border-dashed border-border bg-surface p-card shadow-card">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-text-secondary">
            {formatDate(experience.date, lang)}
          </p>
          <p className="text-xl font-semibold">
            {formatPrice(experience.price, lang)}
          </p>
        </div>
        <p className="mt-1 text-sm font-medium text-success">
          {seatsLeft} {t("experiences.seatsLeft")}
        </p>

        {success ? (
          <div className="mt-4">
            <p className="font-medium text-success">
              {t("experiences.detail.request.success")}
            </p>
            <Link to="/dashboard" className="text-accent">
              {t("experiences.detail.request.dashboardLink")}
            </Link>
          </div>
        ) : (
          seatsLeft > 0 && (
            <>
              <button
                type="button"
                className="btn-primary mt-4 w-full"
                onClick={handleBook}
              >
                {t("experiences.detail.book")}
              </button>
              {showForm && (
                <form
                  onSubmit={handleSubmit}
                  className="mt-4 flex flex-col gap-3"
                >
                  <label className="flex flex-col gap-1 text-sm font-semibold text-text-secondary">
                    {t("experiences.detail.request.seats")}
                    <select
                      className={`${fieldClass} cursor-pointer`}
                      value={seats}
                      onChange={(e) => setSeats(Number(e.target.value))}
                    >
                      {Array.from({ length: seatsLeft }, (_, i) => i + 1).map(
                        (n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ),
                      )}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-sm font-semibold text-text-secondary">
                    {t("experiences.detail.request.message")}
                    <textarea
                      className={`${fieldClass} min-h-24`}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      maxLength={500}
                    />
                  </label>
                  <p className="text-sm text-text-secondary">
                    {t("experiences.detail.request.messageHelp")}
                  </p>
                  {requestError && (
                    <p className="text-sm font-medium text-accent" role="alert">
                      {requestError}
                    </p>
                  )}
                  <button
                    type="submit"
                    className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={submitting}
                  >
                    {t("experiences.detail.request.submit")}
                  </button>
                </form>
              )}
            </>
          )
        )}
      </div>
    </section>
  );
}

export default ExperienceDetail;
