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

  reconcileExpiredPendingPayments(nowMs: number = Date.now()): void {
    for (const booking of bookings) {
      if (booking.status === "PENDING_PAYMENT") {
        const expTime = new Date(booking.paymentExpiresAt).getTime();
        if (nowMs >= expTime) {
          booking.status = "EXPIRED";
          booking.reservedQuantity = 0;
          booking.bookedQuantity = 0;

          const attempt = paymentAttempts.find(
            (p) =>
              p.bookingId === booking.bookingId &&
              (p.status === "PENDING" || p.status === "VERIFYING"),
          );
          if (attempt) {
            attempt.status = "EXPIRED";
          }
        }
      }
    }
  },

  getBookings(): readonly BookingRecord[] {
    return bookings;
  },

  getPaymentAttempts(): readonly PaymentAttemptRecord[] {
    return paymentAttempts;
  },

  getPaymentAttemptForBooking(
    bookingId: string,
  ): PaymentAttemptRecord | undefined {
    return paymentAttempts.find((p) => p.bookingId === bookingId);
  },

  getReservedQuantity(sessionId: string, nowMs: number = Date.now()): number {
    this.reconcileExpiredPendingPayments(nowMs);
    return bookings
      .filter((b) => {
        if (b.sessionId !== sessionId || b.status !== "PENDING_PAYMENT") {
          return false;
        }
        return new Date(b.paymentExpiresAt).getTime() > nowMs;
      })
      .reduce((sum, b) => sum + b.reservedQuantity, 0);
  },

  getBookedQuantity(sessionId: string): number {
    return bookings
      .filter(
        (b) =>
          b.sessionId === sessionId &&
          (b.status === "PAID" || b.status === "COMPLETED"),
      )
      .reduce((sum, b) => sum + b.bookedQuantity, 0);
  },

  getOccupiedQuantity(sessionId: string, nowMs: number = Date.now()): number {
    return (
      this.getReservedQuantity(sessionId, nowMs) +
      this.getBookedQuantity(sessionId)
    );
  },

  getActivePendingPayment(
    travelerId: string,
    nowMs: number = Date.now(),
  ): PendingPaymentHandoff | undefined {
    this.reconcileExpiredPendingPayments(nowMs);
    const active = bookings.find((b) => {
      if (b.travelerId !== travelerId || b.status !== "PENDING_PAYMENT") {
        return false;
      }
      return new Date(b.paymentExpiresAt).getTime() > nowMs;
    });

    if (!active) return undefined;

    return {
      bookingId: active.bookingId,
      packageId: active.packageId,
      amount: active.totalAmount,
      expiresAt: active.paymentExpiresAt,
    };
  },

  getActiveBookingRecord(
    travelerId: string,
    nowMs: number = Date.now(),
  ): BookingRecord | undefined {
    this.reconcileExpiredPendingPayments(nowMs);
    return bookings.find((b) => {
      if (b.travelerId !== travelerId || b.status !== "PENDING_PAYMENT") {
        return false;
      }
      return new Date(b.paymentExpiresAt).getTime() > nowMs;
    });
  },

  getBookingById(bookingId: string): BookingRecord | undefined {
    return bookings.find((b) => b.bookingId === bookingId);
  },

  getBookingsByTraveler(travelerId: string): readonly BookingRecord[] {
    return bookings.filter((b) => b.travelerId === travelerId);
  },

  executePaymentSuccess(params: { bookingId: string; nowMs?: number }): {
    success: boolean;
    reason?: "NOT_FOUND" | "EXPIRED" | "ALREADY_PAID" | "INVALID_STATE";
    booking?: BookingRecord;
  } {
    const nowMs = params.nowMs ?? Date.now();
    this.reconcileExpiredPendingPayments(nowMs);

    const booking = bookings.find((b) => b.bookingId === params.bookingId);
    if (!booking) {
      return { success: false, reason: "NOT_FOUND" };
    }

    if (booking.status === "PAID" || booking.status === "COMPLETED") {
      return { success: true, booking, reason: "ALREADY_PAID" };
    }

    if (booking.status === "EXPIRED") {
      return { success: false, reason: "EXPIRED", booking };
    }

    if (booking.status === "CANCELLED") {
      return { success: false, reason: "NOT_FOUND", booking };
    }

    if (booking.status !== "PENDING_PAYMENT") {
      return { success: false, reason: "INVALID_STATE", booking };
    }

    const attempt = paymentAttempts.find(
      (p) => p.bookingId === booking.bookingId,
    );
    if (!attempt) {
      return { success: false, reason: "INVALID_STATE", booking };
    }

    // attempt must be in an active/retry state (PENDING, VERIFYING, or FAILED for retry)
    if (
      attempt.status !== "PENDING" &&
      attempt.status !== "VERIFYING" &&
      attempt.status !== "FAILED"
    ) {
      return { success: false, reason: "INVALID_STATE", booking };
    }

    const expTime = new Date(booking.paymentExpiresAt).getTime();
    if (nowMs >= expTime) {
      booking.status = "EXPIRED";
      booking.reservedQuantity = 0;
      booking.bookedQuantity = 0;
      attempt.status = "EXPIRED";
      return { success: false, reason: "EXPIRED", booking };
    }

    // Atomically transition to PAID
    booking.status = "PAID";
    booking.reservedQuantity = 0;
    booking.bookedQuantity = booking.participantCount;
    booking.paidAt = new Date(nowMs).toISOString();

    attempt.status = "SUCCEEDED";
    attempt.updatedAt = new Date(nowMs).toISOString();

    return { success: true, booking };
  },

  executePaymentFailure(params: { bookingId: string; nowMs?: number }): {
    success: boolean;
    reason?: "NOT_FOUND" | "EXPIRED" | "INVALID_STATE";
    booking?: BookingRecord;
  } {
    const nowMs = params.nowMs ?? Date.now();
    this.reconcileExpiredPendingPayments(nowMs);

    const booking = bookings.find((b) => b.bookingId === params.bookingId);
    if (!booking) {
      return { success: false, reason: "NOT_FOUND" };
    }

    // Must NOT mutate PAID, COMPLETED, CANCELLED, EXPIRED into FAILED
    if (booking.status !== "PENDING_PAYMENT") {
      if (booking.status === "EXPIRED") {
        return { success: false, reason: "EXPIRED", booking };
      }
      return { success: false, reason: "INVALID_STATE", booking };
    }

    const attempt = paymentAttempts.find(
      (p) => p.bookingId === booking.bookingId,
    );
    if (!attempt) {
      return { success: false, reason: "INVALID_STATE", booking };
    }

    const expTime = new Date(booking.paymentExpiresAt).getTime();
    if (nowMs >= expTime) {
      booking.status = "EXPIRED";
      booking.reservedQuantity = 0;
      booking.bookedQuantity = 0;
      attempt.status = "EXPIRED";
      return { success: false, reason: "EXPIRED", booking };
    }

    attempt.status = "FAILED";
    attempt.updatedAt = new Date(nowMs).toISOString();

    return { success: true, booking };
  },

  cancelPendingBooking(params: {
    travelerId: string;
    bookingId: string;
    nowMs?: number;
  }): {
    success: boolean;
    reason?:
      | "NOT_FOUND"
      | "EXPIRED"
      | "ALREADY_RESOLVED"
      | "INVALID_OWNER"
      | "INVALID_STATE";
    booking?: BookingRecord;
  } {
    const nowMs = params.nowMs ?? Date.now();
    this.reconcileExpiredPendingPayments(nowMs);

    const booking = bookings.find((b) => b.bookingId === params.bookingId);
    if (!booking) {
      return { success: false, reason: "NOT_FOUND" };
    }

    if (booking.travelerId !== params.travelerId) {
      return { success: false, reason: "INVALID_OWNER" };
    }

    if (booking.status === "PAID" || booking.status === "COMPLETED") {
      return { success: false, reason: "INVALID_STATE", booking };
    }

    if (booking.status === "CANCELLED") {
      return { success: true, booking, reason: "ALREADY_RESOLVED" };
    }

    if (booking.status === "EXPIRED") {
      return { success: false, reason: "EXPIRED", booking };
    }

    if (booking.status !== "PENDING_PAYMENT") {
      return { success: false, reason: "INVALID_STATE", booking };
    }

    // Check expiry race
    const expTime = new Date(booking.paymentExpiresAt).getTime();
    if (nowMs >= expTime) {
      booking.status = "EXPIRED";
      booking.reservedQuantity = 0;
      booking.bookedQuantity = 0;
      const attempt = paymentAttempts.find(
        (p) => p.bookingId === booking.bookingId,
      );
      if (attempt) attempt.status = "EXPIRED";
      return { success: false, reason: "EXPIRED", booking };
    }

    // Transition to CANCELLED atomically
    booking.status = "CANCELLED";
    booking.reservedQuantity = 0;
    booking.bookedQuantity = 0;

    const attempt = paymentAttempts.find(
      (p) => p.bookingId === booking.bookingId,
    );
    if (attempt) {
      attempt.status = "CANCELLED";
    }

    return { success: true, booking };
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
    nowMs?: number;
  }):
    | { success: true; booking: BookingRecord; payment: PaymentAttemptRecord }
    | {
        success: false;
        reason:
          | "INSUFFICIENT_CAPACITY"
          | "IDEMPOTENCY_CONFLICT"
          | "ACTIVE_PENDING_PAYMENT";
        existingPending?: PendingPaymentHandoff;
      } {
    const nowMs = input.nowMs ?? Date.now();

    // 1. Idempotency check (allows replay of same committed transaction)
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

    // 2. Reconcile expired pending records
    this.reconcileExpiredPendingPayments(nowMs);

    // 3. STORE-LEVEL ATOMIC INVARIANT: Check active pending payment for traveler
    const activePending = this.getActivePendingPayment(input.travelerId, nowMs);
    if (activePending) {
      return {
        success: false,
        reason: "ACTIVE_PENDING_PAYMENT",
        existingPending: activePending,
      };
    }

    // 4. Capacity ledger check: occupied = active reserved + booked slots
    const currentOccupied = this.getOccupiedQuantity(input.sessionId, nowMs);
    const availableSlots = input.capacitySnapshot - currentOccupied;

    if (availableSlots < input.participantCount) {
      return { success: false, reason: "INSUFFICIENT_CAPACITY" };
    }

    // 5. Atomically create booking & payment attempt
    const now = new Date(nowMs);
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
      bookedQuantity: 0,
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

  // Helper for adding test fixtures
  addDirectBooking(
    booking: BookingRecord,
    payment?: PaymentAttemptRecord,
  ): void {
    bookings.push({ ...booking });
    if (payment) {
      paymentAttempts.push({ ...payment });
    }
  },
};
