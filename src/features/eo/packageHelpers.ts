import type { EoPackageStatus } from "./types";

export function getHumanStatusLabel(status: EoPackageStatus): string {
  switch (status) {
    case "DRAFT":
      return "Draf";
    case "PENDING_ADMIN_REVIEW":
      return "Menunggu Review";
    case "REJECTED":
      return "Perlu Perbaikan";
    case "APPROVED":
      return "Disetujui";
    case "LIVE":
      return "Live";
  }
}

export function getStatusBadgeTone(
  status: EoPackageStatus,
): "success" | "warning" | "danger" | "neutral" {
  switch (status) {
    case "LIVE":
    case "APPROVED":
      return "success";
    case "PENDING_ADMIN_REVIEW":
      return "warning";
    case "REJECTED":
      return "danger";
    case "DRAFT":
    default:
      return "neutral";
  }
}
