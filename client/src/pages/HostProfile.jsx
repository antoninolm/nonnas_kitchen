import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { useTranslation } from "../hooks/useTranslation";
import ExperienceCard from "../components/ExperienceCard.jsx";
import VerifiedBadge from "../components/VerifiedBadge.jsx";
import RatingBadge from "../components/RatingBadge.jsx";
import ReviewList from "../components/ReviewList.jsx";
import Avatar from "../components/Avatar.jsx";

function HostProfile() {
  const { id } = useParams();
  const { t } = useTranslation();

  const {
    data: host,
    loading: hostLoading,
    error: hostError,
  } = useFetch(`/api/v1/hosts/${id}`);

  const experiencesUrl = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return `/api/v1/experiences?host=${id}&from=${today}`;
  }, [id]);

  const { data: experiences, loading: experiencesLoading } =
    useFetch(experiencesUrl);

  const { data: reviewsData, loading: reviewsLoading } = useFetch(
    `/api/v1/hosts/${id}/reviews`,
  );

  if (hostLoading)
    return <p className="p-4 text-text-secondary">{t("common.loading")}</p>;
  if (hostError)
    return (
      <p className="p-4 font-medium text-accent" role="alert">
        {t("common.error")}
      </p>
    );
  if (!host) return null;

  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-section-y">
      {host.photos?.[0] && (
        <img
          src={host.photos[0]}
          alt=""
          className="mb-4 h-64 w-full rounded-card border border-dashed border-border object-cover shadow-card sm:h-80"
        />
      )}
      <h1 className="my-0">{host.displayName}</h1>
      <p className="mb-2 flex flex-wrap items-center gap-2 text-text-secondary">
        {host.city}
        {host.neighborhood && ` — ${host.neighborhood}`}
        {host.verified && <VerifiedBadge />}
        <RatingBadge avg={host.ratingAvg} count={host.ratingCount} />
      </p>
      {host.managers?.length > 0 && (
        <p className="mb-2 flex flex-wrap items-center gap-3 text-sm text-text-secondary">
          {t("hosts.managedBy")}
          {host.managers.map((manager) => (
            <Link
              key={manager._id}
              to={`/users/${manager._id}`}
              className="flex items-center gap-2 no-underline hover:text-accent"
            >
              <Avatar src={manager.avatar} name={manager.name} size="sm" />
              {manager.name}
            </Link>
          ))}
        </p>
      )}
      {host.bio && <p className="mt-4 text-lg leading-relaxed">{host.bio}</p>}

      <h2 className="mt-8 mb-4">{t("hosts.upcomingExperiences")}</h2>
      {experiencesLoading && (
        <p className="text-text-secondary">{t("common.loading")}</p>
      )}
      {!experiencesLoading && experiences?.length > 0 && (
        <div className="grid grid-cols-1 gap-gap sm:grid-cols-2">
          {experiences.map((experience) => (
            <ExperienceCard key={experience._id} experience={experience} />
          ))}
        </div>
      )}
      {!experiencesLoading && experiences?.length === 0 && (
        <div className="rounded-card border border-dashed border-border bg-surface p-card text-center text-text-secondary shadow-card">
          <p>{t("hosts.noUpcoming")}</p>
        </div>
      )}

      <h2 className="mt-8 mb-4">{t("hosts.reviewsTitle")}</h2>
      {reviewsLoading && (
        <p className="text-text-secondary">{t("common.loading")}</p>
      )}
      {!reviewsLoading && reviewsData && (
        <ReviewList reviews={reviewsData.reviews} />
      )}
    </section>
  );
}

export default HostProfile;
