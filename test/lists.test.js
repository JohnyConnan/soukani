import { test } from "node:test";
import assert from "node:assert/strict";
import { buildFixture as fixture } from "./helpers.js";


test("AE2: with no 2027 groups the Groups page explains and names the month, with no list markup", async () => {
  const p = await fixture();
  const cs = p.get("/soubory/"), en = p.get("/en/groups/");
  assert.match(cs, /vybere umělecká komise festivalu[\s\S]*Výběr zveřejníme v únoru 2027\./);
  assert.match(en, /The selection will be published in February 2027\./);
  for (const html of [cs, en]) {
    assert.doesNotMatch(html, /class="card-grid"|group-card|lorem/i);
  }
});

test("AE5: with no 2027 poster the Programme page shows the labelled placeholder and never the 2025 poster", async () => {
  const p = await fixture();
  assert.match(p.get("/program/"), /class="poster-pending" role="img" aria-label="Plakát 2027 připravujeme"/);
  assert.match(p.get("/en/programme/"), /The 2027 poster is in preparation/);
  assert.doesNotMatch(p.get("/program/"), /poster-2025/);
  assert.match(p.get("/program/"), /Program festivalu zveřejníme v dubnu 2027\./);
  assert.match(p.get("/en/programme/"), /will be published in April 2027\./);
  assert.doesNotMatch(p.get("/program/"), /class="day"|programme-extras/);
});

test("workshops without records explain the format and the month", async () => {
  const p = await fixture();
  assert.match(p.get("/dilny/"), /každé dopoledne[\s\S]*Seznam seminářů a lektorů zveřejníme v březnu 2027\./);
  assert.match(p.get("/en/workshops/"), /will be published in March 2027\./);
});

test("null announce months fall back to the deadline wording", async () => {
  const p = await fixture("null-dates");
  assert.match(p.get("/soubory/"), /po uzávěrce přihlášek\.<\/p>/);
  assert.doesNotMatch(p.get("/soubory/"), /Výběr zveřejníme v/);
  assert.match(p.get("/program/"), /Program festivalu zveřejníme po výběru souborů\./);
  assert.match(p.get("/en/workshops/"), /will be published before the festival\./);
});

test("groups render country names from the code table, original titles and the host badge", async () => {
  const p = await fixture("groups-partial");
  const cs = p.get("/soubory/"), en = p.get("/en/groups/");
  assert.match(cs, /Itálie · Brixen/);
  assert.match(en, /Italy · Bressanone/);
  assert.match(cs, /Nit <span class="mute" lang="und">\(Il filo\)<\/span>/);
  assert.match(en, /The Thread <span class="mute" lang="und">\(Il filo\)<\/span>/);
  assert.equal((cs.match(/class="badge"/g) || []).length, 1, "one host badge");
  assert.match(cs, /<span class="badge">pořádající soubor<\/span>/);
  assert.match(en, /<span class="badge">host ensemble<\/span>/);
  assert.match(cs, /class="notice groups-more">Další soubory doplníme\./);
  assert.match(cs, /Režie: Anna Rossi/);
  assert.match(cs, /<img src="\/assets\/photos\/2025\/soukani-2025-06\.jpg" alt="HOP-HOP – Pavouček" loading="lazy"/);
  assert.doesNotMatch(cs, /coming-soon/);
});

test("groupsComplete hides the 'more to come' line", async () => {
  const p = await fixture("groups-complete");
  assert.doesNotMatch(p.get("/soubory/"), /groups-more/);
  assert.equal((p.get("/soubory/").match(/class="card group-card"/g) || []).length, 2);
});

test("programme out: day headings in order, times ascending, group and side slots, PDF and tickets", async () => {
  const p = await fixture("programme-out");
  const cs = p.get("/program/");
  const days = [...cs.matchAll(/<time datetime="(\d{4}-\d{2}-\d{2})">([^<]+)<\/time>/g)].map((m) => m[2]);
  assert.deepEqual(days, ["5. 5. 2027", "6. 5. 2027"]);
  const times = [...cs.matchAll(/slot-time">([^<]+)</g)].map((m) => m[1]);
  assert.deepEqual(times, ["16:00", "19:00", "15:00"]);
  assert.match(cs, /HOP-HOP, Ostrov \(Česká republika\): Pavouček/);
  assert.match(p.get("/en/programme/"), /Teatro Giovani Brixen, Bressanone \(Italy\): The Thread/);
  assert.match(cs, /slot-venue">KKC Ostrov · doprovodný program<\/div>\s*<div class="slot-title">Slavnostní zahájení/);
  assert.match(cs, /<img src="\/assets\/posters\/poster-2025\.jpg" alt="Plakát Soukání Ostrov 2027"/);
  assert.match(cs, /href="\/assets\/downloads\/programme-test\.pdf">Program ke stažení \(PDF\)/);
  assert.match(cs, /<h3>Vstupenky<\/h3>\s*<p>Vstupné 100 Kč/);
  assert.match(cs, /href="https:\/\/kkc-ostrov\.cz" rel="noopener">Předprodej vstupenek/);
  assert.doesNotMatch(cs, /coming-soon/);
});

test("workshops: directors first, lecturer TBA text, unpublished hidden", async () => {
  const p = await fixture("groups-partial");
  const cs = p.get("/dilny/"), en = p.get("/en/workshops/");
  assert.ok(cs.indexOf("Seminář pro vedoucí souborů") < cs.indexOf("Semináře pro mladé herce"));
  assert.match(cs, /Lektor: lektor bude upřesněn/);
  assert.match(en, /Lecturer: lecturer TBA/);
  assert.match(cs, /Lektor: Jana Nováková/);
  assert.doesNotMatch(cs, /Skryté/);
  assert.equal((cs.match(/class="workshop"/g) || []).length, 2);
});
