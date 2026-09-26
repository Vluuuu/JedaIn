import {
  calculatePaymentBreakdown,
  getBookingPaymentBreakdown,
} from "./pricing";
import type {
  BookingRecord,
  BookingStatus,
  PaymentAttemptRecord,
  PaymentAttemptStatus,
  PendingPaymentHandoff,
} from "./types";

export const CHECKOUT_MVP_CONFIG = {
  paymentTimeoutMinutes: 15,
};

export const TRAVELER_TRANSACTIONS_STORAGE_KEY =
  "jedain.traveler.transactions.v1";

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

interface PersistedIdempotencyEntry {
  key: string;
  input: {
    travelerId: string;
    sessionId: string;
    participantCount: number;
    unitPricePerPerson: number;
  };
  bookingId: string;
  paymentAttemptId: string;
}

interface PersistedTransactionState {
  version: 1;
  bookings: BookingRecord[];
  paymentAttempts: PaymentAttemptRecord[];
  idempotency?: PersistedIdempotencyEntry[];
}

const VALID_BOOKING_STATUSES: Set<string> = new Set([
  "PENDING_PAYMENT",
  "PAID",
  "COMPLETED",
  "CANCELLED",
  "EXPIRED",
]);

const VALID_PAYMENT_STATUSES: Set<string> = new Set([
  "PENDING",
  "VERIFYING",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
  "EXPIRED",
]);

function getSessionStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage ?? null;
  } catch {
    return null;
  }
}

function isValidIsoDate(val: unknown): val is string {
  if (typeof val !== "string" || !val.trim()) return false;
  const timestamp = Date.parse(val);
  return !Number.isNaN(timestamp);
}

function validateAndNormalizeBooking(data: unknown): BookingRecord | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const b = data as Record<string, unknown>;

  if (typeof b.bookingId !== "string" || !b.bookingId.trim()) return null;
  if (typeof b.travelerId !== "string" || !b.travelerId.trim()) return null;
  if (typeof b.packageId !== "string" || !b.packageId.trim()) return null;
  if (typeof b.sessionId !== "string" || !b.sessionId.trim()) return null;

  if (
    typeof b.participantCount !== "number" ||
    !Number.isInteger(b.participantCount) ||
    b.participantCount <= 0
  ) {
    return null;
  }

  if (
    typeof b.unitPricePerPerson !== "number" ||
    !Number.isFinite(b.unitPricePerPerson) ||
    b.unitPricePerPerson < 0
  ) {
    return null;
  }

  if (
    typeof b.totalAmount !== "number" ||
    !Number.isFinite(b.totalAmount) ||
    b.totalAmount < 0
  ) {
    return null;
  }

  if (typeof b.status !== "string" || !VALID_BOOKING_STATUSES.has(b.status)) {
    return null;
  }
  const status = b.status as BookingStatus;

  if (
    typeof b.reservedQuantity !== "number" ||
    !Number.isInteger(b.reservedQuantity) ||
    b.reservedQuantity < 0
  ) {
    return null;
  }

  if (
    typeof b.bookedQuantity !== "number" ||
    !Number.isInteger(b.bookedQuantity) ||
    b.bookedQuantity < 0
  ) {
    return null;
  }

  // Coherence guards between status and quantities
  if (status === "PENDING_PAYMENT") {
    if (b.bookedQuantity !== 0 || b.reservedQuantity <= 0) return null;
  } else if (status === "PAID" || status === "COMPLETED") {
    if (b.reservedQuantity !== 0 || b.bookedQuantity <= 0) return null;
  } else if (status === "CANCELLED" || status === "EXPIRED") {
    if (b.reservedQuantity !== 0 || b.bookedQuantity !== 0) return null;
  }

  if (!isValidIsoDate(b.createdAt)) return null;
  if (!isValidIsoDate(b.paymentExpiresAt)) return null;

  if (status === "PAID") {
    if (!isValidIsoDate(b.paidAt)) return null;
    if (b.completedAt !== undefined) return null;
  } else if (status === "COMPLETED") {
    if (!isValidIsoDate(b.paidAt)) return null;
    if (!isValidIsoDate(b.completedAt)) return null;
  } else {
    if (b.paidAt !== undefined || b.completedAt !== undefined) return null;
  }

  const subtotal =
    typeof b.subtotal === "number" &&
    Number.isFinite(b.subtotal) &&
    b.subtotal >= 0
      ? b.subtotal
      : undefined;
  const serviceFee =
    typeof b.serviceFee === "number" &&
    Number.isFinite(b.serviceFee) &&
    b.serviceFee >= 0
      ? b.serviceFee
      : undefined;
  const total =
    typeof b.total === "number" && Number.isFinite(b.total) && b.total >= 0
      ? b.total
      : undefined;

  return {
    bookingId: b.bookingId,
    travelerId: b.travelerId,
    packageId: b.packageId,
    sessionId: b.sessionId,
    participantCount: b.participantCount,
    unitPricePerPerson: b.unitPricePerPerson,
    subtotal,
    serviceFee,
    total,
    totalAmount: b.totalAmount,
    status,
    reservedQuantity: b.reservedQuantity,
    bookedQuantity: b.bookedQuantity,
    createdAt: b.createdAt,
    paymentExpiresAt: b.paymentExpiresAt,
    paidAt: b.paidAt as string | undefined,
    completedAt: b.completedAt as string | undefined,
  };
}

