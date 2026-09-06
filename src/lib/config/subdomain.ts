/**
 * Subdomain detection utility for JedaIn multi-surface hosting.
 * Identifies whether the current request is served from the dedicated EO subdomain (eo.jedain.biz.id).
 * Supports search parameter override (?subdomain=eo) for preview environments.
 */
export function isEoSubdomain(hostname?: string): boolean {
  if (typeof window === "undefined" && !hostname) return false;

  if (typeof window !== "undefined" && window.location?.search) {
    const params = new URLSearchParams(window.location.search);
    if (params.get("subdomain") === "eo") return true;
  }

  const host = (
    hostname ?? (typeof window !== "undefined" ? window.location.hostname : "")
  ).toLowerCase();

  return (
    host.startsWith("eo.") ||
    host === "eo.jedain.biz.id" ||
    host === "eo.localhost"
  );
}
