import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockDestinationStore } from "../eo/mockDestinationStore";
import {
  adminCatalogRepository,
  validateVerifiedDestination,
  type VerifiedDestinationInput,
} from "./adminCatalogRepository";
import { adminSessionStore } from "./adminSessionStore";

const backend = vi.hoisted(() => ({
  mode: false,
  authorize: vi.fn(),
  single: vi.fn(),
  insert: vi.fn(),
}));
vi.mock("../../lib/supabase", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  isSupabaseMode: () => backend.mode,
  requireAuthenticatedUser: backend.authorize,
  getSupabaseClient: () => ({ from: () => ({ insert: backend.insert }) }),
}));
const valid: VerifiedDestinationInput = {
  name: "Destinasi uji",
  province: "Jawa Timur",
  city: "Malang",
  description: "Data destinasi untuk pengujian.",
  capacityPerSession: 8,
  baseCostPerPerson: 100000,
  localGuideFeePerPerson: 25000,
  localGuideSummary: "Pemandu lokal telah diverifikasi.",
  verified: true,
  availableActivities: ["Trekking"],
  facilities: [],
  baseCostIncludes: ["Tiket masuk"],
  baseCostExcludes: [],
};
beforeEach(() => {
  backend.mode = false;
  backend.authorize.mockReset();
  backend.single.mockReset();
  backend.insert.mockReset();
  adminSessionStore.reset();
  mockDestinationStore.reset();
  backend.insert.mockImplementation(() => ({
    select: () => ({ single: backend.single }),
  }));
});
describe("Admin-only verified destination catalog", () => {
  it("rejects a missing Admin session before changing the catalog", async () => {
    const count = mockDestinationStore.getAll().length;
    await expect(
      adminCatalogRepository.createVerifiedDestination(valid),
    ).rejects.toThrow("Hanya Admin");
    expect(mockDestinationStore.getAll()).toHaveLength(count);
  });
  it("requires verification, a guide, a positive capacity and integer costs", () => {
    expect(
      validateVerifiedDestination({ ...valid, verified: false }),
    ).toContain("Konfirmasi");
    expect(
      validateVerifiedDestination({ ...valid, localGuideSummary: " " }),
    ).toContain("Lengkapi");
    expect(
      validateVerifiedDestination({ ...valid, capacityPerSession: 0 }),
    ).toContain("Kapasitas");
    expect(
      validateVerifiedDestination({ ...valid, baseCostPerPerson: -1 }),
    ).toContain("Biaya");
    expect(
      validateVerifiedDestination({ ...valid, localGuideFeePerPerson: 0.5 }),
    ).toContain("Biaya");
    expect(
      validateVerifiedDestination({
        ...valid,
        imageUrl: "javascript:alert(1)",
      }),
    ).toContain("HTTPS");
  });
  it("adds a verified mock destination without inventing a photo or creating partner accounts", async () => {
    adminSessionStore.loginAsDemoAdmin();
    const destination =
      await adminCatalogRepository.createVerifiedDestination(valid);
    expect(destination).toMatchObject({
      name: valid.name,
      status: "ACTIVE",
      guideReady: true,
      imageUrl: undefined,
      mediaGallery: [],
    });
    expect(mockDestinationStore.getById(destination.destinationId)).toEqual(
      destination,
    );
    expect(
      (await adminCatalogRepository.getCatalog()).organizers[0].name,
    ).toBeTruthy();
  });
  it("rejects a backend EO even if the local Admin cache says Admin", async () => {
    backend.mode = true;
    adminSessionStore.loginAsDemoAdmin();
    backend.authorize.mockResolvedValue({
      success: true,
      partnerUser: { role: "EO" },
    });
    await expect(
      adminCatalogRepository.createVerifiedDestination(valid),
    ).rejects.toThrow("Akses Admin");
    expect(backend.insert).not.toHaveBeenCalled();
  });
  it("reports failed remote inserts without adding a local success", async () => {
    backend.mode = true;
    backend.authorize.mockResolvedValue({
      success: true,
      partnerUser: { role: "ADMIN" },
    });
    backend.single.mockResolvedValue({
      data: null,
      error: { message: "Database unavailable" },
    });
    const count = mockDestinationStore.getAll().length;
    await expect(
      adminCatalogRepository.createVerifiedDestination(valid),
    ).rejects.toThrow("Database unavailable");
    expect(mockDestinationStore.getAll()).toHaveLength(count);
  });
  it("re-fetches the inserted record before updating the local directory", async () => {
    backend.mode = true;
    backend.authorize.mockResolvedValue({
      success: true,
      partnerUser: { role: "ADMIN" },
    });
    backend.single.mockImplementation(async () => ({
      data: backend.insert.mock.calls[0][0],
      error: null,
    }));
    const destination =
      await adminCatalogRepository.createVerifiedDestination(valid);
    expect(destination).toMatchObject({
      status: "ACTIVE",
      guideReady: true,
      baseCostPerPerson: 100000,
    });
    expect(mockDestinationStore.getById(destination.destinationId)).toEqual(
      destination,
    );
    expect(backend.authorize).toHaveBeenCalledWith("ADMIN");
  });
});
