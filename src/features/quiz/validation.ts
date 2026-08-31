import type { GroupSizeBand, GroupType } from "./types";

/**
 * Validates group_type and group_size_band according to the canonical contract:
 * - SOLO -> ONE
 * - PARTNER -> TWO
 * - FRIENDS -> TWO | THREE_TO_FOUR | FIVE_PLUS
 * - FAMILY -> TWO | THREE_TO_FOUR | FIVE_PLUS
 */
export function isValidGroupContext(
  groupType?: GroupType,
  groupSizeBand?: GroupSizeBand,
): boolean {
  if (!groupType || !groupSizeBand) {
    return false;
  }

  switch (groupType) {
    case "SOLO":
      return groupSizeBand === "ONE";
    case "PARTNER":
      return groupSizeBand === "TWO";
    case "FRIENDS":
    case "FAMILY":
      return (
        groupSizeBand === "TWO" ||
        groupSizeBand === "THREE_TO_FOUR" ||
        groupSizeBand === "FIVE_PLUS"
      );
    default:
      return false;
  }
}
