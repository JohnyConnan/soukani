import { test, before } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import YAML from "yaml";
import { build } from "./helpers.js";

let pages;
before(async () => {
  pages = await build({ PATH_PREFIX: undefined, SITE_URL: "https://soukani.cz" });
});
const htmlPages = () => [...pages].filter(([u]) => u.endsWith("/") || u.endsWith(".html"));

test("no design leftovers or invented facts in any output", () => {
  for (const [url, html] of htmlPages()) {
    for (const needle of ["lorem", "TODO", "placeholder", "MDDM", "JAMU", "28. 4.", "12–20", "šapitó"]) {
      assert.ok(!html.toLowerCase().includes(needle.toLowerCase()), `${url} contains "${needle}"`);
    }
  }
});

test("every page has a non-empty title and description in both languages", () => {
  for (const [url, html] of htmlPages()) {
    assert.match(html, /<title>[^<]{5,}<\/title>/, url);
    assert.match(html, /<meta name="description" content="[^"]{20,}">/, url);
  }
});

test("footer IČO matches the public registry and partner logos exist on disk", () => {
  assert.match(pages.get("/"), /IČO 49753606/);
  const partners = YAML.parse(readFileSync("content/partners.yaml", "utf8"));
  assert.equal(partners.length, 3);
  for (const p of partners) assert.ok(existsSync(`src/${p.logo}`), p.logo);
});

test("every external link is https with a host", () => {
  for (const [url, html] of htmlPages()) {
    for (const m of html.matchAll(/href="([^"]+)"/g)) {
      const href = m[1];
      if (href.startsWith("/") || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) continue;
      assert.match(href, /^https:\/\/[a-z0-9.-]+\.[a-z]{2,}(\/|$|\?)/i, `${url}: ${href}`);
    }
  }
});

test("home carries one JSON-LD Event with the 2027 facts and an Organization block", () => {
  const html = pages.get("/");
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
  const events = blocks.filter((b) => b["@type"] === "Event");
  assert.equal(events.length, 1);
  const ev = events[0];
  assert.equal(ev.startDate, "2027-05-05");
  assert.equal(ev.endDate, "2027-05-09");
  assert.equal(ev.location.name, "Kulturní a kreativní centrum Ostrov");
  assert.match(ev.organizer.name, /Základní umělecká škola Ostrov/);
  assert.equal(ev.image, "https://soukani.cz/assets/identity/2025/logo-barevne.png");
  assert.equal(ev.url, "https://soukani.cz/");
  const org = blocks.find((b) => b["@type"] === "Organization");
  assert.ok(org, "Organization block");
  assert.deepEqual(org.sameAs, ["https://www.facebook.com/SoukaniOstrov"]);
  assert.ok(!pages.get("/dilny/").includes('"@type":"Event"'), "no Event on the workshops page");
  assert.ok(pages.get("/program/").includes('"@type":"Event"'), "Event on the programme page");
});

test("with null edition dates no Event is emitted but Organization remains", async () => {
  const p = await build({ PATH_PREFIX: undefined, SITE_URL: "https://soukani.cz", CONTENT_DIR: "test/fixtures/null-dates" });
  assert.ok(!p.get("/").includes('"@type":"Event"'));
  assert.ok(p.get("/").includes('"@type":"Organization"'));
});

test("llms.txt names the festival, the dates and the About and Programme URLs in both languages", () => {
  const txt = pages.get("/llms.txt");
  assert.match(txt, /^# Soukání Ostrov/);
  assert.match(txt, /5–9 May 2027/);
  assert.match(txt, /https:\/\/soukani\.cz\/en\/about\//);
  assert.match(txt, /https:\/\/soukani\.cz\/o-festivalu\//);
  assert.match(txt, /https:\/\/soukani\.cz\/en\/programme\//);
  assert.match(txt, /https:\/\/soukani\.cz\/program\//);
  assert.match(txt, /Actors aged 14–18/);
});
