import type {
  BudgetBand,
  CurrentIntent,
  DepartureAreaId,
  DurationPreference,
  GroupSizeBand,
  GroupType,
  PreferredActivity,
} from "./types";

export interface OptionItem<T> {
  value: T;
  label: string;
}

export const QUIZ_INTENT_OPTIONS: OptionItem<CurrentIntent>[] = [
  {
    value: "RECHARGE",
    label: "Tenang & recharge",
  },
  {
    value: "NATURE",
    label: "Dekat dengan alam",
  },
  {
    value: "NOVELTY",
    label: "Eksplorasi & suasana baru",
  },
  {
    value: "REFLECTION",
    label: "Refleksi & me-time",
  },
  {
    value: "ACTIVE",
    label: "Bergerak & lebih aktif",
  },
  {
    value: "SOCIAL",
    label: "Quality time bareng orang dekat",
  },
];

export const QUIZ_ACTIVITY_OPTIONS: OptionItem<PreferredActivity>[] = [
  {
    value: "NATURE_SCENERY",
    label: "Alam & pemandangan",
  },
  {
    value: "MINDFULNESS_RELAXATION",
    label: "Relaksasi & mindfulness",
  },
  {
    value: "LOCAL_CULTURE",
    label: "Budaya & pengalaman lokal",
  },
  {
    value: "CREATIVE_WORKSHOP",
    label: "Kreatif & workshop",
  },
  {
    value: "LIGHT_EXPLORATION",
    label: "Eksplorasi ringan",
  },
  {
    value: "OUTDOOR_ACTIVE",
    label: "Outdoor & aktif",
  },
];

export const QUIZ_BUDGET_OPTIONS: OptionItem<BudgetBand>[] = [
  {
    value: "UP_TO_200K",
    label: "Sampai Rp200 ribu",
  },
  {
    value: "AROUND_200_300K",
    label: "Sekitar Rp200–300 ribu",
  },
  {
    value: "AROUND_300_500K",
    label: "Sekitar Rp300–500 ribu",
  },
  {
    value: "ABOVE_500K",
    label: "Di atas Rp500 ribu",
  },
];

export const QUIZ_DURATION_OPTIONS: OptionItem<DurationPreference>[] = [
  {
    value: "HALF_DAY",
    label: "Setengah hari",
  },
  {
    value: "FULL_DAY",
    label: "1 hari",
  },
  {
    value: "TWO_D_ONE_N",
    label: "2 hari 1 malam",
  },
  {
    value: "THREE_D_TWO_N_PLUS",
    label: "3 hari 2 malam atau lebih",
  },
];

export const QUIZ_DEPARTURE_OPTIONS: OptionItem<DepartureAreaId>[] = [
  {
    value: "MALANG",
    label: "Malang",
  },
  {
    value: "SURABAYA",
    label: "Surabaya",
  },
  {
    value: "OTHER",
    label: "Area lain",
  },
];

export const QUIZ_GROUP_TYPE_OPTIONS: OptionItem<GroupType>[] = [
  {
    value: "SOLO",
    label: "Sendiri",
  },
  {
    value: "PARTNER",
    label: "Pasangan",
  },
  {
    value: "FRIENDS",
    label: "Teman",
  },
  {
    value: "FAMILY",
    label: "Keluarga",
  },
];

export const QUIZ_GROUP_SIZE_OPTIONS: OptionItem<GroupSizeBand>[] = [
  {
    value: "TWO",
    label: "2 orang",
  },
  {
    value: "THREE_TO_FOUR",
    label: "3–4 orang",
  },
  {
    value: "FIVE_PLUS",
    label: "5+ orang",
  },
];

export const TOTAL_QUIZ_STEPS = 6;
