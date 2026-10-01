// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { mockDestinationVerificationStore } from "../features/admin/mockDestinationVerificationStore";
import { mockApplicationStore } from "../features/eo/mockApplicationStore";
import { mockDestinationStore } from "../features/eo/mockDestinationStore";
import { partnerSessionStore } from "../features/eo/partnerSessionStore";
import type {
  PartnerApplicationRow,
  PartnerRegistrationInput,
} from "../features/eo/partnerRegistrationTypes";
import * as clientModule from "../lib/supabase/client";
import { setDataModeOverride } from "../lib/supabase/config";
import * as authModule from "../lib/supabase/demoAuth";
import { destinationRepository } from "./destinationRepository";
import {
  partnerRegistrationRepository,
  validatePartnerRegistration,
  GUIDE_PHOTO_BUCKET,
} from "./partnerRegistrationRepository";

const eo: PartnerRegistrationInput = {
  role: "EO",
  password: "AkunMitra2026!",
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
  password: "AkunMitra2026!",
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
      signUp: vi.fn(async () => {
        session = { user };
        return { data: { user, session }, error: null };
      }),
      signInWithPassword: vi.fn(),
    },
    from: vi.fn(() => query),
    rpc,
    storage: { from: vi.fn(() => storage) },
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
    expect(client.auth.signUp).toHaveBeenCalledWith({
      email: "dina@gmail.com",
      password: eo.password,
    });
    expect(JSON.stringify(rpc.mock.calls)).not.toContain(eo.password);
    expect(partnerSessionStore.get()?.id).toBe("partner_new");
    expect(mockApplicationStore.getBySellerId("partner_new")?.status).toBe(
      "PENDING_REVIEW",
    );
  });
  it("persists the actual guide file in private storage and saves its path rather than the preview", async () => {
    const { client, storage, rpc } = backend(dest);
    expect((await partnerRegistrationRepository.submit(dest)).success).toBe(
      true,
    );
    expect(client.storage.from).toHaveBeenCalledWith(GUIDE_PHOTO_BUCKET);
    expect(storage.upload).toHaveBeenCalledOnce();
    expect(JSON.stringify(rpc.mock.calls)).not.toContain("photoPreview");
    expect(
      mockDestinationVerificationStore.getByPartnerId("partner_new")
        ?.guideIdentity?.fullName,
    ).toBe("Pemandu Satu");
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
  it("cleans up an unattached portrait if application persistence fails", async () => {
    const { storage, rpc } = backend(dest);
    rpc.mockResolvedValueOnce({
      data: null,
      error: new Error("save failed"),
    } as never);
    expect((await partnerRegistrationRepository.submit(dest)).success).toBe(
      false,
    );
    expect(storage.remove).toHaveBeenCalledOnce();
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
  it("keeps approval failures pending and verifies the persisted approval before unlocking the destination", async () => {
    const { rpc } = backend(dest);
    await partnerRegistrationRepository.submit(dest);
    rpc.mockResolvedValueOnce({
      data: null,
      error: new Error("approval failed"),
    } as never);
    await expect(partnerRegistrationRepository.approveDemo()).rejects.toThrow(
      "approval failed",
    );
    expect(
      mockDestinationVerificationStore.getByPartnerId("partner_new")?.status,
    ).toBe("PENDING_REVIEW");
    const canonical = {
      ...mockDestinationStore.getAll()[0],
      destinationId: "dest_new",
    };
    vi.spyOn(destinationRepository, "getById").mockResolvedValue(canonical);
    await partnerRegistrationRepository.approveDemo();
    expect(partnerSessionStore.get()?.id).toBe("partner_new");
    expect(
      mockDestinationVerificationStore.getByPartnerId("partner_new")
        ?.demoEmailRecipient,
    ).toBe("dina@gmail.com");
    expect(mockDestinationStore.getById("dest_new")).toBeDefined();
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
