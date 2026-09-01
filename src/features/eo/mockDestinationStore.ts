import type { DestinationRecord } from "./types";

export const MOCK_DESTINATION_DIRECTORY: DestinationRecord[] = [
  {
    destinationId: "dest_lereng_hijau",
    name: "Lereng Hijau Batu",
    locationLabel: "Batu / Malang Raya",
    province: "Jawa Timur",
    city: "Batu",
    verificationLevel: "BASIC",
    guideReady: true,
    baseCostPerPerson: 125000,
    description:
      "Kawasan perkebunan teh dan lereng bukit berkabut yang tenang, terkelola secara lestari bersama warga lokal. Memiliki pemandu lokal terlatih di lokasi.",
    highlights: [
      "Jalur jalan santai kebun teh dengan kontur landai",
      "Pemandu lokal standby dan ramah rute",
      "Saung santai dan fasilitas air bersih",
    ],
    capacityPerSession: 20,
    imageUrl: "/images/packages/slow_green_day.jpg",
    status: "ACTIVE",
  },
  {
    destinationId: "dest_lembah_pacet",
    name: "Lembah Alam Pacet",
    locationLabel: "Mojokerto Raya",
    province: "Jawa Timur",
    city: "Mojokerto",
    verificationLevel: "PLUS",
    guideReady: true,
    baseCostPerPerson: 160000,
    description:
      "Lembah hutan pinus berhawa sejuk dengan aliran sungai jernih dan area mindfulness outdoor. Diverifikasi standar PLUS dengan SOP keselamatan lengkap.",
    highlights: [
      "Sungai alami dangkal untuk terapi suara air",
      "Kawasan bebas bising dan fasilitas retreat",
      "Guide lokal terakreditasi siap mendampingi",
    ],
    capacityPerSession: 15,
    imageUrl: "/images/packages/weekend_nature_reset.jpg",
    status: "ACTIVE",
  },
  {
    destinationId: "dest_hutan_trawas",
    name: "Hutan Bambu Trawas",
    locationLabel: "Mojokerto / Pasuruan",
    province: "Jawa Timur",
    city: "Pasuruan",
    verificationLevel: "BASIC",
    guideReady: false,
    baseCostPerPerson: 95000,
    description:
      "Kawasan hutan bambu hening untuk kontemplasi mandiri. Belum memiliki guide lokal di tempat sehingga mewajibkan EO memiliki Certified Guide sendiri.",
    highlights: [
      "Suasana sangat hening dan sejuk alami",
      "Spot meditasi dan jalan hening",
      "Wajib pemandu bersertifikat dari EO",
    ],
    capacityPerSession: 12,
    imageUrl: "/images/packages/mindful_morning.jpg",
    status: "ACTIVE",
  },
];

let destinations = [...MOCK_DESTINATION_DIRECTORY];

export const mockDestinationStore = {
  reset(): void {
    destinations = [...MOCK_DESTINATION_DIRECTORY];
  },

  getAll(): readonly DestinationRecord[] {
    return destinations;
  },

  getById(destinationId: string): DestinationRecord | undefined {
    return destinations.find((d) => d.destinationId === destinationId);
  },

  getEligibleForEo(
    guideStatus: "CONCEPT_ONLY" | "CERTIFIED_GUIDE",
  ): readonly DestinationRecord[] {
    return destinations.filter((d) => {
      if (d.status !== "ACTIVE") return false;
      if (guideStatus === "CONCEPT_ONLY") {
        return d.guideReady === true;
      }
      // CERTIFIED_GUIDE can access all active BASIC/PLUS destinations
      return true;
    });
  },
};
