import { mockDestinationStore } from "./mockDestinationStore";
import type {
  EoGuideStatus,
  EoPackageRecord,
  EoSessionRecord,
  EoValidationError,
  EoValidationResult,
} from "./types";

export function validateEoPackage(
  pkg: Partial<EoPackageRecord>,
  eoGuideStatus: EoGuideStatus,
): EoValidationResult {
  const errors: EoValidationError[] = [];

  // Step 1: Destination
  if (!pkg.destinationId) {
    errors.push({
      step: 1,
      field: "destinationId",
      message: "Pilih destinasi terverifikasi untuk paket ini.",
    });
  } else {
    const dest = mockDestinationStore.getById(pkg.destinationId);
    if (
      !dest ||
      (dest.verificationLevel !== "BASIC" && dest.verificationLevel !== "PLUS")
    ) {
      errors.push({
        step: 1,
        field: "destinationId",
        message:
          "Destinasi yang dipilih tidak terdaftar atau belum terverifikasi.",
      });
    } else if (eoGuideStatus === "CONCEPT_ONLY" && !dest.guideReady) {
      errors.push({
        step: 1,
        field: "destinationId",
        message:
          "EO dengan status Concept-Only hanya dapat memilih destinasi yang memiliki Guide Ready (pemandu lokal siap).",
      });
    }
  }

  // Step 2 & General info: Title & Value Proposition
  if (!pkg.title || pkg.title.trim().length < 5) {
    errors.push({
      step: 2,
      field: "title",
      message: "Judul paket wajib diisi minimal 5 karakter.",
    });
  }

  if (!pkg.shortSummary || pkg.shortSummary.trim().length < 10) {
    errors.push({
      step: 2,
      field: "shortSummary",
      message: "Ringkasan nilai pengalaman wajib diisi minimal 10 karakter.",
    });
  }

  // Step 3: Itinerary
  if (!pkg.itinerary || pkg.itinerary.length === 0) {
    errors.push({
      step: 3,
      field: "itinerary",
      message:
        "Minimal masukkan 1 aktivitas dalam rencana perjalanan (itinerary).",
    });
  } else {
    pkg.itinerary.forEach((item, idx) => {
      if (!item.title.trim() || !item.description.trim()) {
        errors.push({
          step: 3,
          field: `itinerary[${idx}]`,
          message: `Aktivitas #${idx + 1} wajib memiliki judul dan deskripsi.`,
        });
      }
    });
  }

  // Step 4: Pricing
  if (!pkg.pricing) {
    errors.push({
      step: 4,
      field: "pricing",
      message: "Rincian harga wajib diisi.",
    });
  } else {
    if (pkg.pricing.eoMargin < 0) {
      errors.push({
        step: 4,
        field: "eoMargin",
        message: "Margin EO tidak boleh bernilai negatif.",
      });
    }
    const expectedCustomerPrice =
      pkg.pricing.destinationBaseCost + pkg.pricing.eoMargin;
    if (pkg.pricing.customerPrice < expectedCustomerPrice) {
      errors.push({
        step: 4,
        field: "customerPrice",
        message:
          "Harga jual ke traveler tidak boleh lebih kecil dari modal destinasi + margin EO.",
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export const SEEDED_LIVE_PACKAGE: EoPackageRecord = {
  packageId: "slow_green_day",
  eoId: "eo_jeda_alam",
  eoDisplayName: "Jeda Alam Nusantara",
  title: "Sehari Pelan di Lereng Hijau",
  shortSummary:
    "Lepaskan kepenatan rutinitas harian dengan berjalan santai di perkebunan teh yang asri, menikmati udara sejuk lereng Batu, dan menikmati teh herbal hangat bersama pemandu lokal.",
  valueProposition:
    "Aktivitas santai menikmati panorama perkebunan teh dan lereng asri Batu dengan ritme tidak terburu-buru.",
  destinationId: "dest_lereng_hijau",
  insightId: "ins_nature_batu_1d",
  durationLabel: "1 hari",
  suitableGroupTypes: ["SOLO", "PARTNER", "FRIENDS", "FAMILY"],
  highlights: [
    "Jalan santai menyusuri perkebunan teh lereng Batu dengan udara pegunungan segar",
    "Sesi hening dan relaksasi bernapas di titik pandang lembah hijau",
    "Mencicipi seduhan teh herbal racikan petani lokal",
    "Santap siang hangat menu pedesaan lokal",
  ],
  itinerary: [
    {
      order: 1,
      title: "Pagi - Berkumpul & Perjalanan Santai",
      description:
        "Tiba di lokasi titik kumpul Lereng Hijau Batu, perkenalan hangat dengan pemandu lokal, dan menikmati teh sambutan hangat.",
      timeOfDayLabel: "Pagi",
      durationLabel: "1 jam",
    },
    {
      order: 2,
      title: "Menjelajah Jalur Teh & Latihan Napas",
      description:
        "Berjalan kaki santai menyusuri jalur perkebunan teh yang tenang, dipandu dengan sesi jeda napas ringan untuk merilekskan pikiran.",
      timeOfDayLabel: "Pagi - Siang",
      durationLabel: "2.5 jam",
    },
    {
      order: 3,
      title: "Santap Siang & Refleksi Santai",
      description:
        "Menikmati hidangan lokal khas pedesaan, waktu bebas untuk bersantai atau membaca buku, dan penutupan sesi.",
      timeOfDayLabel: "Siang - Sore",
      durationLabel: "2 jam",
    },
  ],
  includedItems: [
    "Tiket masuk kawasan Lereng Hijau Batu",
    "Pemandu lokal selama sesi kegiatan",
    "Seduhan teh herbal dan kudapan lokal",
    "Santap siang menu pedesaan",
  ],
  excludedItems: [
    "Transportasi pribadi ke titik kumpul",
    "Pengeluaran pribadi",
  ],
  safetyNotes: [
    "Gunakan sepatu berjalan yang nyaman dan tidak licin.",
    "Bawa jaket atau pakaian hangat tipis.",
  ],
  pricing: {
    destinationBaseCost: 125000,
    eoMargin: 150000,
    customerPrice: 275000,
  },
  guideStatus: "CERTIFIED_GUIDE",
  status: "LIVE",
  createdAt: "2026-08-01T08:00:00Z",
  updatedAt: "2026-08-05T10:00:00Z",
};

export const SEEDED_SESSIONS: EoSessionRecord[] = [
  {
    sessionId: "ses_sgd_1",
    packageId: "slow_green_day",
    eoId: "eo_jeda_alam",
    startAt: "2026-09-12T08:00:00+07:00",
    endAt: "2026-09-12T14:00:00+07:00",
    capacity: 6,
    remainingSlots: 6,
    pricePerPerson: 275000,
    status: "OPEN",
    createdAt: "2026-08-05T10:00:00Z",
  },
  {
    sessionId: "ses_sgd_2",
    packageId: "slow_green_day",
    eoId: "eo_jeda_alam",
    startAt: "2026-09-19T08:00:00+07:00",
    endAt: "2026-09-19T14:00:00+07:00",
    capacity: 6,
    remainingSlots: 4,
    pricePerPerson: 275000,
    status: "OPEN",
    createdAt: "2026-08-05T10:00:00Z",
  },
];

let packages: EoPackageRecord[] = [{ ...SEEDED_LIVE_PACKAGE }];
let sessions: EoSessionRecord[] = SEEDED_SESSIONS.map((s) => ({ ...s }));

export const mockEoPackageStore = {
  reset(): void {
    packages = [{ ...SEEDED_LIVE_PACKAGE }];
    sessions = SEEDED_SESSIONS.map((s) => ({ ...s }));
  },

  getAllPackages(): readonly EoPackageRecord[] {
    return packages;
  },

  getPackagesByEo(eoId: string): readonly EoPackageRecord[] {
    return packages.filter((p) => p.eoId === eoId);
  },

  getPackageById(packageId: string): EoPackageRecord | undefined {
    return packages.find((p) => p.packageId === packageId);
  },

  saveDraft(
    draft: Partial<EoPackageRecord> & { eoId: string; eoDisplayName: string },
  ): EoPackageRecord {
    const nowIso = new Date().toISOString();
    const existingIndex = draft.packageId
      ? packages.findIndex((p) => p.packageId === draft.packageId)
      : -1;

    const packageId =
      existingIndex >= 0
        ? packages[existingIndex].packageId
        : draft.packageId ||
          `pkg_eo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const dest = draft.destinationId
      ? mockDestinationStore.getById(draft.destinationId)
      : undefined;
    const baseCost = dest?.baseCostPerPerson ?? 100000;
    const margin = draft.pricing?.eoMargin ?? 150000;
    const customerPrice = draft.pricing?.customerPrice ?? baseCost + margin;

    const record: EoPackageRecord = {
      packageId,
      eoId: draft.eoId,
      eoDisplayName: draft.eoDisplayName,
      title: draft.title || "",
      shortSummary: draft.shortSummary || "",
      valueProposition: draft.valueProposition || draft.shortSummary || "",
      destinationId: draft.destinationId || "",
      insightId: draft.insightId,
      durationLabel: draft.durationLabel || "1 hari",
      suitableGroupTypes: draft.suitableGroupTypes || [
        "SOLO",
        "PARTNER",
        "FRIENDS",
      ],
      highlights: draft.highlights || [],
      itinerary: draft.itinerary || [],
      includedItems: draft.includedItems || [
        "Tiket masuk destinasi",
        "Pemandu selama kegiatan",
        "Konsumsi lokal",
      ],
      excludedItems: draft.excludedItems || [
        "Transportasi ke titik kumpul",
        "Pengeluaran pribadi",
      ],
      safetyNotes: draft.safetyNotes || [
        "Kenakan alas kaki yang nyaman.",
        "Patuhi arahan pemandu selama kegiatan.",
      ],
      pricing: {
        destinationBaseCost: baseCost,
        eoMargin: margin,
        customerPrice,
      },
      guideStatus: draft.guideStatus || "CERTIFIED_GUIDE",
      status: "DRAFT",
      createdAt:
        existingIndex >= 0 ? packages[existingIndex].createdAt : nowIso,
      updatedAt: nowIso,
    };

    if (existingIndex >= 0) {
      packages[existingIndex] = record;
    } else {
      packages.push(record);
    }

    return record;
  },

  submitForReview(
    packageId: string,
    eoGuideStatus: EoGuideStatus,
  ): {
    success: boolean;
    package?: EoPackageRecord;
    validationResult: EoValidationResult;
  } {
    const pkg = packages.find((p) => p.packageId === packageId);
    if (!pkg) {
      return {
        success: false,
        validationResult: {
          valid: false,
          errors: [
            { step: 1, field: "packageId", message: "Paket tidak ditemukan." },
          ],
        },
      };
    }

    const validationResult = validateEoPackage(pkg, eoGuideStatus);
    pkg.validationResult = validationResult;
    pkg.updatedAt = new Date().toISOString();

    if (!validationResult.valid) {
      // Failed validation: remains DRAFT
      pkg.status = "DRAFT";
      return { success: false, package: pkg, validationResult };
    }

    // Success: transition DRAFT -> PENDING_ADMIN_REVIEW
    pkg.status = "PENDING_ADMIN_REVIEW";
    pkg.submittedAt = new Date().toISOString();

    return { success: true, package: pkg, validationResult };
  },

  // Admin decision helpers (for later Admin sprint / test harness)
  approvePackage(packageId: string): boolean {
    const pkg = packages.find((p) => p.packageId === packageId);
    if (!pkg) return false;
    pkg.status = "APPROVED";
    pkg.reviewedAt = new Date().toISOString();
    return true;
  },

  makePackageLive(packageId: string): boolean {
    const pkg = packages.find((p) => p.packageId === packageId);
    if (!pkg) return false;
    pkg.status = "LIVE";
    pkg.reviewedAt = new Date().toISOString();
    return true;
  },

  rejectPackage(packageId: string, reason: string): boolean {
    const pkg = packages.find((p) => p.packageId === packageId);
    if (!pkg) return false;
    pkg.status = "REJECTED";
    pkg.rejectionReason = reason;
    pkg.reviewedAt = new Date().toISOString();
    return true;
  },

  // Sessions management
  getAllSessions(): readonly EoSessionRecord[] {
    return sessions;
  },

  getSessionsByEo(eoId: string): readonly EoSessionRecord[] {
    return sessions.filter((s) => s.eoId === eoId);
  },

  getSessionsByPackage(packageId: string): readonly EoSessionRecord[] {
    return sessions.filter((s) => s.packageId === packageId);
  },

  createSession(input: {
    packageId: string;
    eoId: string;
    startAt: string;
    endAt: string;
    capacity: number;
    pricePerPerson: number;
  }): { success: boolean; session?: EoSessionRecord; message?: string } {
    const pkg = packages.find((p) => p.packageId === input.packageId);
    if (!pkg) {
      return { success: false, message: "Paket tidak ditemukan." };
    }

    if (pkg.status !== "APPROVED" && pkg.status !== "LIVE") {
      return {
        success: false,
        message:
          "Hanya paket berstatus APPROVED atau LIVE yang dapat membuka jadwal sesi.",
      };
    }

    if (input.capacity <= 0) {
      return { success: false, message: "Kapasitas peserta minimal 1 orang." };
    }

    const sessionId = `ses_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const session: EoSessionRecord = {
      sessionId,
      packageId: input.packageId,
      eoId: input.eoId,
      startAt: input.startAt,
      endAt: input.endAt,
      capacity: input.capacity,
      remainingSlots: input.capacity,
      pricePerPerson: input.pricePerPerson,
      status: "OPEN",
      createdAt: new Date().toISOString(),
    };

    sessions.push(session);
    return { success: true, session };
  },

  updateSessionStatus(
    sessionId: string,
    status: "OPEN" | "FULL" | "CLOSED" | "CANCELLED",
  ): boolean {
    const s = sessions.find((item) => item.sessionId === sessionId);
    if (!s) return false;
    s.status = status;
    return true;
  },
};
