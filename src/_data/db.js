import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { loadDb } from "../../lib/db.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

/**
 * The single validated entry point for all content. CONTENT_DIR (tests) points at a fixture
 * directory; files missing there fall back to the real content/ directory.
 */
export default function () {
  const seed = join(root, "content");
  const dir = process.env.CONTENT_DIR ? resolve(root, process.env.CONTENT_DIR) : seed;
  return loadDb(dir, { srcDir: join(root, "src"), fallbackDir: dir === seed ? null : seed });
}
