import Eleventy from "@11ty/eleventy";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import YAML from "yaml";

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

export const SEED = "test/fixtures/seed";

/** Builds with a fixture directory from test/fixtures/ (the frozen seed when `name` is null) and no path prefix. */
export function buildFixture(name = null, env = {}) {
  return build({ PATH_PREFIX: undefined, CONTENT_DIR: name ? `test/fixtures/${name}` : SEED, ...env });
}

/** Writes a temporary fixture whose 2027 record is changed by `mutate`; returns its path (caller removes it). */
export function editionVariant(mutate, base = SEED) {
  const dir = mkdtempSync(join(tmpdir(), "soukani-variant-"));
  cpSync(join(root, base), dir, { recursive: true }); // carry the fixture's own files and test assets along
  const editions = YAML.parse(readFileSync(join(root, base, "editions.yaml"), "utf8"));
  mutate(editions.find((e) => e.year === 2027), editions);
  writeFileSync(join(dir, "editions.yaml"), YAML.stringify(editions));
  return dir;
}
