import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { loadDb } from "../lib/db.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const opts = { srcDir: join(root, "src") };
const seed = () => loadDb(join(root, "content"), opts);
const fixture = (name) => loadDb(join(root, "test/fixtures", name), { ...opts, fallbackDir: join(root, "content") });

test("seed data loads with 2027 current and empty 2027 records", () => {
  const db = seed();
  assert.equal(db.current.year, 2027);
  assert.equal(db.editions[0].year, 2027);
  assert.deepEqual(db.forEdition("groups", 2027), []);
  assert.equal(db.forEdition("photos", 2025).length, 8);
  assert.equal(db.state(db.current), "announced");
  assert.equal(db.news[0].date, "2026-09-15", "news sorted newest first, dates as ISO strings");
  assert.equal(db.current.dateFrom, "2027-05-05");
  assert.equal(db.archivePages.length, 0, "2025 has an external archive URL, so no local archive page");
  assert.equal(db.previousWithPhotos.year, 2025);
  assert.equal(db.countryName("IT", "cs"), "Itálie");
  assert.equal(db.mediaContact.id, "konyvkova");
  assert.equal(db.applicationsContact.id, "konyvka");
});

test("fixture directory overrides seed files without touching the rest", () => {
  const db = fixture("call-open");
  assert.equal(db.current.call, "open");
  assert.equal(db.state(db.current), "open");
  assert.equal(db.current.applyUrl, "https://forms.example.org/soukani-2027");
  assert.equal(db.news.length, 2, "news.yaml falls back to content/");
});

test("state derivation follows the matrix", () => {
  assert.equal(fixture("call-closed").state(fixture("call-closed").current), "closed");
  assert.equal(fixture("groups-partial").state(fixture("groups-partial").current), "groupsKnown");
  assert.equal(fixture("programme-out").state(fixture("programme-out").current), "programmeOut");
  assert.equal(fixture("past").state(fixture("past").current), "past");
  const roll = fixture("rollover-2029");
  assert.equal(roll.current.year, 2029);
  assert.equal(roll.state(roll.edition(2027)), "archived");
  assert.equal(roll.archivePages.length, 2, "2027 renders locally in two languages");
  assert.equal(roll.previousWithPhotos.year, 2027);
});

test("unpublished records are excluded", () => {
  const db = fixture("groups-partial");
  assert.equal(db.forEdition("workshops", 2027).length, 2);
  assert.ok(!db.workshops.some((w) => w.id === "2027-hidden"));
});

test("programme slots sort by day then time", () => {
  const slots = fixture("programme-out").forEdition("programme", 2027);
  assert.deepEqual(slots.map((s) => `${s.day} ${s.time}`), ["2027-05-05 16:00", "2027-05-05 19:00", "2027-05-06 15:00"]);
});

test("null dates are accepted for an upcoming edition", () => {
  const db = fixture("null-dates");
  assert.equal(db.current.dateFrom, null);
});

test("broken content throws one readable error listing every problem", () => {
  assert.throws(() => loadDb(join(root, "test/fixtures/broken"), { ...opts, fallbackDir: join(root, "content") }), (err) => {
    assert.match(err.message, /Content validation failed/);
    assert.match(err.message, /groups\.yaml › it-broken › text\.en/);
    assert.match(err.message, /country code "XY"/);
    return true;
  });
});
