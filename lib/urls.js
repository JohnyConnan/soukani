/**
 * URL helpers shared by the Eleventy config, the build data module and the templates.
 * Everything here is pure: no environment access, so tests can pass values directly.
 */

/** Normalises a path prefix to the form "/x/" (leading and trailing slash); empty → "/". */
export function normalizePathPrefix(value) {
  let prefix = (value ?? "").trim();
  if (prefix === "" || prefix === "/") return "/";
  if (!prefix.startsWith("/")) prefix = "/" + prefix;
  if (!prefix.endsWith("/")) prefix += "/";
  return prefix.replace(/\/{2,}/g, "/");
}

/** Normalises the site origin: trims, drops trailing slashes; empty → "" (relative URLs). */
export function normalizeSiteUrl(value) {
  const url = (value ?? "").trim();
  return url.replace(/\/+$/, "");
}

/** Joins origin + prefix + path into one absolute URL without doubled slashes. */
export function absoluteUrl(siteUrl, pathPrefix, path = "/") {
  const origin = normalizeSiteUrl(siteUrl);
  const prefix = normalizePathPrefix(pathPrefix);
  const rel = String(path ?? "/").replace(/^\/+/, "");
  return origin + prefix + rel;
}

/** True when the host is a temporary GitHub Pages address (used for the noindex guard). */
export function isTemporaryHost(siteUrl) {
  const origin = normalizeSiteUrl(siteUrl);
  if (!origin) return true;
  try {
    return new URL(origin).hostname.endsWith("github.io");
  } catch {
    return true;
  }
}
