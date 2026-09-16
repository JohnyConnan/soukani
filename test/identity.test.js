import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { build, SEED } from "./helpers.js";

const cssDir = "src/assets/css";
const css = readdirSync(cssDir).map((f) => readFileSync(join(cssDir, f), "utf8")).join("\n");

test("AE4: accent and logo come from the edition record on every page", async () => {
  const seed = await build({ PATH_PREFIX: undefined, CONTENT_DIR: SEED });
  for (const url of ["/", "/en/", "/dilny/", "/en/press/", "/404.html"]) {
    assert.match(seed.get(url), /--accent: #FF6B2C;/, url);
    // The header badge, the favicon and the Přihlášky badge take the colour logo; the hero, whose
    // band is the accent colour, takes the negative one.
    assert.match(seed.get(url), /src="\/assets\/identity\/2025\/logo-[a-z]+\.png"/, url);
    assert.match(seed.get(url), /href="\/assets\/identity\/2025\/logo-barevne\.png" type="image\/png"/, url);
  }
  const rolled = await build({ PATH_PREFIX: undefined, CONTENT_DIR: "test/fixtures/rollover-2029" });
  assert.match(rolled.get("/"), /--accent: #1B7F5C;/);
  assert.match(rolled.get("/"), /<meta name="theme-color" content="#1B7F5C">/);
  assert.match(rolled.get("/404.html"), /--accent: #1B7F5C;/);
});

test("each logo variant sits where it reads: colour in the header and on Přihlášky, negative on the accent band", async () => {
  const pages = await build({ PATH_PREFIX: undefined, CONTENT_DIR: SEED });
  const logo = (v) => new RegExp(`/assets/identity/2025/logo-${v}\\.png`);
  assert.match(pages.get("/"), /class="brand-logo" src="\/assets\/identity\/2025\/logo-barevne\.png"/);
  assert.match(pages.get("/"), /class="hero-logo"><img src="\/assets\/identity\/2025\/logo-negativ\.png"/);
  assert.doesNotMatch(pages.get("/").slice(pages.get("/").indexOf('class="rings"')), logo("barevne"));
  assert.match(pages.get("/prihlasky/"), /class="page-head-logo" aria-hidden="true">\s*<img src="\/assets\/identity\/2025\/logo-barevne\.png"/);
  assert.match(pages.get("/en/applications/"), logo("barevne"));
});

test("CSS honours prefers-reduced-motion and defines focus-visible", () => {
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?animation: none/);
  assert.match(css, /:focus-visible \{/);
});

test("no stylesheet or font request targets an external host", async () => {
  const pages = await build({ PATH_PREFIX: undefined, CONTENT_DIR: SEED });
  for (const [url, html] of pages) {
    if (!url.endsWith("/") && !url.endsWith(".html")) continue;
    const externalLinks = [...html.matchAll(/<link[^>]+href="(https?:)?\/\/[^"]+"/g)].filter((m) => !/rel="(canonical|alternate)"/.test(m[0]));
    assert.deepEqual(externalLinks.map((m) => m[0]), [], url);
    assert.doesNotMatch(html, /<script[^>]+src=/, url);
  }
  assert.doesNotMatch(css, /url\(\s*["']?https?:/);
});

test("CSS url() references are relative to the stylesheet, never root-absolute", () => {
  assert.doesNotMatch(css, /url\(\s*["']?\//);
});

test("hero decoration is aria-hidden and the logo image is present", async () => {
  const pages = await build({ PATH_PREFIX: undefined, CONTENT_DIR: SEED });
  const home = pages.get("/");
  assert.match(home, /<div class="rings" aria-hidden="true">/);
  // The hero band is the accent colour, so it takes the negative variant, not the colour one.
  assert.match(home, /class="hero-logo"><img src="\/assets\/identity\/2025\/logo-negativ\.png" alt=""/);
});

test("the hero spider has its own orbit and the ring insets the script cycles exist in the CSS", async () => {
  const home = (await build({ PATH_PREFIX: undefined, CONTENT_DIR: SEED })).get("/");
  // The spider rides an orbit of its own so the script can move it between rings.
  assert.match(home, /<div class="orbit os"><span class="spider">/);
  assert.match(home, /--spider-ring/, "the hop script must ship with the page");
  // Every inset the script cycles through has to be a ring that is actually drawn, or the spider
  // walks on nothing. Keep these two lists in step when the ring sizes change.
  const script = home.slice(home.indexOf("RINGS = ["));
  const cycled = script.slice(0, script.indexOf("]")).match(/\d+(\.\d+)?%/g);
  assert.equal(cycled.length, 3);
  for (const inset of cycled) {
    assert.match(css, new RegExp(`\\.ring\\.r\\d \\{ inset: ${inset.replace(".", "\\.")};`), inset);
  }
});

test("only the spider takes the pointer inside the decorative rings", () => {
  assert.match(css, /\.rings \{[^}]*pointer-events: none;/);
  assert.match(css, /\.spider \{[^}]*pointer-events: auto;/);
  // Reduced motion freezes the hop and takes the spider back out of the pointer's way.
  const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
  assert.match(reduced, /\.orbit\.os \{ transition: none; \}/);
  assert.match(reduced, /\.spider \{ pointer-events: none/);
});
