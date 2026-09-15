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
    assert.match(seed.get(url), /src="\/assets\/identity\/2025\/logo-barevne\.png"/, url);
  }
  const rolled = await build({ PATH_PREFIX: undefined, CONTENT_DIR: "test/fixtures/rollover-2029" });
  assert.match(rolled.get("/"), /--accent: #1B7F5C;/);
  assert.match(rolled.get("/"), /<meta name="theme-color" content="#1B7F5C">/);
  assert.match(rolled.get("/404.html"), /--accent: #1B7F5C;/);
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
  assert.match(home, /class="hero-logo"><img src="\/assets\/identity\/2025\/logo-barevne\.png" alt=""/);
});
