import type {
  DemandDistributionItem,
  DemandInsightRecord,
  DemandSignalSummary,
} from "./types";

export const MOCK_DEMAND_SIGNALS: DemandSignalSummary[] = [
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

export const MOCK_BUDGET_DISTRIBUTION: DemandDistributionItem[] = [
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
    description: "Kisaran paling diminati untuk trip 1 hari dengan konsumsi.",
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

export const MOCK_DURATION_DISTRIBUTION: DemandDistributionItem[] = [
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

export const MOCK_DEPARTURE_DISTRIBUTION: DemandDistributionItem[] = [
  {
    id: "dep_malang",
    label: "Malang & Batu",
    count: 459,
    percentage: 45,
    description: "Mencari lokasi lereng pegunungan dekat dan tenang.",
  },
  {
    id: "dep_surabaya",
    label: "Surabaya & Sidoarjo",
    count: 408,
    percentage: 40,
    description: "Jeda akhir pekan ke arah Batu, Pacet, atau Trawas.",
  },
  {
    id: "dep_other",
    label: "Area Lain di Jawa Timur",
    count: 153,
    percentage: 15,
    description: "Kediri, Pasuruan, Blitar, dan sekitarnya.",
  },
];

export const MOCK_DEMAND_INSIGHTS: DemandInsightRecord[] = [
  {
    insightId: "ins_nature_batu_1d",
    title: "Tingginya Permintaan Jeda Alam 1 Hari di Lereng Malang Raya",
    intent: "NATURE",
    intentLabel: "Dekat dengan alam",
    targetArea: "Malang / Surabaya",
    durationLabel: "1 hari",
    preferredBudgetRange: "Rp200.000 – Rp300.000 / orang",
    travelerDemandCount: 312,
    unmetDemandDescription:
      "312 traveler dari Malang & Surabaya mencari paket alam satu hari dengan pemandu ramah dan sesi teh/makan siang lokal. Pasokan paket terkurasi saat ini masih terbatas.",
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
    travelerDemandCount: 198,
    unmetDemandDescription:
      "198 traveler mencari jeda pagi hari 4–5 jam di tepi sungai atau hutan pinus dengan jeda bising perkotaan total.",
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
    travelerDemandCount: 145,
    unmetDemandDescription:
      "145 traveler tertarik mencoba kerajinan tanah liat atau membatik alami dipadukan dengan jalan santai desa.",
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

export const mockInsightStore = {
  getSignals(): readonly DemandSignalSummary[] {
    return MOCK_DEMAND_SIGNALS;
  },

  getBudgetDistribution(): readonly DemandDistributionItem[] {
    return MOCK_BUDGET_DISTRIBUTION;
  },

  getDurationDistribution(): readonly DemandDistributionItem[] {
    return MOCK_DURATION_DISTRIBUTION;
  },

  getDepartureDistribution(): readonly DemandDistributionItem[] {
    return MOCK_DEPARTURE_DISTRIBUTION;
  },

  getAllInsights(): readonly DemandInsightRecord[] {
    return MOCK_DEMAND_INSIGHTS;
  },

  getInsightById(insightId: string): DemandInsightRecord | undefined {
    return MOCK_DEMAND_INSIGHTS.find((i) => i.insightId === insightId);
  },
};
