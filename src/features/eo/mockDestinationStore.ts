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
    imageUrl:
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 500' width='800' height='500'><defs><linearGradient id='sky' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='%23E0F2E9'/><stop offset='45%' stop-color='%23FDF8EE'/><stop offset='100%' stop-color='%23F4EAD4'/></linearGradient><linearGradient id='sun' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='%23FFF2B2'/><stop offset='100%' stop-color='%23F9B658'/></linearGradient><linearGradient id='mFar' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='%238DBCA0' stop-opacity='0.7'/><stop offset='100%' stop-color='%23568F6E' stop-opacity='0.85'/></linearGradient><linearGradient id='mMid' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='%234A8360'/><stop offset='100%' stop-color='%232E6344'/></linearGradient><linearGradient id='tSlope' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='%233E7E56'/><stop offset='100%' stop-color='%231E4D30'/></linearGradient></defs><rect width='800' height='500' fill='url(%23sky)'/><circle cx='560' cy='180' r='65' fill='url(%23sun)' opacity='0.85'/><path d='M120 280 Q260 140 400 280 T680 280 Q760 210 800 240 L800 500 L0 500 L0 260 Q50 240 120 280 Z' fill='url(%23mFar)'/><path d='M0 320 Q160 210 340 320 Q520 230 720 340 L800 320 L800 500 L0 500 Z' fill='url(%23mMid)'/><path d='M0 360 C180 300 360 410 580 330 C690 290 760 330 800 360 L800 500 L0 500 Z' fill='url(%23tSlope)'/><path d='M20 440 Q180 380 340 430 M50 460 Q260 395 440 455' stroke='%235DAE76' stroke-width='2.5' stroke-linecap='round' fill='none' opacity='0.45'/><rect y='290' width='800' height='50' fill='%23FFFFFF' opacity='0.22'/><path d='M720 500 L720 400 L705 425 L720 370 L710 390 L720 345 L730 390 L720 370 L735 425 Z' fill='%230F2117' opacity='0.8'/></svg>",
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
    imageUrl:
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 500' width='800' height='500'><defs><linearGradient id='duskSky' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='%232D3A54'/><stop offset='40%' stop-color='%2368546E'/><stop offset='75%' stop-color='%23C27E6A'/><stop offset='100%' stop-color='%23F4B574'/></linearGradient><linearGradient id='vDark' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='%2324382E'/><stop offset='100%' stop-color='%23101E17'/></linearGradient></defs><rect width='800' height='500' fill='url(%23duskSky)'/><path d='M0 310 Q240 230 460 300 Q680 250 800 290 L800 500 L0 500 Z' fill='%231E2A24' opacity='0.75'/><path d='M0 360 Q300 310 600 370 L800 340 L800 500 L0 500 Z' fill='url(%23vDark)'/><polygon points='340,320 460,320 490,370 310,370' fill='%234A311D'/><polygon points='400,280 320,320 480,320' fill='%232E1D10'/><rect x='375' y='335' width='50' height='30' rx='3' fill='%23FFE380' opacity='0.95'/><circle cx='400' cy='350' r='45' fill='%23FFC043' opacity='0.3'/><path d='M160 500 L160 340 L145 370 L160 300 L150 325 L160 270 L170 325 L160 300 L175 370 Z' fill='%230B140F'/></svg>",
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
    imageUrl:
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 500' width='800' height='500'><defs><linearGradient id='mSky' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='%23D4E7F7'/><stop offset='50%' stop-color='%23EDF5FC'/><stop offset='100%' stop-color='%23F3F7EB'/></linearGradient><linearGradient id='wGrad' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='%237CAFCB'/><stop offset='50%' stop-color='%233E789F'/><stop offset='100%' stop-color='%231E4F6E'/></linearGradient></defs><rect width='800' height='500' fill='url(%23mSky)'/><circle cx='200' cy='140' r='90' fill='%23FFFBEA' opacity='0.75'/><path d='M0 260 L40 230 L80 265 L130 215 L180 260 L240 205 L300 260 L380 195 L460 260 L540 210 L620 265 L700 220 L770 260 L800 240 L800 500 L0 500 Z' fill='%23679883' opacity='0.6'/><path d='M0 290 Q200 250 400 290 Q600 260 800 290 L800 500 L0 500 Z' fill='%2323523E'/><path d='M0 340 Q220 310 440 335 Q650 315 800 340 L800 500 L0 500 Z' fill='url(%23wGrad)'/><ellipse cx='400' cy='380' rx='180' ry='12' fill='%23BDE1F5' opacity='0.45'/></svg>",
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

  /**
   * Authoritative EO-available destination selector:
   * Only returns destinations that are ACTIVE, verified (BASIC or PLUS),
   * and have local guide capability (guideReady === true).
   * Identical rule for BOTH CONCEPT_ONLY and CERTIFIED_GUIDE.
   */
  getEligibleForEo(
    guideStatus?: "CONCEPT_ONLY" | "CERTIFIED_GUIDE",
  ): readonly DestinationRecord[] {
    void guideStatus; // Uniform eligibility in MVP: all EO-available destinations have local guide capability
    return destinations
      .filter((d) => {
        if (d.status !== "ACTIVE") return false;
        if (d.verificationLevel !== "BASIC" && d.verificationLevel !== "PLUS") {
          return false;
        }
        return d.guideReady === true;
      })
      .map((d) => cloneDestination(d));
  },
};
