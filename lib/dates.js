/** Date helpers. Inputs are ISO strings (YYYY-MM-DD or YYYY-MM); output is per language. */

const MONTHS = {
  cs: {
    nominative: ["leden", "únor", "březen", "duben", "květen", "červen", "červenec", "srpen", "září", "říjen", "listopad", "prosinec"],
    genitive: ["ledna", "února", "března", "dubna", "května", "června", "července", "srpna", "září", "října", "listopadu", "prosince"],
  },
  en: {
    nominative: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  },
};

const WEEKDAYS = {
  cs: ["neděle", "pondělí", "úterý", "středa", "čtvrtek", "pátek", "sobota"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
};

export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
export const ISO_MONTH = /^\d{4}-\d{2}$/;

/** Accepts a string or a Date (YAML parses unquoted dates into Date objects) and returns YYYY-MM-DD or null. */
export function toIsoDate(value) {
  if (value == null) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
  return String(value);
}

export function isValidIsoDate(value) {
  const s = toIsoDate(value);
  if (!s || !ISO_DATE.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

export function isValidIsoMonth(value) {
  if (typeof value !== "string" || !ISO_MONTH.test(value)) return false;
  const m = Number(value.slice(5));
  return m >= 1 && m <= 12;
}

function parts(value) {
  const [y, m, d] = toIsoDate(value).split("-").map(Number);
  return { y, m, d };
}

/** 31. 12. 2026 (cs) / 31 December 2026 (en) */
export function formatDate(value, lang) {
  if (!value) return "";
  const { y, m, d } = parts(value);
  if (lang === "cs") return `${d}. ${m}. ${y}`;
  return `${d} ${MONTHS.en.nominative[m - 1]} ${y}`;
}

/** 5.–9. 5. 2027 / 5–9 May 2027; cross-month: 30. 4.–3. 5. 2025 / 30 April–3 May 2025 */
export function formatRange(from, to, lang) {
  if (!from) return "";
  if (!to || toIsoDate(from) === toIsoDate(to)) return formatDate(from, lang);
  const a = parts(from);
  const b = parts(to);
  if (lang === "cs") {
    if (a.y === b.y && a.m === b.m) return `${a.d}.–${b.d}. ${a.m}. ${a.y}`;
    if (a.y === b.y) return `${a.d}. ${a.m}.–${b.d}. ${b.m}. ${a.y}`;
    return `${a.d}. ${a.m}. ${a.y}–${b.d}. ${b.m}. ${b.y}`;
  }
  const mn = MONTHS.en.nominative;
  if (a.y === b.y && a.m === b.m) return `${a.d}–${b.d} ${mn[a.m - 1]} ${a.y}`;
  if (a.y === b.y) return `${a.d} ${mn[a.m - 1]}–${b.d} ${mn[b.m - 1]} ${a.y}`;
  return `${a.d} ${mn[a.m - 1]} ${a.y}–${b.d} ${mn[b.m - 1]} ${b.y}`;
}

/** "2027-02" → únor 2027 / February 2027 (nominative, standalone) */
export function formatMonth(value, lang) {
  if (!value) return "";
  const [y, m] = String(value).split("-").map(Number);
  const name = lang === "cs" ? MONTHS.cs.nominative[m - 1] : MONTHS.en.nominative[m - 1];
  return `${name} ${y}`;
}

/** "2027-02" → v únoru 2027 is left to copy; this returns the locative-friendly form for "v {month}" in cs. */
export function formatMonthIn(value, lang) {
  if (!value) return "";
  const [y, m] = String(value).split("-").map(Number);
  if (lang !== "cs") return `${MONTHS.en.nominative[m - 1]} ${y}`;
  const locative = ["lednu", "únoru", "březnu", "dubnu", "květnu", "červnu", "červenci", "srpnu", "září", "říjnu", "listopadu", "prosinci"];
  return `${locative[m - 1]} ${y}`;
}

/** 16 → "16." (cs) / "16th" (en) */
export function ordinal(n, lang) {
  if (n == null) return "";
  if (lang === "cs") return `${n}.`;
  const v = n % 100;
  const suffix = v >= 11 && v <= 13 ? "th" : { 1: "st", 2: "nd", 3: "rd" }[n % 10] || "th";
  return `${n}${suffix}`;
}

/** Pieces for the schedule's day circle: { day: 6, monthShort: "kvě" | "May", weekday: "čtvrtek" | "Thursday" } */
export function dayParts(value, lang) {
  if (!value) return null;
  const { y, m, d } = parts(value);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const month = lang === "cs" ? MONTHS.cs.nominative[m - 1] : MONTHS.en.nominative[m - 1];
  return { day: d, monthShort: month.slice(0, 3), weekday: WEEKDAYS[lang][weekday] };
}
