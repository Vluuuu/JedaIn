import type { SupabaseClient } from "@supabase/supabase-js";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { mockDestinationStore } from "../features/eo/mockDestinationStore";
import {
  mockEoPackageStore,
  SEEDED_LIVE_PACKAGE,
} from "../features/eo/mockEoPackageStore";
import * as clientModule from "../lib/supabase/client";
import {
  setDataModeOverride,
  setSupabaseConfigOverride,
} from "../lib/supabase/config";
import type { PackageRow } from "../lib/supabase/database.types";
import * as authModule from "../lib/supabase/demoAuth";
import { destinationRepository } from "./destinationRepository";
import { packageRepository } from "./packageRepository";
import { sessionRepository } from "./sessionRepository";

beforeEach(() => {
  mockDestinationStore.reset();
  mockEoPackageStore.reset();
  setDataModeOverride("supabase");
  setSupabaseConfigOverride({
    url: "https://example.supabase.co",
    publishableKey: "test-key",
  });
  vi.spyOn(authModule, "requireAuthenticatedUser").mockResolvedValue({
    success: true,
    partnerUser: {
      id: "eo_jeda_alam",
      role: "EO",
      name: "TO",
      email: "to@example.test",
      businessName: "TO",
      guideStatus: "CERTIFIED_GUIDE",
    },
  });
  vi.spyOn(destinationRepository, "getAuthoritativeById").mockResolvedValue(
    mockDestinationStore.getById("dest_lereng_hijau"),
  );
});
afterEach(() => {
  vi.restoreAllMocks();
  setDataModeOverride(null);
  setSupabaseConfigOverride(null);
  mockEoPackageStore.reset();
  mockDestinationStore.reset();
});

it("distinguishes an unavailable owned catalog from a successfully empty catalog", async () => {
  const order = vi.fn().mockResolvedValue({
    data: null,
    error: { message: "Catalog unavailable" },
  });
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order,
  };
  vi.spyOn(clientModule, "getSupabaseClient").mockReturnValue({
    from: () => chain,
  } as unknown as SupabaseClient);
  await expect(
    packageRepository.getPackagesByEo("eo_jeda_alam", { throwOnError: true }),
  ).rejects.toThrow("Daftar paket belum dapat dimuat.");
  await expect(
    sessionRepository.getSessionsByEo("eo_jeda_alam", { throwOnError: true }),
  ).rejects.toThrow("Jadwal paket belum dapat dimuat.");
  order.mockResolvedValue({ data: [], error: null });
  await expect(
    packageRepository.getPackagesByEo("eo_jeda_alam", { throwOnError: true }),
  ).resolves.toEqual([]);
  await expect(
    sessionRepository.getSessionsByEo("eo_jeda_alam", { throwOnError: true }),
  ).resolves.toEqual([]);
});

it("propagates transport failures for owned booking catalogs when strict reads are requested", async () => {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockRejectedValue(new Error("Network unavailable")),
  };
  vi.spyOn(clientModule, "getSupabaseClient").mockReturnValue({
    from: () => chain,
  } as unknown as SupabaseClient);
  await expect(
    packageRepository.getPackagesByEo("eo_jeda_alam", { throwOnError: true }),
  ).rejects.toThrow("Network unavailable");
  await expect(
    sessionRepository.getSessionsByEo("eo_jeda_alam", { throwOnError: true }),
  ).rejects.toThrow("Network unavailable");
});

it("persists multiple departures through authenticated Supabase save, reload and review submission", async () => {
  let serverRow: PackageRow | undefined;
  const upsert = vi.fn((row: PackageRow) => {
    serverRow = structuredClone(row);
    return chain;
  });
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    upsert,
    update: vi.fn((patch: Partial<PackageRow>) => {
      serverRow = { ...serverRow!, ...patch };
      return chain;
    }),
    single: vi.fn(async () => ({
      data: structuredClone(serverRow),
      error: null,
    })),
    maybeSingle: vi.fn(async () => ({
      data: structuredClone(serverRow),
      error: null,
    })),
  };
  vi.spyOn(clientModule, "getSupabaseClient").mockReturnValue({
    from: () => chain,
  } as unknown as SupabaseClient);
  const options = [
    {
      id: "malang",
      areaLabel: "Malang",
      meetingPointLabel: "Alun-Alun",
      departureTimeLabel: "07.00 WIB",
      pricePerPerson: 249000,
    },
    {
      id: "surabaya",
      areaLabel: "Surabaya",
      meetingPointLabel: "Gubeng",
      departureTimeLabel: "05.00 WIB",
      pricePerPerson: 451400,
    },
  ];
  const saved = await packageRepository.saveDraft({
    ...SEEDED_LIVE_PACKAGE,
    packageId: undefined,
    departureOptions: options,
  });
  expect(saved.success).toBe(true);
  expect(serverRow).toMatchObject({
    departure_options: options,
    customer_price: 249000,
    eo_id: "eo_jeda_alam",
    status: "DRAFT",
  });
  mockEoPackageStore.reset();
  const reloaded = await packageRepository.getPackageForEo(
    saved.package!.packageId,
    "eo_jeda_alam",
  );
  expect(reloaded?.departureOptions).toEqual(options);
  const again = await packageRepository.saveDraft({
    ...reloaded,
    title: "Reloaded draft",
  });
  expect(again.package?.departureOptions?.map((o) => o.id)).toEqual([
    "malang",
    "surabaya",
  ]);
  expect(upsert).toHaveBeenCalledTimes(2);
  expect(
    (await packageRepository.submitForReview(saved.package!.packageId)).success,
  ).toBe(true);
  expect(serverRow?.status).toBe("PENDING_ADMIN_REVIEW");
});

it("does not report a saved departure or mutate the mock cache when a Supabase write fails", async () => {
  const chain = {
    upsert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: null,
      error: { message: "RLS write rejected" },
    }),
  };
  vi.spyOn(clientModule, "getSupabaseClient").mockReturnValue({
    from: () => chain,
  } as unknown as SupabaseClient);
  const before = mockEoPackageStore.getAllPackages();
  const result = await packageRepository.saveDraft({
    ...SEEDED_LIVE_PACKAGE,
    packageId: undefined,
    departureOptions: [
      {
        id: "one",
        areaLabel: "Malang",
        meetingPointLabel: "Alun-Alun",
        departureTimeLabel: "07.00 WIB",
        pricePerPerson: 249000,
      },
    ],
  });
  expect(result).toEqual({ success: false, message: "RLS write rejected" });
  expect(mockEoPackageStore.getAllPackages()).toEqual(before);
});
