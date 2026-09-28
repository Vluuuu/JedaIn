import type { SupabaseClient } from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { partnerSessionStore } from "../../features/eo/partnerSessionStore";
import * as clientModule from "./client";
import { setDataModeOverride, setSupabaseConfigOverride } from "./config";
import {
  DEMO_DESTINATION_CREDENTIALS,
  DEMO_EO_CREDENTIALS,
  ensureDemoDestinationSession,
  ensureDemoEoSession,
  getBackendAuthStatus,
  requireAuthenticatedUser,
} from "./demoAuth";

describe("demoAuth - Prototype Demo Authentication Bridge", () => {
  beforeEach(() => {
    partnerSessionStore.reset();
    setDataModeOverride(null);
    setSupabaseConfigOverride(null);
  });

  afterEach(() => {
    partnerSessionStore.reset();
    setDataModeOverride(null);
    setSupabaseConfigOverride(null);
    vi.restoreAllMocks();
  });

  describe("Mock Mode (Default)", () => {
    it("ensureDemoEoSession sets EO demo session in partnerSessionStore", async () => {
      setDataModeOverride("mock");
      const res = await ensureDemoEoSession();

      expect(res.success).toBe(true);
      expect(res.mode).toBe("mock");
      expect(res.partnerId).toBe("eo_jeda_alam");

      const current = partnerSessionStore.get();
      expect(current?.role).toBe("EO");
      expect(current?.id).toBe("eo_jeda_alam");
    });

    it("ensureDemoDestinationSession sets Destination demo session in partnerSessionStore", async () => {
      setDataModeOverride("mock");
      const res = await ensureDemoDestinationSession();

      expect(res.success).toBe(true);
      expect(res.mode).toBe("mock");
      expect(res.partnerId).toBe("dest_partner_lereng_hijau");

      const current = partnerSessionStore.get();
      expect(current?.role).toBe("DESTINATION");
      expect(current?.id).toBe("dest_partner_lereng_hijau");
    });

    it("requireAuthenticatedUser succeeds with current partner role", async () => {
      setDataModeOverride("mock");
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

      const checkEo = await requireAuthenticatedUser("EO");
      expect(checkEo.success).toBe(true);

      const checkDest = await requireAuthenticatedUser("DESTINATION");
      expect(checkDest.success).toBe(false);
      expect(checkDest.error).toContain(
        "Hanya DESTINATION yang dapat melakukan aksi ini",
      );
    });
  });

  describe("Supabase Mode", () => {
    beforeEach(() => {
      setDataModeOverride("supabase");
      setSupabaseConfigOverride({
        url: "https://yykgpvgwougibnhhxttw.supabase.co",
        publishableKey: "test-anon-key",
      });
    });

    it("fails gracefully if Supabase client is not available", async () => {
      vi.spyOn(clientModule, "getSupabaseClient").mockReturnValue(null);

      const res = await ensureDemoEoSession();
      expect(res.success).toBe(false);
      expect(res.error).toContain("Klien Supabase tidak tersedia");
    });

    it("successfully creates/restores Supabase session for demo EO", async () => {
      const mockSupabase = {
        auth: {
          getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
          signOut: vi.fn().mockResolvedValue({}),
          signInWithPassword: vi.fn().mockResolvedValue({
            data: {
              user: {
                id: "supabase_eo_uuid_123",
                email: DEMO_EO_CREDENTIALS.email,
              },
              session: { access_token: "token" },
            },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              id: "eo_jeda_alam",
              auth_user_id: "supabase_eo_uuid_123",
              role: "EO",
            },
          }),
        }),
      };
      vi.spyOn(clientModule, "getSupabaseClient").mockReturnValue(
        mockSupabase as unknown as SupabaseClient,
      );

      const res = await ensureDemoEoSession();
      expect(res.success).toBe(true);
      expect(res.mode).toBe("supabase");
      expect(res.user?.id).toBe("supabase_eo_uuid_123");
      expect(res.partnerId).toBe("eo_jeda_alam");
      expect(res.isLinked).toBe(true);

      // Verify partnerSessionStore updated
      expect(partnerSessionStore.get()?.id).toBe("eo_jeda_alam");
    });

    it("successfully creates/restores Supabase session for demo Destination", async () => {
      const mockSupabase = {
        auth: {
          getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
          signOut: vi.fn().mockResolvedValue({}),
          signInWithPassword: vi.fn().mockResolvedValue({
            data: {
              user: {
                id: "supabase_dest_uuid_456",
                email: DEMO_DESTINATION_CREDENTIALS.email,
              },
              session: { access_token: "token" },
            },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              id: "dest_partner_lereng_hijau",
              auth_user_id: "supabase_dest_uuid_456",
              role: "DESTINATION",
            },
          }),
        }),
      };
      vi.spyOn(clientModule, "getSupabaseClient").mockReturnValue(
        mockSupabase as unknown as SupabaseClient,
      );

      const res = await ensureDemoDestinationSession();
      expect(res.success).toBe(true);
      expect(res.mode).toBe("supabase");
      expect(res.user?.id).toBe("supabase_dest_uuid_456");
      expect(res.partnerId).toBe("dest_partner_lereng_hijau");

      expect(partnerSessionStore.get()?.id).toBe("dest_partner_lereng_hijau");
    });

    it("getBackendAuthStatus accurately reports live Supabase session and mapping", async () => {
      const mockSupabase = {
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: {
              session: {
                user: { id: "uuid_test", email: "partner@jedaalam.id" },
              },
            },
          }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              id: "eo_jeda_alam",
              auth_user_id: "uuid_test",
              role: "EO",
              email: "partner@jedaalam.id",
            },
          }),
        }),
      };
      vi.spyOn(clientModule, "getSupabaseClient").mockReturnValue(
        mockSupabase as unknown as SupabaseClient,
      );

      const status = await getBackendAuthStatus();
      expect(status.mode).toBe("supabase");
      expect(status.isAuthenticated).toBe(true);
      expect(status.userId).toBe("uuid_test");
      expect(status.role).toBe("EO");
      expect(status.partnerId).toBe("eo_jeda_alam");
      expect(status.isLinked).toBe(true);
    });
  });
});