function validateAndNormalizePaymentAttempt(
  data: unknown,
  bookingsMap: Map<string, BookingRecord>,
): PaymentAttemptRecord | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const p = data as Record<string, unknown>;

  if (typeof p.paymentAttemptId !== "string" || !p.paymentAttemptId.trim())
    return null;
  if (typeof p.bookingId !== "string" || !p.bookingId.trim()) return null;

  const matchingBooking = bookingsMap.get(p.bookingId);
  if (!matchingBooking) return null;

  if (typeof p.status !== "string" || !VALID_PAYMENT_STATUSES.has(p.status)) {
    return null;
  }
  const status = p.status as PaymentAttemptStatus;

  if (!isValidIsoDate(p.expiresAt)) return null;
  if (p.updatedAt !== undefined && !isValidIsoDate(p.updatedAt)) return null;

  // Cross-entity coherence
  if (status === "SUCCEEDED") {
    if (
      matchingBooking.status !== "PAID" &&
      matchingBooking.status !== "COMPLETED"
    ) {
      return null;
    }
  }
  if (
    matchingBooking.status === "PAID" ||
    matchingBooking.status === "COMPLETED"
  ) {
    if (status !== "SUCCEEDED") return null;
  }
  if (matchingBooking.status === "PENDING_PAYMENT") {
    if (
      status === "SUCCEEDED" ||
      status === "CANCELLED" ||
      status === "EXPIRED"
    ) {
      return null;
    }
  }
  if (matchingBooking.status === "CANCELLED") {
    if (
      status === "SUCCEEDED" ||
      status === "PENDING" ||
      status === "VERIFYING"
    ) {
      return null;
    }
  }
  if (matchingBooking.status === "EXPIRED") {
    if (
      status === "SUCCEEDED" ||
      status === "PENDING" ||
      status === "VERIFYING"
    ) {
      return null;
    }
  }

  return {
    paymentAttemptId: p.paymentAttemptId,
    bookingId: p.bookingId,
    status,
    expiresAt: p.expiresAt,
    updatedAt: p.updatedAt as string | undefined,
  };
}

