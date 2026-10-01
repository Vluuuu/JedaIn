// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { mockDestinationVerificationStore } from "../features/admin/mockDestinationVerificationStore";
import { mockApplicationStore } from "../features/eo/mockApplicationStore";
import { mockDestinationStore } from "../features/eo/mockDestinationStore";
import { partnerSessionStore } from "../features/eo/partnerSessionStore";
import { partnerAccountCredentialsStore } from "../features/eo/partnerAccountCredentialsStore";
import type {
  PartnerApplicationRow,
  PartnerRegistrationInput,
} from "../features/eo/partnerRegistrationTypes";
import * as clientModule from "../lib/supabase/client";
import { setDataModeOverride } from "../lib/supabase/config";
import * as authModule from "../lib/supabase/demoAuth";
import {
  partnerRegistrationRepository,
  validatePartnerRegistration,
} from "./partnerRegistrationRepository";

const eo: PartnerRegistrationInput = {
  role: "EO",
  details: {
    businessName: "Travel Baru",
    contactPerson: "Dina",
    email: "dina@gmail.com",
    phone: "081234567890",
    city: "Batu",
    province: "Jawa Timur",
    experienceDescription: "Perjalanan alam bersama warga",
    yearsOfOperation: 2,
    guideStatus: "CONCEPT_ONLY",
    agreedToSop: true,
  },
};
const dest: PartnerRegistrationInput = {
  role: "DESTINATION",
  guidePhoto: new File(["portrait"], "guide.png", { type: "image/png" }),
  details: {
    name: "Kebun Baru",
    managementName: "Pengelola Kebun",
    contactPerson: "Dina",
    email: "dina@gmail.com",
    phone: "081234567890",
    city: "Batu",
    province: "Jawa Timur",
    locationLabel: "Batu",
    description: "Kawasan alam terkelola bersama warga",
    highlights: ["Kebun"],
    capacityPerSession: 10,
    baseCostPerPerson: 100000,
    guideReady: true,
    guideReadinessEvidence: "Pemandu tersedia setiap kunjungan",
    agreedToSop: true,
    guideIdentity: {
      fullName: "Pemandu Satu",
      phone: "081234567891",
      domicile: "Batu",
      experience: "Memimpin rute kebun 3 tahun",
      photoPreview: "data:image/png;base64,cHJldmlldw==",
    },
  },
};

afterEach(() => {
  vi.restoreAllMocks();
  setDataModeOverride(null);
  mockApplicationStore.reset();
  mockDestinationVerificationStore.reset();
  mockDestinationStore.reset();
  partnerSessionStore.reset();
});

