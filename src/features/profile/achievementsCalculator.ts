import type { BookingRecord } from "../checkout/types";
import { getCombinedCatalogPackages } from "../marketplace/marketplaceAdapter";
import { mockReviewStore } from "../reviews/mockReviewStore";
import type { AchievementItem } from "./types";

export interface AchievementCalculationInputs {
  travelerId: string;
  completedBookings: BookingRecord[];
}

export function calculateTravelerAchievements(
  inputs: AchievementCalculationInputs,
): AchievementItem[] {
  const { travelerId, completedBookings } = inputs;

  const completedTripsCount = completedBookings.length;

  // Derive unique destinations visited from completed bookings
  const catalog = getCombinedCatalogPackages();
  const visitedDestinations = new Set<string>();
  for (const b of completedBookings) {
    const pkg = catalog.find((p) => p.id === b.packageId);
    if (pkg?.destinationName?.trim()) {
      visitedDestinations.add(pkg.destinationName.trim().toLowerCase());
    } else if (b.packageId) {
      visitedDestinations.add(b.packageId);
    }
  }
  const uniqueDestinationsCount = visitedDestinations.size;

  // Derive reviews submitted by traveler
  const allReviews = mockReviewStore.getAllReviews();
  const travelerReviews = allReviews.filter((r) => r.travelerId === travelerId);
  const reviewsCount = travelerReviews.length;

  return [
    {
      id: "JEDA_PERTAMA",
      title: "Jeda Pertama",
      description: "Menyelesaikan 1 perjalanan jeda yang bermakna",
      earned: completedTripsCount >= 1,
      progressText:
        completedTripsCount >= 1 ? "Selesai" : `${completedTripsCount}/1`,
    },
    {
      id: "TIGA_JEDA",
      title: "Tiga Jeda",
      description: "Menyelesaikan 3 perjalanan jeda",
      earned: completedTripsCount >= 3,
      progressText:
        completedTripsCount >= 3
          ? "Selesai"
          : `${Math.min(completedTripsCount, 3)}/3`,
    },
    {
      id: "LIMA_DESTINASI",
      title: "5 Destinasi",
      description: "Menjelajah 5 destinasi yang menenangkan",
      earned: uniqueDestinationsCount >= 5,
      progressText:
        uniqueDestinationsCount >= 5
          ? "Selesai"
          : `${Math.min(uniqueDestinationsCount, 5)}/5`,
    },
    {
      id: "PEMBERI_ULASAN",
      title: "Pemberi Ulasan",
      description: "Membagikan refleksi dan ulasan perjalanan",
      earned: reviewsCount >= 1,
      progressText: reviewsCount >= 1 ? "Selesai" : `${reviewsCount}/1`,
    },
  ];
}
