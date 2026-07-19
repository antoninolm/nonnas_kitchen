export function toProfileFormValues(user) {
  return {
    name: user.name ?? "",
    avatar: user.avatar ?? "",
    city: user.interests?.city ?? "",
    budget:
      user.interests?.maxPrice != null
        ? (user.interests.maxPrice / 100).toString()
        : "",
    tags: user.interests?.tags?.join(", ") ?? "",
  };
}

export function buildProfilePayload(values) {
  return {
    name: values.name,
    avatar: values.avatar,
    interests: {
      city: values.city,
      maxPrice: values.budget
        ? Math.round(parseFloat(values.budget) * 100)
        : undefined,
      tags: values.tags
        ? values.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : [],
    },
  };
}
