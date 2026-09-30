import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mockEoPackageStore } from "../features/eo/mockEoPackageStore";
import { partnerSessionStore } from "../features/eo/partnerSessionStore";
import { sessionRepository } from "./sessionRepository";

describe("sessionRepository - Temporal Integrity & Lifecycle", () => {
  beforeEach(() => {
    mockEoPackageStore.reset();
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
  });

  afterEach(() => {
    mockEoPackageStore.reset();
    partnerSessionStore.reset();
  });

  it("1. fetches all sessions and filters by package", async () => {
    const all = await sessionRepository.getAllSessions();
    expect(all.length).toBeGreaterThanOrEqual(2);

    const forPkg =
      await sessionRepository.getSessionsByPackage("slow_green_day");
    expect(forPkg.every((s) => s.packageId === "slow_green_day")).toBe(true);
  });

  it("2. enforces temporal validity: rejects session with start date in the past", async () => {
    const pastStart = new Date(Date.now() - 3600000).toISOString();
    const futureEnd = new Date(Date.now() + 3600000).toISOString();

    const res = await sessionRepository.createSession({
      packageId: "slow_green_day",
      startAt: pastStart,
      endAt: futureEnd,
      capacity: 8,
      pricePerPerson: 300000,
    });

    expect(res.success).toBe(false);
    expect(res.message).toContain("harus di masa depan");
  });

  it("3. creates session successfully when temporal rules and capacity are valid", async () => {
    const futureStart = new Date(Date.now() + 86400000).toISOString();
    const futureEnd = new Date(Date.now() + 90000000).toISOString();

    const res = await sessionRepository.createSession({
      packageId: "slow_green_day",
      startAt: futureStart,
      endAt: futureEnd,
      capacity: 8,
      pricePerPerson: 300000,
      operationalNote: "Bawa perlengkapan hujan",
    });

    expect(res.success).toBe(true);
    expect(res.session?.capacity).toBe(8);
    expect(res.session?.remainingSlots).toBe(8);
    expect(res.session?.operationalNote).toBe("Bawa perlengkapan hujan");
  });

  it("4. rejects reopening past session to OPEN", async () => {
    // Directly create or check past session in store
    const sessionRes = await sessionRepository.createSession({
      packageId: "slow_green_day",
      startAt: new Date(Date.now() + 100000).toISOString(),
      endAt: new Date(Date.now() + 200000).toISOString(),
      capacity: 5,
      pricePerPerson: 300000,
    });
    expect(sessionRes.success).toBe(true);
    const sid = sessionRes.session!.sessionId;

    // Simulate clock advancing past session
    const simulatedNowMs = Date.now() + 500000;
    const updateRes = await sessionRepository.updateSessionStatus(
      sid,
      "OPEN",
      simulatedNowMs,
    );
    expect(updateRes.success).toBe(false);
    expect(updateRes.message).toContain("tidak dapat dibuka kembali");
  });
});
