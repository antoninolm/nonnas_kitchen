import { useState } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { useTranslation } from "../hooks/useTranslation";
import { useAuth } from "../hooks/useAuth";
import { formatDate, formatPrice } from "../utils/format";
import { apiErrorKey } from "../utils/apiError";

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

  if (loading) return <p className="p-4">{t("common.loading")}</p>;
  if (error)
    return (
      <p className="p-4" role="alert">
        {t("common.error")}
      </p>
    );
  if (!experience) return null;

  const seatsLeft = experience.seatsTotal - experience.seatsBooked;

  return (
    <section className="mx-auto max-w-2xl p-4">
      {experience.photos?.[0] && (
        <img
          src={experience.photos[0]}
          alt=""
          className="mb-4 h-64 w-full rounded-lg object-cover"
        />
      )}
      <h1 className="text-2xl font-semibold">{experience.title}</h1>
      <p className="mb-2">{experience.recipeName}</p>

      {experience.host && (
        <p className="mb-2">
          <Link to={`/hosts/${experience.host._id}`}>
            {experience.host.displayName}
          </Link>{" "}
          — {experience.host.city}
          {experience.host.verified && (
            <> · {t("experiences.detail.verified")}</>
          )}
        </p>
      )}

      <p>{formatDate(experience.date, lang)}</p>
      <p>{formatPrice(experience.price, lang)}</p>
      <p>
        {seatsLeft} {t("experiences.seatsLeft")}
      </p>

      {experience.tags?.length > 0 && (
        <p className="mt-2">{experience.tags.join(", ")}</p>
      )}

      {experience.story && <p className="mt-4">{experience.story}</p>}

      {success ? (
        <div className="mt-6">
          <p>{t("experiences.detail.request.success")}</p>
          <Link to="/dashboard">
            {t("experiences.detail.request.dashboardLink")}
          </Link>
        </div>
      ) : (
        seatsLeft > 0 && (
          <>
            <button type="button" className="mt-6" onClick={handleBook}>
              {t("experiences.detail.book")}
            </button>
            {showForm && (
              <form
                onSubmit={handleSubmit}
                className="mt-4 flex flex-col gap-3"
              >
                <label className="flex flex-col gap-1">
                  {t("experiences.detail.request.seats")}
                  <select
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
                <label className="flex flex-col gap-1">
                  {t("experiences.detail.request.message")}
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    maxLength={500}
                  />
                </label>
                <p>{t("experiences.detail.request.messageHelp")}</p>
                {requestError && <p role="alert">{requestError}</p>}
                <button type="submit" disabled={submitting}>
                  {t("experiences.detail.request.submit")}
                </button>
              </form>
            )}
          </>
        )
      )}
    </section>
  );
}

export default ExperienceDetail;
