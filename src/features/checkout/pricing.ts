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
  const serviceFee = TRAVELER_SERVICE_FEE;
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
    | "unitPricePerPerson"
    | "participantCount"
    | "subtotal"
    | "serviceFee"
    | "total"
    | "totalAmount"
  >,
): PaymentBreakdown {
  return calculatePaymentBreakdown(
    booking.unitPricePerPerson,
    booking.participantCount,
  );
}

export function formatRupiah(amount: number): string {
  return `Rp${amount.toLocaleString("id-ID")}`;
}