function validateAndNormalizeTransactions(data: unknown): {
  bookings: BookingRecord[];
  paymentAttempts: PaymentAttemptRecord[];
  idempotencyMap: Map<string, IdempotencyRecord>;
} | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const candidate = data as Record<string, unknown>;

  if (candidate.version !== 1) return null;
  if (!Array.isArray(candidate.bookings)) return null;
  if (!Array.isArray(candidate.paymentAttempts)) return null;

  const validBookings: BookingRecord[] = [];
  const bookingsMap = new Map<string, BookingRecord>();

  for (const item of candidate.bookings) {
    const valid = validateAndNormalizeBooking(item);
    if (!valid) return null;
    if (bookingsMap.has(valid.bookingId)) return null;
    validBookings.push(valid);
    bookingsMap.set(valid.bookingId, valid);
  }

  const validPaymentAttempts: PaymentAttemptRecord[] = [];
  const attemptsMap = new Map<string, PaymentAttemptRecord>();

  for (const item of candidate.paymentAttempts) {
    const valid = validateAndNormalizePaymentAttempt(item, bookingsMap);
    if (!valid) return null;
    if (attemptsMap.has(valid.paymentAttemptId)) return null;
    validPaymentAttempts.push(valid);
    attemptsMap.set(valid.paymentAttemptId, valid);
  }

  // Cross-entity coherence: every PAID or COMPLETED booking MUST have a matching SUCCEEDED attempt
  for (const booking of validBookings) {
    if (booking.status === "PAID" || booking.status === "COMPLETED") {
      const matchingAttempt = validPaymentAttempts.find(
        (p) => p.bookingId === booking.bookingId && p.status === "SUCCEEDED",
      );
      if (!matchingAttempt) {
        return null;
      }
    }
  }

  const newIdempotencyMap = new Map<string, IdempotencyRecord>();
  if (Array.isArray(candidate.idempotency)) {
    for (const item of candidate.idempotency) {
      if (!item || typeof item !== "object" || Array.isArray(item)) continue;
      const rec = item as Record<string, unknown>;
      if (typeof rec.key !== "string" || !rec.key.trim()) continue;
      if (
        typeof rec.bookingId !== "string" ||
        typeof rec.paymentAttemptId !== "string"
      ) {
        continue;
      }

      const booking = bookingsMap.get(rec.bookingId);
      const payment = attemptsMap.get(rec.paymentAttemptId);
      if (!booking || !payment) continue;

      // Invariant: payment attempt must belong to the referenced booking
      if (payment.bookingId !== booking.bookingId) continue;

      if (
        !rec.input ||
        typeof rec.input !== "object" ||
        Array.isArray(rec.input)
      ) {
        continue;
      }
      const inp = rec.input as Record<string, unknown>;
      if (
        inp.travelerId !== booking.travelerId ||
        inp.sessionId !== booking.sessionId ||
        inp.participantCount !== booking.participantCount ||
        inp.unitPricePerPerson !== booking.unitPricePerPerson
      ) {
        continue;
      }

      newIdempotencyMap.set(rec.key, {
        input: {
          travelerId: booking.travelerId,
          sessionId: booking.sessionId,
          participantCount: booking.participantCount,
          unitPricePerPerson: booking.unitPricePerPerson,
        },
        booking,
        payment,
      });
    }
  }

  return {
    bookings: validBookings,
    paymentAttempts: validPaymentAttempts,
    idempotencyMap: newIdempotencyMap,
  };
}

function loadPersistedTransactions(): {
  bookings: BookingRecord[];
  paymentAttempts: PaymentAttemptRecord[];
  idempotencyMap: Map<string, IdempotencyRecord>;
} {
  const storage = getSessionStorage();
  if (!storage) {
    return { bookings: [], paymentAttempts: [], idempotencyMap: new Map() };
  }

  try {
    const raw = storage.getItem(TRAVELER_TRANSACTIONS_STORAGE_KEY);
    if (!raw) {
      return { bookings: [], paymentAttempts: [], idempotencyMap: new Map() };
    }

    const parsed = JSON.parse(raw);
    const validated = validateAndNormalizeTransactions(parsed);
    if (!validated) {
      try {
        storage.removeItem(TRAVELER_TRANSACTIONS_STORAGE_KEY);
      } catch {
        // ignore
      }
      return { bookings: [], paymentAttempts: [], idempotencyMap: new Map() };
    }
    return validated;
  } catch {
    try {
      storage.removeItem(TRAVELER_TRANSACTIONS_STORAGE_KEY);
    } catch {
      // ignore
    }
    return { bookings: [], paymentAttempts: [], idempotencyMap: new Map() };
  }
}

