import type {
  DemandDistributionItem,
  DemandFilterOptions,
  DemandInsightRecord,
  DemandSignalSummary,
} from "./types";

/**
 * Deterministic prototype reference date for time-aware demand queries.
 * Saturday, 5 September 2026.
 */
export const PROTOTYPE_AS_OF_DATE = "2026-09-05";

export interface PrototypeDemandEvent {
  id: string;
  timestamp: string; // YYYY-MM-DDTHH:mm:ssZ
  date: string; // YYYY-MM-DD
  intent: "NATURE" | "CALM" | "EXPLORATION" | "REFLECTION";
  budgetBand: "b_under_200k" | "b_200_300k" | "b_300_500k" | "b_above_500k";
  durationBand: "d_halfday" | "d_fullday" | "d_2d1n";
  departureAreaRaw: string;
  matchedOpportunityIds: string[];
}

export function normalizeAreaLabel(raw: string): string {
  const trimmed = raw.trim().replace(/\s+/g, " ");
  if (!trimmed) return "Area lain";

  // Known city/district direct match or canonical casing
  const lower = trimmed.toLowerCase();
  if (lower === "malang") return "Malang";
  if (lower === "batu") return "Batu";
  if (lower === "surabaya") return "Surabaya";
  if (lower === "sidoarjo") return "Sidoarjo";
  if (lower === "kediri") return "Kediri";
  if (lower === "pasuruan") return "Pasuruan";
  if (lower === "blitar") return "Blitar";
  if (lower === "jakarta" || lower === "dki jakarta") return "Jakarta";
  if (lower === "gresik") return "Gresik";
  if (lower === "mojokerto") return "Mojokerto";

  // Title-case fallback
  return trimmed
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Allowed origin sets per opportunity to guarantee truthful "Asal traveler" context.
 */
export const OPPORTUNITY_ALLOWED_ORIGINS: Record<string, readonly string[]> = {
  ins_nature_batu_1d: ["Malang", "Surabaya"],
  ins_mindful_pacet_halfday: ["Surabaya", "Sidoarjo"],
  ins_workshop_culture_weekend: ["Malang", "Batu"],
};

/**
 * Deterministic generation of the 1,020 prototype traveler demand responses.
 * Exactly matches all-time distribution counts:
 *
 * Total responses: 1,020
 *
 * Intents:
 * - NATURE: 428 (42%)
 * - CALM: 286 (28%)
 * - EXPLORATION: 164 (16%)
 * - REFLECTION: 142 (14%)
 *
 * Budgets:
 * - b_under_200k: 224 (22%)
 * - b_200_300k: 490 (48%)
 * - b_300_500k: 214 (21%)
 * - b_above_500k: 92 (9%)
 *
 * Durations:
 * - d_halfday: 357 (35%)
 * - d_fullday: 530 (52%)
 * - d_2d1n: 133 (13%)
 *
 * Unmet demand opportunities:
 * - ins_nature_batu_1d: 312
 * - ins_mindful_pacet_halfday: 198
 * - ins_workshop_culture_weekend: 145
 *
 * Exact Departure Areas:
 * Normalized individual areas (Malang: 306, Surabaya: 260, Batu: 153, Sidoarjo: 148,
 * Kediri: 51, Pasuruan: 42, Jakarta: 35, Blitar: 25) -> Sum = 1,020.
 *
 * Calendar Timeline (relative to PROTOTYPE_AS_OF_DATE: 2026-09-05):
 * - TODAY (2026-09-05, Saturday): 18 responses
 * - YESTERDAY (2026-09-04, Friday): 24 responses
 * - THIS_WEEK (2026-08-31 Mon to 2026-09-05 Sat): 126 responses
 * - THIS_MONTH (2026-09-01 Tue to 2026-09-05 Sat): 108 responses
 * - ALL: 1,020 responses (across August & early September 2026)
 */

// Seeded pseudo-random generator (Mulberry32) for deterministic reproducible interleaving
function createDeterministicRng(seed: number) {
  let s = seed;
  return function () {
    let t = (s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function deterministicShuffle<T>(array: T[], rng: () => number): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}

function buildPrototypeEvents(): PrototypeDemandEvent[] {
  // 1. Quotas of all-time totals
  const budgetsQuota = {
    b_under_200k: 224,
    b_200_300k: 490,
    b_300_500k: 214,
    b_above_500k: 92,
  };
  const durationsQuota = { d_halfday: 357, d_fullday: 530, d_2d1n: 133 };
  const areasQuota: Record<string, number> = {
    Malang: 306,
    Surabaya: 260,
    Batu: 153,
    Sidoarjo: 148,
    Kediri: 51,
    Pasuruan: 42,
    Jakarta: 35,
    Blitar: 25,
  };

  interface EventDraft {
    opp: string[];
    intent: "NATURE" | "CALM" | "EXPLORATION" | "REFLECTION";
    duration: "d_halfday" | "d_fullday" | "d_2d1n";
    budget: "b_under_200k" | "b_200_300k" | "b_300_500k" | "b_above_500k";
    area: string;
  }

  const drafts: EventDraft[] = [];

  // Group 1: 312 events for ins_nature_batu_1d (Nature, full/half day, Rp200k-300k, Malang/Surabaya ONLY)
  for (let i = 0; i < 312; i++) {
    drafts.push({
      opp: ["ins_nature_batu_1d"],
      intent: "NATURE",
      duration: i < 280 ? "d_fullday" : "d_halfday",
      budget: i < 230 ? "b_200_300k" : i < 280 ? "b_under_200k" : "b_300_500k",
      area: i < 170 ? "Malang" : "Surabaya",
    });
  }

  // Group 2: 198 events for ins_mindful_pacet_halfday (Calm, half/full day, Rp150-250k, Surabaya/Sidoarjo ONLY)
  for (let i = 0; i < 198; i++) {
    drafts.push({
      opp: ["ins_mindful_pacet_halfday"],
      intent: "CALM",
      duration: i < 170 ? "d_halfday" : "d_fullday",
      budget: i < 90 ? "b_under_200k" : i < 178 ? "b_200_300k" : "b_300_500k",
      area: i < 108 ? "Surabaya" : "Sidoarjo",
    });
  }

  // Group 3: 145 events for ins_workshop_culture_weekend (Exploration, weekend, Rp250-350k, Malang/Batu ONLY for Malang Raya)
  for (let i = 0; i < 145; i++) {
    drafts.push({
      opp: ["ins_workshop_culture_weekend"],
      intent: "EXPLORATION",
      duration: i < 95 ? "d_fullday" : i < 125 ? "d_2d1n" : "d_halfday",
      budget: i < 80 ? "b_200_300k" : i < 130 ? "b_300_500k" : "b_above_500k",
      area: i < 95 ? "Malang" : "Batu",
    });
  }

  // Group 4: Remaining 365 unmatched events to complete exact canonical totals:
  // Nature: 428 - 312 = 116
  // Calm: 286 - 198 = 88
  // Exploration: 164 - 145 = 19
  // Reflection: 142
  const remIntents: ("NATURE" | "CALM" | "EXPLORATION" | "REFLECTION")[] = [
    ...Array<"NATURE">(116).fill("NATURE"),
    ...Array<"CALM">(88).fill("CALM"),
    ...Array<"EXPLORATION">(19).fill("EXPLORATION"),
    ...Array<"REFLECTION">(142).fill("REFLECTION"),
  ];

  const usedBudget = {
    b_under_200k: 0,
    b_200_300k: 0,
    b_300_500k: 0,
    b_above_500k: 0,
  };
  for (const d of drafts) usedBudget[d.budget]++;

  const remBudgets: (
    "b_under_200k" | "b_200_300k" | "b_300_500k" | "b_above_500k"
  )[] = [
    ...Array<"b_under_200k">(
      budgetsQuota.b_under_200k - usedBudget.b_under_200k,
    ).fill("b_under_200k"),
    ...Array<"b_200_300k">(
      budgetsQuota.b_200_300k - usedBudget.b_200_300k,
    ).fill("b_200_300k"),
    ...Array<"b_300_500k">(
      budgetsQuota.b_300_500k - usedBudget.b_300_500k,
    ).fill("b_300_500k"),
    ...Array<"b_above_500k">(
      budgetsQuota.b_above_500k - usedBudget.b_above_500k,
    ).fill("b_above_500k"),
  ];

  const usedDur = { d_halfday: 0, d_fullday: 0, d_2d1n: 0 };
  for (const d of drafts) usedDur[d.duration]++;

  const remDurations: ("d_halfday" | "d_fullday" | "d_2d1n")[] = [
    ...Array<"d_halfday">(durationsQuota.d_halfday - usedDur.d_halfday).fill(
      "d_halfday",
    ),
    ...Array<"d_fullday">(durationsQuota.d_fullday - usedDur.d_fullday).fill(
      "d_fullday",
    ),
    ...Array<"d_2d1n">(durationsQuota.d_2d1n - usedDur.d_2d1n).fill("d_2d1n"),
  ];

  const usedArea: Record<string, number> = {};
  for (const d of drafts) usedArea[d.area] = (usedArea[d.area] || 0) + 1;

  const remAreas: string[] = [];
  for (const [a, tot] of Object.entries(areasQuota)) {
    const rem = tot - (usedArea[a] || 0);
    for (let k = 0; k < rem; k++) remAreas.push(a);
  }

  // Shuffle remaining uncorrelated attributes deterministically
  const rngSetup = createDeterministicRng(12345);
  deterministicShuffle(remIntents, rngSetup);
  deterministicShuffle(remBudgets, rngSetup);
  deterministicShuffle(remDurations, rngSetup);
  deterministicShuffle(remAreas, rngSetup);

  for (let i = 0; i < 365; i++) {
    drafts.push({
      opp: [],
      intent: remIntents[i],
      duration: remDurations[i],
      budget: remBudgets[i],
      area: remAreas[i],
    });
  }

  // Interleave all 1,020 drafts deterministically across the chronological timeline
  const rngDrafts = createDeterministicRng(98765);
  deterministicShuffle(drafts, rngDrafts);

  // Date partition targets summing to 1,020:
  // Today (2026-09-05): 18
  // Yesterday (2026-09-04): 24
  // 2026-09-03: 20
  // 2026-09-02: 22
  // 2026-09-01: 24 (Sum Sep 1-5 = 108)
  // 2026-08-31: 18 (Sum Mon Aug 31 - Sat Sep 5 = 126)
  // Prior August days: 894 responses across 2026-08-01 to 2026-08-30
  const dateQuotas: Record<string, number> = {
    "2026-09-05": 18,
    "2026-09-04": 24,
    "2026-09-03": 20,
    "2026-09-02": 22,
    "2026-09-01": 24,
    "2026-08-31": 18,
  };

  const datesToAssign: string[] = [];
  for (const [d, count] of Object.entries(dateQuotas)) {
    for (let i = 0; i < count; i++) datesToAssign.push(d);
  }

  const remainingTarget = 1020 - datesToAssign.length;
  for (let i = 0; i < remainingTarget; i++) {
    const day = 1 + (i % 30);
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    datesToAssign.push(`2026-08-${dayStr}`);
  }

  const events: PrototypeDemandEvent[] = [];
  for (let i = 0; i < 1020; i++) {
    const d = drafts[i];
    const date = datesToAssign[i];
    const hour = (i * 7) % 24;
    const minute = (i * 13) % 60;
    const hourStr = hour < 10 ? `0${hour}` : `${hour}`;
    const minStr = minute < 10 ? `0${minute}` : `${minute}`;

    events.push({
      id: `ev_${i + 1}`,
      timestamp: `${date}T${hourStr}:${minStr}:00Z`,
      date,
      intent: d.intent,
      budgetBand: d.budget,
      durationBand: d.duration,
      departureAreaRaw: d.area,
      matchedOpportunityIds: d.opp,
    });
  }

  return events;
}

export const PROTOTYPE_DEMAND_EVENTS: PrototypeDemandEvent[] =
  buildPrototypeEvents();

export const MOCK_DEMAND_INSIGHT_METADATA: Omit<
  DemandInsightRecord,
  "travelerDemandCount"
>[] = [
  {
    insightId: "ins_nature_batu_1d",
    title: "Tingginya Permintaan Jeda Alam 1 Hari di Lereng Malang Raya",
    intent: "NATURE",
    intentLabel: "Dekat dengan alam",
    targetArea: "Malang / Surabaya",
    durationLabel: "1 hari",
    preferredBudgetRange: "Rp200.000 – Rp300.000 / orang",
    unmetDemandDescription:
      "Traveler dari Malang & Surabaya mencari paket alam satu hari dengan pemandu ramah dan sesi teh/makan siang lokal. Pasokan paket terkurasi saat ini masih terbatas.",
    recommendedFocus: [
      "Jalan santai kebun teh/pegunungan (intensitas ringan)",
      "Termasuk santap siang lokal dan seduhan herbal",
      "Waktu selesai sebelum sore agar nyaman pulang hari yang sama",
    ],
    sampleActivities: [
      "Walking tour kebun teh & respirasi mindfulness",
      "Seduh teh herbal lokal bareng petani",
      "Makan siang bersama menu pedesaan",
    ],
  },
  {
    insightId: "ins_mindful_pacet_halfday",
    title: "Kebutuhan Retreat Singkat Setengah Hari di Mojokerto / Pacet",
    intent: "CALM",
    intentLabel: "Tenang & recharge",
    targetArea: "Surabaya / Sidoarjo",
    durationLabel: "Setengah hari",
    preferredBudgetRange: "Rp150.000 – Rp250.000 / orang",
    unmetDemandDescription:
      "Traveler mencari jeda pagi hari 4–5 jam di tepi sungai atau hutan pinus dengan jeda bising perkotaan total.",
    recommendedFocus: [
      "Sesi hening tepi sungai dan relaksasi napas",
      "Kapasitas grup kecil 4–10 orang untuk menjaga ketenangan",
      "Akses mudah dari jalan utama",
    ],
    sampleActivities: [
      "Sound healing suara sungai alami",
      "Jeda hening & teh herbal pagi",
      "Piknik ringan buah & kudapan sehat",
    ],
  },
  {
    insightId: "ins_workshop_culture_weekend",
    title: "Minat Belajar Kerajinan & Tradisi Lokal Akhir Pekan",
    intent: "EXPLORATION",
    intentLabel: "Eksplorasi & suasana baru",
    targetArea: "Malang Raya",
    durationLabel: "1 hari",
    preferredBudgetRange: "Rp250.000 – Rp350.000 / orang",
    unmetDemandDescription:
      "Traveler tertarik mencoba kerajinan tanah liat atau membatik alami dipadukan dengan jalan santai desa.",
    recommendedFocus: [
      "Workshop interaktif bersama pengrajin lokal",
      "Membawa pulang hasil karya sendiri",
      "Pengalaman budaya otentik tanpa kesan komersil berlebih",
    ],
    sampleActivities: [
      "Sesi memilin gerabah tradisional",
      "Keliling desa & cicip kudapan tradisional",
      "Foto dokumentasi karya",
    ],
  },
];

/**
 * Filter predicate based on period preset or custom range relative to PROTOTYPE_AS_OF_DATE
 */
export function matchesPeriod(
  eventDate: string,
  options?: DemandFilterOptions,
): boolean {
  if (!options || options.period === "ALL") return true;

  const asOf = PROTOTYPE_AS_OF_DATE; // "2026-09-05" (Saturday)
  const [asOfY, asOfM, asOfD] = asOf.split("-").map(Number);
  const asOfDateObj = new Date(Date.UTC(asOfY, asOfM - 1, asOfD));

  if (options.period === "TODAY") {
    return eventDate === asOf;
  }

  if (options.period === "YESTERDAY") {
    const yestDateObj = new Date(asOfDateObj.getTime() - 24 * 60 * 60 * 1000);
    const yestStr = yestDateObj.toISOString().slice(0, 10);
    return eventDate === yestStr;
  }

  if (options.period === "THIS_WEEK") {
    // Week starts Monday: 2026-08-31 to 2026-09-05
    return eventDate >= "2026-08-31" && eventDate <= asOf;
  }

  if (options.period === "THIS_MONTH") {
    // Month starts 2026-09-01 to 2026-09-05
    return eventDate >= "2026-09-01" && eventDate <= asOf;
  }

  if (options.period === "THIS_YEAR") {
    // Year starts 2026-01-01 to 2026-09-05 (covers all 2026 prototype data)
    return eventDate >= "2026-01-01" && eventDate <= asOf;
  }

  if (options.period === "CUSTOM") {
    const start = options.customRange?.startDate;
    const end = options.customRange?.endDate;
    if (start && eventDate < start) return false;
    if (end && eventDate > end) return false;
    return true;
  }

  return true;
}

export const mockInsightStore = {
  getAsOfDate(): string {
    return PROTOTYPE_AS_OF_DATE;
  },

  getAllEvents(): readonly PrototypeDemandEvent[] {
    return PROTOTYPE_DEMAND_EVENTS;
  },

  getEvents(options?: DemandFilterOptions): PrototypeDemandEvent[] {
    if (!options || options.period === "ALL")
      return [...PROTOTYPE_DEMAND_EVENTS];
    return PROTOTYPE_DEMAND_EVENTS.filter((ev) =>
      matchesPeriod(ev.date, options),
    );
  },

  getTotalResponses(options?: DemandFilterOptions): number {
    return this.getEvents(options).length;
  },

  getSignals(options?: DemandFilterOptions): readonly DemandSignalSummary[] {
    const events = this.getEvents(options);
    const total = events.length;

    if (total === 0 && options?.period !== "ALL") {
      return [
        {
          intent: "NATURE",
          intentLabel: "Dekat dengan alam",
          percentage: 0,
          travelerCount: 0,
          description:
            "Jeda luar ruangan berhawa sejuk dengan ritme santai dan pemandangan hijau.",
        },
        {
          intent: "CALM",
          intentLabel: "Tenang & recharge",
          percentage: 0,
          travelerCount: 0,
          description:
            "Mencari tempat hening untuk melepas kejenuhan kerja tanpa beban fisik berlebih.",
        },
        {
          intent: "EXPLORATION",
          intentLabel: "Eksplorasi & suasana baru",
          percentage: 0,
          travelerCount: 0,
          description:
            "Tertarik berjalan di desa wisata atau mengenal tradisi lokal yang hangat.",
        },
        {
          intent: "REFLECTION",
          intentLabel: "Refleksi & me-time",
          percentage: 0,
          travelerCount: 0,
          description:
            "Perjalanan solo atau privat dengan ruang waktu membaca, menulis, dan meditasi ringan.",
        },
      ];
    }

    if (!options || options.period === "ALL") {
      // Return exact canonical all-time reference
      return [
        {
          intent: "NATURE",
          intentLabel: "Dekat dengan alam",
          percentage: 42,
          travelerCount: 428,
          description:
            "Kebutuhan traveler tertinggi: jeda luar ruangan berhawa sejuk dengan ritme santai dan pemandangan hijau.",
        },
        {
          intent: "CALM",
          intentLabel: "Tenang & recharge",
          percentage: 28,
          travelerCount: 286,
          description:
            "Mencari tempat hening untuk melepas kejenuhan kerja tanpa beban fisik berlebih.",
        },
        {
          intent: "EXPLORATION",
          intentLabel: "Eksplorasi & suasana baru",
          percentage: 16,
          travelerCount: 164,
          description:
            "Tertarik berjalan di desa wisata atau mengenal tradisi lokal yang hangat.",
        },
        {
          intent: "REFLECTION",
          intentLabel: "Refleksi & me-time",
          percentage: 14,
          travelerCount: 142,
          description:
            "Perjalanan solo atau privat dengan ruang waktu membaca, menulis, dan meditasi ringan.",
        },
      ];
    }

    // Dynamic derivation for period subsets
    const counts = { NATURE: 0, CALM: 0, EXPLORATION: 0, REFLECTION: 0 };
    for (const ev of events) counts[ev.intent]++;

    return [
      {
        intent: "NATURE",
        intentLabel: "Dekat dengan alam",
        percentage: Math.round((counts.NATURE / total) * 100),
        travelerCount: counts.NATURE,
        description:
          "Kebutuhan traveler tertinggi: jeda luar ruangan berhawa sejuk dengan ritme santai dan pemandangan hijau.",
      },
      {
        intent: "CALM",
        intentLabel: "Tenang & recharge",
        percentage: Math.round((counts.CALM / total) * 100),
        travelerCount: counts.CALM,
        description:
          "Mencari tempat hening untuk melepas kejenuhan kerja tanpa beban fisik berlebih.",
      },
      {
        intent: "EXPLORATION",
        intentLabel: "Eksplorasi & suasana baru",
        percentage: Math.round((counts.EXPLORATION / total) * 100),
        travelerCount: counts.EXPLORATION,
        description:
          "Tertarik berjalan di desa wisata atau mengenal tradisi lokal yang hangat.",
      },
      {
        intent: "REFLECTION",
        intentLabel: "Refleksi & me-time",
        percentage: Math.round((counts.REFLECTION / total) * 100),
        travelerCount: counts.REFLECTION,
        description:
          "Perjalanan solo atau privat dengan ruang waktu membaca, menulis, dan meditasi ringan.",
      },
    ];
  },

  getBudgetDistribution(
    options?: DemandFilterOptions,
  ): readonly DemandDistributionItem[] {
    const events = this.getEvents(options);
    const total = events.length;

    if (total === 0 && options?.period !== "ALL") {
      return [
        {
          id: "b_under_200k",
          label: "Di bawah Rp200.000",
          count: 0,
          percentage: 0,
          description: "Trip hemat setengah hari / jalan santai mandiri.",
        },
        {
          id: "b_200_300k",
          label: "Rp200.000 – Rp300.000",
          count: 0,
          percentage: 0,
          description:
            "Kisaran paling diminati untuk trip 1 hari dengan konsumsi.",
        },
        {
          id: "b_300_500k",
          label: "Rp300.000 – Rp500.000",
          count: 0,
          percentage: 0,
          description: "Paket lengkap dengan workshop atau pemandu khusus.",
        },
        {
          id: "b_above_500k",
          label: "Di atas Rp500.000",
          count: 0,
          percentage: 0,
          description: "Retreat privat menginap (2D1N).",
        },
      ];
    }

    if (!options || options.period === "ALL") {
      // Return exact canonical all-time reference
      return [
        {
          id: "b_under_200k",
          label: "Di bawah Rp200.000",
          count: 224,
          percentage: 22,
          description: "Trip hemat setengah hari / jalan santai mandiri.",
        },
        {
          id: "b_200_300k",
          label: "Rp200.000 – Rp300.000",
          count: 490,
          percentage: 48,
          description:
            "Kisaran paling diminati untuk trip 1 hari dengan konsumsi.",
        },
        {
          id: "b_300_500k",
          label: "Rp300.000 – Rp500.000",
          count: 214,
          percentage: 21,
          description: "Paket lengkap dengan workshop atau pemandu khusus.",
        },
        {
          id: "b_above_500k",
          label: "Di atas Rp500.000",
          count: 92,
          percentage: 9,
          description: "Retreat privat menginap (2D1N).",
        },
      ];
    }

    const counts = {
      b_under_200k: 0,
      b_200_300k: 0,
      b_300_500k: 0,
      b_above_500k: 0,
    };
    for (const ev of events) counts[ev.budgetBand]++;

    return [
      {
        id: "b_under_200k",
        label: "Di bawah Rp200.000",
        count: counts.b_under_200k,
        percentage: Math.round((counts.b_under_200k / total) * 100),
        description: "Trip hemat setengah hari / jalan santai mandiri.",
      },
      {
        id: "b_200_300k",
        label: "Rp200.000 – Rp300.000",
        count: counts.b_200_300k,
        percentage: Math.round((counts.b_200_300k / total) * 100),
        description:
          "Kisaran paling diminati untuk trip 1 hari dengan konsumsi.",
      },
      {
        id: "b_300_500k",
        label: "Rp300.000 – Rp500.000",
        count: counts.b_300_500k,
        percentage: Math.round((counts.b_300_500k / total) * 100),
        description: "Paket lengkap dengan workshop atau pemandu khusus.",
      },
      {
        id: "b_above_500k",
        label: "Di atas Rp500.000",
        count: counts.b_above_500k,
        percentage: Math.round((counts.b_above_500k / total) * 100),
        description: "Retreat privat menginap (2D1N).",
      },
    ];
  },

  getDurationDistribution(
    options?: DemandFilterOptions,
  ): readonly DemandDistributionItem[] {
    const events = this.getEvents(options);
    const total = events.length;

    if (total === 0 && options?.period !== "ALL") {
      return [
        {
          id: "d_halfday",
          label: "Setengah Hari (4–5 Jam)",
          count: 0,
          percentage: 0,
          description: "Sesi hening pagi atau jeda sore tanpa menginap.",
        },
        {
          id: "d_fullday",
          label: "1 Hari Penuh (6–8 Jam)",
          count: 0,
          percentage: 0,
          description:
            "Format terfavorit: berangkat pagi, santap siang, pulang sore.",
        },
        {
          id: "d_2d1n",
          label: "2 Hari 1 Malam (Menginap)",
          count: 0,
          percentage: 0,
          description: "Retreat akhir pekan di kabin atau camping alam.",
        },
      ];
    }

    if (!options || options.period === "ALL") {
      // Return exact canonical all-time reference
      return [
        {
          id: "d_halfday",
          label: "Setengah Hari (4–5 Jam)",
          count: 357,
          percentage: 35,
          description: "Sesi hening pagi atau jeda sore tanpa menginap.",
        },
        {
          id: "d_fullday",
          label: "1 Hari Penuh (6–8 Jam)",
          count: 530,
          percentage: 52,
          description:
            "Format terfavorit: berangkat pagi, santap siang, pulang sore.",
        },
        {
          id: "d_2d1n",
          label: "2 Hari 1 Malam (Menginap)",
          count: 133,
          percentage: 13,
          description: "Retreat akhir pekan di kabin atau camping alam.",
        },
      ];
    }

    const counts = { d_halfday: 0, d_fullday: 0, d_2d1n: 0 };
    for (const ev of events) counts[ev.durationBand]++;

    return [
      {
        id: "d_halfday",
        label: "Setengah Hari (4–5 Jam)",
        count: counts.d_halfday,
        percentage: Math.round((counts.d_halfday / total) * 100),
        description: "Sesi hening pagi atau jeda sore tanpa menginap.",
      },
      {
        id: "d_fullday",
        label: "1 Hari Penuh (6–8 Jam)",
        count: counts.d_fullday,
        percentage: Math.round((counts.d_fullday / total) * 100),
        description:
          "Format terfavorit: berangkat pagi, santap siang, pulang sore.",
      },
      {
        id: "d_2d1n",
        label: "2 Hari 1 Malam (Menginap)",
        count: counts.d_2d1n,
        percentage: Math.round((counts.d_2d1n / total) * 100),
        description: "Retreat akhir pekan di kabin atau camping alam.",
      },
    ];
  },

  /**
   * Returns exact normalized individual departure areas sorted by count descending.
   */
  getDepartureDistribution(
    options?: DemandFilterOptions,
  ): readonly DemandDistributionItem[] {
    const events = this.getEvents(options);
    const total = events.length;

    if (total === 0) {
      return [];
    }

    const areaCountMap = new Map<string, number>();
    for (const ev of events) {
      const area = normalizeAreaLabel(ev.departureAreaRaw);
      areaCountMap.set(area, (areaCountMap.get(area) ?? 0) + 1);
    }

    const items: DemandDistributionItem[] = [];
    for (const [label, count] of areaCountMap.entries()) {
      items.push({
        id: `dep_${label.toLowerCase().replace(/\s+/g, "_")}`,
        label,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        description: `Traveler berangkat dari area ${label}.`,
      });
    }

    // Sort by count descending, then alphabetical
    items.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
    return items;
  },

  /**
   * Returns unmet demand opportunities with counts derived from selected period.
   */
  getAllInsights(
    options?: DemandFilterOptions,
  ): readonly DemandInsightRecord[] {
    const events = this.getEvents(options);

    return MOCK_DEMAND_INSIGHT_METADATA.map((meta) => {
      let count = 0;
      if (!options || options.period === "ALL") {
        if (meta.insightId === "ins_nature_batu_1d") count = 312;
        else if (meta.insightId === "ins_mindful_pacet_halfday") count = 198;
        else if (meta.insightId === "ins_workshop_culture_weekend") count = 145;
      } else {
        count = events.filter((ev) =>
          ev.matchedOpportunityIds.includes(meta.insightId),
        ).length;
      }

      // Format description truthfully reflecting current period count
      const unmetDesc =
        count > 0
          ? `${count} traveler dari ${meta.targetArea} mencari paket terkait pada periode ini.`
          : `Belum ada permintaan traveler dari ${meta.targetArea} untuk kategori ini pada periode terpilih.`;

      return {
        ...meta,
        travelerDemandCount: count,
        unmetDemandDescription:
          !options || options.period === "ALL"
            ? meta.unmetDemandDescription
            : unmetDesc,
      };
    });
  },

  getInsightById(
    insightId: string,
    options?: DemandFilterOptions,
  ): DemandInsightRecord | undefined {
    return this.getAllInsights(options).find((i) => i.insightId === insightId);
  },
};
