import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { HtmlBasePlugin } from "@11ty/eleventy";
import { normalizePathPrefix } from "./lib/urls.js";
import { formatDate, formatRange, formatMonth, formatMonthIn, ordinal } from "./lib/dates.js";

export default function (eleventyConfig) {
  // Read inside the function so tests can vary the prefix per Eleventy instance.
  const pathPrefix = normalizePathPrefix(process.env.PATH_PREFIX);

  eleventyConfig.addPlugin(HtmlBasePlugin);

  // Content filters. `t` picks one language from a { cs, en } pair; `fill` replaces {tokens}.
  eleventyConfig.addFilter("t", (pair, lang) => {
    if (pair == null) return "";
    if (typeof pair !== "object") return pair;
    if (!(lang in pair)) throw new Error(`Copy pair has no "${lang}" value: ${JSON.stringify(pair)}`);
    return pair[lang];
  });
  eleventyConfig.addFilter("fill", (text, vars = {}) =>
    String(text ?? "").replace(/\{(\w+)\}/g, (m, k) => {
      if (!(k in vars)) throw new Error(`No value for token {${k}} in "${text}"`);
      return vars[k];
    }),
  );
  eleventyConfig.addFilter("date", formatDate);
  eleventyConfig.addFilter("range", formatRange);
  eleventyConfig.addFilter("month", formatMonth);
  eleventyConfig.addFilter("monthIn", formatMonthIn);
  eleventyConfig.addFilter("ordinal", ordinal);
  eleventyConfig.addFilter("groupBy", (list, key) => {
    const map = new Map();
    for (const item of list ?? []) {
      const k = item[key];
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(item);
    }
    return [...map.entries()].map(([k, items]) => ({ key: k, items }));
  });
  eleventyConfig.addFilter("where", (list, key, value) => (list ?? []).filter((i) => i[key] === value));
  eleventyConfig.addFilter("year", (iso) => String(iso ?? "").slice(0, 4));
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addWatchTarget("./content/");
  eleventyConfig.setServerOptions({ watch: ["content/**/*.yaml"] });

  // GitHub Pages must not run Jekyll over the output.
  eleventyConfig.on("eleventy.after", async ({ dir, outputMode }) => {
    if (outputMode !== "fs" || !dir?.output) return; // programmatic test builds write nothing
    await mkdir(dir.output, { recursive: true });
    await writeFile(join(dir.output, ".nojekyll"), "");
  });

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    pathPrefix,
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
