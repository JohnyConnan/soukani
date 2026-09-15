import { test, before } from "node:test";
import assert from "node:assert/strict";
import { build, SEED } from "./helpers.js";

let pages;
before(async () => {
  pages = await build({ PATH_PREFIX: undefined, SITE_URL: "https://johnyconnan.github.io", CONTENT_DIR: SEED });
});

const EXPECTED = {
  home: ["/", "/en/"], about: ["/o-festivalu/", "/en/about/"], groups: ["/soubory/", "/en/groups/"],
  programme: ["/program/", "/en/programme/"], workshops: ["/dilny/", "/en/workshops/"],
  photos: ["/fotogalerie/", "/en/photos/"], press: ["/pro-media/", "/en/press/"],
};

test("AE1: the Czech workshops page switches to the English workshops page and back", () => {
  assert.match(pages.get("/dilny/"), /class="lang-switch" href="\/en\/workshops\/" hreflang="en" lang="en"/);
  assert.match(pages.get("/en/workshops/"), /class="lang-switch" href="\/dilny\/" hreflang="cs" lang="cs"/);
});

test("every registry page produces exactly its two permalinks", () => {
  for (const [key, urls] of Object.entries(EXPECTED)) for (const url of urls) assert.ok(pages.has(url), `${key} → ${url}`);
  const htmlPages = [...pages.keys()].filter((u) => u.endsWith("/") || u.endsWith(".html"));
  assert.equal(htmlPages.length, 16 + 1, "eight registry pages × two languages + 404");
});

test("each output carries lang, one canonical, two hreflang alternates and x-default → English", () => {
  for (const [cs, en] of Object.values(EXPECTED)) {
    for (const [url, lang] of [[cs, "cs"], [en, "en"]]) {
      const html = pages.get(url);
      assert.match(html, new RegExp(`<html lang="${lang}">`), url);
      assert.equal((html.match(/rel="canonical"/g) || []).length, 1, `${url} canonical`);
      assert.match(html, new RegExp(`rel="canonical" href="https://johnyconnan.github.io${url.replace(/\//g, "\\/")}"`));
      assert.match(html, new RegExp(`hreflang="cs" href="https://johnyconnan.github.io${cs.replace(/\//g, "\\/")}"`));
      assert.match(html, new RegExp(`hreflang="en" href="https://johnyconnan.github.io${en.replace(/\//g, "\\/")}"`));
      assert.match(html, new RegExp(`hreflang="x-default" href="https://johnyconnan.github.io${en.replace(/\//g, "\\/")}"`));
      assert.match(html, /<meta name="description" content="[^"]+">/);
      assert.match(html, /<title>[^<]+<\/title>/);
    }
  }
});

test("home counterpart is /en/, not /en//", () => {
  assert.match(pages.get("/"), /class="lang-switch" href="\/en\/"/);
  assert.doesNotMatch(pages.get("/"), /\/en\/\//);
});

test("menu order follows R6 in both languages", () => {
  const labels = (html) => [...html.matchAll(/<nav class="menu"[\s\S]*?<\/nav>/g)][0][0].match(/>([^<]+)<\/a>/g).map((m) => m.slice(1, -4));
  assert.deepEqual(labels(pages.get("/")), ["Úvod", "O festivalu", "Přihlášky", "Program", "Dílny", "Fotogalerie", "Pro média"]);
  assert.deepEqual(labels(pages.get("/en/")), ["Home", "About", "Applications", "Programme", "Workshops", "Photos", "Press"]);
});

test("footer holds IČO, four contact roles, Facebook, three partner logos and the old-site link", () => {
  const html = pages.get("/o-festivalu/");
  const footer = html.slice(html.indexOf('<footer'));
  assert.doesNotMatch(footer, /footer-logo/, "the festival logo is not repeated in the footer");
  assert.match(footer, /IČO 49753606/);
  assert.equal((footer.match(/class="contact-role"/g) || []).length, 4);
  assert.match(footer, /https:\/\/www\.facebook\.com\/SoukaniOstrov/);
  assert.equal((footer.match(/<img src="\/assets\/partners\//g) || []).length, 3);
  assert.match(footer, /https:\/\/hophop\.zusostrov\.cz\/soukani-cs\.html/);
  assert.match(footer, /href="\/archiv\/"/);
  assert.match(pages.get("/en/about/"), /href="\/en\/archive\/"/);
});

test("header menu is a details/summary disclosure with a labelled toggle", () => {
  const html = pages.get("/");
  assert.match(html, /<details class="nav">\s*<summary class="nav-toggle" aria-expanded="false">/);
  assert.match(html, /nav-toggle-label">Menu</);
  assert.match(html, /aria-current="page"/);
});

test("404 links to both homepages", () => {
  const html = pages.get("/404.html");
  assert.match(html, /href="\/">Na úvodní stránku</);
  assert.match(html, /href="\/en\/">Go to the homepage</);
});

test("noindex is emitted on the github.io host only", async () => {
  for (const url of Object.values(EXPECTED).flat()) assert.match(pages.get(url), /<meta name="robots" content="noindex">/, url);
  const live = await build({ PATH_PREFIX: undefined, SITE_URL: "https://soukani.cz", CONTENT_DIR: SEED });
  for (const url of Object.values(EXPECTED).flat()) assert.doesNotMatch(live.get(url), /noindex/, url);
  assert.match(live.get("/"), /rel="canonical" href="https:\/\/soukani\.cz\/"/);
});

test("with PATH_PREFIX the menu, assets and switch are prefixed", async () => {
  const prefixed = await build({ PATH_PREFIX: "/soukani/", SITE_URL: "https://johnyconnan.github.io", CONTENT_DIR: SEED });
  const html = prefixed.get("/dilny/");
  assert.match(html, /href="\/soukani\/en\/workshops\/"/);
  assert.match(html, /href="\/soukani\/assets\/css\/site\.css"/);
  assert.match(html, /rel="canonical" href="https:\/\/johnyconnan\.github\.io\/soukani\/dilny\/"/);
  assert.match(html, /hreflang="x-default" href="https:\/\/johnyconnan\.github\.io\/soukani\/en\/workshops\/"/);
});
