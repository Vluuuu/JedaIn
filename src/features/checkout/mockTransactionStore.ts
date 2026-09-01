import type {
  BookingRecord,
  PaymentAttemptRecord,
  PendingPaymentHandoff,
} from "./types";

export const CHECKOUT_MVP_CONFIG = {
  paymentTimeoutMinutes: 15,
};

interface IdempotencyRecord {
  input: {
    travelerId: string;
    sessionId: string;
    participantCount: number;
    unitPricePerPerson: number;
  };
  booking: BookingRecord;
  payment: PaymentAttemptRecord;
}

let bookings: BookingRecord[] = [];
let paymentAttempts: PaymentAttemptRecord[] = [];
const idempotencyMap = new Map<string, IdempotencyRecord>();

export const mockTransactionStore = {
  reset(): void {
    bookings = [];
    paymentAttempts = [];
    idempotencyMap.clear();
  },

  getBookings(): readonly BookingRecord[] {
    return bookings;
  },

  getPaymentAttempts(): readonly PaymentAttemptRecord[] {
    return paymentAttempts;
  },

  getReservedQuantity(sessionId: string): number {
    const now = new Date().getTime();
    return bookings
      .filter((b) => {
        if (b.sessionId !== sessionId || b.status !== "PENDING_PAYMENT") {
          return false;
        }
        return new Date(b.paymentExpiresAt).getTime() > now;
      })
      .reduce((sum, b) => sum + b.reservedQuantity, 0);
  },

  getActivePendingPayment(
    travelerId: string,
  ): PendingPaymentHandoff | undefined {
    const now = new Date().getTime();
    const active = bookings.find((b) => {
      if (b.travelerId !== travelerId || b.status !== "PENDING_PAYMENT") {
        return false;
      }
      return new Date(b.paymentExpiresAt).getTime() > now;
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
    input?: {
      travelerId: string;
      sessionId: string;
      participantCount: number;
      unitPricePerPerson: number;
    },
  ):
    | {
        result?: { booking: BookingRecord; payment: PaymentAttemptRecord };
        conflict: boolean;
      }
    | undefined {
    const record = idempotencyMap.get(idempotencyKey);
    if (!record) return undefined;

    if (input) {
      const match =
        record.input.travelerId === input.travelerId &&
        record.input.sessionId === input.sessionId &&
        record.input.participantCount === input.participantCount &&
        record.input.unitPricePerPerson === input.unitPricePerPerson;

      if (!match) {
        return { conflict: true };
      }
    }

    return {
      result: { booking: record.booking, payment: record.payment },
      conflict: false,
    };
  },

  createTransaction(input: {
    travelerId: string;
    packageId: string;
    sessionId: string;
    participantCount: number;
    unitPricePerPerson: number;
    capacitySnapshot: number;
    idempotencyKey: string;
  }):
    | { success: true; booking: BookingRecord; payment: PaymentAttemptRecord }
    | {
        success: false;
        reason: "INSUFFICIENT_CAPACITY" | "IDEMPOTENCY_CONFLICT";
      } {
    // 1. Idempotency check
    const existing = idempotencyMap.get(input.idempotencyKey);
    if (existing) {
      const match =
        existing.input.travelerId === input.travelerId &&
        existing.input.sessionId === input.sessionId &&
        existing.input.participantCount === input.participantCount &&
        existing.input.unitPricePerPerson === input.unitPricePerPerson;

      if (!match) {
        return { success: false, reason: "IDEMPOTENCY_CONFLICT" };
      }
      return {
        success: true,
        booking: existing.booking,
        payment: existing.payment,
      };
    }

    // 2. Capacity ledger check (in-memory atomic boundary)
    const currentActiveReserved = this.getReservedQuantity(input.sessionId);
    const availableSlots = input.capacitySnapshot - currentActiveReserved;

    if (availableSlots < input.participantCount) {
      return { success: false, reason: "INSUFFICIENT_CAPACITY" };
    }

    // 3. Atomically create booking & payment attempt
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

    const record: IdempotencyRecord = {
      input: {
        travelerId: input.travelerId,
        sessionId: input.sessionId,
        participantCount: input.participantCount,
        unitPricePerPerson: input.unitPricePerPerson,
      },
      booking,
      payment,
    };

    idempotencyMap.set(input.idempotencyKey, { ...record });

    return { success: true, booking, payment };
  },
};
