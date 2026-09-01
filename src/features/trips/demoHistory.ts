import type { BookingRecord } from "../checkout/types";
import type { PackageSessionPreview } from "../packageDetail/types";

export interface DemoTravelerHistoryData {
  booking: BookingRecord;
  session: PackageSessionPreview;
}

export function createDemoTravelerHistory(
  travelerId: string,
): DemoTravelerHistoryData {
  const sessionId = `ses_sgd_hist_${travelerId}`;
  return {
    booking: {
      bookingId: `bk_demo_completed_${travelerId}`,
      travelerId,
      packageId: "slow_green_day",
      sessionId,
      participantCount: 2,
      unitPricePerPerson: 275000,
      totalAmount: 550000,
      status: "COMPLETED",
      reservedQuantity: 0,
      bookedQuantity: 0,
      createdAt: "2026-08-15T08:00:00+07:00",
      paymentExpiresAt: "2026-08-15T08:15:00+07:00",
      paidAt: "2026-08-15T08:10:00+07:00",
      completedAt: "2026-08-20T17:00:00+07:00",
    },
    session: {
      sessionId,
      packageId: "slow_green_day",
      startAt: "2026-08-20T08:00:00+07:00",
      endAt: "2026-08-20T14:00:00+07:00",
      status: "CLOSED",
      pricePerPerson: 275000,
      remainingSlots: 0,
    },
  };
}

export const DEMO_TRAVELER_HISTORY = createDemoTravelerHistory("usr_demo");
