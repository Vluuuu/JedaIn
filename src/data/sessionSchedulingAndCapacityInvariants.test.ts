import type { SupabaseClient } from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockDestinationStore } from "../features/eo/mockDestinationStore";
import { mockEoPackageStore } from "../features/eo/mockEoPackageStore";
import { partnerSessionStore } from "../features/eo/partnerSessionStore";
import * as clientModule from "../lib/supabase/client";
import {
  setDataModeOverride,
  setSupabaseConfigOverride,
} from "../lib/supabase/config";
import { sessionRepository } from "./sessionRepository";

describe("Regression Tests: Destination Capacity & Schedule Conflict Invariants", () => {
  const baseNow = Date.parse("2026-10-01T00:00:00Z");

  // Times in UTC (WIB = UTC+7)
  // 08:00 - 14:00 WIB = 01:00 - 07:00 UTC
  const slot_08_14_start = "2026-10-25T01:00:00.000Z";
  const slot_08_14_end = "2026-10-25T07:00:00.000Z";

  // 12:00 - 18:00 WIB = 05:00 - 11:00 UTC (overlaps with 08:00 - 14:00)
  const slot_12_18_start = "2026-10-25T05:00:00.000Z";
  const slot_12_18_end = "2026-10-25T11:00:00.000Z";

  // 10:00 - 12:00 WIB = 03:00 - 05:00 UTC (fully inside 08:00 - 14:00)
  const slot_10_12_start = "2026-10-25T03:00:00.000Z";
  const slot_10_12_end = "2026-10-25T05:00:00.000Z";

  // 14:00 - 18:00 WIB = 07:00 - 11:00 UTC (adjacent right, [start, end) semantics: non-overlapping)
  const slot_14_18_start = "2026-10-25T07:00:00.000Z";
  const slot_14_18_end = "2026-10-25T11:00:00.000Z";

  beforeEach(() => {
    mockDestinationStore.reset();
    mockEoPackageStore.reset();
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
  });

  afterEach(() => {
    mockDestinationStore.reset();
    mockEoPackageStore.reset();
    partnerSessionStore.reset();
    setDataModeOverride(null);
    setSupabaseConfigOverride(null);
    vi.restoreAllMocks();
  });

  describe("A. Destination Capacity Limit", () => {
    it("1. capacity 20 is accepted, but capacity 21 is rejected for Lereng Hijau (max: 20)", async () => {
      // Destination dest_lereng_hijau capacityPerSession = 20
      const dest = mockDestinationStore.getById("dest_lereng_hijau");
      expect(dest?.capacityPerSession).toBe(20);

      // Capacity = 20 -> PASS
      const passRes = await sessionRepository.createSession({
        packageId: "slow_green_day",
        startAt: "2026-10-26T01:00:00.000Z",
        endAt: "2026-10-26T07:00:00.000Z",
        capacity: 20,
        pricePerPerson: 300000,
        nowMs: baseNow,
      });
      expect(passRes.success).toBe(true);
      expect(passRes.session?.capacity).toBe(20);

      // Capacity = 21 -> FAIL
      const failRes = await sessionRepository.createSession({
        packageId: "slow_green_day",
        startAt: "2026-10-27T01:00:00.000Z",
        endAt: "2026-10-27T07:00:00.000Z",
        capacity: 21,
        pricePerPerson: 300000,
        nowMs: baseNow,
      });
      expect(failRes.success).toBe(false);
      expect(failRes.message).toContain("Kapasitas sesi maksimal untuk");
      expect(failRes.message).toContain("adalah 20 orang");
    });
  });

  describe("B. Destination Schedule Conflict", () => {
    it("2. same destination, same EO: exact overlapping time (08-14 vs 08-14) is rejected", async () => {
      // 1st session: 08-14
      const firstRes = await sessionRepository.createSession({
        packageId: "slow_green_day",
        startAt: slot_08_14_start,
        endAt: slot_08_14_end,
        capacity: 10,
        pricePerPerson: 300000,
        nowMs: baseNow,
      });
      expect(firstRes.success).toBe(true);

      // 2nd session: exact same time 08-14 on same destination -> FAIL
      const secondRes = await sessionRepository.createSession({
        packageId: "slow_green_day",
        startAt: slot_08_14_start,
        endAt: slot_08_14_end,
        capacity: 10,
        pricePerPerson: 300000,
        nowMs: baseNow,
      });
      expect(secondRes.success).toBe(false);
      expect(secondRes.message).toContain("Destinasi sudah digunakan pada");
      expect(secondRes.message).toContain("25 Okt 2026, 08.00–14.00 WIB");
    });

    it("3. same destination, same EO: partial overlapping time (08-14 vs 12-18) is rejected", async () => {
      // 1st session: 08-14
      const firstRes = await sessionRepository.createSession({
        packageId: "slow_green_day",
        startAt: slot_08_14_start,
        endAt: slot_08_14_end,
        capacity: 10,
        pricePerPerson: 300000,
        nowMs: baseNow,
      });
      expect(firstRes.success).toBe(true);

      // 2nd session: 12-18 (overlaps between 12:00 and 14:00) -> FAIL
      const secondRes = await sessionRepository.createSession({
        packageId: "slow_green_day",
        startAt: slot_12_18_start,
        endAt: slot_12_18_end,
        capacity: 10,
        pricePerPerson: 300000,
        nowMs: baseNow,
      });
      expect(secondRes.success).toBe(false);
      expect(secondRes.message).toContain("Destinasi sudah digunakan pada");
    });

    it("4. same destination, DIFFERENT EO: conflicting time (EO A 08-14 vs EO B 10-12) is rejected", async () => {
      // EO A (eo_jeda_alam) creates session 08-14 on dest_lereng_hijau
      const eoARes = await sessionRepository.createSession({
        packageId: "slow_green_day",
        startAt: slot_08_14_start,
        endAt: slot_08_14_end,
        capacity: 10,
        pricePerPerson: 300000,
        nowMs: baseNow,
      });
      expect(eoARes.success).toBe(true);

      // Create package for EO B (eo_kreatif_desa) on the SAME destination dest_lereng_hijau
      mockEoPackageStore.upsertPackage({
        packageId: "pkg_eo_b_lereng",
        eoId: "eo_kreatif_desa",
        eoDisplayName: "Kreatif Desa",
        title: "Paket EO B di Lereng",
        shortSummary: "Pengalaman EO B di destinasi yang sama.",
        valueProposition: "Nilai pengalaman.",
        destinationId: "dest_lereng_hijau",
        durationLabel: "1 hari",
        suitableGroupTypes: ["SOLO"],
        highlights: [],
        itinerary: [],
        includedItems: ["Transport"],
        excludedItems: [],
        safetyNotes: ["SOP aman"],
        pricing: {
          destinationBaseCost: 125000,
          localGuideFee: 25000,
          eoMargin: 100000,
          customerPrice: 250000,
        },
        guideStatus: "CERTIFIED_GUIDE",
        guideSource: "DESTINATION",
        status: "LIVE",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Switch partner to EO B
      partnerSessionStore.setPartner({
        id: "eo_kreatif_desa",
        email: "partner@kreatifdesa.id",
        name: "Partner Kreatif",
        role: "EO",
        businessName: "Kreatif Desa",
      });

      // EO B attempts to create session 10-12 on dest_lereng_hijau -> must be rejected
      const eoBRes = await sessionRepository.createSession({
        packageId: "pkg_eo_b_lereng",
        startAt: slot_10_12_start,
        endAt: slot_10_12_end,
        capacity: 5,
        pricePerPerson: 250000,
        nowMs: baseNow,
      });
      expect(eoBRes.success).toBe(false);
      expect(eoBRes.message).toContain("Destinasi sudah digunakan pada");
    });

    it("5. same destination adjacent times (08-14 vs 14-18) with [start, end) semantics is accepted", async () => {
      // 1st session: 08-14
      const firstRes = await sessionRepository.createSession({
        packageId: "slow_green_day",
        startAt: slot_08_14_start,
        endAt: slot_08_14_end,
        capacity: 10,
        pricePerPerson: 300000,
        nowMs: baseNow,
      });
      expect(firstRes.success).toBe(true);

      // 2nd session starts at 14:00 exactly when 1st session ends -> PASS
      const secondRes = await sessionRepository.createSession({
        packageId: "slow_green_day",
        startAt: slot_14_18_start,
        endAt: slot_14_18_end,
        capacity: 10,
        pricePerPerson: 300000,
        nowMs: baseNow,
      });
      expect(secondRes.success).toBe(true);
    });

    it("6. different destinations with identical time (both 08-14) are both accepted", async () => {
      // 1st session on dest_lereng_hijau (slow_green_day)
      const firstRes = await sessionRepository.createSession({
        packageId: "slow_green_day",
        startAt: slot_08_14_start,
        endAt: slot_08_14_end,
        capacity: 10,
        pricePerPerson: 300000,
        nowMs: baseNow,
      });
      expect(firstRes.success).toBe(true);

      // 2nd session on dest_lembah_pacet (pkg_pacet_mindful_retreat) at the same time
      mockEoPackageStore.approvePackage("pkg_pacet_mindful_retreat");
      const secondRes = await sessionRepository.createSession({
        packageId: "pkg_pacet_mindful_retreat",
        startAt: slot_08_14_start,
        endAt: slot_08_14_end,
        capacity: 10,
        pricePerPerson: 350000,
        nowMs: baseNow,
      });
      expect(secondRes.success).toBe(true);
    });
  });

  describe("C. Status Semantics (OPEN, FULL, CLOSED, CANCELLED)", () => {
    it("7. existing CANCELLED session does NOT block new session at the same time", async () => {
      // 1. Create session 08-14
      const firstRes = await sessionRepository.createSession({
        packageId: "slow_green_day",
        startAt: slot_08_14_start,
        endAt: slot_08_14_end,
        capacity: 10,
        pricePerPerson: 300000,
        nowMs: baseNow,
      });
      expect(firstRes.success).toBe(true);
      const sid = firstRes.session!.sessionId;

      // 2. Cancel session
      const cancelRes = await sessionRepository.updateSessionStatus(
        sid,
        "CANCELLED",
        baseNow,
      );
      expect(cancelRes.success).toBe(true);

      // 3. New session at the exact same time (08-14) on the same destination -> PASS
      const secondRes = await sessionRepository.createSession({
        packageId: "slow_green_day",
        startAt: slot_08_14_start,
        endAt: slot_08_14_end,
        capacity: 10,
        pricePerPerson: 300000,
        nowMs: baseNow,
      });
      expect(secondRes.success).toBe(true);

      // 4. Attempting to reopen the cancelled session now fails because the slot was taken
      const reopenRes = await sessionRepository.updateSessionStatus(
        sid,
        "OPEN",
        baseNow,
      );
      expect(reopenRes.success).toBe(false);
      expect(reopenRes.message).toContain("sudah memiliki sesi terjadwal");
    });

    it("8. existing CLOSED session continues to block the destination schedule", async () => {
      // 1. Create session 08-14
      const firstRes = await sessionRepository.createSession({
        packageId: "slow_green_day",
        startAt: slot_08_14_start,
        endAt: slot_08_14_end,
        capacity: 10,
        pricePerPerson: 300000,
        nowMs: baseNow,
      });
      expect(firstRes.success).toBe(true);
      const sid = firstRes.session!.sessionId;

      // 2. Close session (sales closed, event not cancelled)
      const closeRes = await sessionRepository.updateSessionStatus(
        sid,
        "CLOSED",
        baseNow,
      );
      expect(closeRes.success).toBe(true);

      // 3. New session at same time 08-14 -> MUST BE REJECTED
      const secondRes = await sessionRepository.createSession({
        packageId: "slow_green_day",
        startAt: slot_08_14_start,
        endAt: slot_08_14_end,
        capacity: 10,
        pricePerPerson: 300000,
        nowMs: baseNow,
      });
      expect(secondRes.success).toBe(false);
      expect(secondRes.message).toContain("Destinasi sudah digunakan pada");
    });

    it("9. existing FULL session continues to block the destination schedule", async () => {
      // 1. Create session 08-14
      const firstRes = await sessionRepository.createSession({
        packageId: "slow_green_day",
        startAt: slot_08_14_start,
        endAt: slot_08_14_end,
        capacity: 10,
        pricePerPerson: 300000,
        nowMs: baseNow,
      });
      expect(firstRes.success).toBe(true);
      const sid = firstRes.session!.sessionId;

      // 2. Mark session FULL
      const fullRes = await sessionRepository.updateSessionStatus(
        sid,
        "FULL",
        baseNow,
      );
      expect(fullRes.success).toBe(true);

      // 3. New session at same time 08-14 -> MUST BE REJECTED
      const secondRes = await sessionRepository.createSession({
        packageId: "slow_green_day",
        startAt: slot_08_14_start,
        endAt: slot_08_14_end,
        capacity: 10,
        pricePerPerson: 300000,
        nowMs: baseNow,
      });
      expect(secondRes.success).toBe(false);
      expect(secondRes.message).toContain("Destinasi sudah digunakan pada");
    });
  });

  describe("D. Supabase Database Guard & Error Mapping", () => {
    beforeEach(() => {
      setDataModeOverride("supabase");
      setSupabaseConfigOverride({
        url: "https://yykgpvgwougibnhhxttw.supabase.co",
        publishableKey: "test-anon-key-12345",
      });
    });

    it("10 & 11. maps PostgreSQL trigger capacity check rejection into user-friendly error", async () => {
      const mockSupabase = {
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: {
              session: {
                user: { id: "eo_uid_123", email: "partner@jedaalam.id" },
              },
            },
          }),
        },
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "partner_profiles") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: "eo_jeda_alam",
                  role: "EO",
                  auth_user_id: "eo_uid_123",
                  email: "partner@jedaalam.id",
                },
              }),
            };
          }
          if (table === "packages") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: "slow_green_day",
                  eo_id: "eo_jeda_alam",
                  destination_id: "dest_lereng_hijau",
                  status: "LIVE",
                },
              }),
            };
          }
          if (table === "destinations") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: "dest_lereng_hijau",
                  name: "Lereng Hijau Batu",
                  capacity_per_session: 20,
                  status: "ACTIVE",
                },
              }),
            };
          }
          if (table === "sessions") {
            return {
              select: vi.fn().mockReturnThis(),
              in: vi.fn().mockReturnThis(),
              neq: vi.fn().mockReturnThis(),
              lt: vi.fn().mockReturnThis(),
              gt: vi.fn().mockReturnThis(),
              limit: vi.fn().mockResolvedValue({ data: [] }), // Preflight sees no conflict
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: {
                    message:
                      "Kapasitas sesi (25) melebihi batas maksimal destinasi Lereng Hijau Batu (20 orang).",
                    code: "23514",
                  },
                }),
              }),
            };
          }
          return {};
        }),
      };

      vi.spyOn(clientModule, "getSupabaseClient").mockReturnValue(
        mockSupabase as unknown as SupabaseClient,
      );

      const res = await sessionRepository.createSession({
        packageId: "slow_green_day",
        startAt: slot_08_14_start,
        endAt: slot_08_14_end,
        capacity: 25,
        pricePerPerson: 300000,
        nowMs: baseNow,
      });

      expect(res.success).toBe(false);
      expect(res.message).toBe(
        "Kapasitas sesi maksimal untuk Lereng Hijau Batu adalah 20 orang.",
      );
    });

    it("10 & 11. maps PostgreSQL trigger schedule conflict rejection into user-friendly error", async () => {
      const mockSupabase = {
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: {
              session: {
                user: { id: "eo_uid_123", email: "partner@jedaalam.id" },
              },
            },
          }),
        },
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "partner_profiles") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: "eo_jeda_alam",
                  role: "EO",
                  auth_user_id: "eo_uid_123",
                  email: "partner@jedaalam.id",
                },
              }),
            };
          }
          if (table === "packages") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: "slow_green_day",
                  eo_id: "eo_jeda_alam",
                  destination_id: "dest_lereng_hijau",
                  status: "LIVE",
                },
              }),
            };
          }
          if (table === "destinations") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: "dest_lereng_hijau",
                  name: "Lereng Hijau Batu",
                  capacity_per_session: 20,
                  status: "ACTIVE",
                },
              }),
            };
          }
          if (table === "sessions") {
            return {
              select: vi.fn().mockReturnThis(),
              in: vi.fn().mockReturnThis(),
              neq: vi.fn().mockReturnThis(),
              lt: vi.fn().mockReturnThis(),
              gt: vi.fn().mockReturnThis(),
              limit: vi.fn().mockResolvedValue({ data: [] }), // Simulating concurrent race where preflight saw no row
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: {
                    message:
                      "Destinasi Lereng Hijau Batu sudah memiliki sesi terjadwal pada kurun waktu 25 Okt 2026, 08.00 - 14.00 WIB (sesi ses_existing).",
                    code: "23P01",
                  },
                }),
              }),
            };
          }
          return {};
        }),
      };

      vi.spyOn(clientModule, "getSupabaseClient").mockReturnValue(
        mockSupabase as unknown as SupabaseClient,
      );

      const res = await sessionRepository.createSession({
        packageId: "slow_green_day",
        startAt: slot_08_14_start,
        endAt: slot_08_14_end,
        capacity: 10,
        pricePerPerson: 300000,
        nowMs: baseNow,
      });

      expect(res.success).toBe(false);
      expect(res.message).toBe(
        "Destinasi ini sudah memiliki sesi terjadwal pada waktu tersebut. Pilih waktu lain.",
      );
      // Ensures raw PostgreSQL exception syntax is not exposed to the user
      expect(res.message).not.toContain("23P01");
      expect(res.message).not.toContain("ERROR:");
    });
  });
});
