import { mockApplicationStore } from "./mockApplicationStore";
import { mockDestinationStore } from "./mockDestinationStore";
import { partnerSessionStore } from "./partnerSessionStore";
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
      dest.status !== "ACTIVE" ||
      (dest.verificationLevel !== "BASIC" && dest.verificationLevel !== "PLUS")
    ) {
      errors.push({
        step: 1,
        field: "destinationId",
        message:
          "Destinasi yang dipilih tidak terdaftar atau belum terverifikasi aktif.",
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

  // Step 2 & General info: Title, Summary & Duration
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

  if (!pkg.durationLabel || !pkg.durationLabel.trim()) {
    errors.push({
      step: 2,
      field: "durationLabel",
      message: "Durasi paket wajib ditentukan.",
    });
  }

  // Step 3: Itinerary & Safety
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

  if (
    !pkg.safetyNotes ||
    pkg.safetyNotes.length === 0 ||
    !pkg.safetyNotes.some((s) => s && s.trim().length > 0)
  ) {
    errors.push({
      step: 3,
      field: "safetyNotes",
      message: "Minimal cantumkan 1 catatan operasional atau keselamatan.",
    });
  }

  // Step 4: Pricing (Authoritative Base Cost and Exact Formula)
  const dest = pkg.destinationId
    ? mockDestinationStore.getById(pkg.destinationId)
    : undefined;
  const authoritativeBaseCost = dest?.baseCostPerPerson ?? 100000;

  if (!pkg.pricing) {
    errors.push({
      step: 4,
      field: "pricing",
      message: "Rincian harga wajib diisi.",
    });
  } else {
    if (pkg.pricing.destinationBaseCost !== authoritativeBaseCost) {
      errors.push({
        step: 4,
        field: "destinationBaseCost",
        message:
          "Modal dasar destinasi tidak sesuai dengan data resmi destinasi.",
      });
    }

    if (pkg.pricing.eoMargin < 0) {
      errors.push({
        step: 4,
        field: "eoMargin",
        message: "Margin EO tidak boleh bernilai negatif.",
      });
    }

    const exactCustomerPrice = authoritativeBaseCost + pkg.pricing.eoMargin;
    if (pkg.pricing.customerPrice !== exactCustomerPrice) {
      errors.push({
        step: 4,
        field: "customerPrice",
        message: `Harga jual ke traveler harus sama persis dengan modal destinasi + margin EO (Rp${exactCustomerPrice.toLocaleString("id-ID")}).`,
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

export const SEEDED_PENDING_PACKAGE: EoPackageRecord = {
  packageId: "pkg_pacet_mindful_retreat",
  eoId: "eo_jeda_alam",
  eoDisplayName: "Jeda Alam Nusantara",
  title: "Pagi Hening Tepi Sungai Pacet",
  shortSummary:
    "Retreat setengah hari di tepi sungai Pacet yang jernih dengan terapi suara air alami dan sesi relaksasi napas.",
  valueProposition:
    "Jeda singkat memulihkan pikiran dari bising perkotaan di lembah hutan pinus berhawa sejuk.",
  destinationId: "dest_lembah_pacet",
  insightId: "ins_mindful_pacet_halfday",
  durationLabel: "Setengah hari",
  suitableGroupTypes: ["SOLO", "PARTNER", "FRIENDS"],
  highlights: [
    "Sesi meditasi suara sungai alami",
    "Jeda hening pagi dan teh herbal lokal",
    "Piknik ringan buah segar",
  ],
  itinerary: [
    {
      order: 1,
      title: "Pagi - Berkumpul di Saung Lembah",
      description: "Penyambutan dan persiapan sesi hening.",
      timeOfDayLabel: "Pagi",
      durationLabel: "45 menit",
    },
    {
      order: 2,
      title: "Sesi Hening & Terapi Suara Sungai",
      description: "Relaksasi kesadaran penuh di bebatuan sungai yang tenang.",
      timeOfDayLabel: "Pagi - Siang",
      durationLabel: "2 jam",
    },
    {
      order: 3,
      title: "Teh Herbal & Penutupan",
      description: "Menikmati teh hangat dan kudapan sehat.",
      timeOfDayLabel: "Siang",
      durationLabel: "1 jam",
    },
  ],
  includedItems: [
    "Tiket masuk Lembah Alam Pacet",
    "Pemandu retreat bersertifikat",
    "Teh herbal dan kudapan buah sehat",
  ],
  excludedItems: ["Transportasi pribadi", "Belanja pribadi"],
  safetyNotes: [
    "Kenakan pakaian santai yang nyaman.",
    "Hati-hati saat melangkah di bebatuan tepi sungai.",
  ],
  pricing: {
    destinationBaseCost: 160000,
    eoMargin: 100000,
    customerPrice: 260000,
  },
  guideStatus: "CERTIFIED_GUIDE",
  status: "PENDING_ADMIN_REVIEW",
  validationResult: { valid: true, errors: [] },
  submittedAt: "2026-08-28T09:00:00Z",
  createdAt: "2026-08-28T08:30:00Z",
  updatedAt: "2026-08-28T09:00:00Z",
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

function clonePackage(pkg: EoPackageRecord): EoPackageRecord {
  return {
    ...pkg,
    suitableGroupTypes: [...pkg.suitableGroupTypes],
    highlights: [...pkg.highlights],
    itinerary: pkg.itinerary.map((it) => ({ ...it })),
    includedItems: [...pkg.includedItems],
    excludedItems: [...pkg.excludedItems],
    safetyNotes: [...pkg.safetyNotes],
    pricing: { ...pkg.pricing },
  };
}

let packages: EoPackageRecord[] = [
  clonePackage(SEEDED_LIVE_PACKAGE),
  clonePackage(SEEDED_PENDING_PACKAGE),
];
let sessions: EoSessionRecord[] = SEEDED_SESSIONS.map((s) => ({ ...s }));

export const mockEoPackageStore = {
  reset(): void {
    packages = [
      clonePackage(SEEDED_LIVE_PACKAGE),
      clonePackage(SEEDED_PENDING_PACKAGE),
    ];
    sessions = SEEDED_SESSIONS.map((s) => ({ ...s }));
  },

  getAllPackages(): readonly EoPackageRecord[] {
    return packages.map((p) => clonePackage(p));
  },

  getPackagesByEo(eoId: string): readonly EoPackageRecord[] {
    return packages.filter((p) => p.eoId === eoId).map((p) => clonePackage(p));
  },

  getPackageById(packageId: string): EoPackageRecord | undefined {
    const pkg = packages.find((p) => p.packageId === packageId);
    return pkg ? clonePackage(pkg) : undefined;
  },

  getPackageForEo(
    packageId: string,
    eoId: string,
  ): EoPackageRecord | undefined {
    const pkg = packages.find(
      (p) => p.packageId === packageId && p.eoId === eoId,
    );
    return pkg ? clonePackage(pkg) : undefined;
  },

  saveDraft(draft: Partial<EoPackageRecord>): {
    success: boolean;
    package?: EoPackageRecord;
    message?: string;
  } {
    const actor = partnerSessionStore.get();
    if (!actor || actor.role !== "EO") {
      return {
        success: false,
        message:
          "Akses ditolak: Hanya EO terautentikasi yang dapat mengelola draf paket.",
      };
    }

    const actorEoId = actor.id;
    const app = mockApplicationStore.getBySellerId(actorEoId);
    if (!app || app.status !== "APPROVED") {
      return {
        success: false,
        message: "Akses ditolak: Akun EO belum berstatus APPROVED.",
      };
    }

    const actorDisplayName =
      actor.businessName || app.businessName || "EO Partner";
    const authorGuideStatus: EoGuideStatus =
      app.guideStatus ?? actor.guideStatus ?? "CERTIFIED_GUIDE";

    const nowIso = new Date().toISOString();
    const existingIndex = draft.packageId
      ? packages.findIndex((p) => p.packageId === draft.packageId)
      : -1;

    // Check ownership & hijack prevention using authenticated actor
    if (existingIndex >= 0) {
      const existing = packages[existingIndex];
      if (existing.eoId !== actorEoId) {
        return {
          success: false,
          message: "Akses ditolak: Anda bukan pemilik paket ini.",
        };
      }

      if (existing.status !== "DRAFT" && existing.status !== "REJECTED") {
        return {
          success: false,
          message:
            "Paket yang sedang ditinjau atau sudah disetujui tidak dapat diedit langsung.",
        };
      }
    }

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
    const customerPrice = baseCost + margin;

    const record: EoPackageRecord = {
      packageId,
      eoId: actorEoId,
      eoDisplayName: actorDisplayName,
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
      safetyNotes:
        draft.safetyNotes !== undefined
          ? draft.safetyNotes
          : [
              "Kenakan alas kaki yang nyaman.",
              "Patuhi arahan pemandu selama kegiatan.",
            ],
      pricing: {
        destinationBaseCost: baseCost,
        eoMargin: margin,
        customerPrice,
      },
      guideStatus: authorGuideStatus,
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

    return { success: true, package: clonePackage(record) };
  },

  submitForReview(packageId: string): {
    success: boolean;
    package?: EoPackageRecord;
    validationResult: EoValidationResult;
    message?: string;
  } {
    const actor = partnerSessionStore.get();
    if (!actor || actor.role !== "EO") {
      return {
        success: false,
        validationResult: {
          valid: false,
          errors: [
            {
              step: 1,
              field: "auth",
              message: "Pengguna belum terautentikasi sebagai EO.",
            },
          ],
        },
      };
    }

    const actorEoId = actor.id;
    const app = mockApplicationStore.getBySellerId(actorEoId);
    if (!app || app.status !== "APPROVED") {
      return {
        success: false,
        validationResult: {
          valid: false,
          errors: [
            {
              step: 1,
              field: "auth",
              message: "Akun EO belum berstatus APPROVED.",
            },
          ],
        },
      };
    }

    const authorGuideStatus: EoGuideStatus =
      app.guideStatus ?? actor.guideStatus ?? "CERTIFIED_GUIDE";

    const pkg = packages.find((p) => p.packageId === packageId);
    if (!pkg || pkg.eoId !== actorEoId) {
      return {
        success: false,
        validationResult: {
          valid: false,
          errors: [
            {
              step: 1,
              field: "packageId",
              message:
                "Paket tidak ditemukan atau bukan milik EO terautentikasi.",
            },
          ],
        },
      };
    }

    // Idempotency: already submitted
    if (pkg.status === "PENDING_ADMIN_REVIEW") {
      return {
        success: true,
        package: clonePackage(pkg),
        validationResult: { valid: true, errors: [] },
        message: "ALREADY_SUBMITTED",
      };
    }

    if (pkg.status !== "DRAFT" && pkg.status !== "REJECTED") {
      return {
        success: false,
        validationResult: {
          valid: false,
          errors: [
            {
              step: 1,
              field: "status",
              message:
                "Hanya draf atau revisi paket yang dapat diajukan untuk review.",
            },
          ],
        },
      };
    }

    const validationResult = validateEoPackage(pkg, authorGuideStatus);
    pkg.validationResult = validationResult;
    pkg.updatedAt = new Date().toISOString();

    if (!validationResult.valid) {
      // Failed validation: remains DRAFT
      pkg.status = "DRAFT";
      return { success: false, package: clonePackage(pkg), validationResult };
    }

    // Success: transition to PENDING_ADMIN_REVIEW
    pkg.status = "PENDING_ADMIN_REVIEW";
    pkg.submittedAt = new Date().toISOString();

    return { success: true, package: clonePackage(pkg), validationResult };
  },

  // Admin decision helpers (Strict transition guards)
  approvePackage(packageId: string): boolean {
    const pkg = packages.find((p) => p.packageId === packageId);
    if (!pkg || pkg.status !== "PENDING_ADMIN_REVIEW") return false;
    pkg.status = "APPROVED";
    pkg.reviewedAt = new Date().toISOString();
    return true;
  },

  publishApprovedPackage(packageId: string): {
    success: boolean;
    package?: EoPackageRecord;
    message?: string;
  } {
    const actor = partnerSessionStore.get();
    if (!actor || actor.role !== "EO") {
      return {
        success: false,
        message:
          "Akses ditolak: Hanya EO terautentikasi yang dapat mempublikasikan paket.",
      };
    }

    const app = mockApplicationStore.getBySellerId(actor.id);
    if (!app || app.status !== "APPROVED") {
      return {
        success: false,
        message: "Akses ditolak: Akun EO belum berstatus APPROVED.",
      };
    }

    const pkg = packages.find((p) => p.packageId === packageId);
    if (!pkg) {
      return {
        success: false,
        message: "Paket tidak ditemukan.",
      };
    }

    if (pkg.eoId !== actor.id) {
      return {
        success: false,
        message: "Akses ditolak: Anda bukan pemilik paket ini.",
      };
    }

    // Idempotency: if already LIVE, return success deterministically
    if (pkg.status === "LIVE") {
      return {
        success: true,
        package: clonePackage(pkg),
        message: "ALREADY_LIVE",
      };
    }

    if (pkg.status !== "APPROVED") {
      return {
        success: false,
        message:
          "Hanya paket yang telah disetujui kurator Admin (APPROVED) yang dapat dipublikasikan.",
      };
    }

    pkg.status = "LIVE";
    pkg.updatedAt = new Date().toISOString();
    return {
      success: true,
      package: clonePackage(pkg),
    };
  },

  rejectPackage(packageId: string, reason: string): boolean {
    const pkg = packages.find((p) => p.packageId === packageId);
    if (!pkg || pkg.status !== "PENDING_ADMIN_REVIEW" || !reason.trim()) {
      return false;
    }
    pkg.status = "REJECTED";
    pkg.rejectionReason = reason.trim();
    pkg.reviewedAt = new Date().toISOString();
    return true;
  },

  // Sessions management
  getAllSessions(): readonly EoSessionRecord[] {
    return sessions.map((s) => ({ ...s }));
  },

  getSessionsByEo(eoId: string): readonly EoSessionRecord[] {
    return sessions.filter((s) => s.eoId === eoId).map((s) => ({ ...s }));
  },

  getSessionsByPackage(packageId: string): readonly EoSessionRecord[] {
    return sessions
      .filter((s) => s.packageId === packageId)
      .map((s) => ({ ...s }));
  },

  createSession(input: {
    packageId: string;
    startAt: string;
    endAt: string;
    capacity: number;
    pricePerPerson: number;
  }): { success: boolean; session?: EoSessionRecord; message?: string } {
    const actor = partnerSessionStore.get();
    if (!actor || actor.role !== "EO") {
      return {
        success: false,
        message:
          "Akses ditolak: Hanya EO terautentikasi yang dapat membuka sesi.",
      };
    }

    const actorEoId = actor.id;
    const app = mockApplicationStore.getBySellerId(actorEoId);
    if (!app || app.status !== "APPROVED") {
      return {
        success: false,
        message: "Akses ditolak: Akun EO belum berstatus APPROVED.",
      };
    }

    const pkg = packages.find((p) => p.packageId === input.packageId);
    if (!pkg || pkg.eoId !== actorEoId) {
      return {
        success: false,
        message: "Paket tidak ditemukan atau bukan milik EO terautentikasi.",
      };
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
      eoId: pkg.eoId,
      startAt: input.startAt,
      endAt: input.endAt,
      capacity: input.capacity,
      remainingSlots: input.capacity,
      pricePerPerson: input.pricePerPerson,
      status: "OPEN",
      createdAt: new Date().toISOString(),
    };

    sessions.push(session);
    return { success: true, session: { ...session } };
  },

  updateSessionStatus(
    sessionId: string,
    status: "OPEN" | "FULL" | "CLOSED" | "CANCELLED",
  ): boolean {
    const actor = partnerSessionStore.get();
    if (!actor || actor.role !== "EO") return false;

    const app = mockApplicationStore.getBySellerId(actor.id);
    if (!app || app.status !== "APPROVED") return false;

    const s = sessions.find(
      (item) => item.sessionId === sessionId && item.eoId === actor.id,
    );
    if (!s) return false;
    s.status = status;
    return true;
  },
};
