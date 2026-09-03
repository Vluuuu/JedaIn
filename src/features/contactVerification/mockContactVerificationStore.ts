import type { ContactVerificationRecord } from "./types";

let records: ContactVerificationRecord[] = [];

export const mockContactVerificationStore = {
  reset(): void {
    records = [];
  },

  getVerifiedPhone(travelerId: string): string | undefined {
    const rec = records.find((r) => r.travelerId === travelerId);
    return rec?.phone;
  },

  isPhoneVerified(travelerId: string, phone?: string): boolean {
    if (!phone) return false;
    return records.some(
      (r) => r.travelerId === travelerId && r.phone === phone,
    );
  },

  markPhoneVerified(travelerId: string, phone: string): void {
    const existingIndex = records.findIndex((r) => r.travelerId === travelerId);
    const newRecord: ContactVerificationRecord = {
      travelerId,
      phone,
      verifiedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      records[existingIndex] = newRecord;
    } else {
      records.push(newRecord);
    }
  },

  clearForTraveler(travelerId: string): void {
    records = records.filter((r) => r.travelerId !== travelerId);
  },
};