function persistCurrentTransactions(): void {
  const storage = getSessionStorage();
  if (!storage) return;

  try {
    if (bookings.length === 0 && paymentAttempts.length === 0) {
      storage.removeItem(TRAVELER_TRANSACTIONS_STORAGE_KEY);
      return;
    }

    const idempotencyEntries: PersistedIdempotencyEntry[] = [];
    for (const [key, record] of idempotencyMap.entries()) {
      idempotencyEntries.push({
        key,
        input: { ...record.input },
        bookingId: record.booking.bookingId,
        paymentAttemptId: record.payment.paymentAttemptId,
      });
    }

    const payload: PersistedTransactionState = {
      version: 1,
      bookings: bookings.map((b) => ({ ...b })),
      paymentAttempts: paymentAttempts.map((p) => ({ ...p })),
      idempotency: idempotencyEntries,
    };

    storage.setItem(TRAVELER_TRANSACTIONS_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Gracefully ignore storage write failures (quota exceeded, security error, etc.)
  }
}

function clearPersistedTransactions(): void {
  const storage = getSessionStorage();
  if (!storage) return;

  try {
    storage.removeItem(TRAVELER_TRANSACTIONS_STORAGE_KEY);
  } catch {
    // ignore
  }
}

const initialTransactions = loadPersistedTransactions();
let bookings: BookingRecord[] = initialTransactions.bookings;
let paymentAttempts: PaymentAttemptRecord[] =
  initialTransactions.paymentAttempts;
let idempotencyMap: Map<string, IdempotencyRecord> =
  initialTransactions.idempotencyMap;

export const mockTransactionStore = {
  reset(): void {
    bookings = [];
    paymentAttempts = [];
    idempotencyMap.clear();
    clearPersistedTransactions();
  },

  clearMemoryForTesting(): void {
    bookings = [];
    paymentAttempts = [];
    idempotencyMap.clear();
  },

  hydrateFromStorage(): void {
    const loaded = loadPersistedTransactions();
    bookings = loaded.bookings;
    paymentAttempts = loaded.paymentAttempts;
    idempotencyMap = loaded.idempotencyMap;
  },

  reconcileExpiredPendingPayments(nowMs: number = Date.now()): void {
    let mutated = false;
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
              (p.status === "PENDING" ||
                p.status === "VERIFYING" ||
                p.status === "FAILED"),
          );
          if (attempt) {
            attempt.status = "EXPIRED";
          }
          mutated = true;
        }
      }
    }
    if (mutated) {
      persistCurrentTransactions();
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

    const breakdown = getBookingPaymentBreakdown(active);

    return {
      bookingId: active.bookingId,
      packageId: active.packageId,
      amount: breakdown.total,
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
      persistCurrentTransactions();
      return { success: false, reason: "EXPIRED", booking };
    }

    // Atomically transition to PAID
    booking.status = "PAID";
    booking.reservedQuantity = 0;
    booking.bookedQuantity = booking.participantCount;
    booking.paidAt = new Date(nowMs).toISOString();

    attempt.status = "SUCCEEDED";
    attempt.updatedAt = new Date(nowMs).toISOString();

    persistCurrentTransactions();

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
      persistCurrentTransactions();
      return { success: false, reason: "EXPIRED", booking };
    }

    attempt.status = "FAILED";
    attempt.updatedAt = new Date(nowMs).toISOString();

    persistCurrentTransactions();

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
      persistCurrentTransactions();
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

    persistCurrentTransactions();

    return { success: true, booking };
  },

  completePaidBookingForDemo(params: {
    travelerId: string;
    bookingId: string;
    nowMs?: number;
  }): {
    success: boolean;
    reason?: "NOT_FOUND" | "INVALID_OWNER" | "INVALID_STATE";
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

    // Idempotent for already COMPLETED
    if (booking.status === "COMPLETED") {
      return { success: true, booking };
    }

    // Only PAID bookings can be completed
    if (booking.status !== "PAID") {
      return { success: false, reason: "INVALID_STATE", booking };
    }

    booking.status = "COMPLETED";
    booking.completedAt = new Date(nowMs).toISOString();

    persistCurrentTransactions();

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

    const breakdown = calculatePaymentBreakdown(
      input.unitPricePerPerson,
      input.participantCount,
    );

    const booking: BookingRecord = {
      bookingId,
      travelerId: input.travelerId,
      packageId: input.packageId,
      sessionId: input.sessionId,
      participantCount: input.participantCount,
      unitPricePerPerson: input.unitPricePerPerson,
      subtotal: breakdown.subtotal,
      serviceFee: breakdown.serviceFee,
      total: breakdown.total,
      totalAmount: breakdown.total,
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

    persistCurrentTransactions();

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
    persistCurrentTransactions();
  },
};
