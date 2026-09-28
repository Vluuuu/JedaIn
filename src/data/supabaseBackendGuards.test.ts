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
import type { PackageRow } from "../lib/supabase/database.types";
import { destinationRepository } from "./destinationRepository";
import { packageRepository } from "./packageRepository";
import { sessionRepository } from "./sessionRepository";

describe("Supabase Backend Guards, Auth Enforcement & Authoritative Pricing", () => {
  beforeEach(() => {
    mockDestinationStore.reset();
    mockEoPackageStore.reset();
    partnerSessionStore.reset();
    setDataModeOverride("supabase");
    setSupabaseConfigOverride({
      url: "https://yykgpvgwougibnhhxttw.supabase.co",
      publishableKey: "test-anon-key-12345",
    });
  });

  afterEach(() => {
    mockDestinationStore.reset();
    mockEoPackageStore.reset();
    partnerSessionStore.reset();
    setDataModeOverride(null);
    setSupabaseConfigOverride(null);
    vi.restoreAllMocks();
  });

  describe("1. Backend auth required for Supabase writes (unauthenticated rejected)", () => {
    it("destination write fails clearly when unauthenticated", async () => {
      // Mock client that returns no active session
      const mockSupabase = {
        auth: {
          getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        },
      };
      vi.spyOn(clientModule, "getSupabaseClient").mockReturnValue(
        mockSupabase as unknown as SupabaseClient,
      );

      const res = await destinationRepository.updateDescription(
        "dest_lereng_hijau",
        "Deskripsi baru yang dicoba diubah tanpa login",
      );

      expect(res.success).toBe(false);
      expect(res.message).toContain("Sesi Supabase tidak terautentikasi");
      // Verify mock store was not mutated
      expect(
        mockDestinationStore.getById("dest_lereng_hijau")?.description,
      ).not.toContain("Deskripsi baru yang dicoba diubah tanpa login");
    });

    it("package saveDraft fails clearly when unauthenticated", async () => {
      const mockSupabase = {
        auth: {
          getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        },
      };
      vi.spyOn(clientModule, "getSupabaseClient").mockReturnValue(
        mockSupabase as unknown as SupabaseClient,
      );

      const res = await packageRepository.saveDraft({
        title: "Paket Tanpa Auth",
        destinationId: "dest_lereng_hijau",
      });

      expect(res.success).toBe(false);
      expect(res.message).toContain("Sesi Supabase tidak terautentikasi");
    });

    it("session creation fails clearly when unauthenticated", async () => {
      const mockSupabase = {
        auth: {
          getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        },
      };
      vi.spyOn(clientModule, "getSupabaseClient").mockReturnValue(
        mockSupabase as unknown as SupabaseClient,
      );

      const res = await sessionRepository.createSession({
        packageId: "slow_green_day",
        startAt: new Date(Date.now() + 86400000).toISOString(),
        endAt: new Date(Date.now() + 90000000).toISOString(),
        capacity: 10,
        pricePerPerson: 300000,
      });

      expect(res.success).toBe(false);
      expect(res.message).toContain("Sesi Supabase tidak terautentikasi");
    });
  });

  describe("2. Write failure does NOT silently fall back to mock in Supabase mode", () => {
    it("when Supabase update fails with database error, destinationRepository returns failure without mutating mock", async () => {
      const originalDescription =
        mockDestinationStore.getById("dest_lereng_hijau")?.description;

      const mockSupabase = {
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: {
              session: {
                user: { id: "dest_uid_123", email: "destinasi@lerenghijau.id" },
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
                  id: "dest_partner_lereng_hijau",
                  role: "DESTINATION",
                  auth_user_id: "dest_uid_123",
                  email: "destinasi@lerenghijau.id",
                },
              }),
            };
          }
          if (table === "destinations") {
            return {
              update: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              select: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: null,
                error: {
                  message: "new row violates row-level security policy",
                },
              }),
            };
          }
          return {};
        }),
      };
      vi.spyOn(clientModule, "getSupabaseClient").mockReturnValue(
        mockSupabase as unknown as SupabaseClient,
      );

      const res = await destinationRepository.updateDescription(
        "dest_lereng_hijau",
        "Deskripsi yang seharusnya gagal di Supabase",
      );

      expect(res.success).toBe(false);
      expect(res.message).toContain("row-level security policy");

      // Crucial assertion: mock store was NOT modified!
      expect(
        mockDestinationStore.getById("dest_lereng_hijau")?.description,
      ).toBe(originalDescription);
    });

    it("when Supabase package draft fails, packageRepository returns failure without mutating mock store", async () => {
      const initialCount = mockEoPackageStore.getAllPackages().length;

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
              maybeSingle: vi.fn().mockResolvedValue({ data: null }),
              upsert: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: "Permission denied for table packages" },
              }),
            };
          }
          return {};
        }),
      };
      vi.spyOn(clientModule, "getSupabaseClient").mockReturnValue(
        mockSupabase as unknown as SupabaseClient,
      );

      const res = await packageRepository.saveDraft({
        title: "Paket Yang Harus Gagal",
        destinationId: "dest_lereng_hijau",
      });

      expect(res.success).toBe(false);
      expect(res.message).toContain("Permission denied");
      expect(mockEoPackageStore.getAllPackages().length).toBe(initialCount);
    });
  });

  describe("3. Authoritative destination pricing in Supabase mode", () => {
    it("reads destination pricing from destinationRepository.getById rather than stale mock store", async () => {
      // Spy on destinationRepository.getById to return updated live Supabase destination
      const liveDestination = {
        ...mockDestinationStore.getById("dest_lereng_hijau")!,
        baseCostPerPerson: 180000,
        localGuideFeePerPerson: 60000,
      };
      vi.spyOn(destinationRepository, "getById").mockResolvedValue(
        liveDestination,
      );

      let capturedPackageRow: Partial<PackageRow> | null = null;

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
              maybeSingle: vi.fn().mockResolvedValue({ data: null }),
              upsert: vi.fn().mockImplementation((payload) => {
                capturedPackageRow = payload;
                return {
                  select: vi.fn().mockReturnThis(),
                  single: vi.fn().mockResolvedValue({
                    data: { ...payload, created_at: new Date().toISOString() },
                    error: null,
                  }),
                };
              }),
            };
          }
          return {};
        }),
      };
      vi.spyOn(clientModule, "getSupabaseClient").mockReturnValue(
        mockSupabase as unknown as SupabaseClient,
      );

      const draftRes = await packageRepository.saveDraft({
        title: "Paket dengan Harga Dinamis Destinasi",
        destinationId: "dest_lereng_hijau",
        guideSource: "DESTINATION",
        pricing: {
          destinationBaseCost: 0,
          localGuideFee: 0,
          eoMargin: 120000,
          customerPrice: 0,
        },
      });

      expect(destinationRepository.getById).toHaveBeenCalledWith(
        "dest_lereng_hijau",
      );
      expect(draftRes.success).toBe(true);

      const savedRow = capturedPackageRow as Partial<PackageRow> | null;
      // Total customer price should be baseCost (180000) + guideFee (60000) + margin (120000) = 360000
      expect(savedRow?.destination_base_cost).toBe(180000);
      expect(savedRow?.local_guide_fee).toBe(60000);
      expect(savedRow?.eo_margin).toBe(120000);
      expect(savedRow?.customer_price).toBe(360000);
    });
  });

  describe("4. Role & Ownership Guards", () => {
    it("destination write cannot execute if authenticated user is mapped to EO instead of DESTINATION", async () => {
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
                  role: "EO", // Not DESTINATION!
                  auth_user_id: "eo_uid_123",
                  email: "partner@jedaalam.id",
                },
              }),
            };
          }
          return {};
        }),
      };
      vi.spyOn(clientModule, "getSupabaseClient").mockReturnValue(
        mockSupabase as unknown as SupabaseClient,
      );

      const res = await destinationRepository.updateDescription(
        "dest_lereng_hijau",
        "Mencoba update dari akun EO",
      );

      expect(res.success).toBe(false);
      expect(res.message).toContain("tidak memiliki izin sebagai DESTINATION");
    });

    it("ACC Paket (Demo) cannot execute if authenticated user is mapped to DESTINATION instead of EO", async () => {
      const mockSupabase = {
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: {
              session: {
                user: { id: "dest_uid_123", email: "destinasi@lerenghijau.id" },
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
                  id: "dest_partner_lereng_hijau",
                  role: "DESTINATION", // Not EO!
                  auth_user_id: "dest_uid_123",
                  email: "destinasi@lerenghijau.id",
                },
              }),
            };
          }
          return {};
        }),
      };
      vi.spyOn(clientModule, "getSupabaseClient").mockReturnValue(
        mockSupabase as unknown as SupabaseClient,
      );

      const res = await packageRepository.approveOwnPackageForDemo(
        "pkg_pacet_mindful_retreat",
      );
      expect(res.success).toBe(false);
      expect(res.message).toContain("tidak memiliki izin sebagai EO");
    });
  });
});
