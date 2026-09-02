import { mockDestinationVerificationStore } from "../admin/mockDestinationVerificationStore";
import { partnerSessionStore } from "../eo/partnerSessionStore";
import type { DestinationRecord } from "../eo/types";
import { resolveAuthenticatedDestinationContext } from "./destinationContext";
import type { DestinationApplicationDraft } from "./types";

export const mockDestinationPartnerService = {
  submitApplication(draft: DestinationApplicationDraft): {
    success: boolean;
    message?: string;
    applicationId?: string;
  } {
    const partner = partnerSessionStore.get();
    if (!partner || partner.role !== "DESTINATION") {
      return {
        success: false,
        message:
          "Akses ditolak: Hanya Mitra Destinasi terautentikasi yang dapat mengajukan verifikasi.",
      };
    }

    const res = mockDestinationVerificationStore.submitApplication({
      partnerIdentityId: partner.id,
      name: draft.name,
      locationLabel: draft.locationLabel,
      province: draft.province,
      city: draft.city,
      managementName: draft.managementName,
      contactPerson: draft.contactPerson,
      phone: draft.phone,
      email: draft.email,
      legalEntityDoc: draft.legalEntityDoc,
      baseCostPerPerson: draft.baseCostPerPerson,
      description: draft.description,
      highlights: draft.highlights,
      capacityPerSession: draft.capacityPerSession,
      guideReady: draft.guideReady,
      guideReadinessEvidence: draft.guideReadinessEvidence,
      agreedToSop: draft.agreedToSop,
    });

    if (!res.success || !res.application) {
      return {
        success: false,
        message: res.message ?? "Gagal memproses pengajuan destinasi.",
      };
    }

    return { success: true, applicationId: res.application.applicationId };
  },

  getCanonicalDestinationForPartner(): DestinationRecord | undefined {
    const context = resolveAuthenticatedDestinationContext();
    return context?.destination;
  },
};
