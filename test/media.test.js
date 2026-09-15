import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "./helpers.js";

const fixture = (name, env = {}) => build({ PATH_PREFIX: undefined, CONTENT_DIR: name ? `test/fixtures/${name}` : undefined, ...env });

test("photo records render as lazy images with alt text and the copied path", async () => {
  const p = await fixture();
  const cs = p.get("/fotogalerie/");
  assert.match(cs, /<img src="\/assets\/photos\/2025\/soukani-2025-01\.jpg" alt="HOP-HOP Vlaštovky: :X" loading="lazy" decoding="async" width="640" height="960">/);
  assert.match(cs, /alt="Fotografie z festivalu Soukání Ostrov 2025" loading="lazy"/, "caption-less photo gets the generic alt");
  assert.match(p.get("/en/photos/"), /alt="Photo from the Soukání Ostrov 2025 festival"/);
  assert.equal((cs.match(/<figure>/g) || []).length, 8);
});

test("no 2027 photos: the 'during the festival' note, the 2025 teaser and the film link", async () => {
  const p = await fixture();
  const cs = p.get("/fotogalerie/");
  assert.match(cs, /photos-empty">Fotografie z ročníku 2027 budeme přidávat během festivalu\./);
  assert.match(cs, /<h2>Ohlédnutí za Soukáním 2025<\/h2>/);
  assert.match(cs, /href="https:\/\/www\.youtube\.com\/watch\?v=auz9aV2gZgE" rel="noopener">Festivalový film 2025 na YouTube/);
  assert.match(p.get("/en/photos/"), /Photos from the 2027 festival will be added as the festival takes place\./);
});

test("with 2027 archived and 2029 current the teaser picks 2027", async () => {
  const p = await fixture("rollover-2029");
  assert.match(p.get("/fotogalerie/"), /<h2>Ohlédnutí za Soukáním 2027<\/h2>/);
  assert.doesNotMatch(p.get("/fotogalerie/"), /Ohlédnutí za Soukáním 2025/);
});

test("old-site gallery links appear for every edition with an external archive URL", async () => {
  const p = await fixture();
  const links = [...p.get("/fotogalerie/").matchAll(/href="(https:\/\/hophop\.zusostrov\.cz\/soukani-\d{4}-cs\.html)" rel="noopener">Soukání (\d{4}) na stránkách/g)];
  assert.equal(links.length, 13);
  assert.equal(links[0][2], "2025");
  assert.equal(links.at(-1)[2], "2001");
});

test("Press lists three 2025-labelled logo variants and no poster or PDF while unset", async () => {
  const p = await fixture();
  const cs = p.get("/pro-media/");
  assert.match(cs, /href="\/assets\/identity\/2025\/logo-barevne\.png" download>Logo 2025 – barevné \(PNG\)/);
  assert.match(cs, /Logo 2025 – bílé \(PNG\)/);
  assert.match(cs, /Logo 2025 – negativ \(PNG\)/);
  assert.match(p.get("/en/press/"), /Logo 2025 – colour \(PNG\)/);
  assert.doesNotMatch(cs, /Plakát 20\d\d \(JPG\)|Program 20\d\d \(PDF\)/);
  assert.match(cs, /media-contact"><strong>Mgr\. Irena Konývková<\/strong>, ředitelka festivalu/);
  assert.match(cs, /reditelka@zusostrov\.cz/);
  assert.match(cs, /tel:\+420776080097/);
  assert.match(cs, /<h3>Starší ročníky<\/h3>/);
  assert.match(cs, /vary\.rozhlas\.cz/);
});

test("Press shows poster and PDF downloads once set", async () => {
  const p = await fixture("programme-out");
  assert.match(p.get("/pro-media/"), /poster-2025\.jpg" download>Plakát 2027 \(JPG\)/);
  assert.match(p.get("/en/press/"), /programme-test\.pdf" download>Programme 2027 \(PDF\)/);
});

test("OG image is absolute with SITE_URL and relative without", async () => {
  const withUrl = await fixture(null, { SITE_URL: "https://soukani.cz" });
  assert.match(withUrl.get("/"), /property="og:image" content="https:\/\/soukani\.cz\/assets\/identity\/2025\/logo-barevne\.png"/);
  const without = await fixture(null, { SITE_URL: undefined });
  assert.match(without.get("/"), /property="og:image" content="\/assets\/identity\/2025\/logo-barevne\.png"/);
});

test("no iframe or third-party script in any output", async () => {
  const p = await fixture();
  for (const [url, html] of p) {
    if (!url.endsWith("/") && !url.endsWith(".html")) continue;
    assert.doesNotMatch(html, /<iframe/i, url);
    assert.doesNotMatch(html, /<script[^>]*\ssrc=/i, url);
  }
});
