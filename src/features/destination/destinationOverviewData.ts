import { mockTransactionStore } from "../checkout/mockTransactionStore";
import { mockEoPackageStore } from "../eo/mockEoPackageStore";
import { PROTOTYPE_AS_OF_DATE } from "../eo/mockInsightStore";
import type {
  DestinationRecord,
  EoPackageRecord,
  EoSessionRecord,
  EoSessionStatus,
} from "../eo/types";
import { mockReviewStore, type ReviewRecord } from "../reviews/mockReviewStore";
import { getDestinationReviewTargetRef } from "./destinationContext";

const PROTOTYPE_AS_OF_MS = Date.parse(`${PROTOTYPE_AS_OF_DATE}T00:00:00+07:00`);

export const destinationSessionStatusLabels: Record<EoSessionStatus, string> = {
  OPEN: "Terbuka",
  FULL: "Penuh",
  CLOSED: "Ditutup",
  CANCELLED: "Dibatalkan",
};

export interface DestinationSessionSummary {
  session: EoSessionRecord;
  package: EoPackageRecord;
  confirmedParticipants: number;
  operationalCapacity: number;
  usagePercent: number;
  exceedsDestinationCapacity: boolean;
}

export interface DestinationOverviewData {
  upcomingSessions: DestinationSessionSummary[];
  confirmedParticipants: number;
  eoPartners: string[];
  reviews: ReviewRecord[];
  latestReviews: ReviewRecord[];
  averageRating?: string;
  profileCompletedItems: number;
  profileTotalItems: number;
  profileChecklist: { label: string; complete: boolean }[];
}

export function getDestinationOverviewData(
  destination: DestinationRecord,
  asOfMs = PROTOTYPE_AS_OF_MS,
): DestinationOverviewData {
  const packages = mockEoPackageStore
    .getAllPackages()
    .filter((item) => item.destinationId === destination.destinationId);
  const packagesById = new Map(packages.map((item) => [item.packageId, item]));
  const bookings = mockTransactionStore.getBookings();

  const upcomingSessions = mockEoPackageStore
    .getAllSessions()
    .filter((session) => {
      const startMs = Date.parse(session.startAt);
      return (
        packagesById.has(session.packageId) &&
        Number.isFinite(startMs) &&
        startMs >= asOfMs &&
        session.status !== "CANCELLED"
      );
    })
    .sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt))
    .flatMap((session) => {
      const pkg = packagesById.get(session.packageId);
      if (!pkg) return [];

      const confirmedParticipants = bookings
        .filter(
          (booking) =>
            booking.sessionId === session.sessionId &&
            (booking.status === "PAID" || booking.status === "COMPLETED"),
        )
        .reduce((sum, booking) => sum + booking.bookedQuantity, 0);
      const operationalCapacity = Math.min(
        session.capacity,
        destination.capacityPerSession,
      );

      return [
        {
          session,
          package: pkg,
          confirmedParticipants,
          operationalCapacity,
          usagePercent:
            session.capacity > 0
              ? Math.min(
                  100,
                  Math.round((confirmedParticipants / session.capacity) * 100),
                )
              : 0,
          exceedsDestinationCapacity:
            session.capacity > destination.capacityPerSession,
        },
      ];
    });

  const reviewTarget = getDestinationReviewTargetRef(destination);
  const reviews = [...mockReviewStore.getReviewsForDestination(reviewTarget)];
  const latestReviews = [...reviews]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 3);
  const profileChecklist = [
    { label: "Nama destinasi", complete: Boolean(destination.name.trim()) },
    { label: "Lokasi", complete: Boolean(destination.locationLabel.trim()) },
    {
      label: "Deskripsi destinasi",
      complete: Boolean(destination.description.trim()),
    },
    {
      label: "Aktivitas yang tersedia",
      complete: Boolean(destination.availableActivities?.length),
    },
    {
      label: "Fasilitas destinasi",
      complete: Boolean(destination.facilities?.length),
    },
    {
      label: "Catatan operasional",
      complete: Boolean(destination.operationalNotes?.length),
    },
    {
      label: "Informasi pemandu lokal",
      complete: Boolean(destination.localGuideSummary?.trim()),
    },
    {
      label: "Biaya dasar destinasi",
      complete: destination.baseCostPerPerson > 0,
    },
    {
      label: "Kapasitas umum destinasi",
      complete: destination.capacityPerSession > 0,
    },
  ];

  return {
    upcomingSessions,
    confirmedParticipants: upcomingSessions.reduce(
      (sum, item) => sum + item.confirmedParticipants,
      0,
    ),
    eoPartners: [
      ...new Set(upcomingSessions.map((item) => item.package.eoDisplayName)),
    ],
    reviews,
    latestReviews,
    averageRating:
      reviews.length > 0
        ? (
            reviews.reduce((sum, review) => sum + review.rating, 0) /
            reviews.length
          ).toFixed(1)
        : undefined,
    profileCompletedItems: profileChecklist.filter((item) => item.complete)
      .length,
    profileTotalItems: profileChecklist.length,
    profileChecklist,
  };
}
