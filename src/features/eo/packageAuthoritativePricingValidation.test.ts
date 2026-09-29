import { describe, expect, it } from "vitest";
import { mockDestinationStore } from "./mockDestinationStore";
import { validateEoPackage } from "./mockEoPackageStore";
import type { DestinationRecord, EoPackageRecord } from "./types";

describe("Regression Tests: Authoritative Destination Pricing Validation", () => {
  const validBasePackage: Partial<EoPackageRecord> = {
    title: "Eksplorasi Lereng Hijau Asri",
    shortSummary:
      "Pengalaman mindful menyusuri perkebunan teh yang damai dan asri.",
    destinationId: "dest_lereng_hijau",
    durationLabel: "1 hari",
    meetingPointLabel: "Stasiun Malang",
    departureTimeLabel: "07.00 WIB",
    outboundTransport: "Minibus",
    returnTransport: "Minibus",
    includedItems: ["Transportasi PP", "Tiket Masuk"],
    itinerary: [
      {
        order: 1,
        title: "Sesi Pagi",
        description: "Jalan santai di kebun teh.",
      },
    ],
    safetyNotes: ["Gunakan sepatu yang nyaman."],
  };

  const authoritativeLiveDestination: DestinationRecord = {
    ...mockDestinationStore.getById("dest_lereng_hijau")!,
    baseCostPerPerson: 125000,
    localGuideFeePerPerson: 100000,
  };

  it("Scenario A: validates successfully when package uses live destination pricing (guideSource=DESTINATION)", () => {
    // Verify mock destination has stale fee (25000)
    expect(
      mockDestinationStore.getById("dest_lereng_hijau")?.localGuideFeePerPerson,
    ).toBe(25000);

    // Package with live pricing: 125000 + 100000 + 150000 = 375000
    const pkg: Partial<EoPackageRecord> = {
      ...validBasePackage,
      guideSource: "DESTINATION",
      pricing: {
        destinationBaseCost: 125000,
        localGuideFee: 100000,
        eoMargin: 150000,
        customerPrice: 375000,
      },
    };

    const res = validateEoPackage(
      pkg,
      "CERTIFIED_GUIDE",
      authoritativeLiveDestination,
    );

    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it("Scenario B: rejects package with stale pricing against authoritative destination", () => {
    // Package with stale pricing: 125000 + 25000 + 150000 = 300000
    const stalePkg: Partial<EoPackageRecord> = {
      ...validBasePackage,
      guideSource: "DESTINATION",
      pricing: {
        destinationBaseCost: 125000,
        localGuideFee: 25000,
        eoMargin: 150000,
        customerPrice: 300000,
      },
    };

    const res = validateEoPackage(
      stalePkg,
      "CERTIFIED_GUIDE",
      authoritativeLiveDestination,
    );

    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.field === "localGuideFee")).toBe(true);
    expect(res.errors.some((e) => e.field === "customerPrice")).toBe(true);
    expect(
      res.errors.find((e) => e.field === "localGuideFee")?.message,
    ).toContain(
      "Tarif pemandu lokal tidak sesuai dengan sumber pemandu yang dipilih.",
    );
    expect(
      res.errors.find((e) => e.field === "customerPrice")?.message,
    ).toContain("Rp375.000");
  });

  it("Scenario C: validates successfully when guideSource=EO (local guide fee = 0)", () => {
    // Destination has localGuideFeePerPerson = 100000, but EO guide source means localGuideFee is 0
    // customerPrice = 125000 + 0 + 150000 = 275000
    const eoGuidePkg: Partial<EoPackageRecord> = {
      ...validBasePackage,
      guideSource: "EO",
      pricing: {
        destinationBaseCost: 125000,
        localGuideFee: 0,
        eoMargin: 150000,
        customerPrice: 275000,
      },
    };

    const res = validateEoPackage(
      eoGuidePkg,
      "CERTIFIED_GUIDE",
      authoritativeLiveDestination,
    );

    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);

    // If EO guide package mistakenly included local guide fee, it must fail
    const invalidEoGuidePkg: Partial<EoPackageRecord> = {
      ...validBasePackage,
      guideSource: "EO",
      pricing: {
        destinationBaseCost: 125000,
        localGuideFee: 100000,
        eoMargin: 150000,
        customerPrice: 375000,
      },
    };

    const invalidRes = validateEoPackage(
      invalidEoGuidePkg,
      "CERTIFIED_GUIDE",
      authoritativeLiveDestination,
    );

    expect(invalidRes.valid).toBe(false);
    expect(invalidRes.errors.some((e) => e.field === "localGuideFee")).toBe(
      true,
    );
  });

  it("retains backward compatibility with mock destination when authoritativeDestination is omitted", () => {
    // When no authoritative destination is supplied, uses mockDestinationStore (fee: 25000)
    const mockPricingPkg: Partial<EoPackageRecord> = {
      ...validBasePackage,
      guideSource: "DESTINATION",
      pricing: {
        destinationBaseCost: 125000,
        localGuideFee: 25000,
        eoMargin: 150000,
        customerPrice: 300000,
      },
    };

    const res = validateEoPackage(mockPricingPkg, "CERTIFIED_GUIDE");
    expect(res.valid).toBe(true);
  });
});
