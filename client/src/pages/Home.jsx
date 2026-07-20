import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { useTranslation } from "../hooks/useTranslation";
import { useAuth } from "../hooks/useAuth";
import ExperienceCard from "../components/ExperienceCard.jsx";
import { hasInterests, computeMatchScore } from "../utils/matchScore";

function Home() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: experiences } = useFetch("/api/v1/experiences");
  const personalized = Boolean(user && hasInterests(user.interests));

  const featured = useMemo(() => {
    if (!experiences) return [];
    if (!personalized) return experiences.slice(0, 3);

    return [...experiences]
      .sort((a, b) => {
        const diff =
          computeMatchScore(b, user.interests) -
          computeMatchScore(a, user.interests);
        return diff !== 0 ? diff : new Date(a.date) - new Date(b.date);
      })
      .slice(0, 3);
  }, [experiences, personalized, user?.interests]);

  return (
    <>
      <section className="border-b border-dashed border-border bg-accent-soft px-section-x py-section-y">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="mt-0 mb-3">{t("home.hero.title")}</h1>
          <p className="mb-6 text-lg text-text-secondary">
            {t("home.hero.subtitle")}
          </p>
          <Link to="/experiences" className="btn-primary">
            {t("home.hero.cta")}
          </Link>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="mx-auto w-full max-w-5xl px-4 py-section-y sm:px-section-x">
          <h2 className="mb-4">
            {t(
              personalized
                ? "home.featured.titlePersonalized"
                : "home.featured.title",
            )}
          </h2>
          {user && !personalized && (
            <p className="mb-4 text-sm text-text-secondary">
              {t("home.featured.personalizeHint")}{" "}
              <Link to="/profile" className="underline">
                {t("home.featured.personalizeHintCta")}
              </Link>
            </p>
          )}
          <div className="grid grid-cols-1 gap-gap sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((experience) => (
              <ExperienceCard key={experience._id} experience={experience} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

export default Home;