function backend(input: PartnerRegistrationInput) {
  setDataModeOverride("supabase");
  let saved: PartnerApplicationRow | null = null;
  let session: { user: { id: string; email: string } } | null = null;
  const user = { id: "auth_new_partner", email: input.details.email };
  const storage = {
    upload: vi.fn().mockResolvedValue({ error: null }),
    remove: vi.fn().mockResolvedValue({ error: null }),
    createSignedUrl: vi.fn().mockResolvedValue({
      data: { signedUrl: "https://example.com/private-photo" },
      error: null,
    }),
  };
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(async () => ({ data: saved, error: null })),
  };
  const rpc = vi.fn(
    async (
      name: string,
      args?: { p_payload: PartnerApplicationRow["payload"] },
    ) => {
      if (name === "register_partner_application")
        saved = {
          id: "application_new",
          partner_id: "partner_new",
          auth_user_id: user.id,
          role: input.role,
          email: user.email,
          status: "PENDING_REVIEW",
          payload: args!.p_payload,
          destination_id: input.role === "DESTINATION" ? "dest_new" : null,
          submitted_at: "2026-10-01T10:00:00Z",
          reviewed_at: null,
          rejection_reason: null,
          approval_mode: null,
          email_notification: "NOT_SENT",
          account_email: null,
          account_issued_at: null,
        };
      else if (saved)
        saved = {
          ...saved,
          status: "APPROVED",
          approval_mode: "DEMO",
          email_notification: "SIMULATED",
        };
      return { data: saved, error: null };
    },
  );
  const client = {
    auth: {
      getSession: vi.fn(async () => ({ data: { session }, error: null })),
      signOut: vi.fn(async () => {
        session = null;
        return { error: null };
      }),
      signUp: vi.fn(
        async (credentials: { email: string; password: string }) => {
          user.email = credentials.email;
          session = { user };
          return { data: { user, session }, error: null };
        },
      ),
      signInWithPassword: vi.fn(),
      setSession: vi.fn(async () => {
        if (saved?.account_email) user.email = saved.account_email;
        session = { user };
        return { data: { session, user }, error: null };
      }),
    },
    from: vi.fn(() => query),
    rpc,
    storage: { from: vi.fn(() => storage) },
    functions: {
      invoke: vi.fn(async () => {
        if (saved)
          saved = {
            ...saved,
            status: "APPROVED",
            approval_mode: "DEMO",
            email_notification: "SIMULATED",
            account_email: "new@jedain.biz.id",
            account_issued_at: "2026-10-01T10:01:00Z",
          };
        return {
          data: {
            accountEmail: "new@jedain.biz.id",
            password: "Jd!8ServerIssuedPassword2026",
            authUserId: user.id,
            session: {
              access_token: "new_access",
              refresh_token: "new_refresh",
            },
          },
          error: null,
        };
      }),
    },
  };
  vi.spyOn(clientModule, "getSupabaseClient").mockReturnValue(
    client as unknown as ReturnType<typeof clientModule.getSupabaseClient>,
  );
  vi.spyOn(authModule, "requireAuthenticatedUser").mockResolvedValue({
    success: true,
    partnerUser: {
      id: "partner_new",
      email: user.email,
      name: "Dina",
      businessName: "Travel Baru",
      role: input.role,
    },
  });
  return { client, storage, query, rpc };
}

