import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, cpSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import YAML from "yaml";
import { build } from "./helpers.js";

const fixture = (name) => build({ PATH_PREFIX: undefined, SITE_URL: "https://soukani.cz", CONTENT_DIR: name ? `test/fixtures/${name}` : undefined });

test("AE6: after archiving 2027 the home page carries no 2027 records and /archiv/2027/ carries them all", async () => {
  const p = await fixture("rollover-2029");
  const home = p.get("/");
  assert.doesNotMatch(home, /Výzva k přihlášení na Soukání Ostrov 2027|Teatro Giovani|soukani-2025-02\.jpg/);
  assert.match(home, /--accent: #1B7F5C;/);
  const archive = p.get("/archiv/2027/");
  assert.ok(archive, "/archiv/2027/ rendered");
  assert.match(archive, /<h1>Soukání Ostrov 2027<\/h1>/);
  assert.match(archive, /Výzva k přihlášení na Soukání Ostrov 2027/, "2027 news");
  assert.match(archive, /Teatro Giovani Brixen/, "2027 group");
  assert.match(archive, /slot-time">15:00</, "2027 slot");
  assert.match(archive, /Lektor: Marek K\./, "2027 workshop");
  assert.match(archive, /alt="Soukání 2027" loading="lazy"/, "2027 photo");
  assert.match(archive, /--accent: #FF6B2C;/, "2027 accent on the archive page");
  assert.match(archive, /5\.–9\. 5\. 2027/);
  assert.doesNotMatch(archive, /coming-soon|groups-more|id="call"/);
  const en = p.get("/en/archive/2027/");
  assert.match(en, /<html lang="en">/);
  assert.match(en, /Bressanone \(Italy\)/);
  assert.match(archive, /class="lang-switch" href="\/en\/archive\/2027\/"/);
  assert.match(en, /hreflang="cs" href="https:\/\/soukani\.cz\/archiv\/2027\/"/);
});

test("/archiv/ lists editions newest first: 2029 current, 2027 local, 2025 and earlier external", async () => {
  const p = await fixture("rollover-2029");
  const cs = p.get("/archiv/");
  const years = [...cs.matchAll(/edition-year">(\d{4})</g)].map((m) => Number(m[1]));
  assert.deepEqual(years, [2029, 2027, 2025, 2023, 2021, 2019, 2017, 2015, 2013, 2011, 2009, 2007, 2005, 2003, 2001]);
  assert.match(cs, /class="archive-local" href="\/archiv\/2027\/"/);
  assert.match(cs, /class="archive-external" href="https:\/\/hophop\.zusostrov\.cz\/soukani-2025-cs\.html" rel="noopener">Soukání Ostrov 2025 \(na stránkách HOP-HOP\)/);
  assert.match(p.get("/en/archive/"), /class="archive-local" href="\/en\/archive\/2027\/"/);
  assert.match(p.get("/en/archive/"), /17th edition/);
});

test("seed: /archiv/ exists, 2025 links to the old site and no local edition pages render", async () => {
  const p = await fixture();
  assert.match(p.get("/archiv/"), /class="archive-current" href="\/">Soukání Ostrov 2027</);
  assert.match(p.get("/archiv/"), /15\. ročník, 30\. 4\.–3\. 5\. 2025/);
  assert.ok(!p.has("/archiv/2025/"), "2025 stays external");
});

test("an archived edition with zero records renders facts only, no empty list markup", async () => {
  const dir = mkdtempSync(join(tmpdir(), "soukani-archive-"));
  cpSync("test/fixtures/rollover-2029", dir, { recursive: true });
  const editions = YAML.parse(readFileSync(join(dir, "editions.yaml"), "utf8"));
  const e2023 = editions.find((e) => e.year === 2023);
  e2023.externalArchiveUrl = null;
  e2023.accent = "#123456";
  e2023.logo = { color: "assets/identity/2025/logo-barevne.png", white: "assets/identity/2025/logo-bile.png", negative: "assets/identity/2025/logo-negativ.png" };
  writeFileSync(join(dir, "editions.yaml"), YAML.stringify(editions));
  try {
    const p = await build({ PATH_PREFIX: undefined, CONTENT_DIR: dir });
    const html = p.get("/archiv/2023/");
    assert.ok(html, "/archiv/2023/ rendered");
    assert.match(html, /fact-value">14\.</);
    assert.match(html, /--accent: #123456;/);
    assert.doesNotMatch(html, /card-grid|class="day"|class="gallery"|class="workshop"|news-list/);
  } finally { rmSync(dir, { recursive: true }); }
});

test("sitemap lists the local archive pages with alternates in the rollover state", async () => {
  const p = await fixture("rollover-2029");
  const xml = p.get("/sitemap.xml");
  assert.match(xml, /<loc>https:\/\/soukani\.cz\/archiv\/2027\/<\/loc>/);
  assert.match(xml, /<loc>https:\/\/soukani\.cz\/en\/archive\/2027\/<\/loc>/);
  assert.match(xml, /hreflang="en" href="https:\/\/soukani\.cz\/en\/archive\/2027\/"/);
});
