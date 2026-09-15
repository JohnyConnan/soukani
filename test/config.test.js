import { test } from "node:test";
import assert from "node:assert/strict";
import buildData from "../src/_data/build.js";
import { absoluteUrl, normalizePathPrefix, normalizeSiteUrl, isTemporaryHost } from "../lib/urls.js";
import { build } from "./helpers.js";

test("pathPrefix defaults to / when PATH_PREFIX is unset", () => {
  delete process.env.PATH_PREFIX;
  delete process.env.SITE_URL;
  const data = buildData();
  assert.equal(data.pathPrefix, "/");
  assert.equal(data.url, "");
  assert.equal(data.absoluteUrl("/en/"), "/en/");
});

test("prefix normalisation adds missing slashes", () => {
  assert.equal(normalizePathPrefix("soukani"), "/soukani/");
  assert.equal(normalizePathPrefix("/soukani"), "/soukani/");
  assert.equal(normalizePathPrefix("/soukani/"), "/soukani/");
  assert.equal(normalizePathPrefix(""), "/");
});

test("SITE_URL with and without trailing slash yields one canonical form", () => {
  assert.equal(normalizeSiteUrl("https://johnyconnan.github.io/"), "https://johnyconnan.github.io");
  assert.equal(normalizeSiteUrl("https://johnyconnan.github.io"), "https://johnyconnan.github.io");
  assert.equal(
    absoluteUrl("https://johnyconnan.github.io/", "/soukani/", "/en/"),
    "https://johnyconnan.github.io/soukani/en/",
  );
  assert.equal(absoluteUrl("https://soukani.cz", "/", "/"), "https://soukani.cz/");
});

test("temporary host detection drives the noindex guard", () => {
  assert.equal(isTemporaryHost("https://johnyconnan.github.io"), true);
  assert.equal(isTemporaryHost("https://soukani.cz"), false);
  assert.equal(isTemporaryHost(""), true);
});

test("with PATH_PREFIX=/soukani/ a root-relative link is rewritten in output", async () => {
  const pages = await build({ PATH_PREFIX: "/soukani/", SITE_URL: "https://johnyconnan.github.io" });
  const home = pages.get("/");
  assert.ok(home, "home page rendered");
  assert.match(home, /href="\/soukani\/en\/"/);
  assert.ok(pages.has("/en/"), "English home rendered");
});

test("without PATH_PREFIX links stay root-relative", async () => {
  const pages = await build({ PATH_PREFIX: undefined, SITE_URL: undefined });
  assert.match(pages.get("/"), /href="\/en\/"/);
  assert.ok(pages.has("/404.html"));
});
