export const emptyExperienceValues = {
  title: "",
  recipeName: "",
  date: "",
  price: "",
  seatsTotal: "",
  address: "",
  story: "",
  tags: "",
  durationMin: "",
  photo: "",
};

export function buildExperiencePayload(values, hostId) {
  return {
    host: hostId,
    title: values.title,
    recipeName: values.recipeName,
    date: values.date,
    price: Math.round(parseFloat(values.price) * 100),
    seatsTotal: Number(values.seatsTotal),
    address: values.address,
    story: values.story || undefined,
    durationMin: values.durationMin ? Number(values.durationMin) : undefined,
    photos: values.photo ? [values.photo] : [],
    tags: values.tags
      ? values.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [],
  };
}

export function toExperienceFormValues(experience) {
  return {
    title: experience.title,
    recipeName: experience.recipeName,
    date: experience.date ? experience.date.slice(0, 10) : "",
    price: (experience.price / 100).toString(),
    seatsTotal: experience.seatsTotal.toString(),
    address: experience.address ?? "",
    story: experience.story ?? "",
    tags: experience.tags?.join(", ") ?? "",
    durationMin: experience.durationMin
      ? experience.durationMin.toString()
      : "",
    photo: experience.photos?.[0] ?? "",
  };
}

export function buildExperienceUpdatePayload(values) {
  return {
    title: values.title,
    recipeName: values.recipeName,
    date: values.date,
    price: Math.round(parseFloat(values.price) * 100),
    seatsTotal: Number(values.seatsTotal),
    address: values.address,
    story: values.story || undefined,
    durationMin: values.durationMin ? Number(values.durationMin) : undefined,
    photos: values.photo ? [values.photo] : [],
    tags: values.tags
      ? values.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [],
  };
}
