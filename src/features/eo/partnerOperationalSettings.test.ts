import { afterEach, describe, expect, it } from "vitest";
import { destinationRepository } from "../../data/destinationRepository";
import { sessionRepository } from "../../data/sessionRepository";
import { mockDestinationStore } from "./mockDestinationStore";
import { mockEoPackageStore } from "./mockEoPackageStore";
import { partnerSessionStore } from "./partnerSessionStore";

afterEach(() => {
  partnerSessionStore.reset();
  mockDestinationStore.reset();
  mockEoPackageStore.reset();
});

describe("partner operational settings", () => {
  it("only the owning destination can update its general capacity and hours note", async () => {
    partnerSessionStore.loginAsDemoDestination();
    const destinationId = "dest_lereng_hijau";
    const before = mockDestinationStore.getById(destinationId)!;
    const notes = [
      ...(before.operationalNotes ?? []),
      "Jam operasional: Setiap hari, 07.00–16.00 WIB",
    ];
    const updated = await destinationRepository.updateOperationalSettings(
      destinationId,
      18,
      notes,
    );
    expect(updated.success).toBe(true);
    expect(
      mockDestinationStore.getById(destinationId)?.capacityPerSession,
    ).toBe(18);
    expect(
      mockDestinationStore.getById(destinationId)?.operationalNotes,
    ).toContain("Jam operasional: Setiap hari, 07.00–16.00 WIB");

    const otherDestination =
      await destinationRepository.updateOperationalSettings(
        "dest_hutan_trawas",
        12,
        notes,
      );
    expect(otherDestination.success).toBe(false);

    partnerSessionStore.loginAsDemoApproved();
    const wrongRole = await destinationRepository.updateOperationalSettings(
      destinationId,
      5,
      notes,
    );
    expect(wrongRole.success).toBe(false);
    expect(
      mockDestinationStore.getById(destinationId)?.capacityPerSession,
    ).toBe(18);
  });

  it("lets a TO adjust a future session while preserving booked seats and status", async () => {
    partnerSessionStore.loginAsDemoApproved();
    const created = await sessionRepository.createSession({
      packageId: "slow_green_day",
      startAt: "2035-10-10T08:00:00.000Z",
      endAt: "2035-10-10T14:00:00.000Z",
      capacity: 6,
      pricePerPerson: 300000,
      nowMs: Date.parse("2035-01-01T00:00:00.000Z"),
    });
    expect(created.success).toBe(true);
    const session = created.session!;
    mockEoPackageStore.upsertSession({
      ...session,
      capacity: 6,
      remainingSlots: 4,
    });

    const changedTime = await sessionRepository.updateSessionSchedule({
      sessionId: session.sessionId,
      startAt: "2035-10-11T08:00:00.000Z",
      endAt: "2035-10-11T14:00:00.000Z",
      capacity: 8,
      nowMs: Date.parse("2035-01-01T00:00:00.000Z"),
    });
    expect(changedTime.success).toBe(false);

    const tooSmall = await sessionRepository.updateSessionSchedule({
      sessionId: session.sessionId,
      startAt: session.startAt,
      endAt: session.endAt,
      capacity: 1,
      nowMs: Date.parse("2035-01-01T00:00:00.000Z"),
    });
    expect(tooSmall.success).toBe(false);

    const changedCapacity = await sessionRepository.updateSessionSchedule({
      sessionId: session.sessionId,
      startAt: session.startAt,
      endAt: session.endAt,
      capacity: 8,
      nowMs: Date.parse("2035-01-01T00:00:00.000Z"),
    });
    expect(changedCapacity.success).toBe(true);
    expect(changedCapacity.session?.remainingSlots).toBe(6);
    expect(changedCapacity.session?.status).toBe("OPEN");
  });
});
