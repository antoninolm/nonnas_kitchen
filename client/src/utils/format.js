function localeFor(lang) {
  return lang === "it" ? "it-IT" : "en-US";
}

export function formatPrice(cents, lang) {
  return new Intl.NumberFormat(localeFor(lang), {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export function formatDate(date, lang) {
  return new Intl.DateTimeFormat(localeFor(lang), {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}
