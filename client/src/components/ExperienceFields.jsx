import { useTranslation } from "../hooks/useTranslation";

function ExperienceFields({ values, onChange }) {
  const { t } = useTranslation();

  function set(field) {
    return (e) => onChange(field, e.target.value);
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        {t("experienceFields.title")}
        <input
          type="text"
          value={values.title}
          onChange={set("title")}
          required
        />
      </label>
      <label className="flex flex-col gap-1">
        {t("experienceFields.recipeName")}
        <input
          type="text"
          value={values.recipeName}
          onChange={set("recipeName")}
          required
        />
      </label>
      <label className="flex flex-col gap-1">
        {t("experienceFields.date")}
        <input
          type="date"
          value={values.date}
          onChange={set("date")}
          required
        />
      </label>
      <label className="flex flex-col gap-1">
        {t("experienceFields.price")}
        <input
          type="number"
          min="0"
          step="0.01"
          value={values.price}
          onChange={set("price")}
          required
        />
      </label>
      <label className="flex flex-col gap-1">
        {t("experienceFields.seatsTotal")}
        <input
          type="number"
          min="1"
          max="12"
          value={values.seatsTotal}
          onChange={set("seatsTotal")}
          required
        />
      </label>
      <label className="flex flex-col gap-1">
        {t("experienceFields.address")}
        <input
          type="text"
          value={values.address}
          onChange={set("address")}
          required
        />
      </label>
      <label className="flex flex-col gap-1">
        {t("experienceFields.story")}
        <textarea value={values.story} onChange={set("story")} />
      </label>
      <label className="flex flex-col gap-1">
        {t("experienceFields.tags")}
        <input type="text" value={values.tags} onChange={set("tags")} />
      </label>
      <label className="flex flex-col gap-1">
        {t("experienceFields.durationMin")}
        <input
          type="number"
          min="1"
          value={values.durationMin}
          onChange={set("durationMin")}
        />
      </label>
      <label className="flex flex-col gap-1">
        {t("experienceFields.photo")}
        <input type="text" value={values.photo} onChange={set("photo")} />
      </label>
    </div>
  );
}

export default ExperienceFields;
