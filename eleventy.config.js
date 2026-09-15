import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { HtmlBasePlugin } from "@11ty/eleventy";
import { normalizePathPrefix } from "./lib/urls.js";

export default function (eleventyConfig) {
  // Read inside the function so tests can vary the prefix per Eleventy instance.
  const pathPrefix = normalizePathPrefix(process.env.PATH_PREFIX);

  eleventyConfig.addPlugin(HtmlBasePlugin);
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addWatchTarget("./content/");
  eleventyConfig.setServerOptions({ watch: ["content/**/*.yaml"] });

  // GitHub Pages must not run Jekyll over the output.
  eleventyConfig.on("eleventy.after", async ({ dir }) => {
    if (dir?.output) await writeFile(join(dir.output, ".nojekyll"), "");
  });

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    pathPrefix,
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
