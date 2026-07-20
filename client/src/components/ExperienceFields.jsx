import { useTranslation } from "../hooks/useTranslation";

function ExperienceFields({ values, onChange }) {
  const { t } = useTranslation();

  function set(field) {
    return (e) => onChange(field, e.target.value);
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="form-label">
        {t("experienceFields.title")}
        <input
          type="text"
          className="field"
          value={values.title}
          onChange={set("title")}
          required
        />
      </label>
      <label className="form-label">
        {t("experienceFields.recipeName")}
        <input
          type="text"
          className="field"
          value={values.recipeName}
          onChange={set("recipeName")}
          required
        />
      </label>
      <label className="form-label">
        {t("experienceFields.date")}
        <input
          type="date"
          className="field"
          value={values.date}
          onChange={set("date")}
          required
        />
      </label>
      <label className="form-label">
        {t("experienceFields.price")}
        <input
          type="number"
          className="field"
          min="0"
          step="0.01"
          value={values.price}
          onChange={set("price")}
          required
        />
      </label>
      <label className="form-label">
        {t("experienceFields.seatsTotal")}
        <input
          type="number"
          className="field"
          min="1"
          max="12"
          value={values.seatsTotal}
          onChange={set("seatsTotal")}
          required
        />
      </label>
      <label className="form-label">
        {t("experienceFields.address")}
        <input
          type="text"
          className="field"
          value={values.address}
          onChange={set("address")}
          required
        />
      </label>
      <label className="form-label">
        {t("experienceFields.story")}
        <textarea
          className="field min-h-24"
          value={values.story}
          onChange={set("story")}
        />
      </label>
      <label className="form-label">
        {t("experienceFields.tags")}
        <input
          type="text"
          className="field"
          value={values.tags}
          onChange={set("tags")}
        />
      </label>
      <label className="form-label">
        {t("experienceFields.dietaryOptions")}
        <input
          type="text"
          className="field"
          value={values.dietaryOptions}
          onChange={set("dietaryOptions")}
        />
      </label>
      <label className="form-label">
        {t("experienceFields.menu")}
        <input
          type="text"
          className="field"
          value={values.menu}
          onChange={set("menu")}
        />
      </label>
      <label className="form-label">
        {t("experienceFields.languagesSpoken")}
        <input
          type="text"
          className="field"
          value={values.languagesSpoken}
          onChange={set("languagesSpoken")}
        />
      </label>
      <label className="form-label">
        {t("experienceFields.conversationTopics")}
        <input
          type="text"
          className="field"
          value={values.conversationTopics}
          onChange={set("conversationTopics")}
        />
      </label>
      <label className="form-label">
        {t("experienceFields.houseRules")}
        <textarea
          className="field min-h-24"
          maxLength={500}
          value={values.houseRules}
          onChange={set("houseRules")}
        />
      </label>
      <label className="form-label">
        {t("experienceFields.durationMin")}
        <input
          type="number"
          className="field"
          min="1"
          value={values.durationMin}
          onChange={set("durationMin")}
        />
      </label>
      <label className="form-label">
        {t("experienceFields.photo")}
        <input
          type="text"
          className="field"
          value={values.photo}
          onChange={set("photo")}
        />
      </label>
    </div>
  );
}

export default ExperienceFields;
