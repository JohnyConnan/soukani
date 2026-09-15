import Eleventy from "@11ty/eleventy";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Builds the site programmatically (no files written) and returns a Map url → html.
 * `env` values are applied to process.env for the duration of the build.
 */
export async function build(env = {}) {
  const previous = {};
  for (const [k, v] of Object.entries(env)) {
    previous[k] = process.env[k];
    if (v === undefined || v === null) delete process.env[k];
    else process.env[k] = v;
  }
  try {
    const elev = new Eleventy(join(root, "src"), join(root, "_site"), {
      quietMode: true,
      configPath: join(root, "eleventy.config.js"),
    });
    const pages = await elev.toJSON();
    const byUrl = new Map();
    for (const p of pages) byUrl.set(p.url, p.content);
    return byUrl;
  } finally {
    for (const [k, v] of Object.entries(previous)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}
