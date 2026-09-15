import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { loadDb } from "../../lib/db.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

/**
 * The single validated entry point for all content. Real builds read content/. Tests set
 * CONTENT_DIR to a fixture directory; files missing there fall back to the frozen seed under
 * test/fixtures/seed (never to the live content/, so editing content never breaks the tests).
 */
export default function () {
  const live = join(root, "content");
  if (!process.env.CONTENT_DIR) return loadDb(live, { srcDir: join(root, "src") });
  const dir = resolve(root, process.env.CONTENT_DIR);
  const seed = join(root, "test/fixtures/seed");
  return loadDb(dir, { srcDir: join(root, "src"), fallbackDir: dir === seed ? null : seed });
}