describe("Supabase partner registration", () => {
  it("creates a pending application, verifies the profile link, and keeps the password out of application data", async () => {
    const { client, rpc } = backend(eo);
    expect(await partnerRegistrationRepository.submit(eo)).toEqual({
      success: true,
    });
    const bootstrap = client.auth.signUp.mock.calls[0][0];
    expect(bootstrap.email).toBe("dina@gmail.com");
    expect(bootstrap.password.length).toBeGreaterThanOrEqual(24);
    expect(JSON.stringify(rpc.mock.calls)).not.toContain(bootstrap.password);
    expect(
      mockApplicationStore.getBySellerId("partner_new")?.accountEmail,
    ).toBeUndefined();
    expect(partnerSessionStore.get()?.id).toBe("partner_new");
    expect(mockApplicationStore.getBySellerId("partner_new")?.status).toBe(
      "PENDING_REVIEW",
    );
  });
  it.each([undefined, "", "081234567891"])(
    "blocks destination self-registration before authentication or portrait upload (phone %s)",
    async (phone) => {
      const input = {
        ...dest,
        details: {
          ...dest.details,
          guideIdentity: { ...dest.details.guideIdentity, phone },
        },
      };
      const { client, storage, rpc } = backend(input);
      const result = await partnerRegistrationRepository.submit(input);
      expect(result.success).toBe(false);
      expect(result.message).toContain("tim/Admin JedaIn");
      expect(client.auth.signUp).not.toHaveBeenCalled();
      expect(storage.upload).not.toHaveBeenCalled();
      expect(rpc).not.toHaveBeenCalled();
    },
  );
  it.each(["fullName", "domicile", "experience"] as const)(
    "rejects a missing guide %s before authentication writes even when phone is supplied",
    async (field) => {
      const input = {
        ...dest,
        details: {
          ...dest.details,
          guideIdentity: { ...dest.details.guideIdentity, [field]: " " },
        },
      };
      const { client, rpc } = backend(input);
      expect((await partnerRegistrationRepository.submit(input)).success).toBe(
        false,
      );
      expect(client.auth.signUp).not.toHaveBeenCalled();
      expect(rpc).not.toHaveBeenCalled();
    },
  );
  it("requires a photo even when the other required guide fields are complete", () => {
    expect(
      validatePartnerRegistration({
        ...dest,
        guidePhoto: undefined,
        details: {
          ...dest.details,
          guideIdentity: {
            ...dest.details.guideIdentity,
            photoPreview: undefined,
          },
        },
      }),
    ).toContain("Unggah foto");
  });
  it("keeps a failed upload out of the application store and does not call the save RPC", async () => {
    const { storage, rpc } = backend(dest);
    storage.upload.mockResolvedValueOnce({ error: new Error("upload failed") });
    expect((await partnerRegistrationRepository.submit(dest)).success).toBe(
      false,
    );
    expect(rpc).not.toHaveBeenCalled();
    expect(
      mockDestinationVerificationStore.getByPartnerId("partner_new"),
    ).toBeUndefined();
  });
  it("does not create an unattached portrait when destination registration is disabled", async () => {
    const { storage, rpc } = backend(dest);
    expect((await partnerRegistrationRepository.submit(dest)).success).toBe(
      false,
    );
    expect(storage.upload).not.toHaveBeenCalled();
    expect(storage.remove).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });
  it("does not report registration success when re-fetching the linked application fails", async () => {
    const { query } = backend(eo);
    query.maybeSingle
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({
        data: null,
        error: new Error("read failed"),
      } as never);
    expect((await partnerRegistrationRepository.submit(eo)).success).toBe(
      false,
    );
    expect(mockApplicationStore.getBySellerId("partner_new")).toBeUndefined();
  });
  it("does not self-approve a pending destination or invoke account issuance", async () => {
    const { client } = backend(dest);
    partnerSessionStore.setPartner({
      id: "partner_new",
      role: "DESTINATION",
      email: "dina@gmail.com",
      name: "Dina",
      businessName: "Kebun Baru",
    });
    await expect(partnerRegistrationRepository.approveDemo()).rejects.toThrow(
      "tim/Admin",
    );
    expect(client.functions.invoke).not.toHaveBeenCalled();
    expect(mockDestinationStore.getById("dest_new")).toBeUndefined();
  });
  it("restores the registered applicant after local stores and identity are lost", async () => {
    backend(eo);
    await partnerRegistrationRepository.submit(eo);
    mockApplicationStore.reset();
    partnerSessionStore.reset();
    await partnerRegistrationRepository.restoreSession();
    expect(partnerSessionStore.get()?.id).toBe("partner_new");
    expect(mockApplicationStore.getBySellerId("partner_new")?.status).toBe(
      "PENDING_REVIEW",
    );
  });
  it("does not expose issued credentials if the new session belongs to another account", async () => {
    const { client } = backend(eo);
    await partnerRegistrationRepository.submit(eo);
    client.auth.setSession.mockResolvedValueOnce({
      data: {
        session: { user: { id: "other_user", email: "other@jedain.biz.id" } },
        user: { id: "other_user", email: "other@jedain.biz.id" },
      },
      error: null,
    });
    await expect(partnerRegistrationRepository.approveDemo()).rejects.toThrow(
      "Sesi akun baru",
    );
    expect(partnerAccountCredentialsStore.get()).toBeUndefined();
  });
  it("requires a named accountable guide and validates the photo before any authentication write", () => {
    const missing = {
      ...dest,
      guidePhoto: undefined,
      details: {
        ...dest.details,
        guideIdentity: {
          fullName: "",
          phone: "",
          domicile: "",
          experience: "",
        },
      },
    };
    expect(validatePartnerRegistration(missing)).toContain("Lengkapi nama");
    const invalid = {
      ...dest,
      guidePhoto: new File(["bad"], "bad.svg", { type: "image/svg+xml" }),
    };
    expect(validatePartnerRegistration(invalid)).toContain("JPG");
  });
});
