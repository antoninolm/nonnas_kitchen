export function apiErrorKey(
  err,
  { defaultKey = "forms.errors.generic", ...overrides } = {},
) {
  const override = overrides[err.status];
  if (typeof override === "function") return override(err);
  return override ?? defaultKey;
}
