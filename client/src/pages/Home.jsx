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
      <section className="mx-auto max-w-2xl p-8 text-center">
        <h1 className="mb-2 text-3xl font-semibold">{t("home.hero.title")}</h1>
        <p className="mb-4">{t("home.hero.subtitle")}</p>
        <Link to="/experiences">{t("home.hero.cta")}</Link>
      </section>

      {featured.length > 0 && (
        <section className="mx-auto max-w-5xl p-4">
          <h2 className="mb-4 text-xl font-semibold">
            {t("home.featured.title")}
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
