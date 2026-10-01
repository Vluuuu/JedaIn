import { customPackageImageStore } from "../../lib/assets/packageImages";
import { mockApplicationStore } from "./mockApplicationStore";
import { mockDestinationStore } from "./mockDestinationStore";
import { partnerSessionStore } from "./partnerSessionStore";
import type {
  DestinationRecord,
  EoGuideStatus,
  EoPackageRecord,
  EoSessionRecord,
  EoValidationError,
  EoValidationResult,
} from "./types";

export function formatSessionTimeWindow(
  startAt: string,
  endAt: string,
): string {
  const start = new Date(startAt);
  const end = new Date(endAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return `${startAt} - ${endAt}`;
  }

  const dateStr = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(start);

  const startTimeStr = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(start)
    .replace(":", ".");

  const endTimeStr = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(end)
    .replace(":", ".");

  return `${dateStr}, ${startTimeStr}–${endTimeStr} WIB`;
}

export function validateEoPackage(
  pkg: Partial<EoPackageRecord>,
  eoGuideStatus: EoGuideStatus,
  authoritativeDestination?: DestinationRecord,
): EoValidationResult {
  const errors: EoValidationError[] = [];

  // ponytail: destination fallback uses mockDestinationStore when authoritativeDestination not provided; upgrade to strict repository-only validator when mock mode is retired.
  const dest =
    authoritativeDestination !== undefined
      ? authoritativeDestination
      : pkg.destinationId
        ? mockDestinationStore.getById(pkg.destinationId)
        : undefined;

  // Step 1: Destination & Guide Source
  if (!pkg.destinationId) {
    errors.push({
      step: 1,
      field: "destinationId",
      message: "Pilih destinasi terverifikasi untuk paket ini.",
    });
  } else {
    if (!dest || dest.status !== "ACTIVE") {
      errors.push({
        step: 1,
        field: "destinationId",
        message:
          "Destinasi yang dipilih tidak terdaftar atau belum terverifikasi aktif.",
      });
    } else if (!dest.guideReady) {
      errors.push({
        step: 1,
        field: "destinationId",
        message:
          "Destinasi yang dipilih wajib memiliki kesiapan pemandu lokal terverifikasi.",
      });
    }
  }

  // Guide Source validation rule (MVP locked)
  // 1. guideSource is required
  // 2. CONCEPT_ONLY must use DESTINATION
  // 3. CERTIFIED_GUIDE may use DESTINATION or EO
  if (!pkg.guideSource) {
    errors.push({
      step: 1,
      field: "guideSource",
      message: "Sumber kepemanduan wajib ditentukan (Destinasi atau EO).",
    });
  } else if (pkg.guideSource === "EO" && eoGuideStatus === "CONCEPT_ONLY") {
    errors.push({
      step: 1,
      field: "guideSource",
      message:
        "EO dengan status Concept-Only wajib menggunakan pemandu lokal dari destinasi.",
    });
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

  // Step 3: Logistics & Itinerary
  if (!pkg.meetingPointLabel || !pkg.meetingPointLabel.trim()) {
    errors.push({
      step: 3,
      field: "meetingPointLabel",
      message: "Lengkapi titik kumpul perjalanan.",
    });
  }

  if (!pkg.departureTimeLabel || !pkg.departureTimeLabel.trim()) {
    errors.push({
      step: 3,
      field: "departureTimeLabel",
      message: "Lengkapi waktu kumpul atau keberangkatan.",
    });
  }

  if (!pkg.outboundTransport || !pkg.outboundTransport.trim()) {
    errors.push({
      step: 3,
      field: "outboundTransport",
      message: "Jelaskan transportasi menuju destinasi.",
    });
  }

  if (!pkg.returnTransport || !pkg.returnTransport.trim()) {
    errors.push({
      step: 3,
      field: "returnTransport",
      message: "Jelaskan transportasi kembali setelah kegiatan.",
    });
  }

  if (
    !pkg.includedItems ||
    pkg.includedItems.length === 0 ||
    !pkg.includedItems.some((s) => s && s.trim().length > 0)
  ) {
    errors.push({
      step: 3,
      field: "includedItems",
      message:
        "Minimal cantumkan 1 fasilitas atau layanan yang termasuk dalam paket.",
    });
  }

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

    const authoritativeGuideFee =
      pkg.guideSource === "DESTINATION"
        ? (dest?.localGuideFeePerPerson ?? 0)
        : 0;
    if (pkg.pricing.localGuideFee !== authoritativeGuideFee) {
      errors.push({
        step: 4,
        field: "localGuideFee",
        message:
          "Tarif pemandu lokal tidak sesuai dengan sumber pemandu yang dipilih.",
      });
    }
    const exactCustomerPrice =
      authoritativeBaseCost + authoritativeGuideFee + pkg.pricing.eoMargin;
    if (pkg.pricing.customerPrice !== exactCustomerPrice) {
      errors.push({
        step: 4,
        field: "customerPrice",
        message: `Harga package harus sama dengan biaya dasar destinasi + tarif pemandu yang digunakan + margin EO (Rp${exactCustomerPrice.toLocaleString("id-ID")}).`,
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
        "Berkumpul di titik kumpul Alun-Alun Kota Batu, perkenalan hangat dengan tim Travel Organizer, dan perjalanan bersama menuju Lereng Hijau Batu.",
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
    "Transportasi PP dari titik kumpul",
    "Tiket masuk kawasan Lereng Hijau Batu",
    "Pemandu lokal selama sesi kegiatan",
    "Seduhan teh herbal dan kudapan lokal",
    "Santap siang menu pedesaan",
  ],
  excludedItems: [
    "Transportasi peserta menuju titik kumpul awal",
    "Pengeluaran dan belanja pribadi di luar paket",
  ],
  safetyNotes: [
    "Gunakan sepatu berjalan yang nyaman dan tidak licin.",
    "Bawa jaket atau pakaian hangat tipis.",
  ],
  meetingPointLabel: "Area keberangkatan Alun-Alun Kota Batu",
  departureTimeLabel:
    "Peserta berkumpul pukul 07.00 WIB sebelum keberangkatan.",
  outboundTransport:
    "Minibus Travel Organizer dari titik kumpul Batu menuju Lereng Hijau Batu.",
  returnTransport:
    "Minibus kembali ke titik kumpul Batu setelah seluruh kegiatan selesai.",
  accessNotes: [
    "Area keberangkatan mudah diakses kendaraan pribadi di pusat Kota Batu.",
    "Titik kumpul berada di sisi timur Alun-Alun Kota Batu dengan penanda JedaIn.",
  ],
  pricing: {
    destinationBaseCost: 125000,
    localGuideFee: 25000,
    eoMargin: 150000,
    customerPrice: 300000,
  },
  guideStatus: "CERTIFIED_GUIDE",
  guideSource: "DESTINATION",
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
    "Transportasi PP dari titik kumpul Pacet",
    "Tiket masuk Lembah Alam Pacet",
    "Pemandu retreat bersertifikat",
    "Teh herbal dan kudapan buah sehat",
  ],
  excludedItems: [
    "Transportasi peserta menuju titik kumpul awal",
    "Belanja pribadi",
  ],
  safetyNotes: [
    "Kenakan pakaian santai yang nyaman.",
    "Hati-hati saat melangkah di bebatuan tepi sungai.",
  ],
  meetingPointLabel: "Pendopo Utama Lembah Alam Pacet",
  departureTimeLabel: "Berkumpul 15 menit sebelum kegiatan dimulai",
  outboundTransport: "Shuttle Travel Organizer dari titik kumpul Pacet",
  returnTransport: "Shuttle kembali ke titik kumpul Pacet setelah sesi selesai",
  accessNotes: [
    "Dapat diakses mobil dan motor, area parkir luas di gerbang utama.",
  ],
  pricing: {
    destinationBaseCost: 160000,
    localGuideFee: 30000,
    eoMargin: 100000,
    customerPrice: 290000,
  },
  guideStatus: "CERTIFIED_GUIDE",
  guideSource: "DESTINATION",
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
    startAt: "2026-10-10T08:00:00+07:00",
    endAt: "2026-10-10T14:00:00+07:00",
    capacity: 6,
    remainingSlots: 6,
    pricePerPerson: 300000,
    status: "OPEN",
    createdAt: "2026-08-05T10:00:00Z",
    operationalNote:
      "Rute jalan kaki menggunakan jalur kebun teh sisi barat. Area saung bambu disiapkan untuk istirahat sesi hening.",
    operationalNoteUpdatedAt: "2026-08-10T14:30:00Z",
  },
  {
    sessionId: "ses_sgd_2",
    packageId: "slow_green_day",
    eoId: "eo_jeda_alam",
    startAt: "2026-10-17T08:00:00+07:00",
    endAt: "2026-10-17T14:00:00+07:00",
    capacity: 6,
    remainingSlots: 4,
    pricePerPerson: 300000,
    status: "OPEN",
    createdAt: "2026-08-05T10:00:00Z",
  },
];

function clonePackage(pkg: EoPackageRecord): EoPackageRecord {
  return {
    ...pkg,
    imageUrls: pkg.imageUrls ? [...pkg.imageUrls] : undefined,
    suitableGroupTypes: [...pkg.suitableGroupTypes],
    highlights: [...pkg.highlights],
    itinerary: pkg.itinerary.map((it) => ({ ...it })),
    includedItems: [...pkg.includedItems],
    excludedItems: [...pkg.excludedItems],
    safetyNotes: [...pkg.safetyNotes],
    accessNotes: pkg.accessNotes ? [...pkg.accessNotes] : undefined,
    pricing: { ...pkg.pricing },
  };
}

let packages: EoPackageRecord[] = [
  clonePackage(SEEDED_LIVE_PACKAGE),
  clonePackage(SEEDED_PENDING_PACKAGE),
];
let sessions: EoSessionRecord[] = SEEDED_SESSIONS.map((s) => ({ ...s }));

export const mockEoPackageStore = {
  replaceFromBackend(
    packageRecords: EoPackageRecord[],
    sessionRecords: EoSessionRecord[],
  ): void {
    packages = packageRecords.map(clonePackage);
    sessions = sessionRecords.map((session) => ({ ...session }));
  },
  reset(): void {
    customPackageImageStore.reset();
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
    const effectiveGuideSource = draft.guideSource || "DESTINATION";
    const localGuideFee =
      effectiveGuideSource === "DESTINATION"
        ? (dest?.localGuideFeePerPerson ?? 0)
        : 0;
    const customerPrice = baseCost + localGuideFee + margin;
    const imageUrls =
      draft.imageUrls ??
      (draft.imageUrl
        ? [draft.imageUrl]
        : existingIndex >= 0
          ? packages[existingIndex].imageUrls
          : undefined);
    const imageUrl = draft.imageUrl ?? imageUrls?.[0];

    const record: EoPackageRecord = {
      packageId,
      eoId: actorEoId,
      eoDisplayName: actorDisplayName,
      title: draft.title || "",
      shortSummary: draft.shortSummary || "",
      valueProposition: draft.valueProposition || draft.shortSummary || "",
      destinationId: draft.destinationId || "",
      imageUrl,
      imageUrls: imageUrls ? [...new Set(imageUrls)] : undefined,
      insightId: draft.insightId,
      durationLabel: draft.durationLabel || "1 hari",
      suitableGroupTypes: draft.suitableGroupTypes || [
        "SOLO",
        "PARTNER",
        "FRIENDS",
      ],
      highlights: draft.highlights || [],
      itinerary: draft.itinerary || [],
      includedItems:
        draft.includedItems !== undefined
          ? draft.includedItems
          : existingIndex >= 0
            ? packages[existingIndex].includedItems
            : [],
      excludedItems:
        draft.excludedItems !== undefined
          ? draft.excludedItems
          : existingIndex >= 0
            ? packages[existingIndex].excludedItems
            : [],
      safetyNotes:
        draft.safetyNotes !== undefined
          ? draft.safetyNotes
          : existingIndex >= 0
            ? packages[existingIndex].safetyNotes
            : [],
      meetingPointLabel:
        draft.meetingPointLabel !== undefined
          ? draft.meetingPointLabel
          : existingIndex >= 0
            ? packages[existingIndex].meetingPointLabel
            : undefined,
      departureTimeLabel:
        draft.departureTimeLabel !== undefined
          ? draft.departureTimeLabel
          : existingIndex >= 0
            ? packages[existingIndex].departureTimeLabel
            : undefined,
      outboundTransport:
        draft.outboundTransport !== undefined
          ? draft.outboundTransport
          : existingIndex >= 0
            ? packages[existingIndex].outboundTransport
            : undefined,
      returnTransport:
        draft.returnTransport !== undefined
          ? draft.returnTransport
          : existingIndex >= 0
            ? packages[existingIndex].returnTransport
            : undefined,
      accessNotes:
        draft.accessNotes !== undefined
          ? draft.accessNotes
          : existingIndex >= 0
            ? packages[existingIndex].accessNotes
            : undefined,
      pricing: {
        destinationBaseCost: baseCost,
        localGuideFee,
        eoMargin: margin,
        customerPrice,
      },
      guideStatus: authorGuideStatus,
      guideSource: draft.guideSource || "DESTINATION",
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

    if (record.imageUrl) {
      customPackageImageStore.set(record.packageId, record.imageUrl);
    } else {
      customPackageImageStore.delete(record.packageId);
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
    operationalNote?: string;
    nowMs?: number;
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

    const dest = mockDestinationStore.getById(pkg.destinationId);
    if (!dest) {
      return {
        success: false,
        message: "Destinasi tidak ditemukan atau belum terdaftar aktif.",
      };
    }

    if (input.capacity > dest.capacityPerSession) {
      return {
        success: false,
        message: `Kapasitas sesi maksimal untuk ${dest.name} adalah ${dest.capacityPerSession} orang.`,
      };
    }

    // Temporal validation (EO-F01)
    const nowMs = input.nowMs ?? Date.now();
    const startMs = Date.parse(input.startAt);
    const endMs = Date.parse(input.endAt);

    if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
      return {
        success: false,
        message: "Format tanggal dan waktu sesi tidak valid.",
      };
    }

    if (startMs <= nowMs) {
      return {
        success: false,
        message:
          "Waktu mulai sesi harus di masa depan (tidak boleh di masa lalu atau waktu sekarang).",
      };
    }

    if (endMs <= startMs) {
      return {
        success: false,
        message: "Waktu selesai sesi harus setelah waktu mulai.",
      };
    }

    // Schedule conflict across all packages & EOs for the same destination
    // Statuses OPEN, FULL, and CLOSED block the schedule; only CANCELLED frees it.
    const destinationPkgIds = new Set(
      packages
        .filter((p) => p.destinationId === pkg.destinationId)
        .map((p) => p.packageId),
    );

    const conflictSession = sessions.find((s) => {
      if (!destinationPkgIds.has(s.packageId)) return false;
      if (s.status === "CANCELLED") return false;
      const existingStartMs = Date.parse(s.startAt);
      const existingEndMs = Date.parse(s.endAt);
      if (Number.isNaN(existingStartMs) || Number.isNaN(existingEndMs)) {
        return false;
      }
      // Interval [start, end) overlap: new.start < existing.end && new.end > existing.start
      return startMs < existingEndMs && endMs > existingStartMs;
    });

    if (conflictSession) {
      return {
        success: false,
        message: `Destinasi sudah digunakan pada ${formatSessionTimeWindow(
          conflictSession.startAt,
          conflictSession.endAt,
        )}. Pilih waktu lain.`,
      };
    }

    const nowIso = new Date(nowMs).toISOString();
    const cleanNote = input.operationalNote?.trim();
    const sessionId = `ses_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const session: EoSessionRecord = {
      sessionId,
      packageId: input.packageId,
      eoId: pkg.eoId,
      startAt: new Date(startMs).toISOString(),
      endAt: new Date(endMs).toISOString(),
      capacity: input.capacity,
      remainingSlots: input.capacity,
      pricePerPerson: input.pricePerPerson,
      status: "OPEN",
      createdAt: nowIso,
      operationalNote: cleanNote || undefined,
      operationalNoteUpdatedAt: cleanNote ? nowIso : undefined,
    };

    sessions.push(session);
    return { success: true, session: { ...session } };
  },

  updateSessionStatus(
    sessionId: string,
    status: "OPEN" | "FULL" | "CLOSED" | "CANCELLED",
    nowMs?: number,
  ): boolean {
    const actor = partnerSessionStore.get();
    if (!actor || actor.role !== "EO") return false;

    const app = mockApplicationStore.getBySellerId(actor.id);
    if (!app || app.status !== "APPROVED") return false;

    const s = sessions.find(
      (item) => item.sessionId === sessionId && item.eoId === actor.id,
    );
    if (!s) return false;

    // Past session must not be reopened (EO-F01)
    if (status === "OPEN") {
      const currentNowMs = nowMs ?? Date.now();
      const startMs = Date.parse(s.startAt);
      if (Number.isNaN(startMs) || startMs <= currentNowMs) {
        return false;
      }
    }

    // Active session status (OPEN, FULL, CLOSED) must not exceed destination capacity limit
    if (status !== "CANCELLED") {
      const pkg = packages.find((p) => p.packageId === s.packageId);
      if (pkg) {
        const dest = mockDestinationStore.getById(pkg.destinationId);
        if (dest && s.capacity > dest.capacityPerSession) {
          return false;
        }
      }
    }

    // Reopening a CANCELLED session must respect destination schedule conflict
    if (s.status === "CANCELLED" && status !== "CANCELLED") {
      const pkg = packages.find((p) => p.packageId === s.packageId);
      if (pkg) {
        const destinationPkgIds = new Set(
          packages
            .filter((p) => p.destinationId === pkg.destinationId)
            .map((p) => p.packageId),
        );
        const sStartMs = Date.parse(s.startAt);
        const sEndMs = Date.parse(s.endAt);
        const hasConflict = sessions.some((other) => {
          if (other.sessionId === s.sessionId) return false;
          if (!destinationPkgIds.has(other.packageId)) return false;
          if (other.status === "CANCELLED") return false;
          const oStartMs = Date.parse(other.startAt);
          const oEndMs = Date.parse(other.endAt);
          return sStartMs < oEndMs && sEndMs > oStartMs;
        });
        if (hasConflict) {
          return false;
        }
      }
    }

    s.status = status;
    return true;
  },

  updateSessionOperationalNote(
    sessionId: string,
    operationalNote?: string,
  ): boolean {
    const actor = partnerSessionStore.get();
    if (!actor || actor.role !== "EO") return false;

    const app = mockApplicationStore.getBySellerId(actor.id);
    if (!app || app.status !== "APPROVED") return false;

    const s = sessions.find(
      (item) => item.sessionId === sessionId && item.eoId === actor.id,
    );
    if (!s) return false;

    const cleanNote = operationalNote?.trim();
    s.operationalNote = cleanNote || undefined;
    s.operationalNoteUpdatedAt = cleanNote
      ? new Date().toISOString()
      : undefined;
    return true;
  },

  updateSessionSchedule(input: {
    sessionId: string;
    startAt: string;
    endAt: string;
    capacity: number;
    nowMs?: number;
  }): { success: boolean; session?: EoSessionRecord; message?: string } {
    const actor = partnerSessionStore.get();
    if (!actor || actor.role !== "EO") {
      return {
        success: false,
        message: "Hanya Travel Organizer yang dapat mengubah sesi.",
      };
    }
    const app = mockApplicationStore.getBySellerId(actor.id);
    if (!app || app.status !== "APPROVED") {
      return {
        success: false,
        message: "Akun Travel Organizer belum disetujui.",
      };
    }
    const session = sessions.find(
      (item) => item.sessionId === input.sessionId && item.eoId === actor.id,
    );
    if (!session) return { success: false, message: "Sesi tidak ditemukan." };
    const nowMs = input.nowMs ?? Date.now();
    const startMs = Date.parse(input.startAt);
    const endMs = Date.parse(input.endAt);
    if (
      !["OPEN", "FULL", "CLOSED"].includes(session.status) ||
      Date.parse(session.startAt) <= nowMs
    ) {
      return {
        success: false,
        message:
          "Hanya sesi mendatang yang tidak dibatalkan yang dapat diubah.",
      };
    }
    if (!Number.isInteger(input.capacity) || input.capacity < 1) {
      return { success: false, message: "Kapasitas peserta minimal 1 orang." };
    }
    if (
      Number.isNaN(startMs) ||
      Number.isNaN(endMs) ||
      startMs <= nowMs ||
      endMs <= startMs
    ) {
      return {
        success: false,
        message:
          "Waktu mulai harus di masa depan dan waktu selesai setelahnya.",
      };
    }
    const booked = session.capacity - session.remainingSlots;
    if (input.capacity < booked) {
      return {
        success: false,
        message: `Kapasitas tidak boleh kurang dari ${booked} peserta yang sudah memesan.`,
      };
    }
    if (
      booked > 0 &&
      (input.startAt !== session.startAt || input.endAt !== session.endAt)
    ) {
      return {
        success: false,
        message:
          "Waktu sesi dengan peserta terdaftar belum dapat diubah di prototipe.",
      };
    }
    const pkg = packages.find((item) => item.packageId === session.packageId);
    const dest = pkg && mockDestinationStore.getById(pkg.destinationId);
    if (!dest || input.capacity > dest.capacityPerSession) {
      return {
        success: false,
        message: dest
          ? `Kapasitas sesi maksimal untuk ${dest.name} adalah ${dest.capacityPerSession} orang.`
          : "Destinasi tidak ditemukan atau belum terdaftar aktif.",
      };
    }
    const destinationPackageIds = new Set(
      packages
        .filter((item) => item.destinationId === pkg.destinationId)
        .map((item) => item.packageId),
    );
    const conflict = sessions.find(
      (item) =>
        item.sessionId !== session.sessionId &&
        item.status !== "CANCELLED" &&
        destinationPackageIds.has(item.packageId) &&
        startMs < Date.parse(item.endAt) &&
        endMs > Date.parse(item.startAt),
    );
    if (conflict) {
      return {
        success: false,
        message: `Destinasi sudah digunakan pada ${formatSessionTimeWindow(conflict.startAt, conflict.endAt)}. Pilih waktu lain.`,
      };
    }
    session.startAt = input.startAt;
    session.endAt = input.endAt;
    session.capacity = input.capacity;
    session.remainingSlots = input.capacity - booked;
    if (session.status !== "CLOSED") {
      session.status = session.remainingSlots === 0 ? "FULL" : "OPEN";
    }
    return { success: true, session: { ...session } };
  },

  upsertPackage(record: EoPackageRecord): void {
    const idx = packages.findIndex((p) => p.packageId === record.packageId);
    if (idx >= 0) {
      packages[idx] = clonePackage(record);
    } else {
      packages.push(clonePackage(record));
    }
  },

  upsertSession(record: EoSessionRecord): void {
    const idx = sessions.findIndex((s) => s.sessionId === record.sessionId);
    if (idx >= 0) {
      sessions[idx] = { ...record };
    } else {
      sessions.push({ ...record });
    }
  },
};
