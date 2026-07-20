export function hasInterests(interests) {
  if (!interests) return false;
  const hasCity = Boolean(interests.city?.trim());
  const hasMaxPrice =
    typeof interests.maxPrice === "number" && interests.maxPrice >= 0;
  const hasTags = Array.isArray(interests.tags) && interests.tags.length > 0;
  return hasCity || hasMaxPrice || hasTags;
}

export function computeMatchScore(experience, interests) {
  if (!experience || !interests) return 0;
  let score = 0;

  const interestCity = interests.city?.trim().toLowerCase();
  const hostCity = experience.host?.city?.trim().toLowerCase();
  if (interestCity && hostCity && interestCity === hostCity) score += 3;

  if (
    typeof interests.maxPrice === "number" &&
    typeof experience.price === "number" &&
    experience.price <= interests.maxPrice
  ) {
    score += 2;
  }

  const interestTags = new Set(
    (interests.tags ?? [])
      .map((tag) => tag?.trim().toLowerCase())
      .filter(Boolean),
  );
  for (const tag of experience.tags ?? []) {
    const normalized = tag?.trim().toLowerCase();
    if (normalized && interestTags.has(normalized)) score += 1;
  }

  return score;
}
