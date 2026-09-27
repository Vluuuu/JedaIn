import { mockDestinationVerificationStore } from "../admin/mockDestinationVerificationStore";
import { mockDestinationStore } from "../eo/mockDestinationStore";
import { partnerSessionStore } from "../eo/partnerSessionStore";
import type { DestinationMediaItem, DestinationRecord } from "../eo/types";
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
      baseCostIncludes: draft.baseCostIncludes,
      baseCostExcludes: draft.baseCostExcludes,
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

  addGalleryMedia(input: {
    url: string;
    label: string;
    category?: "DESTINATION" | "FACILITY";
  }): {
    success: boolean;
    message?: string;
    media?: DestinationMediaItem;
  } {
    const context = resolveAuthenticatedDestinationContext();
    if (!context) {
      return {
        success: false,
        message:
          "Akses galeri hanya tersedia untuk Mitra Destinasi terverifikasi.",
      };
    }

    const mediaData = input.url.match(
      /^data:image\/(?:jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/,
    );
    if (!mediaData) {
      return {
        success: false,
        message: "Format visual harus JPG, PNG, atau WebP.",
      };
    }
    const encoded = mediaData[1];
    const byteLength =
      (encoded.length * 3) / 4 -
      (encoded.endsWith("==") ? 2 : encoded.endsWith("=") ? 1 : 0);
    if (byteLength > 5 * 1024 * 1024) {
      return { success: false, message: "Ukuran visual maksimal 5 MB." };
    }

    const currentGallery = context.destination.mediaGallery ?? [];

    const media: DestinationMediaItem = {
      mediaId: `media_${context.destination.destinationId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      url: input.url,
      label: input.label.trim() || "Visual destinasi",
      provenance: "DESTINATION_SOURCE",
      category: input.category ?? "DESTINATION",
    };

    mockDestinationStore.updateMediaGallery(context.destination.destinationId, [
      ...currentGallery,
      media,
    ]);

    return { success: true, media };
  },

  updateDescription(description: string): {
    success: boolean;
    message?: string;
  } {
    const context = resolveAuthenticatedDestinationContext();
    if (!context) {
      return {
        success: false,
        message:
          "Akses perubahan profil hanya tersedia untuk Mitra Destinasi aktif.",
      };
    }

    const normalized = description.trim();
    if (normalized.length < 20) {
      return {
        success: false,
        message: "Deskripsi destinasi minimal 20 karakter.",
      };
    }

    mockDestinationStore.updateDescription(
      context.destination.destinationId,
      normalized,
    );
    return { success: true };
  },

  updateLocalGuideFee(localGuideFeePerPerson: number): {
    success: boolean;
    message?: string;
  } {
    const context = resolveAuthenticatedDestinationContext();
    if (!context) {
      return {
        success: false,
        message:
          "Akses tarif pemandu hanya tersedia untuk Mitra Destinasi aktif.",
      };
    }

    if (
      !Number.isFinite(localGuideFeePerPerson) ||
      localGuideFeePerPerson < 0
    ) {
      return {
        success: false,
        message: "Tarif pemandu lokal harus bernilai 0 atau lebih.",
      };
    }

    mockDestinationStore.updateLocalGuideFee(
      context.destination.destinationId,
      localGuideFeePerPerson,
    );
    return { success: true };
  },

  removeGalleryMedia(mediaId: string): { success: boolean; message?: string } {
    const context = resolveAuthenticatedDestinationContext();
    if (!context) {
      return {
        success: false,
        message:
          "Akses galeri hanya tersedia untuk Mitra Destinasi terverifikasi.",
      };
    }

    const currentGallery = context.destination.mediaGallery ?? [];
    const target = currentGallery.find((media) => media.mediaId === mediaId);
    if (!target) {
      return { success: false, message: "Visual tidak ditemukan." };
    }

    if (target.provenance !== "DESTINATION_SOURCE") {
      return {
        success: false,
        message: "Visual prototype bawaan tidak dapat dihapus oleh Mitra.",
      };
    }

    mockDestinationStore.updateMediaGallery(
      context.destination.destinationId,
      currentGallery.filter((media) => media.mediaId !== mediaId),
    );
    return { success: true };
  },
};
