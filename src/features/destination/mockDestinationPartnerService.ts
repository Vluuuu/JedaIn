import { mockDestinationVerificationStore } from "../admin/mockDestinationVerificationStore";
import { mockDestinationStore } from "../eo/mockDestinationStore";
import { partnerSessionStore } from "../eo/partnerSessionStore";
import type { DestinationRecord } from "../eo/types";
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
      destinationIdentityId: draft.destinationIdentityId,
      name: draft.name,
      locationLabel: draft.locationLabel,
      province: draft.province,
      city: draft.city,
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
    const partner = partnerSessionStore.get();
    if (!partner || partner.role !== "DESTINATION") return undefined;

    const app = mockDestinationVerificationStore.getByPartnerId(partner.id);
    if (!app || app.status !== "APPROVED") return undefined;

    return mockDestinationStore.getById(app.destinationIdentityId);
  },
};
