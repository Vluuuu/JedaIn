import type { PartnerUser } from "../eo/types";

const partnerRoleLabels: Record<PartnerUser["role"], string> = {
  EO: "TO",
  DESTINATION: "Mitra Destinasi",
  ADMIN: "Admin",
};

export function getPartnerRoleLabel(role: PartnerUser["role"]): string {
  return partnerRoleLabels[role];
}
