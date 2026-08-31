import type { PackageDetailSource } from "./types";

/**
 * Centralized fictional competition prototype detail metadata for all current 5 LIVE packages.
 * Compliant with PRD, SYSTEM_FLOW, WIREFRAME_SPEC, and PACKAGE_DETAIL_CONTRACT.
 */
export const MOCK_PACKAGE_DETAILS: Record<string, PackageDetailSource> = {
  slow_green_day: {
    packageId: "slow_green_day",
    valueProposition:
      "Lepaskan kepenatan rutinitas harian dengan berjalan santai di perkebunan teh yang asri, menikmati udara sejuk lereng Batu, dan menikmati teh herbal hangat bersama pemandu lokal.",
    highlights: [
      "Jalan santai menyusuri perkebunan teh lereng Batu dengan udara pegunungan segar",
      "Sesi hening dan relaksasi bernapas di titik pandang lembah hijau",
      "Mencicipi seduhan teh herbal racikan petani lokal",
      "Cocok untuk solo traveler, pasangan, maupun grup kecil",
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
      "Transportasi menuju titik kumpul awal",
      "Pengeluaran dan belanja pribadi di luar paket",
      "Perlengkapan cuaca tambahan (jas hujan/jaket pribadi)",
    ],
    safetyNotes: [
      "Gunakan sepatu berjalan yang nyaman dan tidak licin untuk jalur tanah.",
      "Kenakan pakaian hangat atau bawa jaket tipis karena udara lereng bisa dingin berangin.",
      "Aktivitas berjalan santai dengan intensitas ringan dan jalur relatif datar.",
      "Ikuti arahan pemandu demi kenyamanan dan kelestarian perkebunan.",
    ],
    cancellationPolicySummary:
      "Detail ketentuan pembatalan dan refund akan ditampilkan kembali saat checkout sebelum konfirmasi pembayaran.",
    organizer: {
      id: "org_lereng_batu",
      displayName: "Jeda Alam Nusantara",
      guideStatus: "CERTIFIED_GUIDE",
      roleDescription: "Event Organizer Komunitas Wellness Lokal",
      bioSummary:
        "Merancang pengalaman perjalanan berbasis kesadaran penuh dan kearifan alam lokal di Jawa Timur.",
    },
    destinationDetail: {
      overviewDescription:
        "Kawasan perkebunan dan lereng bukit berkabut yang tenang, terkelola secara lestari bersama warga lokal.",
    },
    upcomingSessionPreviews: [
      {
        sessionId: "ses_sgd_1",
        packageId: "slow_green_day",
        startAt: "2026-09-12T08:00:00.000Z",
        endAt: "2026-09-12T14:00:00.000Z",
        status: "OPEN",
        pricePerPerson: 275000,
        remainingSlots: 6,
      },
      {
        sessionId: "ses_sgd_2",
        packageId: "slow_green_day",
        startAt: "2026-09-19T08:00:00.000Z",
        endAt: "2026-09-19T14:00:00.000Z",
        status: "OPEN",
        pricePerPerson: 275000,
        remainingSlots: 4,
      },
    ],
    reviewPreview: {
      excerpts: [
        {
          bookingId: "bk_sgd_comp_1",
          bookingStatus: "COMPLETED",
          authorName: "Sarah M.",
          rating: 5,
          comment:
            "Sangat menenangkan, udaranya segar dan ritme acaranya tidak terburu-buru sama sekali.",
          tripDateLabel: "Agustus 2026",
        },
      ],
    },
  },

  creative_village_halfday: {
    packageId: "creative_village_halfday",
    valueProposition:
      "Temukan ketenangan melalui kreasi tangan lokal, belajar membuat kerajinan gerabah tradisional, dan menikmati suasana pedesaan yang ramah.",
    highlights: [
      "Workshop dasar pembuatan gerabah dan anyaman bambu bersama perajin desa",
      "Mengenal teknik kriya tradisional secara langsung dan membawa pulang hasil karya",
      "Suasana pedesaan yang hening dan ramah keluarga",
      "Durasi ringkas setengah hari yang praktis dan bermakna",
    ],
    itinerary: [
      {
        order: 1,
        title: "Pagi - Sambutan & Pengenalan Kriya",
        description:
          "Penyambutan di balai kriya Desa Wisata Budaya dengan minuman tradisional dan pengenalan materi tanah liat.",
        timeOfDayLabel: "Pagi",
        durationLabel: "45 menit",
      },
      {
        order: 2,
        title: "Praktik Kreasi Gerabah & Anyaman",
        description:
          "Sesi praktik langsung memutar dan membentuk gerabah dipandu oleh maestro perajin lokal.",
        timeOfDayLabel: "Pagi - Siang",
        durationLabel: "2 jam",
      },
      {
        order: 3,
        title: "Pewarnaan Sederhana & Penutupan",
        description:
          "Merapikan hasil karya, mengeringkan gerabah, dan ramah tamah sebelum perjalanan kembali.",
        timeOfDayLabel: "Siang",
        durationLabel: "45 menit",
      },
    ],
    includedItems: [
      "Bahan tanah liat dan peralatan workshop lengkap",
      "Bimbingan langsung perajin desa",
      "Karya kerajinan yang dibuat dapat dibawa pulang",
      "Kudapan dan minuman herbal tradisional",
    ],
    excludedItems: ["Transportasi menuju desa", "Pengeluaran pribadi tambahan"],
    safetyNotes: [
      "Pakaian santai yang nyaman dan tidak masalah jika terkena percikan tanah liat (celemek disediakan).",
      "Aktivitas ramah anak-anak dan keluarga.",
    ],
    cancellationPolicySummary:
      "Detail ketentuan pembatalan dan refund akan ditampilkan kembali saat checkout sebelum konfirmasi pembayaran.",
    organizer: {
      id: "org_desa_budaya",
      displayName: "Ruang Rupa Desa",
      guideStatus: "CONCEPT_ONLY",
      roleDescription: "Pengelola Workshop Budaya & Komunitas",
      bioSummary:
        "Menjembatani wisatawan dengan kearifan tangan perajin lokal di desa-desa Jawa Timur.",
    },
    destinationDetail: {
      overviewDescription:
        "Sentra desa budaya dengan komunitas pengrajin gerabah dan bambu tradisional yang masih terjaga.",
    },
    upcomingSessionPreviews: [
      {
        sessionId: "ses_cvh_1",
        packageId: "creative_village_halfday",
        startAt: "2026-09-13T09:00:00.000Z",
        endAt: "2026-09-13T12:30:00.000Z",
        status: "OPEN",
        pricePerPerson: 190000,
        remainingSlots: 8,
      },
    ],
    reviewPreview: {
      excerpts: [
        {
          bookingId: "bk_cvh_comp_1",
          bookingStatus: "COMPLETED",
          authorName: "Dion K.",
          rating: 5,
          comment:
            "Workshopnya seru dan bikin fokus. Pemandu lokalnya sangat sabar mengajari.",
          tripDateLabel: "Juli 2026",
        },
      ],
    },
  },

  mindful_morning: {
    packageId: "mindful_morning",
    valueProposition:
      "Mulai harimu dengan kejernihan pikiran di tengah ketenangan hutan pinus dan gemericik mata air alami Trawas.",
    highlights: [
      "Sesi relaksasi dan meditasi ringan di tepi mata air pegunungan yang jernih",
      "Jalan hening (silent walk) di bawah kanopi hutan pinus",
      "Sarapan pagi sehat dengan menu alami bersumber lokal",
      "Kembali beraktivitas dengan tubuh dan pikiran yang lebih segar",
    ],
    itinerary: [
      {
        order: 1,
        title: "Pagi Awal - Meditasi Mata Air",
        description:
          "Sesi hening di dek kayu tepi mata air alami, dipandu latihan pernapasan ringan untuk membantu menciptakan suasana yang lebih tenang.",
        timeOfDayLabel: "Pagi",
        durationLabel: "1 jam",
      },
      {
        order: 2,
        title: "Jalan Sadar di Hutan Pinus",
        description:
          "Menyusuri jalur setapak hutan pinus dengan tempo lambat, melatih kesadaran panca indra.",
        timeOfDayLabel: "Pagi",
        durationLabel: "1.5 jam",
      },
      {
        order: 3,
        title: "Sarapan Sehat & Teh Hangat",
        description:
          "Menikmati sarapan bernutrisi hangat dan beristirahat sejenak sebelum menyelesaikan trip.",
        timeOfDayLabel: "Pagi - Siang",
        durationLabel: "1 jam",
      },
    ],
    includedItems: [
      "Akses area Oase Hening Trawas",
      "Pemandu sesi meditasi dan jalan hening",
      "Sarapan pagi sehat dan minuman hangat",
    ],
    excludedItems: ["Transportasi menuju lokasi", "Kebutuhan pribadi tambahan"],
    safetyNotes: [
      "Disarankan membawa alas kaki yang nyaman untuk berjalan di jalur berbatu.",
      "Harap menjaga ketenangan selama sesi jalan hening berlangsung.",
    ],
    cancellationPolicySummary:
      "Detail ketentuan pembatalan dan refund akan ditampilkan kembali saat checkout sebelum konfirmasi pembayaran.",
    organizer: {
      id: "org_mindful_life",
      displayName: "Mindful Living Project",
      guideStatus: "CERTIFIED_GUIDE",
      roleDescription: "Fasilitator Wellness & Mindfulness",
      bioSummary:
        "Menghadirkan ruang jeda dan latihan mindfulness yang ramah pemula di alam terbuka.",
    },
    destinationDetail: {
      overviewDescription:
        "Mata air alami dan kawasan hutan pinus sejuk di kaki pegunungan Mojokerto.",
    },
    upcomingSessionPreviews: [
      {
        sessionId: "ses_mm_1",
        packageId: "mindful_morning",
        startAt: "2026-09-13T06:30:00.000Z",
        endAt: "2026-09-13T10:00:00.000Z",
        status: "OPEN",
        pricePerPerson: 225000,
        remainingSlots: 5,
      },
    ],
    reviewPreview: {
      excerpts: [
        {
          bookingId: "bk_mm_comp_1",
          bookingStatus: "COMPLETED",
          authorName: "Anindya R.",
          rating: 5,
          comment:
            "Sangat membantu melepaskan penat setelah seminggu kerja di Surabaya.",
          tripDateLabel: "Agustus 2026",
        },
      ],
    },
  },

  light_mountain_explore: {
    packageId: "light_mountain_explore",
    valueProposition:
      "Kombinasi menyegarkan antara eksplorasi alam terbuka dan jalan santai menyusuri jalur pegunungan Prigen.",
    highlights: [
      "Jelajah santai menyusuri panorama perbukitan Pasuruan",
      "Spot pandang terbuka dengan pemandangan lembah luas",
      "Aktivitas bergerak aktif dengan intensitas moderat yang menyenangkan",
      "Pemandu berpengalaman yang memahami medan dan jalur lokal",
    ],
    itinerary: [
      {
        order: 1,
        title: "Pagi - Briefing & Peregangan",
        description:
          "Pemeriksaan perlengkapan, peregangan ringan, dan pengenalan rute jelajah santai.",
        timeOfDayLabel: "Pagi",
        durationLabel: "45 menit",
      },
      {
        order: 2,
        title: "Trekking Santai & Eksplorasi Lereng",
        description:
          "Berjalan menyusuri jalur perbukitan hijau dengan istirahat teratur di titik pemandangan alam.",
        timeOfDayLabel: "Pagi - Siang",
        durationLabel: "3 jam",
      },
      {
        order: 3,
        title: "Istirahat di Pos Alam & Santap Siang",
        description:
          "Menikmati santap siang di pos peristirahatan terbuka sebelum kembali ke titik awal.",
        timeOfDayLabel: "Siang",
        durationLabel: "1.5 jam",
      },
    ],
    includedItems: [
      "Tiket masuk kawasan Taman Alam Prigen",
      "Pemandu trek lokal berpengalaman",
      "Santap siang dan air mineral selama perjalanan",
      "Pertolongan pertama standar pendampingan",
    ],
    excludedItems: [
      "Transportasi menuju titik kumpul",
      "Perlengkapan trekking pribadi",
    ],
    safetyNotes: [
      "Wajib mengenakan sepatu olahraga atau trekking dengan sol mencengkeram.",
      "Bawa botol minum pribadi dan pelindung matahari (topi/tabir surya).",
      "Jalur memiliki tanjakan landai hingga sedang, cocok untuk yang ingin bergerak aktif.",
    ],
    cancellationPolicySummary:
      "Detail ketentuan pembatalan dan refund akan ditampilkan kembali saat checkout sebelum konfirmasi pembayaran.",
    organizer: {
      id: "org_jejak_alam",
      displayName: "Jejak Langkah Pasuruan",
      guideStatus: "CERTIFIED_GUIDE",
      roleDescription: "Komunitas Pemandu Alam Terbuka",
      bioSummary:
        "Fokus mendampingi petualangan alam ringan yang aman dan ramah bagi pemula.",
    },
    destinationDetail: {
      overviewDescription:
        "Kawasan perbukitan dan jalur alam terbuka dengan panorama lereng pegunungan Pasuruan.",
    },
    upcomingSessionPreviews: [
      {
        sessionId: "ses_lme_1",
        packageId: "light_mountain_explore",
        startAt: "2026-09-20T07:30:00.000Z",
        endAt: "2026-09-20T13:00:00.000Z",
        status: "OPEN",
        pricePerPerson: 325000,
        remainingSlots: 6,
      },
    ],
    reviewPreview: {
      excerpts: [
        {
          bookingId: "bk_lme_comp_1",
          bookingStatus: "COMPLETED",
          authorName: "Budi P.",
          rating: 5,
          comment:
            "Jalurnya tidak terlalu berat tapi tetap menantang dan pemandangannya bagus.",
          tripDateLabel: "Agustus 2026",
        },
      ],
    },
  },

  weekend_nature_reset: {
    packageId: "weekend_nature_reset",
    valueProposition:
      "Liburan akhir pekan dua hari satu malam yang mendalam di pondok kayu lembah Pacet, menikmati api unggun dan ketenangan malam pegunungan.",
    highlights: [
      "Menginap di pondok kayu ramah lingkungan dengan pemandangan lembah Pacet",
      "Sesi bincang santai di dekat perapian dan melihat bintang di malam hari",
      "Bangun dengan panorama kabut pagi dan suara aliran sungai",
      "Kenyamanan istirahat maksimal untuk melepaskan penat kerja",
    ],
    itinerary: [
      {
        order: 1,
        title: "Hari 1 - Check-in & Jelajah Lembah Sore",
        description:
          "Tiba di pondok lembah Pacet, menikmati minuman sambutan, dan jalan sore santai di tepi sungai.",
        timeOfDayLabel: "Hari 1 Sore",
        durationLabel: "3 jam",
      },
      {
        order: 2,
        title: "Hari 1 - Makan Malam & Sesi Api Unggun",
        description:
          "Santap malam menu hangat khas pegunungan dilanjutkan waktu santai di dekat perapian.",
        timeOfDayLabel: "Hari 1 Malam",
        durationLabel: "2.5 jam",
      },
      {
        order: 3,
        title: "Hari 2 - Pagi Kabut & Peregangan Sungai",
        description:
          "Menikmati sarapan hangat di tepi lembah, peregangan ringan, dan waktu bebas sebelum check-out.",
        timeOfDayLabel: "Hari 2 Pagi",
        durationLabel: "3 jam",
      },
    ],
    includedItems: [
      "Akomodasi 1 malam di pondok kayu Lembah Alam Pacet",
      "Makan malam dan sarapan pagi lokal",
      "Fasilitator pendamping kegiatan",
      "Tiket masuk kawasan wisata lembah",
    ],
    excludedItems: [
      "Transportasi pulang-pergi",
      "Belanja pribadi dan makanan di luar jadwal",
    ],
    safetyNotes: [
      "Bawa pakaian tebal dan jaket karena suhu malam di Pacet bisa cukup dingin.",
      "Perhatikan langkah saat berjalan di dekat aliran sungai berbatu.",
    ],
    cancellationPolicySummary:
      "Detail ketentuan pembatalan dan refund akan ditampilkan kembali saat checkout sebelum konfirmasi pembayaran.",
    organizer: {
      id: "org_pacet_retreat",
      displayName: "Lembah Teduh Retreats",
      guideStatus: "CERTIFIED_GUIDE",
      roleDescription: "Spesialis Penginapan & Retret Alam",
      bioSummary:
        "Menyediakan ruang peristirahatan akhir pekan yang hangat, tenang, dan dekat dengan alam.",
    },
    destinationDetail: {
      overviewDescription:
        "Lembah asri di kawasan pegunungan Pacet yang menawarkan ketenangan dan udara bersih.",
    },
    upcomingSessionPreviews: [
      {
        sessionId: "ses_wnr_1",
        packageId: "weekend_nature_reset",
        startAt: "2026-09-26T14:00:00.000Z",
        endAt: "2026-09-27T11:00:00.000Z",
        status: "OPEN",
        pricePerPerson: 475000,
        remainingSlots: 4,
      },
    ],
    reviewPreview: {
      excerpts: [
        {
          bookingId: "bk_wnr_comp_1",
          bookingStatus: "COMPLETED",
          authorName: "Maya T.",
          rating: 5,
          comment:
            "Pondoknya nyaman sekali, suasananya tenang dan makan malamnya enak.",
          tripDateLabel: "Juli 2026",
        },
      ],
    },
  },
};
