export const emptyExperienceValues = {
  title: "",
  recipeName: "",
  date: "",
  price: "",
  seatsTotal: "",
  address: "",
  story: "",
  tags: "",
  dietaryOptions: "",
  menu: "",
  languagesSpoken: "",
  conversationTopics: "",
  houseRules: "",
  durationMin: "",
  photo: "",
};

function splitList(value) {
  return value
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
}

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
    tags: splitList(values.tags),
    dietaryOptions: splitList(values.dietaryOptions),
    menu: splitList(values.menu),
    languagesSpoken: splitList(values.languagesSpoken),
    conversationTopics: splitList(values.conversationTopics),
    houseRules: values.houseRules || undefined,
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
    dietaryOptions: experience.dietaryOptions?.join(", ") ?? "",
    menu: experience.menu?.join(", ") ?? "",
    languagesSpoken: experience.languagesSpoken?.join(", ") ?? "",
    conversationTopics: experience.conversationTopics?.join(", ") ?? "",
    houseRules: experience.houseRules ?? "",
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
    tags: splitList(values.tags),
    dietaryOptions: splitList(values.dietaryOptions),
    menu: splitList(values.menu),
    languagesSpoken: splitList(values.languagesSpoken),
    conversationTopics: splitList(values.conversationTopics),
    houseRules: values.houseRules || undefined,
  };
}
