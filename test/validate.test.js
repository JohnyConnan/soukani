import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { loadContent, validate } from "../lib/validate.js";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = join(root, "src");
const base = loadContent(join(root, "content"));

function seed(mutate) {
  const raw = structuredClone(base);
  mutate?.(raw);
  return validate(raw, { srcDir });
}
function messages(problems) {
  return problems.map((p) => `${p.file} ${p.id ?? ""} ${p.field ?? ""}: ${p.message}`);
}
function assertProblem(problems, ...needles) {
  const joined = messages(problems).join("\n");
  for (const n of needles) assert.match(joined, n, `expected a problem mentioning ${n}\n${joined}`);
}
const group = {
  id: "it-brixen", edition: 2027, published: true, country: "IT",
  town: { cs: "Brixen", en: "Bressanone" }, ensemble: "Teatro", director: "A. B.", titleOriginal: null,
  title: { cs: "Nit", en: "Thread" }, text: { cs: "Text.", en: "Text." }, photo: null, host: false,
};

test("valid seed content has no problems", () => {
  assert.deepEqual(messages(seed()), []);
});

test("group with text.en missing names groups.yaml, id and field", () => {
  const problems = seed((r) => r.groups.push({ ...group, text: { cs: "Jen česky" } }));
  assertProblem(problems, /groups\.yaml/, /it-brixen/, /text\.en/);
});

test("news item with unknown edition names the edition", () => {
  const problems = seed((r) => (r.news[0].edition = 2072));
  assertProblem(problems, /news\.yaml/, /2072/);
});

test("unknown country code", () => {
  const problems = seed((r) => r.groups.push({ ...group, country: "XY" }));
  assertProblem(problems, /groups\.yaml/, /XY/, /countries\.yaml/);
});

test("slot with non-ISO day", () => {
  const problems = seed((r) => {
    r.groups.push(group);
    r.programme.push({ id: "s1", edition: 2027, published: true, day: "5.5.2027", time: "17:00", type: "performance", venue: { cs: "KKC", en: "KKC" }, groupId: "it-brixen", title: null, note: { cs: "a", en: "b" } });
  });
  assertProblem(problems, /programme\.yaml/, /s1/, /day/, /YYYY-MM-DD/);
});

test("currentEdition must match exactly one non-archived edition", () => {
  assertProblem(seed((r) => (r.site.currentEdition = 2025)), /site\.yaml/, /currentEdition/, /archived/);
  assertProblem(seed((r) => (r.site.currentEdition = 2099)), /site\.yaml/, /currentEdition/, /2099/);
  assertProblem(seed((r) => r.editions.push({ ...r.editions[0] })), /editions\.yaml/, /2027/, /twice|duplicate/i);
});

test("photo file problems name path, size and allowed formats", () => {
  assertProblem(seed((r) => (r.photos[0].file = "assets/photos/2025/missing.jpg")), /photos\.yaml/, /missing\.jpg/, /not found|does not exist/i);
  const tmp = mkdtempSync(join(tmpdir(), "soukani-"));
  writeFileSync(join(tmp, "big.jpg"), Buffer.alloc(401 * 1024));
  const raw = structuredClone(base); raw.photos[0].file = "big.jpg";
  assertProblem(validate(raw, { srcDir: tmp }).filter((p) => p.id === "2025-01"), /photos\.yaml/, /400 KB/i, /big\.jpg/);
  rmSync(tmp, { recursive: true });
  assertProblem(seed((r) => (r.photos[0].file = "assets/photos/2025/x.heic")), /photos\.yaml/, /jpg, jpeg, png, webp/);
});

test("pages entry missing slug.en names the page key and field", () => {
  const problems = seed((r) => delete r.pages[2].slug.en);
  assertProblem(problems, /pages\.yaml/, /groups/, /slug\.en/);
});

test("edition with call open needs applyUrl", () => {
  const problems = seed((r) => (r.editions[0].call = "open"));
  assertProblem(problems, /editions\.yaml/, /2027/, /applyUrl/);
  assert.deepEqual(messages(seed((r) => { r.editions[0].call = "open"; r.editions[0].applyUrl = "https://forms.example/x"; })), []);
});

test("slot groupId must match a published group of the same edition", () => {
  const slot = { id: "s2", edition: 2027, published: true, day: "2027-05-05", time: "17:00", type: "performance", venue: { cs: "KKC", en: "KKC" }, groupId: "italy-brixn", title: null, note: { cs: "a", en: "b" } };
  assertProblem(seed((r) => { r.groups.push(group); r.programme.push(slot); }), /programme\.yaml/, /s2/, /italy-brixn/);
  assertProblem(seed((r) => { r.groups.push({ ...group, published: false }); r.programme.push({ ...slot, groupId: "it-brixen" }); }), /programme\.yaml/, /s2/, /it-brixen/, /published/);
  assertProblem(seed((r) => { r.groups.push({ ...group, edition: 2025 }); r.programme.push({ ...slot, groupId: "it-brixen" }); }), /programme\.yaml/, /s2/, /it-brixen/);
  assert.deepEqual(messages(seed((r) => { r.groups.push(group); r.programme.push({ ...slot, groupId: "it-brixen" }); })), []);
});

test("news page key must exist in the registry", () => {
  assertProblem(seed((r) => (r.news[0].link = { page: "programm" })), /news\.yaml/, /programm/, /pages\.yaml/);
});

test("announce fields must be YYYY-MM", () => {
  assertProblem(seed((r) => (r.editions[0].announceGroups = "February 2027")), /editions\.yaml/, /announceGroups/, /YYYY-MM/);
});

test("copy leaves must be cs/en pairs", () => {
  assertProblem(seed((r) => (r.copy.news.heading = { cs: "Aktuality" })), /copy\.yaml/, /news\.heading\.en/);
  assertProblem(seed((r) => (r.copy.about.description.en = [])), /copy\.yaml/, /about\.description\.en/);
});

test("null dates are valid for an upcoming edition", () => {
  assert.deepEqual(messages(seed((r) => { r.editions[0].dateFrom = null; r.editions[0].dateTo = null; })), []);
  assertProblem(seed((r) => (r.editions[0].dateTo = "2027-05-01")), /editions\.yaml/, /dateTo/, /before/);
});

test("referenced logo, poster and partner files must exist", () => {
  assertProblem(seed((r) => (r.editions[0].logo.color = "assets/identity/2027/nope.png")), /editions\.yaml/, /logo\.color/, /nope\.png/);
  assertProblem(seed((r) => (r.partners[0].logo = "assets/partners/nope.svg")), /partners\.yaml/, /nope\.svg/);
});

test("unpublished record does not fail validation", () => {
  assert.deepEqual(messages(seed((r) => r.groups.push({ ...group, published: false, text: { cs: "x", en: "y" } }))), []);
});
