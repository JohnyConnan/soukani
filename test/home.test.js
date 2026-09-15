import { test } from "node:test";
import assert from "node:assert/strict";
import { rmSync } from "node:fs";
import { build, buildFixture as fixture, editionVariant } from "./helpers.js";


test("seed (call announced, no URL): CTA links to the About page's #call anchor", async () => {
  const p = await fixture();
  assert.match(p.get("/"), /<a class="button" href="\/o-festivalu\/#call">Podmínky účasti<\/a>/);
  assert.match(p.get("/en/"), /<a class="button" href="\/en\/about\/#call">How to apply<\/a>/);
});

test("call open: CTA is the apply URL with rel=noopener", async () => {
  const p = await fixture("call-open");
  assert.match(p.get("/"), /<a class="button" href="https:\/\/forms\.example\.org\/soukani-2027" rel="noopener">Přihlásit soubor<\/a>/);
  assert.match(p.get("/en/"), /href="https:\/\/forms\.example\.org\/soukani-2027" rel="noopener">Apply now</);
});

test("past: hero is retrospective and CTA points to Photos", async () => {
  const p = await fixture("past");
  assert.match(p.get("/"), /Festival proběhl 5\.–9\. 5\. 2027\./);
  assert.match(p.get("/"), /<a class="button" href="\/fotogalerie\/">Fotogalerie<\/a>/);
  assert.match(p.get("/en/"), /The festival took place on 5–9 May 2027\./);
  assert.match(p.get("/en/"), /<a class="button" href="\/en\/photos\/">Photos<\/a>/);
});

test("facts strip prints edition facts per language", async () => {
  const p = await fixture();
  const cs = p.get("/"), en = p.get("/en/");
  assert.match(cs, /fact-value">16\.</);
  assert.match(cs, /fact-value">5\.–9\. 5\. 2027</);
  assert.match(en, /fact-value">16th</);
  assert.match(en, /fact-value">5–9 May 2027</);
  assert.match(cs, /fact-value">14–18 let</);
  assert.match(en, /fact-value">14–18</);
  assert.match(cs, /fact-value">50 minut</);
  assert.match(en, /fact-value">50 minutes</);
  assert.match(cs, /od roku 1995/);
});

test("null dates: 'termín upřesníme' and no dates fact", async () => {
  const p = await fixture("null-dates");
  assert.match(p.get("/"), /termín upřesníme/);
  assert.match(p.get("/en/"), /dates to be announced/);
  assert.doesNotMatch(p.get("/"), /fact-label">Termín</);
});

test("news: newest first, two launch items with resolved links; 2025 items absent", async () => {
  const p = await fixture();
  const cs = p.get("/");
  const first = cs.indexOf("Výzva k přihlášení na Soukání Ostrov 2027");
  const second = cs.indexOf("Soukání Ostrov 2027 se koná");
  assert.ok(first > 0 && second > first, "call item precedes announcement item");
  assert.match(cs, /<a href="\/o-festivalu\/#call">Výzva k přihlášení/);
  assert.match(p.get("/en/"), /<a href="\/en\/about\/#call">Call for applications/);
  assert.match(cs, /datetime="2026-09-15">15\. 9\. 2026</);
  assert.match(p.get("/en/"), /15 September 2026/);
  assert.equal((cs.match(/class="news-item"/g) || []).length, 2);
});

test("no published news for the current edition: no news section at all", async () => {
  const p = await fixture("rollover-2029");
  assert.doesNotMatch(p.get("/"), /id="news"|Aktuality/);
  assert.doesNotMatch(p.get("/en/"), /id="news"|>News</);
});

test("highlight paragraph renders from the edition record", async () => {
  const p = await fixture();
  assert.match(p.get("/"), /Jižní Koreje/);
  assert.match(p.get("/en/"), /South Korea/);
});

test("CTA follows the matrix for closed, groups known, programme out and running", async () => {
  assert.match((await fixture("call-closed")).get("/"), /<a class="button" href="\/soubory\/">Přihlášené soubory<\/a>/);
  assert.match((await fixture("groups-partial")).get("/en/"), /<a class="button" href="\/en\/groups\/">Selected groups<\/a>/);
  assert.match((await fixture("programme-out")).get("/"), /<a class="button" href="\/program\/">Program festivalu<\/a>/);
  const dir = editionVariant((e) => { e.status = "running"; e.call = "closed"; });
  try {
    assert.match((await build({ PATH_PREFIX: undefined, CONTENT_DIR: dir })).get("/en/"), /<a class="button" href="\/en\/programme\/">Festival programme<\/a>/);
  } finally { rmSync(dir, { recursive: true }); }
});

test("an open call keeps the form button even when a poster already exists", async () => {
  const dir = editionVariant((e) => { e.call = "open"; e.applyUrl = "https://forms.example.org/x"; e.poster = "assets/posters/poster-2025.jpg"; });
  try {
    assert.match((await build({ PATH_PREFIX: undefined, CONTENT_DIR: dir })).get("/"), /href="https:\/\/forms\.example\.org\/x" rel="noopener">Přihlásit soubor</);
  } finally { rmSync(dir, { recursive: true }); }
});

test("news items with an external link and with no link render correctly", async () => {
  const p = await fixture("call-open");
  const cs = p.get("/");
  assert.match(cs, /<a href="https:\/\/www\.facebook\.com\/SoukaniOstrov\/posts\/1" rel="noopener">Nový plakát na Facebooku<\/a>/);
  assert.match(cs, /<h3>Bez odkazu<\/h3>/);
  assert.equal((cs.match(/class="news-item"/g) || []).length, 4);
});
