import { test, before } from "node:test";
import assert from "node:assert/strict";
import { build } from "./helpers.js";

/**
 * The only tests that read the live content/ directory. They check invariants that must hold
 * for any valid content, never specific facts, so editing content cannot break the deploy.
 */
let pages;
before(async () => {
  pages = await build({ PATH_PREFIX: "/soukani/", SITE_URL: "https://johnyconnan.github.io", CONTENT_DIR: undefined });
});
const htmlPages = () => [...pages].filter(([u]) => u.endsWith("/") || u.endsWith(".html"));

test("live content builds and every page has a title, description, accent and logo", () => {
  assert.ok(htmlPages().length >= 15);
  for (const [url, html] of htmlPages()) {
    assert.match(html, /<title>[^<]{5,}<\/title>/, url);
    assert.match(html, /<meta name="description" content="[^"]{20,}">/, url);
    assert.match(html, /--accent: #[0-9A-Fa-f]{6};/, url);
    assert.doesNotMatch(html, /src="\/soukani\/"|href="\/soukani\/"[^>]*rel="icon"|\/undefined|\[object Object\]|>null<|content=""/, url);
  }
});

test("live content has no leftovers, broken anchors or non-https external links", () => {
  for (const [url, html] of htmlPages()) {
    for (const needle of ["lorem", "TODO", "placeholder", "MDDM", "JAMU"]) assert.ok(!html.toLowerCase().includes(needle.toLowerCase()), `${url} contains "${needle}"`);
    for (const m of html.matchAll(/href="([^"]+)"/g)) {
      const href = m[1];
      if (href.startsWith("/") || href.startsWith("mailto:") || href.startsWith("tel:")) continue;
      if (href.startsWith("#")) { assert.match(html, new RegExp(`id="${href.slice(1)}"`), `${url}: dangling anchor ${href}`); continue; }
      assert.match(href, /^https:\/\/[a-z0-9.-]+\.[a-z]{2,}(\/|$|\?)/i, `${url}: ${href}`);
    }
    for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) JSON.parse(m[1]);
  }
});
