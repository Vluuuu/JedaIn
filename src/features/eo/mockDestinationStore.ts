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
    availableActivities: [
      "Walking tour kebun teh lereng bukit",
      "Sesi hening & respirasi udara sejuk",
      "Edukasi petik teh bersama warga lokal",
      "Santap siang lalapan pedesaan",
    ],
    facilities: [
      "Saung istirahat bambu",
      "Toilet & sanitasi bersih",
      "Area parkir kendaraan",
      "Musholla semi-terbuka",
      "Pos P3K sederhana",
    ],
    operationalNotes: [
      "Waktu terbaik berkunjung adalah pukul 07.00–14.00 WIB sebelum kabut tebal sore.",
      "Disarankan mengenakan alas kaki anti-selip dan jaket ringan berhawa sejuk.",
    ],
    localGuideSummary:
      "Pemandu lokal warga lereng terlatih memahami rute kebun teh dan sejarah konservasi perkebunan.",
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
    availableActivities: [
      "Sound healing gemericik aliran sungai alami",
      "Jeda meditasi hening tepi hutan pinus",
      "Jalan kaki tanpa alas di area rumput terawat",
      "Seduh wedang rempah herbal lokal",
    ],
    facilities: [
      "Paviliun kayu untuk sesi hening",
      "Toilet standar wisata bersih",
      "Titik bilas air pegunungan",
      "Dapur seduh rempah tradisional",
      "Area parkir beraspal",
    ],
    operationalNotes: [
      "Kawasan bebas asap rokok dan kebisingan musik eksternal untuk menjaga ketenangan.",
      "Debit air sungai dipantau harian dengan batas aman debit terverifikasi tim pengelola.",
    ],
    localGuideSummary:
      "Pemandu retreat lokal terakreditasi standar PLUS dengan pelatihan SOP darurat alam terbuka.",
  },
  {
    destinationId: "dest_hutan_trawas",
    name: "Hutan Bambu Trawas",
    locationLabel: "Mojokerto / Pasuruan",
    province: "Jawa Timur",
    city: "Pasuruan",
    verificationLevel: "BASIC",
    guideReady: true,
    baseCostPerPerson: 95000,
    description:
      "Kawasan hutan bambu hening untuk kontemplasi tenang dan jalan santai. Didukung pemandu lokal desa wisata yang siap memandu alur perjalanan.",
    highlights: [
      "Suasana sangat hening dan sejuk alami",
      "Spot meditasi dan lorong bambu teduh",
      "Pemandu lokal desa wisata siap mendampingi",
    ],
    capacityPerSession: 12,
    imageUrl: "/images/packages/mindful_morning.jpg",
    status: "ACTIVE",
    availableActivities: [
      "Jalan hening melintasi kanopi rumpun bambu",
      "Sesi journaling & kontemplasi santai",
      "Edukasi kerajinan anyaman bambu dasar",
      "Cicip camilan umbi rebus pedesaan",
    ],
    facilities: [
      "Gazebo anyaman bambu teduh",
      "Toilet alam bersih",
      "Titik kumpul awal pendopo desa",
      "Tempat cuci tangan higienis",
    ],
    operationalNotes: [
      "Jalur setapak tanah padat dengan kemiringan sangat landai, cocok untuk pemula.",
      "Kapasitas per sesi dibatasi maksimal 12 orang demi menjaga kekhidmatan hening.",
    ],
    localGuideSummary:
      "Pemandu desa wisata Trawas siap memandu alur jalan dan etika menjaga keheningan ekosistem bambu.",
  },
];

function cloneDestination(dest: DestinationRecord): DestinationRecord {
  return {
    ...dest,
    highlights: [...dest.highlights],
    availableActivities: dest.availableActivities
      ? [...dest.availableActivities]
      : undefined,
    facilities: dest.facilities ? [...dest.facilities] : undefined,
    operationalNotes: dest.operationalNotes
      ? [...dest.operationalNotes]
      : undefined,
  };
}

let destinations = MOCK_DESTINATION_DIRECTORY.map((d) => cloneDestination(d));

export const mockDestinationStore = {
  reset(): void {
    destinations = MOCK_DESTINATION_DIRECTORY.map((d) => cloneDestination(d));
  },

  getAll(): readonly DestinationRecord[] {
    return destinations.map((d) => cloneDestination(d));
  },

  getById(destinationId: string): DestinationRecord | undefined {
    const dest = destinations.find((d) => d.destinationId === destinationId);
    return dest ? cloneDestination(dest) : undefined;
  },

  upsertVerifiedDestination(record: DestinationRecord): DestinationRecord {
    const existingIndex = destinations.findIndex(
      (d) => d.destinationId === record.destinationId,
    );

    const cloned = cloneDestination(record);
    if (existingIndex >= 0) {
      destinations[existingIndex] = cloned;
    } else {
      destinations.push(cloned);
    }
    return cloneDestination(cloned);
  },

  getEligibleForEo(
    guideStatus: "CONCEPT_ONLY" | "CERTIFIED_GUIDE",
  ): readonly DestinationRecord[] {
    return destinations
      .filter((d) => {
        if (d.status !== "ACTIVE") return false;
        if (guideStatus === "CONCEPT_ONLY") {
          return d.guideReady === true;
        }
        // CERTIFIED_GUIDE can access all active BASIC/PLUS destinations
        return true;
      })
      .map((d) => cloneDestination(d));
  },
};
