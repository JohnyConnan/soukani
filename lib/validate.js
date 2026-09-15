/**
 * Loads content/*.yaml and validates it. Pure functions: loadContent(dir) reads files,
 * validate(raw, { srcDir }) returns a list of { file, id, field, message } problems.
 * Error messages are the editor's safety net: always name the file, the record and the field.
 */
import { readFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import YAML from "yaml";
import { isValidIsoDate, isValidIsoMonth, toIsoDate } from "./dates.js";

export const FILES = ["site", "editions", "pages", "copy", "countries", "contacts", "partners", "news", "groups", "workshops", "programme", "photos", "coverage"];
export const LANGUAGES = ["cs", "en"];
export const STATUSES = ["upcoming", "running", "past", "archived"];
export const CALLS = ["announced", "open", "closed"];
export const PHOTO_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
export const PHOTO_MAX_BYTES = 400 * 1024;

/** Reads every content file. `fallbackDir` supplies files missing from `dir` (used by test fixtures). */
export function loadContent(dir, fallbackDir = null) {
  const raw = {};
  for (const name of FILES) {
    let path = join(dir, `${name}.yaml`);
    if (!existsSync(path) && fallbackDir) path = join(fallbackDir, `${name}.yaml`);
    if (!existsSync(path)) throw new Error(`Missing content file: ${path}`);
    const parsed = YAML.parse(readFileSync(path, "utf8"));
    raw[name] = parsed ?? (["site", "copy", "countries"].includes(name) ? {} : []);
  }
  return raw;
}

const isNonEmptyString = (v) => typeof v === "string" && v.trim() !== "";
const isHttps = (v) => typeof v === "string" && /^https:\/\/[^\s/]+/.test(v);

export function validate(raw, { srcDir }) {
  const problems = [];
  const add = (file, id, field, message) => problems.push({ file: `${file}.yaml`, id, field, message });

  // --- pairs -------------------------------------------------------------------------------
  function checkPair(file, id, field, value, { optional = false, allowEmpty = false, lists = false } = {}) {
    if (value == null) {
      if (!optional) add(file, id, field, "missing cs/en pair");
      return;
    }
    if (typeof value !== "object" || Array.isArray(value)) {
      add(file, id, field, "must be a { cs, en } pair");
      return;
    }
    for (const lang of LANGUAGES) {
      const v = value[lang];
      if (v == null) { add(file, id, `${field}.${lang}`, "missing value"); continue; }
      if (lists && Array.isArray(v)) {
        if (v.length === 0 || !v.every(isNonEmptyString)) add(file, id, `${field}.${lang}`, "must be a non-empty list of texts");
        continue;
      }
      if (typeof v !== "string") { add(file, id, `${field}.${lang}`, "must be text"); continue; }
      if (!allowEmpty && v.trim() === "") add(file, id, `${field}.${lang}`, "must not be empty");
    }
    for (const key of Object.keys(value)) if (!LANGUAGES.includes(key)) add(file, id, `${field}.${key}`, "unknown language key (use cs and en)");
  }

  function checkFile(file, id, field, value, { optional = true } = {}) {
    if (value == null) { if (!optional) add(file, id, field, "missing file path"); return; }
    if (!isNonEmptyString(value)) { add(file, id, field, "must be a path relative to src/"); return; }
    if (!existsSync(join(srcDir, value))) add(file, id, field, `file not found: src/${value}`);
  }

  function checkDate(file, id, field, value, { optional = true } = {}) {
    if (value == null) { if (!optional) add(file, id, field, "missing date"); return false; }
    if (!isValidIsoDate(value)) { add(file, id, field, `"${value}" is not a valid date; use YYYY-MM-DD (e.g. 2027-05-05)`); return false; }
    return true;
  }

  function checkMonth(file, id, field, value) {
    if (value == null) return;
    if (!isValidIsoMonth(value)) add(file, id, field, `"${value}" is not a valid month; use YYYY-MM (e.g. 2027-02)`);
  }

  function checkInt(file, id, field, value, { optional = true } = {}) {
    if (value == null) { if (!optional) add(file, id, field, "missing number"); return; }
    if (!Number.isInteger(value)) add(file, id, field, `"${value}" must be a whole number`);
  }

  function checkBool(file, id, field, value, { optional = true } = {}) {
    if (value == null) { if (!optional) add(file, id, field, "missing true/false value"); return; }
    if (typeof value !== "boolean") add(file, id, field, `"${value}" must be true or false`);
  }

  function checkUrl(file, id, field, value) {
    if (value == null) return;
    if (!isHttps(value)) add(file, id, field, `"${value}" must be a full https:// address`);
  }

  // --- copy: every leaf is a pair -----------------------------------------------------------
  (function walk(node, path) {
    if (node == null || typeof node !== "object" || Array.isArray(node)) {
      add("copy", null, path, "must be a { cs, en } pair");
      return;
    }
    const keys = Object.keys(node);
    if (keys.includes("cs") || keys.includes("en")) {
      checkPair("copy", null, path, node, { lists: true });
      return;
    }
    if (keys.length === 0) add("copy", null, path, "empty section");
    for (const key of keys) walk(node[key], path ? `${path}.${key}` : key);
  })(raw.copy ?? {}, "");

  // --- countries -----------------------------------------------------------------------------
  const countries = raw.countries ?? {};
  for (const [code, pair] of Object.entries(countries)) {
    if (!/^[A-Z]{2}$/.test(code)) add("countries", code, null, "country codes are two capital letters (ISO 3166-1 alpha-2)");
    checkPair("countries", code, "name", pair);
  }

  // --- pages -----------------------------------------------------------------------------------
  const pages = Array.isArray(raw.pages) ? raw.pages : [];
  const pageKeys = new Set();
  for (const page of pages) {
    const id = page?.key ?? "(no key)";
    if (!isNonEmptyString(page?.key)) add("pages", id, "key", "missing page key");
    else if (pageKeys.has(page.key)) add("pages", id, "key", "duplicate page key");
    pageKeys.add(page?.key);
    checkPair("pages", id, "slug", page?.slug, { allowEmpty: page?.key === "home" });
    if (page?.slug && typeof page.slug === "object") {
      for (const lang of LANGUAGES) {
        const s = page.slug[lang];
        if (typeof s === "string" && s !== "" && !/^[a-z0-9-]+$/.test(s)) add("pages", id, `slug.${lang}`, `"${s}" may only contain lowercase letters, digits and hyphens`);
      }
    }
    checkPair("pages", id, "label", page?.label);
    checkPair("pages", id, "title", page?.title);
    checkPair("pages", id, "description", page?.description);
    checkBool("pages", id, "inMenu", page?.inMenu, { optional: false });
  }
  for (const key of ["home", "about", "groups", "programme", "workshops", "photos", "press", "archive"]) {
    if (!pageKeys.has(key)) add("pages", key, "key", `the page registry must contain the page "${key}"`);
  }

  // --- editions --------------------------------------------------------------------------------
  const editions = Array.isArray(raw.editions) ? raw.editions : [];
  const years = new Map();
  for (const ed of editions) {
    const id = ed?.year ?? "(no year)";
    checkInt("editions", id, "year", ed?.year, { optional: false });
    if (years.has(ed?.year)) add("editions", id, "year", `edition ${id} is listed twice`);
    years.set(ed?.year, ed);
    checkInt("editions", id, "number", ed?.number, { optional: false });
    if (!STATUSES.includes(ed?.status)) add("editions", id, "status", `"${ed?.status}" must be one of ${STATUSES.join(", ")}`);
    if (!CALLS.includes(ed?.call)) add("editions", id, "call", `"${ed?.call}" must be one of ${CALLS.join(", ")}`);
    const fromOk = checkDate("editions", id, "dateFrom", ed?.dateFrom);
    const toOk = checkDate("editions", id, "dateTo", ed?.dateTo);
    if ((ed?.dateFrom == null) !== (ed?.dateTo == null)) add("editions", id, "dateTo", "set both dateFrom and dateTo, or neither");
    if (fromOk && toOk && ed.dateFrom != null && ed.dateTo != null && toIsoDate(ed.dateTo) < toIsoDate(ed.dateFrom)) add("editions", id, "dateTo", "dateTo is before dateFrom");
    checkDate("editions", id, "applyOpensOn", ed?.applyOpensOn);
    checkDate("editions", id, "applyDeadline", ed?.applyDeadline);
    checkUrl("editions", id, "applyUrl", ed?.applyUrl);
    if (ed?.call === "open" && !isNonEmptyString(ed?.applyUrl)) add("editions", id, "applyUrl", "call is open but applyUrl is empty; set the form address or keep call: announced");
    for (const f of ["ageMin", "ageMax", "maxMinutes", "maxActors", "adultsMin", "adultsMax", "logoYear"]) checkInt("editions", id, f, ed?.[f]);
    if (ed?.accent != null && !/^#[0-9A-Fa-f]{6}$/.test(ed.accent)) add("editions", id, "accent", `"${ed.accent}" must be a hex colour like #FF6B2C`);
    if (ed?.logo != null) {
      if (typeof ed.logo !== "object") add("editions", id, "logo", "must be a map of variants: color, white, negative");
      else for (const [variant, path] of Object.entries(ed.logo)) checkFile("editions", id, `logo.${variant}`, path, { optional: false });
    }
    checkFile("editions", id, "poster", ed?.poster);
    checkFile("editions", id, "programmePdf", ed?.programmePdf);
    checkPair("editions", id, "tickets", ed?.tickets, { optional: true });
    checkUrl("editions", id, "ticketsUrl", ed?.ticketsUrl);
    checkUrl("editions", id, "filmUrl", ed?.filmUrl);
    checkUrl("editions", id, "externalArchiveUrl", ed?.externalArchiveUrl);
    for (const f of ["announceGroups", "announceProgramme", "announceWorkshops"]) checkMonth("editions", id, f, ed?.[f]);
    checkBool("editions", id, "groupsComplete", ed?.groupsComplete);
    checkPair("editions", id, "highlight", ed?.highlight, { optional: true });
  }

  // --- site --------------------------------------------------------------------------------------
  const site = raw.site ?? {};
  const current = years.get(site.currentEdition);
  if (site.currentEdition == null) add("site", null, "currentEdition", "missing; set the year of the current edition");
  else if (!current) add("site", null, "currentEdition", `edition ${site.currentEdition} does not exist in editions.yaml`);
  else if (current.status === "archived") add("site", null, "currentEdition", `edition ${site.currentEdition} is archived; point currentEdition at the new edition`);
  if (!isNonEmptyString(site.name)) add("site", null, "name", "missing festival name");
  checkInt("site", null, "firstEditionYear", site.firstEditionYear, { optional: false });
  checkPair("site", null, "organizer.name", site.organizer?.name);
  for (const f of ["shortName", "street", "city", "ico"]) if (!isNonEmptyString(site.organizer?.[f])) add("site", null, `organizer.${f}`, "missing");
  if (site.organizer?.ico != null && !/^\d{8}$/.test(String(site.organizer.ico))) add("site", null, "organizer.ico", `"${site.organizer.ico}" must be eight digits (quote it in YAML)`);
  checkPair("site", null, "organizer.country", site.organizer?.country);
  checkUrl("site", null, "organizer.url", site.organizer?.url);
  if (site.coOrganizer != null && !isNonEmptyString(site.coOrganizer.name)) add("site", null, "coOrganizer.name", "missing (or set coOrganizer: null)");
  for (const f of ["name", "street", "city"]) if (!isNonEmptyString(site.venue?.[f])) add("site", null, `venue.${f}`, "missing");
  checkUrl("site", null, "venue.url", site.venue?.url);
  checkUrl("site", null, "facebook", site.facebook);
  checkUrl("site", null, "oldSite.url", site.oldSite?.url);

  // --- contacts, partners ------------------------------------------------------------------------
  for (const c of raw.contacts ?? []) {
    const id = c?.id ?? c?.name ?? "(no id)";
    if (!isNonEmptyString(c?.id)) add("contacts", id, "id", "missing id");
    if (!isNonEmptyString(c?.name)) add("contacts", id, "name", "missing name");
    checkPair("contacts", id, "role", c?.role);
    if (!isNonEmptyString(c?.email) || !c.email.includes("@")) add("contacts", id, "email", "missing or invalid e-mail address");
    if (c?.phone != null && !isNonEmptyString(c.phone)) add("contacts", id, "phone", "must be text (quote it) or null");
  }
  if ((raw.contacts ?? []).filter((c) => c?.media).length !== 1) add("contacts", null, "media", "exactly one contact must have media: true");
  if ((raw.contacts ?? []).filter((c) => c?.applications).length !== 1) add("contacts", null, "applications", "exactly one contact must have applications: true");
  for (const p of raw.partners ?? []) {
    const id = p?.id ?? "(no id)";
    checkPair("partners", id, "name", p?.name);
    checkUrl("partners", id, "url", p?.url);
    checkFile("partners", id, "logo", p?.logo, { optional: false });
  }

  // --- edition-tagged records -------------------------------------------------------------------
  const published = (r) => r?.published !== false;
  function checkRecordBase(file, r) {
    const id = r?.id ?? "(no id)";
    if (!isNonEmptyString(r?.id)) add(file, id, "id", "missing id");
    if (!years.has(r?.edition)) add(file, id, "edition", `edition ${r?.edition} does not exist in editions.yaml`);
    checkBool(file, id, "published", r?.published);
    return id;
  }
  const ids = (file, list) => {
    const seen = new Set();
    for (const r of list) {
      if (seen.has(r?.id)) add(file, r?.id, "id", "duplicate id");
      seen.add(r?.id);
    }
  };

  const news = raw.news ?? [];
  ids("news", news);
  for (const n of news) {
    const id = checkRecordBase("news", n);
    checkDate("news", id, "date", n?.date, { optional: false });
    checkPair("news", id, "title", n?.title);
    checkPair("news", id, "text", n?.text);
    if (n?.link != null) {
      if (n.link.page != null && !pageKeys.has(n.link.page)) add("news", id, "link.page", `page "${n.link.page}" is not in pages.yaml`);
      if (n.link.page == null && n.link.url == null) add("news", id, "link", "set link.page (a pages.yaml key) or link.url");
      checkUrl("news", id, "link.url", n.link.url);
    }
  }

  const groups = raw.groups ?? [];
  ids("groups", groups);
  for (const g of groups) {
    const id = checkRecordBase("groups", g);
    if (!countries[g?.country]) add("groups", id, "country", `country code "${g?.country}" is not in countries.yaml`);
    checkPair("groups", id, "town", g?.town);
    if (!isNonEmptyString(g?.ensemble)) add("groups", id, "ensemble", "missing ensemble name");
    if (!isNonEmptyString(g?.director)) add("groups", id, "director", "missing director");
    checkPair("groups", id, "title", g?.title);
    checkPair("groups", id, "text", g?.text);
    checkFile("groups", id, "photo", g?.photo);
    checkBool("groups", id, "host", g?.host);
  }

  const workshops = raw.workshops ?? [];
  ids("workshops", workshops);
  for (const w of workshops) {
    const id = checkRecordBase("workshops", w);
    if (!["directors", "actors"].includes(w?.kind)) add("workshops", id, "kind", `"${w?.kind}" must be directors or actors`);
    checkPair("workshops", id, "title", w?.title);
    if (w?.lecturer != null && !isNonEmptyString(w.lecturer)) add("workshops", id, "lecturer", "must be a name or null");
    checkPair("workshops", id, "bio", w?.bio, { optional: true });
    checkPair("workshops", id, "description", w?.description);
  }

  const programme = raw.programme ?? [];
  ids("programme", programme);
  for (const s of programme) {
    const id = checkRecordBase("programme", s);
    checkDate("programme", id, "day", s?.day, { optional: false });
    if (!/^\d{1,2}:\d{2}$/.test(String(s?.time ?? ""))) add("programme", id, "time", `"${s?.time}" must be HH:MM (quote it in YAML)`);
    if (!["performance", "side"].includes(s?.type)) add("programme", id, "type", `"${s?.type}" must be performance or side`);
    checkPair("programme", id, "venue", s?.venue);
    checkPair("programme", id, "note", s?.note, { optional: true });
    if (s?.type === "performance") {
      const g = groups.find((x) => x?.id === s?.groupId);
      if (!g) add("programme", id, "groupId", `no group with id "${s?.groupId}" in groups.yaml`);
      else if (!published(g)) add("programme", id, "groupId", `group "${s.groupId}" is not published`);
      else if (g.edition !== s?.edition) add("programme", id, "groupId", `group "${s.groupId}" belongs to edition ${g.edition}, not ${s?.edition}`);
      checkPair("programme", id, "title", s?.title, { optional: true });
    } else {
      checkPair("programme", id, "title", s?.title);
    }
  }

  const photos = raw.photos ?? [];
  ids("photos", photos);
  for (const p of photos) {
    const id = checkRecordBase("photos", p);
    if (!isNonEmptyString(p?.file)) { add("photos", id, "file", "missing file path"); continue; }
    const ext = p.file.split(".").pop().toLowerCase();
    if (!PHOTO_EXTENSIONS.includes(ext)) add("photos", id, "file", `"${p.file}" has an unsupported format; allowed: ${PHOTO_EXTENSIONS.join(", ")}`);
    const full = join(srcDir, p.file);
    if (!existsSync(full)) add("photos", id, "file", `file not found: src/${p.file}`);
    else {
      const size = statSync(full).size;
      if (size > PHOTO_MAX_BYTES) add("photos", id, "file", `src/${p.file} is ${Math.round(size / 1024)} KB; the limit is 400 KB (resize to 1600 px long edge)`);
    }
    checkInt("photos", id, "width", p?.width);
    checkInt("photos", id, "height", p?.height);
    checkPair("photos", id, "caption", p?.caption, { optional: true });
  }

  const coverage = raw.coverage ?? [];
  ids("coverage", coverage);
  for (const c of coverage) {
    const id = checkRecordBase("coverage", c);
    checkDate("coverage", id, "date", c?.date, { optional: false });
    if (!isNonEmptyString(c?.outlet)) add("coverage", id, "outlet", "missing outlet name");
    checkPair("coverage", id, "title", c?.title);
    if (!isHttps(c?.url)) add("coverage", id, "url", `"${c?.url}" must be a full https:// address`);
  }

  return problems;
}

/** Formats problems as one readable message. */
export function formatProblems(problems) {
  const lines = problems.map((p) => `  • ${p.file}${p.id != null ? ` › ${p.id}` : ""}${p.field ? ` › ${p.field}` : ""}: ${p.message}`);
  return `Content validation failed (${problems.length} problem${problems.length === 1 ? "" : "s"}):\n${lines.join("\n")}`;
}
