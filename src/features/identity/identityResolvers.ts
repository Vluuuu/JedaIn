/**
 * Centralized identity mapping helpers across surfaces.
 * Compliant with CROSS_SURFACE_INTEGRATION_CONTRACT.md section 14.
 */

export const KNOWN_ORGANIZER_REFS: Record<string, string> = {
  eo_jeda_alam: "org_lereng_batu",
  eo_kreatif_desa: "org_kreatif_desa",
};

/**
 * Resolves the organizer review target reference from an EO identity ID.
 */
export function resolveOrganizerReviewRef(eoId: string): string {
  if (!eoId) return "org_default";
  return KNOWN_ORGANIZER_REFS[eoId] ?? eoId;
}

/**
 * Resolves the destination review target reference from a destination object or name.
 */
export function resolveDestinationReviewRef(
  destination: { name: string } | string,
): string {
  if (typeof destination === "string") {
    return destination.trim();
  }
  return destination?.name ? destination.name.trim() : "";
}
