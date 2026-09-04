import type { BookingRecord } from "../checkout/types";
import { getCombinedCatalogPackages } from "../marketplace/marketplaceAdapter";
import { mockReviewStore } from "../reviews/mockReviewStore";
import { calculateTravelerAchievements } from "./achievementsCalculator";
import { mockMomentStore } from "./mockMomentStore";
import type { ProfileActivityItem } from "./types";

export function formatActivityDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return dateString;
  }
}

export function getTravelerProfileActivity(
  travelerId: string,
  completedBookings: BookingRecord[],
): ProfileActivityItem[] {
  if (!travelerId) return [];

  const catalog = getCombinedCatalogPackages();
  const activities: ProfileActivityItem[] = [];

  // 1. Completed Trips
  for (const b of completedBookings) {
    const pkg = catalog.find((p) => p.id === b.packageId);
    const destination = pkg?.destinationName || "Destinasi Pilihan";
    const title = pkg?.title || "Perjalanan Jeda";
    const ts = b.completedAt || b.paidAt || b.createdAt;
    const dateFormatted = formatActivityDate(ts);

    activities.push({
      id: `act_trip_${b.bookingId}`,
      type: "TRIP_COMPLETED",
      title: `Menyelesaikan ${title}`,
      subtitle: `${destination} · ${dateFormatted}`,
      timestamp: ts,
      formattedDate: dateFormatted,
    });
  }

  // 2. Reviews submitted
  const allReviews = mockReviewStore.getAllReviews();
  const travelerReviews = allReviews.filter((r) => r.travelerId === travelerId);
  for (const rev of travelerReviews) {
    const stars =
      "★".repeat(rev.rating) + "☆".repeat(Math.max(0, 5 - rev.rating));
    const targetName =
      rev.targetType === "DESTINATION"
        ? "destinasi pilihan"
        : "penyelenggara lokal";
    const dateFormatted = formatActivityDate(rev.createdAt);

    activities.push({
      id: `act_rev_${rev.reviewId}`,
      type: "REVIEW_SUBMITTED",
      title: `Memberi ulasan untuk ${targetName}`,
      subtitle: `${stars} · ${dateFormatted}`,
      timestamp: rev.createdAt,
      formattedDate: dateFormatted,
    });
  }

  // 3. Earned Achievements
  const achievements = calculateTravelerAchievements({
    travelerId,
    completedBookings,
  });
  for (const ach of achievements) {
    if (ach.earned) {
      activities.push({
        id: `act_ach_${ach.id}`,
        type: "ACHIEVEMENT_EARNED",
        title: `Meraih milestone: ${ach.title}`,
        subtitle: `${ach.description}`,
        timestamp: new Date().toISOString(),
        formattedDate: "Tercapai",
      });
    }
  }

  // 4. Moments shared
  const moments = mockMomentStore.getMomentsByTraveler(travelerId);
  for (const mom of moments) {
    const dateFormatted = formatActivityDate(mom.createdAt);
    activities.push({
      id: `act_mom_${mom.momentId}`,
      type: "MOMENT_SHARED",
      title: "Membagikan Momen Jeda",
      subtitle: mom.caption || `Momen perjalanan · ${dateFormatted}`,
      timestamp: mom.createdAt,
      formattedDate: dateFormatted,
    });
  }

  // Chronological sort: newest first
  return activities.sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return timeB - timeA;
  });
}
