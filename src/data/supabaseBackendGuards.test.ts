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
          if (table === "destinations") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: "dest_lereng_hijau",
                  name: "Lereng Hijau Batu",
                  location_label: "Batu / Malang Raya",
                  province: "Jawa Timur",
                  city: "Batu",
                  verification_level: "BASIC",
                  guide_ready: true,
                  base_cost_per_person: 125000,
                  local_guide_fee_per_person: 25000,
                  status: "ACTIVE",
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
    it("reads destination pricing from destinationRepository.getAuthoritativeById rather than stale mock store", async () => {
      // Spy on destinationRepository.getAuthoritativeById to return updated live Supabase destination
      const liveDestination = {
        ...mockDestinationStore.getById("dest_lereng_hijau")!,
        baseCostPerPerson: 180000,
        localGuideFeePerPerson: 60000,
      };
      vi.spyOn(destinationRepository, "getAuthoritativeById").mockResolvedValue(
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

      expect(destinationRepository.getAuthoritativeById).toHaveBeenCalledWith(
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

    it("fails saveDraft and prevents packages.upsert when draft has destinationId but live destination read fails", async () => {
      vi.spyOn(destinationRepository, "getAuthoritativeById").mockResolvedValue(
        undefined,
      );

      const upsertSpy = vi.fn();

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
              upsert: upsertSpy,
            };
          }
          return {};
        }),
      };
      vi.spyOn(clientModule, "getSupabaseClient").mockReturnValue(
        mockSupabase as unknown as SupabaseClient,
      );

      const draftRes = await packageRepository.saveDraft({
        title: "Paket Draft Tujuan Gagal Baca",
        destinationId: "dest_lereng_hijau",
      });

      expect(destinationRepository.getAuthoritativeById).toHaveBeenCalledWith(
        "dest_lereng_hijau",
      );
      expect(draftRes.success).toBe(false);
      expect(draftRes.message).toContain(
        "Data resmi destinasi live tidak dapat dibaca dari server.",
      );
      expect(upsertSpy).not.toHaveBeenCalled();
    });

    it("validates submitForReview using live destinationRepository destination rather than stale mock store", async () => {
      const liveDestination = {
        ...mockDestinationStore.getById("dest_lereng_hijau")!,
        baseCostPerPerson: 125000,
        localGuideFeePerPerson: 100000,
      };
      vi.spyOn(destinationRepository, "getAuthoritativeById").mockResolvedValue(
        liveDestination,
      );

      const validPackageRow: PackageRow = {
        id: "pkg_test_submit_live",
        eo_id: "eo_jeda_alam",
        eo_display_name: "Jeda Alam Nusantara",
        title: "Paket Live Destination Submit",
        short_summary: "Ringkasan paket bernilai mindful untuk traveler.",
        value_proposition: "Pengalaman santai di alam.",
        destination_id: "dest_lereng_hijau",
        image_url: null,
        image_urls: null,
        insight_id: null,
        duration_label: "1 hari",
        suitable_group_types: ["SOLO"],
        highlights: ["Highlight 1"],
        itinerary: [
          { order: 1, title: "Sesi Pagi", description: "Jalan santai" },
        ],
        included_items: ["Transportasi PP"],
        excluded_items: [],
        safety_notes: ["Catatan keselamatan."],
        meeting_point_label: "Stasiun Malang",
        departure_time_label: "07.00 WIB",
        outbound_transport: "Minibus",
        return_transport: "Minibus",
        access_notes: null,
        destination_base_cost: 125000,
        local_guide_fee: 100000,
        eo_margin: 150000,
        customer_price: 375000,
        guide_status: "CERTIFIED_GUIDE",
        guide_source: "DESTINATION",
        status: "DRAFT",
        validation_result: null,
        submitted_at: null,
        reviewed_at: null,
        rejection_reason: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      let updatedRow: Record<string, unknown> | null = null;

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
                data: validPackageRow,
              }),
              update: vi.fn().mockImplementation((payload) => {
                updatedRow = payload;
                return {
                  eq: vi.fn().mockReturnThis(),
                  select: vi.fn().mockReturnThis(),
                  single: vi.fn().mockResolvedValue({
                    data: { ...validPackageRow, ...payload },
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

      const submitRes = await packageRepository.submitForReview(
        "pkg_test_submit_live",
      );

      expect(destinationRepository.getAuthoritativeById).toHaveBeenCalledWith(
        "dest_lereng_hijau",
      );
      expect(submitRes.success).toBe(true);
      expect(submitRes.validationResult.valid).toBe(true);
      expect(updatedRow).toMatchObject({ status: "PENDING_ADMIN_REVIEW" });
    });

    it("fails submitForReview with clear error when live destination read fails", async () => {
      vi.spyOn(destinationRepository, "getAuthoritativeById").mockResolvedValue(
        undefined,
      );

      const validPackageRow: PackageRow = {
        id: "pkg_test_fail_live_read",
        eo_id: "eo_jeda_alam",
        eo_display_name: "Jeda Alam Nusantara",
        title: "Paket Live Read Fail",
        short_summary: "Ringkasan paket bernilai mindful untuk traveler.",
        value_proposition: "Pengalaman santai di alam.",
        destination_id: "dest_lereng_hijau",
        image_url: null,
        image_urls: null,
        insight_id: null,
        duration_label: "1 hari",
        suitable_group_types: ["SOLO"],
        highlights: ["Highlight 1"],
        itinerary: [
          { order: 1, title: "Sesi Pagi", description: "Jalan santai" },
        ],
        included_items: ["Transportasi PP"],
        excluded_items: [],
        safety_notes: ["Catatan keselamatan."],
        meeting_point_label: "Stasiun Malang",
        departure_time_label: "07.00 WIB",
        outbound_transport: "Minibus",
        return_transport: "Minibus",
        access_notes: null,
        destination_base_cost: 125000,
        local_guide_fee: 100000,
        eo_margin: 150000,
        customer_price: 375000,
        guide_status: "CERTIFIED_GUIDE",
        guide_source: "DESTINATION",
        status: "DRAFT",
        validation_result: null,
        submitted_at: null,
        reviewed_at: null,
        rejection_reason: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

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
                data: validPackageRow,
              }),
            };
          }
          return {};
        }),
      };
      vi.spyOn(clientModule, "getSupabaseClient").mockReturnValue(
        mockSupabase as unknown as SupabaseClient,
      );

      const submitRes = await packageRepository.submitForReview(
        "pkg_test_fail_live_read",
      );

      expect(submitRes.success).toBe(false);
      expect(submitRes.validationResult.valid).toBe(false);
      expect(
        submitRes.validationResult.errors.some(
          (e) => e.field === "destinationId",
        ),
      ).toBe(true);
      expect(submitRes.validationResult.errors[0].message).toContain(
        "Data resmi destinasi live tidak dapat dibaca dari server.",
      );
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
