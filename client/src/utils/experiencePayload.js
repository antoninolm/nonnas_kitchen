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
