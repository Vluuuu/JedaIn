import type { BookingRecord } from "./types";

export const TRAVELER_SERVICE_FEE = 7500;

export interface PaymentBreakdown {
  unitPrice: number;
  participantCount: number;
  subtotal: number;
  serviceFee: number;
  total: number;
}

export function calculatePaymentBreakdown(
  unitPrice: number,
  participantCount: number,
): PaymentBreakdown {
  const subtotal = unitPrice * participantCount;
  const serviceFee = TRAVELER_SERVICE_FEE * participantCount;
  const total = subtotal + serviceFee;
  return {
    unitPrice,
    participantCount,
    subtotal,
    serviceFee,
    total,
  };
}

export function getBookingPaymentBreakdown(
  booking: Pick<
    BookingRecord,
    | "pricingVersion"
    | "unitPricePerPerson"
    | "participantCount"
    | "subtotal"
    | "serviceFee"
    | "total"
    | "totalAmount"
  >,
): PaymentBreakdown {
  const breakdown = calculatePaymentBreakdown(
    booking.unitPricePerPerson,
    booking.participantCount,
  );
  // Old bookings retain their agreed fee. Never reprice a paid legacy booking.
  if (booking.pricingVersion !== "PER_PERSON") {
    breakdown.serviceFee = TRAVELER_SERVICE_FEE;
    breakdown.total = breakdown.subtotal + breakdown.serviceFee;
  }
  return breakdown;
}

export function formatRupiah(amount: number): string {
  return `Rp${amount.toLocaleString("id-ID")}`;
}
