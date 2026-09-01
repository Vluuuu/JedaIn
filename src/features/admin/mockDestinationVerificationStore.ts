import { mockDestinationStore } from "../eo/mockDestinationStore";
import type { DestinationRecord } from "../eo/types";
import type { DestinationVerificationRecord } from "./types";

export const INITIAL_DESTINATION_APPLICATIONS: DestinationVerificationRecord[] =
  [
    {
      applicationId: "dest_app_coban_rondo",
      destinationIdentityId: "dest_coban_rondo",
      name: "Hutan Pinus Coban Rondo",
      locationLabel: "Pujon, Malang",
      province: "Jawa Timur",
      city: "Batu / Malang",
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
  ];

function cloneVerificationApp(
  app: DestinationVerificationRecord,
): DestinationVerificationRecord {
  return {
    ...app,
    highlights: [...app.highlights],
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
