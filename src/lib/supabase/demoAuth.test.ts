import type { SupabaseClient } from "@supabase/supabase-js";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  it,
  vi,
} from "vitest";
import { partnerSessionStore } from "../../features/eo/partnerSessionStore";
import type { PartnerProfileRow } from "./database.types";
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
expectTypeOf<PartnerProfileRow>().toHaveProperty("display_name");
expectTypeOf<PartnerProfileRow>().not.toHaveProperty("name");

function profileRow(
  overrides: Partial<PartnerProfileRow> = {},
): PartnerProfileRow {
  return {
    id: DEMO_EO_CREDENTIALS.partnerId,
    auth_user_id: "eo_uid",
    role: "EO",
    display_name: "Budi Santoso",
    business_name: "Jeda Alam Nusantara",
    email: DEMO_EO_CREDENTIALS.email,
    guide_status: "CERTIFIED_GUIDE",
    organizer_review_ref: "org_lereng_batu",
    destination_identity_id: null,
    created_at: "2026-09-28T00:00:00.000Z",
    updated_at: "2026-09-28T00:00:00.000Z",
    ...overrides,
  };
}

function mockProfileClient(
  userId: string,
  email: string,
  lookupResults: Array<PartnerProfileRow | null>,
  updateError: string | null = null,
) {
  const maybeSingle = vi.fn().mockImplementation(async () => ({
    data: lookupResults.shift() ?? null,
    error: null,
  }));
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    is: vi.fn().mockResolvedValue({
      error: updateError ? { message: updateError } : null,
    }),
    maybeSingle,
  };
  const client = {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { user: { id: userId, email } } },
        error: null,
      }),
    },
    from: vi.fn().mockReturnValue(query),
  };
  vi.spyOn(clientModule, "getSupabaseClient").mockReturnValue(
    client as unknown as SupabaseClient,
  );
  return { query, client };
}

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

    it("maps display_name and the remaining profile fields into PartnerUser", async () => {
      mockProfileClient("eo_uid", DEMO_EO_CREDENTIALS.email, [profileRow()]);

      const result = await requireAuthenticatedUser("EO");
      expect(result.success).toBe(true);
      expect(result.partnerUser).toMatchObject({
        id: "eo_jeda_alam",
        name: "Budi Santoso",
        email: DEMO_EO_CREDENTIALS.email,
        businessName: "Jeda Alam Nusantara",
        guideStatus: "CERTIFIED_GUIDE",
        organizerReviewRef: "org_lereng_batu",
      });
    });

    it("checks the claim UPDATE error and rejects an unlinked profile", async () => {
      const { query } = mockProfileClient(
        "eo_uid",
        DEMO_EO_CREDENTIALS.email,
        [null, profileRow({ auth_user_id: null })],
        "RLS denied",
      );

      const result = await requireAuthenticatedUser("EO");
      expect(result.success).toBe(false);
      expect(result.error).toContain("RLS denied");
      expect(query.update).toHaveBeenCalledWith({ auth_user_id: "eo_uid" });
      expect(query.is).toHaveBeenCalledWith("auth_user_id", null);
    });

    it("re-fetches and verifies the profile after a successful claim", async () => {
      const { query } = mockProfileClient("eo_uid", DEMO_EO_CREDENTIALS.email, [
        null,
        profileRow({ auth_user_id: null }),
        profileRow(),
      ]);

      const result = await requireAuthenticatedUser("EO");
      expect(result.success).toBe(true);
      expect(result.partnerUser?.name).toBe("Budi Santoso");
      expect(query.maybeSingle).toHaveBeenCalledTimes(3);
    });

    it("rejects a claim when UPDATE reports success but no linked row is visible", async () => {
      mockProfileClient("eo_uid", DEMO_EO_CREDENTIALS.email, [
        null,
        profileRow({ auth_user_id: null }),
        null,
      ]);

      const result = await requireAuthenticatedUser("EO");
      expect(result.success).toBe(false);
      expect(result.error).toContain("belum terverifikasi");
    });

    it("fails EO demo login when authenticated but profile claim fails", async () => {
      mockProfileClient(
        "eo_uid",
        DEMO_EO_CREDENTIALS.email,
        [null, profileRow({ auth_user_id: null })],
        "RLS denied",
      );

      const result = await ensureDemoEoSession();
      expect(result.success).toBe(false);
      expect(result.error).toContain("RLS denied");
      expect(partnerSessionStore.get()).toBeNull();
    });

    it("fails destination demo login when no profile can be linked", async () => {
      mockProfileClient("dest_uid", DEMO_DESTINATION_CREDENTIALS.email, [
        null,
        null,
      ]);

      const result = await ensureDemoDestinationSession();
      expect(result.success).toBe(false);
      expect(result.error).toContain("belum ditautkan");
      expect(partnerSessionStore.get()).toBeNull();
    });

    it("successfully creates/restores Supabase session for demo EO", async () => {
      const mockSupabase = {
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: {
              session: {
                user: {
                  id: "supabase_eo_uuid_123",
                  email: DEMO_EO_CREDENTIALS.email,
                },
              },
            },
          }),
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
              display_name: "Budi Santoso",
              business_name: "Jeda Alam Nusantara",
              email: DEMO_EO_CREDENTIALS.email,
              guide_status: "CERTIFIED_GUIDE",
              organizer_review_ref: "org_lereng_batu",
              destination_identity_id: null,
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
          getSession: vi.fn().mockResolvedValue({
            data: {
              session: {
                user: {
                  id: "supabase_dest_uuid_456",
                  email: DEMO_DESTINATION_CREDENTIALS.email,
                },
              },
            },
          }),
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
              display_name: "Hadi Purnomo",
              business_name: "Pengelola Lereng Hijau Batu",
              email: DEMO_DESTINATION_CREDENTIALS.email,
              guide_status: null,
              organizer_review_ref: null,
              destination_identity_id: "dest_lereng_hijau",
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
