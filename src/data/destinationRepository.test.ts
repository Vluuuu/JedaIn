import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mockDestinationStore } from "../features/eo/mockDestinationStore";
import { destinationRepository } from "./destinationRepository";

describe("destinationRepository - Read, Filtering & Operational Updates", () => {
  beforeEach(() => {
    mockDestinationStore.reset();
  });

  afterEach(() => {
    mockDestinationStore.reset();
  });

  it("1. fetches all destinations and filters eligible EO destinations", async () => {
    const all = await destinationRepository.getAll();
    expect(all.length).toBeGreaterThanOrEqual(3);

    const eligible = await destinationRepository.getEligibleForEo();
    // Only ACTIVE and guideReady
    expect(
      eligible.every((d) => d.status === "ACTIVE" && d.guideReady === true),
    ).toBe(true);
  });

  it("2. retrieves single destination by ID", async () => {
    const dest = await destinationRepository.getById("dest_lereng_hijau");
    expect(dest).toBeDefined();
    expect(dest?.name).toBe("Lereng Hijau Batu");
  });

  it("3. updates description and reflects in subsequent getById calls", async () => {
    const updatedDesc =
      "Kawasan perkebunan teh baru dengan panorama senja menawan.";
    const res = await destinationRepository.updateDescription(
      "dest_lereng_hijau",
      updatedDesc,
    );
    expect(res.success).toBe(true);
    expect(res.destination?.description).toBe(updatedDesc);

    const fetched = await destinationRepository.getById("dest_lereng_hijau");
    expect(fetched?.description).toBe(updatedDesc);
  });

  it("4. updates local guide fee and reflects in subsequent getById calls", async () => {
    const res = await destinationRepository.updateLocalGuideFee(
      "dest_lereng_hijau",
      45000,
    );
    expect(res.success).toBe(true);
    expect(res.destination?.localGuideFeePerPerson).toBe(45000);

    const fetched = await destinationRepository.getById("dest_lereng_hijau");
    expect(fetched?.localGuideFeePerPerson).toBe(45000);
  });
});
