/**
 * Canonical public site URL.
 *
 * Anything that leaves the app (emails, invite links, shareable booking links,
 * QR/kiosk URLs, auth redirect targets) must use this instead of
 * `window.location.origin`, otherwise links generated from the editor preview
 * point at the preview domain instead of the real site.
 */
export const PUBLIC_SITE_URL = "https://booksuite.online";

const isLocalDev = () =>
  typeof window !== "undefined" &&
  /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname);

/** Base origin for outbound links (localhost only during local development). */
export const publicOrigin = (): string =>
  isLocalDev() ? window.location.origin : PUBLIC_SITE_URL;

/** Build an absolute public URL for a path, e.g. publicUrl("/join?code=ABC"). */
export const publicUrl = (path = ""): string => {
  const base = publicOrigin();
  if (!path) return base;
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
};
