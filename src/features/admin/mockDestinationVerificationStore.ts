import { mockDestinationStore } from "../eo/mockDestinationStore";
import type { DestinationRecord } from "../eo/types";
import type { DestinationVerificationRecord } from "./types";

export const INITIAL_DESTINATION_APPLICATIONS: DestinationVerificationRecord[] =
  [
    {
      applicationId: "dest_app_lereng_hijau",
      partnerIdentityId: "dest_partner_lereng_hijau",
      destinationIdentityId: "dest_lereng_hijau",
      name: "Lereng Hijau Batu",
      locationLabel: "Batu / Malang Raya",
      province: "Jawa Timur",
      city: "Batu",
      managementName: "Pokdarwis Lereng Hijau",
      contactPerson: "Hadi Purnomo",
      contactPhone: "081233445566",
      contactEmail: "destinasi@lerenghijau.id",
      legalEntityDocument: {
        name: "Izin_Pengelolaan_Lereng_Batu.pdf",
        attachedAt: "2026-08-01T08:00:00Z",
        status: "VERIFIED",
      },
      baseCostPerPerson: 125000,
      description:
        "Kawasan perkebunan teh dan lereng bukit berkabut yang tenang, terkelola secara lestari bersama warga lokal. Memiliki pemandu lokal terlatih di lokasi.",
      highlights: [
        "Jalur jalan santai kebun teh dengan kontur landai",
        "Pemandu lokal standby dan ramah rute",
        "Saung santai dan fasilitas air bersih",
      ],
      capacityPerSession: 20,
      guideReadinessEvidence:
        "Tersedia 4 pemandu lokal terlatih dari kelompok tani binaan kawasan.",
      submittedAt: "2026-08-01T08:00:00Z",
      status: "APPROVED",
      approvedLevel: "BASIC",
      approvedGuideReady: true,
      reviewedAt: "2026-08-02T10:00:00Z",
    },
    {
      applicationId: "dest_app_coban_rondo",
      partnerIdentityId: "dest_partner_coban_rondo",
      destinationIdentityId: "dest_coban_rondo",
      name: "Hutan Pinus Coban Rondo",
      locationLabel: "Pujon, Malang",
      province: "Jawa Timur",
      city: "Batu / Malang",
      managementName: "Pengelola Coban Rondo",
      contactPerson: "Hadi",
      contactPhone: "0812998877",
      contactEmail: "partner@cobanrondo.id",
      legalEntityDocument: {
        name: "Izin_Hutan_Pinus.pdf",
        attachedAt: "2026-08-26T10:00:00Z",
        status: "ATTACHED",
      },
      baseCostPerPerson: 110000,
      description:
        "Kawasan hutan pinus alami berhawa dingin dengan area saung hening dan akses jalan tertata rapi.",
      highlights: [
        "Jalur jalan santai di bawah naungan pinus",
        "Fasilitas toilet bersih dan pos keamanan",
        "Pemandu lokal standby di gerbang utama",
      ],
      capacityPerSession: 25,
      guideReadinessEvidence:
        "Memiliki 3 pemandu lokal binaan perhutani yang bersertifikasi kepemanduan dasar.",
      submittedAt: "2026-08-26T10:00:00Z",
      status: "PENDING_REVIEW",
    },
    {
      applicationId: "dest_app_trawas_bambu",
      partnerIdentityId: "dest_partner_trawas_bambu",
      destinationIdentityId: "dest_hutan_trawas",
      name: "Hutan Bambu Trawas",
      locationLabel: "Mojokerto / Pasuruan",
      province: "Jawa Timur",
      city: "Pasuruan",
      baseCostPerPerson: 95000,
      description: "Kawasan hutan bambu hening untuk kontemplasi mandiri.",
      highlights: ["Spot meditasi", "Suasana sangat hening"],
      capacityPerSession: 12,
      guideReadinessEvidence: "Belum memiliki pemandu lokal resmi di lokasi.",
      submittedAt: "2026-08-15T09:00:00Z",
      status: "APPROVED",
      approvedLevel: "BASIC",
      approvedGuideReady: false,
      reviewedAt: "2026-08-16T11:00:00Z",
    },
    {
      applicationId: "dest_app_rejected_demo",
      partnerIdentityId: "dest_partner_rejected",
      destinationIdentityId: "dest_curah_rawan",
      name: "Lembah Curah Rawan",
      locationLabel: "Malang Selatan",
      province: "Jawa Timur",
      city: "Malang",
      managementName: "Pengelola Curah Rawan",
      contactPerson: "Rian",
      contactPhone: "081298765432",
      contactEmail: "partner@curahrawan.id",
      baseCostPerPerson: 80000,
      description: "Kawasan tebing dan sungai deras.",
      highlights: ["Tebing curam"],
      capacityPerSession: 10,
      guideReadinessEvidence: "Belum ada pemandu lokal.",
      submittedAt: "2026-08-18T09:00:00Z",
      status: "REJECTED",
      rejectionReason:
        "Akses evakuasi darurat belum memadai dan jalur terlalu curam untuk standar mindful travel.",
      reviewedAt: "2026-08-19T10:00:00Z",
    },
  ];

