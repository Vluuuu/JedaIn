import type { BookingRecord } from "../checkout/types";

export const DEMO_TRAVELER_HISTORY: BookingRecord = {
  bookingId: "bk_demo_completed_999",
  travelerId: "usr_demo",
  packageId: "slow_green_day",
  sessionId: "ses_sgd_1",
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
};
