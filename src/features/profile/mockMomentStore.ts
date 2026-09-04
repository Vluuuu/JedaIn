// Prototype store for Traveler Moments
// Strictly obeys: Moment booking MUST belong to traveler and be COMPLETED.
// Zero fake third-party images.

import { mockTransactionStore } from "../checkout/mockTransactionStore";
import { createDemoTravelerHistory } from "../trips/demoHistory";
import type { TravelerMomentRecord } from "./types";

let moments: TravelerMomentRecord[] = [];

export const mockMomentStore = {
  reset(): void {
    moments = [];
  },

  getAllMoments(): readonly TravelerMomentRecord[] {
    return moments;
  },

  getMomentsByTraveler(travelerId: string): TravelerMomentRecord[] {
    if (!travelerId) return [];

    // Filter by travelerId AND verify booking belongs to traveler & is COMPLETED
    const travelerBookings =
      mockTransactionStore.getBookingsByTraveler(travelerId);
    const demo = createDemoTravelerHistory(travelerId);

    const validBookingIds = new Set<string>();
    for (const b of travelerBookings) {
      if (b.status === "COMPLETED") {
        validBookingIds.add(b.bookingId);
      }
    }
    // Demo booking is COMPLETED
    validBookingIds.add(demo.booking.bookingId);

    return moments.filter(
      (m) => m.travelerId === travelerId && validBookingIds.has(m.bookingId),
    );
  },

  addMoment(moment: Omit<TravelerMomentRecord, "momentId" | "createdAt">): {
    success: boolean;
    moment?: TravelerMomentRecord;
    message?: string;
  } {
    // Validate booking ownership and COMPLETED status
    let booking = mockTransactionStore.getBookingById(moment.bookingId);
    const demo = createDemoTravelerHistory(moment.travelerId);
    if (!booking && moment.bookingId === demo.booking.bookingId) {
      booking = demo.booking;
    }

    if (
      !booking ||
      booking.travelerId !== moment.travelerId ||
      booking.status !== "COMPLETED"
    ) {
      return {
        success: false,
        message:
          "Momen hanya dapat ditambahkan untuk perjalanan yang telah selesai.",
      };
    }

    const newRecord: TravelerMomentRecord = {
      ...moment,
      momentId: `mom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    moments.unshift(newRecord);
    return { success: true, moment: newRecord };
  },
};
