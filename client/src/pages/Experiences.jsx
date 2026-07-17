import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { useTranslation } from "../hooks/useTranslation";
import ExperienceCard from "../components/ExperienceCard.jsx";

function Experiences() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const city = searchParams.get("city") ?? "";
  const tag = searchParams.get("tag") ?? "";
  const from = searchParams.get("from") ?? "";

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    setSearchParams(next);
  }

  const url = useMemo(() => {
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (tag) params.set("tag", tag);
    if (from) params.set("from", from);
    const qs = params.toString();
    return `/api/v1/experiences${qs ? `?${qs}` : ""}`;
  }, [city, tag, from]);

  const { data: experiences, loading, error } = useFetch(url);

  // Tags are derived from the current page's already-fetched experiences —
  // fine while the catalog is unpaginated; a paginated catalog would need
  // a dedicated tags endpoint instead.
  const tagOptions = useMemo(
    () => [...new Set((experiences ?? []).flatMap((e) => e.tags ?? []))].sort(),
    [experiences],
  );

  return (
    <section className="mx-auto max-w-5xl p-4">
      <h1 className="mb-4 text-xl font-semibold">{t("nav.experiences")}</h1>

      <div className="mb-6 flex flex-wrap gap-3">
        <label className="flex flex-col gap-1">
          {t("experiences.filters.city")}
          <input
            type="text"
            value={city}
            onChange={(e) => updateParam("city", e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          {t("experiences.filters.tag")}
          <select
            value={tag}
            onChange={(e) => updateParam("tag", e.target.value)}
          >
            <option value="">{t("experiences.filters.allTags")}</option>
            {tagOptions.map((tagOption) => (
              <option key={tagOption} value={tagOption}>
                {tagOption}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          {t("experiences.filters.from")}
          <input
            type="date"
            value={from}
            onChange={(e) => updateParam("from", e.target.value)}
          />
        </label>
      </div>

      {loading && <p>{t("common.loading")}</p>}
      {error && <p role="alert">{t("common.error")}</p>}
      {!loading && !error && experiences?.length === 0 && (
        <p>{t("experiences.empty")}</p>
      )}

      {!loading && !error && experiences?.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {experiences.map((experience) => (
            <ExperienceCard key={experience._id} experience={experience} />
          ))}
        </div>
      )}
    </section>
  );
}

export default Experiences;
