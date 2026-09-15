/**
 * Builds the `db` object from validated content. Not memoised: Eleventy evaluates the data
 * module once per build, and a module-level cache would serve stale YAML during `--serve`.
 */
import { join } from "node:path";
import { loadContent, validate, formatProblems, LANGUAGES } from "./validate.js";
import { toIsoDate } from "./dates.js";
import { pageUrl, archiveEditionUrl } from "./urls.js";

/**
 * @param {string} contentDir  directory holding the YAML files (fixtures may hold a subset)
 * @param {{ srcDir: string, fallbackDir?: string }} options  referenced files are looked up in
 *   srcDir first, then in the content directories (so fixtures can carry their own test assets)
 */
export function loadDb(contentDir, { srcDir, fallbackDir = null }) {
  const raw = loadContent(contentDir, fallbackDir);
  const problems = validate(raw, { srcDir, assetDirs: [srcDir, contentDir, fallbackDir].filter(Boolean) });
  if (problems.length) throw new Error(formatProblems(problems));

  const published = (list) => (list ?? []).filter((r) => r.published !== false);
  const normaliseDates = (r, fields) => {
    for (const f of fields) if (r[f] instanceof Date) r[f] = toIsoDate(r[f]);
    return r;
  };

  const editions = [...raw.editions]
    .map((e) => normaliseDates({ groupsComplete: false, ...e }, ["dateFrom", "dateTo", "applyOpensOn", "applyDeadline"]))
    .sort((a, b) => b.year - a.year);
  const byYear = new Map(editions.map((e) => [e.year, e]));
  const current = byYear.get(raw.site.currentEdition);

  const collections = {
    news: published(raw.news).map((r) => normaliseDates(r, ["date"])).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)),
    groups: published(raw.groups),
    workshops: published(raw.workshops),
    programme: published(raw.programme).map((r) => normaliseDates(r, ["day"])).sort((a, b) => `${a.day} ${a.time.padStart(5, "0")}`.localeCompare(`${b.day} ${b.time.padStart(5, "0")}`)),
    photos: published(raw.photos),
    coverage: published(raw.coverage).map((r) => normaliseDates(r, ["date"])).sort((a, b) => (a.date < b.date ? 1 : -1)),
  };

  const forEdition = (collection, year) => {
    if (!collections[collection]) throw new Error(`Unknown collection "${collection}"`);
    return collections[collection].filter((r) => r.edition === year);
  };

  /** Derives the page-state-matrix state of an edition from its flags and records. */
  const state = (edition) => {
    if (!edition) return "archived";
    if (edition.status === "archived") return "archived";
    if (edition.status === "past") return "past";
    if (edition.status === "running") return "running";
    if (edition.call === "open") return "open"; // an open form always owns the call to action
    const programmeOut = Boolean(edition.poster || edition.programmePdf || forEdition("programme", edition.year).length);
    if (programmeOut) return "programmeOut";
    if (forEdition("groups", edition.year).length) return "groupsKnown";
    return edition.call;
  };

  const notEdition = (collection, year) => collections[collection].filter((r) => r.edition !== year);

  /** Archived editions rendered locally (no external archive URL), crossed with languages, for pagination. */
  const archivePages = editions
    .filter((e) => e.status === "archived" && !e.externalArchiveUrl)
    .flatMap((edition) => LANGUAGES.map((lang) => ({ edition, lang })));

  /** Most recent non-current edition with local photo records (the gallery teaser). */
  const previousWithPhotos = editions.find((e) => e.year !== current.year && forEdition("photos", e.year).length > 0) ?? null;

  const pages = raw.pages;
  const pageByKey = Object.fromEntries(pages.map((p) => [p.key, p]));
  const countryName = (code, lang) => raw.countries[code]?.[lang] ?? code;
  const groupById = (id) => collections.groups.find((g) => g.id === id) ?? null;

  const db = {
    site: raw.site,
    copy: raw.copy,
    pages,
    pageByKey,
    pageUrl: (key, lang) => pageUrl(pages, key, lang),
    archiveEditionUrl: (year, lang) => archiveEditionUrl(pages, year, lang),
    otherLang: (lang) => (lang === "cs" ? "en" : "cs"),
    menu: pages.filter((p) => p.inMenu),
    countries: raw.countries,
    countryName,
    contacts: raw.contacts,
    mediaContact: raw.contacts.find((c) => c.media),
    applicationsContact: raw.contacts.find((c) => c.applications),
    partners: raw.partners,
    languages: LANGUAGES,
    editions,
    byYear: Object.fromEntries(byYear),
    edition: (year) => byYear.get(year) ?? null,
    current,
    ...collections,
    forEdition,
    notEdition,
    groupById,
    state,
    archivePages,
    previousWithPhotos,
    /** Past editions that link to the old site (for the gallery and archive lists). */
    externalEditions: editions.filter((e) => e.externalArchiveUrl),
  };
  return db;
}
