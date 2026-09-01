import type {
  BookingRecord,
  PaymentAttemptRecord,
  PendingPaymentHandoff,
} from "./types";

/**
 * Configurable prototype constants.
 */
export const CHECKOUT_MVP_CONFIG = {
  paymentTimeoutMinutes: 15,
};

let bookings: BookingRecord[] = [];
let paymentAttempts: PaymentAttemptRecord[] = [];
const idempotencyMap = new Map<
  string,
  { booking: BookingRecord; payment: PaymentAttemptRecord }
>();

export const mockTransactionStore = {
  reset(): void {
    bookings = [];
    paymentAttempts = [];
    idempotencyMap.clear();
  },

  getActivePendingPayment(
    travelerId: string,
  ): PendingPaymentHandoff | undefined {
    const now = new Date().getTime();
    const active = bookings.find((b) => {
      if (b.travelerId !== travelerId || b.status !== "PENDING_PAYMENT") {
        return false;
      }
      const expTime = new Date(b.paymentExpiresAt).getTime();
      return expTime > now;
    });

    if (!active) return undefined;

    return {
      bookingId: active.bookingId,
      packageName: active.packageId,
      amount: active.totalAmount,
      expiresAt: active.paymentExpiresAt,
    };
  },

  getIdempotentTransaction(
    idempotencyKey: string,
  ): { booking: BookingRecord; payment: PaymentAttemptRecord } | undefined {
    return idempotencyMap.get(idempotencyKey);
  },

  createTransaction(input: {
    travelerId: string;
    packageId: string;
    sessionId: string;
    participantCount: number;
    unitPricePerPerson: number;
    idempotencyKey: string;
  }): { booking: BookingRecord; payment: PaymentAttemptRecord } {
    const existing = idempotencyMap.get(input.idempotencyKey);
    if (existing) {
      return existing;
    }

    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + CHECKOUT_MVP_CONFIG.paymentTimeoutMinutes * 60 * 1000,
    ).toISOString();

    const bookingId = `bk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const paymentAttemptId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const booking: BookingRecord = {
      bookingId,
      travelerId: input.travelerId,
      packageId: input.packageId,
      sessionId: input.sessionId,
      participantCount: input.participantCount,
      unitPricePerPerson: input.unitPricePerPerson,
      totalAmount: input.unitPricePerPerson * input.participantCount,
      status: "PENDING_PAYMENT",
      reservedQuantity: input.participantCount,
      createdAt: now.toISOString(),
      paymentExpiresAt: expiresAt,
    };

    const payment: PaymentAttemptRecord = {
      paymentAttemptId,
      bookingId,
      status: "PENDING",
      expiresAt,
    };

    bookings.push(booking);
    paymentAttempts.push(payment);
    idempotencyMap.set(input.idempotencyKey, { booking, payment });

    return { booking, payment };
  },
};
