import { normalizePathPrefix, normalizeSiteUrl, absoluteUrl, isTemporaryHost } from "../../lib/urls.js";

/**
 * Build-time variables. Read inside the function (not at module top level) so tests can
 * vary PATH_PREFIX and SITE_URL per Eleventy instance within one process.
 */
export default function () {
  const pathPrefix = normalizePathPrefix(process.env.PATH_PREFIX);
  const rawUrl = (process.env.SITE_URL ?? "").trim();
  if (rawUrl && !/^https:\/\/[^/\s?#]+\/?$/.test(rawUrl)) {
    throw new Error(`SITE_URL must be an https origin without a path, e.g. https://soukani.cz (got "${rawUrl}")`);
  }
  const url = normalizeSiteUrl(rawUrl);
  return {
    url,
    pathPrefix,
    isTemporaryHost: isTemporaryHost(url),
    // Without an origin the plugin still applies the prefix to root-relative hrefs, so emit the bare path.
    absoluteUrl: (path) => (url ? absoluteUrl(url, pathPrefix, path) : absoluteUrl("", "/", path)),
    time: new Date().toISOString(),
  };
}
