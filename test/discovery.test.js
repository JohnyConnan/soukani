import { test, before } from "node:test";
import assert from "node:assert/strict";
import { build } from "./helpers.js";

let pages;
before(async () => {
  pages = await build({ PATH_PREFIX: "/soukani/", SITE_URL: "https://johnyconnan.github.io" });
});

test("sitemap lists every registry page in both languages with absolute URLs and alternates", () => {
  const xml = pages.get("/sitemap.xml");
  assert.ok(xml, "sitemap rendered");
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.equal(locs.length, 16, "eight registry pages × two languages");
  assert.ok(locs.includes("https://johnyconnan.github.io/soukani/"));
  assert.ok(locs.includes("https://johnyconnan.github.io/soukani/en/workshops/"));
  assert.ok(locs.includes("https://johnyconnan.github.io/soukani/archiv/"));
  assert.match(xml, /<xhtml:link rel="alternate" hreflang="en" href="https:\/\/johnyconnan\.github\.io\/soukani\/en\/workshops\/"\/>/);
  assert.doesNotMatch(xml, /href="\/(?!\/)/, "no root-relative URLs in the sitemap");
});

test("robots.txt allows all crawlers and names the sitemap", () => {
  const txt = pages.get("/robots.txt");
  assert.match(txt, /User-agent: \*\nAllow: \//);
  assert.match(txt, /Sitemap: https:\/\/johnyconnan\.github\.io\/soukani\/sitemap\.xml/);
});
