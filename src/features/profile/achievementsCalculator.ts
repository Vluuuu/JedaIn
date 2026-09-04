import type { BookingRecord } from "../checkout/types";
import { getCombinedCatalogPackages } from "../marketplace/marketplaceAdapter";
import { mockReviewStore } from "../reviews/mockReviewStore";
import type { AchievementItem } from "./types";

export interface AchievementCalculationInputs {
  travelerId: string;
  completedBookings: BookingRecord[];
}

function getBookingTimestamp(booking: BookingRecord): string {
  return booking.completedAt || booking.paidAt || booking.createdAt;
}

export function calculateTravelerAchievements(
  inputs: AchievementCalculationInputs,
): AchievementItem[] {
  const { travelerId, completedBookings } = inputs;

  // Sort completed bookings chronologically ascending
  const sortedBookings = [...completedBookings].sort((a, b) => {
    const timeA = new Date(getBookingTimestamp(a)).getTime();
    const timeB = new Date(getBookingTimestamp(b)).getTime();
    return timeA - timeB;
  });

  const completedTripsCount = sortedBookings.length;

  // 1. JEDA_PERTAMA: earned when completedTripsCount >= 1
  const jedaPertamaEarned = completedTripsCount >= 1;
  const jedaPertamaEarnedAt = jedaPertamaEarned
    ? getBookingTimestamp(sortedBookings[0])
    : undefined;

  // 2. TIGA_JEDA: earned when completedTripsCount >= 3
  const tigaJedaEarned = completedTripsCount >= 3;
  const tigaJedaEarnedAt = tigaJedaEarned
    ? getBookingTimestamp(sortedBookings[2])
    : undefined;

  // 3. LIMA_DESTINASI: earned when unique destination count reaches 5
  const catalog = getCombinedCatalogPackages();
  const visitedDestinations = new Set<string>();
  let limaDestinasiEarnedAt: string | undefined;

  for (const b of sortedBookings) {
    const pkg = catalog.find((p) => p.id === b.packageId);
    const destinationName =
      pkg?.destinationName?.trim().toLowerCase() || b.packageId;
    if (destinationName) {
      visitedDestinations.add(destinationName);
      if (visitedDestinations.size >= 5 && !limaDestinasiEarnedAt) {
        limaDestinasiEarnedAt = getBookingTimestamp(b);
      }
    }
  }
  const uniqueDestinationsCount = visitedDestinations.size;
  const limaDestinasiEarned = uniqueDestinationsCount >= 5;

  // 4. PEMBERI_ULASAN: reviews submitted by traveler for completed bookings only
  const completedBookingIds = new Set(
    completedBookings.map((b) => b.bookingId),
  );
  const allReviews = mockReviewStore.getAllReviews();
  const qualifyingReviews = allReviews
    .filter(
      (r) =>
        r.travelerId === travelerId && completedBookingIds.has(r.bookingId),
    )
    .sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return timeA - timeB;
    });

  const pemberiUlasanEarned = qualifyingReviews.length >= 1;
  const pemberiUlasanEarnedAt = pemberiUlasanEarned
    ? qualifyingReviews[0].createdAt
    : undefined;

  return [
    {
      id: "JEDA_PERTAMA",
      title: "Jeda Pertama",
      description: "Menyelesaikan 1 perjalanan jeda yang bermakna",
      earned: jedaPertamaEarned,
      earnedAt: jedaPertamaEarnedAt,
      progressText: jedaPertamaEarned ? "Selesai" : `${completedTripsCount}/1`,
    },
    {
      id: "TIGA_JEDA",
      title: "Tiga Jeda",
      description: "Menyelesaikan 3 perjalanan jeda",
      earned: tigaJedaEarned,
      earnedAt: tigaJedaEarnedAt,
      progressText: tigaJedaEarned
        ? "Selesai"
        : `${Math.min(completedTripsCount, 3)}/3`,
    },
    {
      id: "LIMA_DESTINASI",
      title: "5 Destinasi",
      description: "Menjelajah 5 destinasi yang menenangkan",
      earned: limaDestinasiEarned,
      earnedAt: limaDestinasiEarnedAt,
      progressText: limaDestinasiEarned
        ? "Selesai"
        : `${Math.min(uniqueDestinationsCount, 5)}/5`,
    },
    {
      id: "PEMBERI_ULASAN",
      title: "Pemberi Ulasan",
      description: "Membagikan refleksi dan ulasan perjalanan",
      earned: pemberiUlasanEarned,
      earnedAt: pemberiUlasanEarnedAt,
      progressText: pemberiUlasanEarned
        ? "Selesai"
        : `${qualifyingReviews.length}/1`,
    },
  ];
}
