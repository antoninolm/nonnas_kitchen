import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { useTranslation } from "../hooks/useTranslation";
import ExperienceCard from "../components/ExperienceCard.jsx";

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

  if (hostLoading) return <p className="p-4">{t("common.loading")}</p>;
  if (hostError)
    return (
      <p className="p-4" role="alert">
        {t("common.error")}
      </p>
    );
  if (!host) return null;

  return (
    <section className="mx-auto max-w-2xl p-4">
      {host.photos?.[0] && (
        <img
          src={host.photos[0]}
          alt=""
          className="mb-4 h-64 w-full rounded-lg object-cover"
        />
      )}
      <h1 className="text-2xl font-semibold">{host.displayName}</h1>
      <p className="mb-2">
        {host.city}
        {host.neighborhood && ` — ${host.neighborhood}`}
        {host.verified && <> · {t("experiences.detail.verified")}</>}
      </p>
      {host.bio && <p className="mt-2">{host.bio}</p>}

      <h2 className="mt-6 mb-4 text-xl font-semibold">
        {t("hosts.upcomingExperiences")}
      </h2>
      {experiencesLoading && <p>{t("common.loading")}</p>}
      {!experiencesLoading && experiences?.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {experiences.map((experience) => (
            <ExperienceCard key={experience._id} experience={experience} />
          ))}
        </div>
      )}
      {!experiencesLoading && experiences?.length === 0 && (
        <p>{t("hosts.noUpcoming")}</p>
      )}
    </section>
  );
}

export default HostProfile;
