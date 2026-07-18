import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { useTranslation } from "../hooks/useTranslation";
import ExperienceCard from "../components/ExperienceCard.jsx";

function Home() {
  const { t } = useTranslation();
  const { data: experiences } = useFetch("/api/v1/experiences");
  const featured = useMemo(() => experiences?.slice(0, 3) ?? [], [experiences]);

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
          <h2 className="mb-4">{t("home.featured.title")}</h2>
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