function cloneVerificationApp(
  app: DestinationVerificationRecord,
): DestinationVerificationRecord {
  return {
    ...app,
    highlights: [...app.highlights],
    legalEntityDocument: app.legalEntityDocument
      ? { ...app.legalEntityDocument }
      : undefined,
  };
}

let verificationApps: DestinationVerificationRecord[] =
  INITIAL_DESTINATION_APPLICATIONS.map((a) => cloneVerificationApp(a));

export const mockDestinationVerificationStore = {
  reset(): void {
    verificationApps = INITIAL_DESTINATION_APPLICATIONS.map((a) =>
      cloneVerificationApp(a),
    );
  },

  getAll(): readonly DestinationVerificationRecord[] {
    return verificationApps.map((a) => cloneVerificationApp(a));
  },

  getById(applicationId: string): DestinationVerificationRecord | undefined {
    const app = verificationApps.find((a) => a.applicationId === applicationId);
    return app ? cloneVerificationApp(app) : undefined;
  },

  getByPartnerId(
    partnerIdentityId: string,
  ): DestinationVerificationRecord | undefined {
    const app = verificationApps.find(
      (a) => a.partnerIdentityId === partnerIdentityId,
    );
    return app ? cloneVerificationApp(app) : undefined;
  },

  submitApplication(input: {
    partnerIdentityId: string;
    destinationIdentityId?: string;
    name: string;
    locationLabel: string;
    province: string;
    city: string;
    managementName?: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    legalEntityDoc?: {
      name: string;
      uploadedAt: string;
      status: "ATTACHED" | "VERIFIED";
    };
    baseCostPerPerson: number;
    description: string;
    highlights: string[];
    capacityPerSession: number;
    guideReady: boolean;
    guideReadinessEvidence: string;
    agreedToSop: boolean;
  }): {
    success: boolean;
    application?: DestinationVerificationRecord;
    message?: string;
  } {
    if (!input.agreedToSop) {
      return {
        success: false,
        message: "Wajib menyetujui standar keselamatan & SOP destinasi JedaIn.",
      };
    }

    if (
      !input.name.trim() ||
      !input.locationLabel.trim() ||
      !input.description.trim()
    ) {
      return {
        success: false,
        message:
          "Informasi nama destinasi, lokasi, dan deskripsi wajib diisi lengkap.",
      };
    }

    if (input.baseCostPerPerson <= 0 || input.capacityPerSession <= 0) {
      return {
        success: false,
        message: "Modal dasar dan kapasitas per sesi harus lebih dari 0.",
      };
    }

    if (!input.highlights || input.highlights.length === 0) {
      return {
        success: false,
        message: "Minimal masukkan 1 fasilitas atau daya tarik utama kawasan.",
      };
    }

    // Check existing application for this partner identity
    const existingIndex = verificationApps.findIndex(
      (a) => a.partnerIdentityId === input.partnerIdentityId,
    );

    if (existingIndex >= 0) {
      const existing = verificationApps[existingIndex];
      if (existing.status === "APPROVED") {
        return {
          success: false,
          message:
            "Aplikasi destinasi Anda sudah disetujui (APPROVED) dan tidak dapat diajukan ulang.",
        };
      }
      if (existing.status === "PENDING_REVIEW") {
        return {
          success: false,
          message:
            "Aplikasi destinasi Anda sedang dalam proses verifikasi (PENDING_REVIEW).",
        };
      }
    }

    const nowIso = new Date().toISOString();
    const destId =
      existingIndex >= 0
        ? verificationApps[existingIndex].destinationIdentityId
        : `dest_${input.name
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "_")
            .slice(0, 20)}_${Date.now().toString(36).slice(-4)}`;

    const application: DestinationVerificationRecord = {
      applicationId:
        existingIndex >= 0
          ? verificationApps[existingIndex].applicationId
          : `dest_app_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      partnerIdentityId: input.partnerIdentityId,
      destinationIdentityId: destId,
      name: input.name.trim(),
      locationLabel: input.locationLabel.trim(),
      province: input.province.trim() || "Jawa Timur",
      city: input.city.trim() || "Batu",
      managementName: input.managementName?.trim() || undefined,
      contactPerson: input.contactPerson?.trim() || undefined,
      contactPhone: input.phone?.trim() || undefined,
      contactEmail: input.email?.trim() || undefined,
      legalEntityDocument: input.legalEntityDoc
        ? {
            name: input.legalEntityDoc.name,
            attachedAt: input.legalEntityDoc.uploadedAt,
            status: input.legalEntityDoc.status,
          }
        : undefined,
      baseCostPerPerson: input.baseCostPerPerson,
      description: input.description.trim(),
      highlights: [...input.highlights],
      capacityPerSession: input.capacityPerSession,
      guideReadinessEvidence: input.guideReadinessEvidence.trim(),
      submittedAt: nowIso,
      status: "PENDING_REVIEW",
    };

    if (existingIndex >= 0) {
      verificationApps[existingIndex] = application;
    } else {
      verificationApps.push(application);
    }

    return { success: true, application: cloneVerificationApp(application) };
  },

  setRejectionReason(applicationId: string, reason?: string): boolean {
    const app = verificationApps.find((a) => a.applicationId === applicationId);
    if (!app) return false;
    app.rejectionReason = reason;
    return true;
  },

  approveApplication(
    applicationId: string,
    guideReady: boolean,
  ): { success: boolean; destination?: DestinationRecord; message?: string } {
    const app = verificationApps.find((a) => a.applicationId === applicationId);
    if (!app || app.status !== "PENDING_REVIEW") {
      return {
        success: false,
        message: "Aplikasi tidak valid atau sudah diproses.",
      };
    }

    app.status = "APPROVED";
    app.approvedLevel = "BASIC"; // LOCKED: initial approval is NEVER PLUS
    app.approvedGuideReady = guideReady;
    app.reviewedAt = new Date().toISOString();

    // Canonical bridge: Explicit domain upsert in mockDestinationStore
    const canonicalDest: DestinationRecord = {
      destinationId: app.destinationIdentityId,
      name: app.name,
      locationLabel: app.locationLabel,
      province: app.province,
      city: app.city,
      verificationLevel: "BASIC",
      guideReady,
      baseCostPerPerson: app.baseCostPerPerson,
      description: app.description,
      highlights: [...app.highlights],
      capacityPerSession: app.capacityPerSession,
      status: "ACTIVE",
    };

    const saved = mockDestinationStore.upsertVerifiedDestination(canonicalDest);

    return { success: true, destination: saved };
  },

  rejectApplication(
    applicationId: string,
    reason: string,
  ): { success: boolean; message?: string } {
    const app = verificationApps.find((a) => a.applicationId === applicationId);
    if (!app || app.status !== "PENDING_REVIEW") {
      return {
        success: false,
        message: "Aplikasi tidak valid atau sudah diproses.",
      };
    }

    if (!reason.trim()) {
      return { success: false, message: "Alasan penolakan wajib diisi." };
    }

    app.status = "REJECTED";
    app.rejectionReason = reason.trim();
    app.reviewedAt = new Date().toISOString();

    return { success: true };
  },
};
