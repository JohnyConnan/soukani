import { normalizePathPrefix, normalizeSiteUrl, absoluteUrl, isTemporaryHost } from "../../lib/urls.js";

/**
 * Build-time variables. Read inside the function (not at module top level) so tests can
 * vary PATH_PREFIX and SITE_URL per Eleventy instance within one process.
 */
export default function () {
  const pathPrefix = normalizePathPrefix(process.env.PATH_PREFIX);
  const url = normalizeSiteUrl(process.env.SITE_URL);
  return {
    url,
    pathPrefix,
    isTemporaryHost: isTemporaryHost(url),
    absoluteUrl: (path) => absoluteUrl(url, pathPrefix, path),
    time: new Date().toISOString(),
  };
}
