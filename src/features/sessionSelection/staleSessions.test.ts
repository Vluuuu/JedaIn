import { describe, expect, it } from "vitest";
import { MockCheckoutAdapter } from "../checkout/mockAdapter";
import { sessionStore } from "../onboarding/sessionStore";
import { MockPackageDetailAdapter } from "../packageDetail/mockAdapter";
import type {
  PackageDetailSource,
  PackageSessionPreview,
} from "../packageDetail/types";
import type { PackageRecommendationSource } from "../recommendation/types";
import { MockSessionSelectionAdapter } from "./mockAdapter";

const mockPkg: PackageRecommendationSource = {
  id: "pkg_stale_test",
  title: "Paket Uji Sesi",
  shortSummary: "Summary",
  destinationName: "Destinasi Hijau",
  locationLabel: "Batu",
  visualAsset: "",
  status: "LIVE",
  verificationLevel: "BASIC",
  pricePerPerson: 200000,
  durationType: "HALF_DAY",
  departureAreas: ["MALANG"],
  experienceIntents: ["NATURE"],
  activityTags: ["NATURE_SCENERY"],
  suitableGroupTypes: ["SOLO"],
  suitableGroupSizeBands: ["ONE"],
  rating: 4.8,
  popularityRank: 1,
};

// Clock at 2026-09-20T10:00:00+07:00
const testClock = () => new Date("2026-09-20T10:00:00+07:00");

const testSessions: PackageSessionPreview[] = [
  {
    sessionId: "ses_past_open",
    packageId: "pkg_stale_test",
    startAt: "2026-09-12T08:00:00+07:00", // Past
    endAt: "2026-09-12T14:00:00+07:00",
    status: "OPEN",
    remainingSlots: 5,
    pricePerPerson: 200000,
  },
  {
    sessionId: "ses_future_cancelled",
    packageId: "pkg_stale_test",
    startAt: "2026-09-28T08:00:00+07:00", // Future
    endAt: "2026-09-28T14:00:00+07:00",
    status: "CANCELLED",
    remainingSlots: 5,
    pricePerPerson: 200000,
  },
  {
    sessionId: "ses_future_open_2",
    packageId: "pkg_stale_test",
    startAt: "2026-10-05T08:00:00+07:00", // Future later
    endAt: "2026-10-05T14:00:00+07:00",
    status: "OPEN",
    remainingSlots: 4,
    pricePerPerson: 200000,
  },
  {
    sessionId: "ses_future_open_1",
    packageId: "pkg_stale_test",
    startAt: "2026-09-25T08:00:00+07:00", // Future earlier
    endAt: "2026-09-25T14:00:00+07:00",
    status: "OPEN",
    remainingSlots: 2,
    pricePerPerson: 200000,
  },
];

const mockDetail: PackageDetailSource = {
  packageId: "pkg_stale_test",
  valueProposition: "Value prop",
  highlights: ["Highlight 1"],
  itinerary: [
    {
      order: 1,
      title: "Aktivitas",
      description: "Desc",
      timeOfDayLabel: "Pagi",
      durationLabel: "2 jam",
    },
  ],
  includedItems: ["Item"],
  excludedItems: ["Item"],
  safetyNotes: ["Note"],
  cancellationPolicySummary: "Policy",
  organizer: {
    id: "org_test",
    displayName: "EO Test",
    guideStatus: "CERTIFIED_GUIDE",
    roleDescription: "EO",
    bioSummary: "Bio",
  },
  destinationDetail: { overviewDescription: "Dest overview" },
  upcomingSessionPreviews: testSessions,
};

describe("P0-01 Stale Traveler Sessions Hygiene", () => {
  it("Check 1 & 2: Session OPEN but startAt is in the past is NOT in selectable session list; future OPEN session is selectable", async () => {
    const adapter = new MockSessionSelectionAdapter({
      packages: [mockPkg],
      details: { pkg_stale_test: mockDetail },
      now: testClock,
    });

    const result = await adapter.getPackageSessions("pkg_stale_test");
    expect(result.state).toBe("READY");

    const sessionIds = result.sessions.map((s) => s.sessionId);
    // Past open session must NOT be included
    expect(sessionIds).not.toContain("ses_past_open");
    // Future open sessions MUST be included
    expect(sessionIds).toContain("ses_future_open_1");
    expect(sessionIds).toContain("ses_future_open_2");
    expect(result.hasSelectableSession).toBe(true);
  });

  it("Check 3: Future CANCELLED session is not in selectable session list", async () => {
    const adapter = new MockSessionSelectionAdapter({
      packages: [mockPkg],
      details: { pkg_stale_test: mockDetail },
      now: testClock,
    });

    const result = await adapter.getPackageSessions("pkg_stale_test");
    const sessionIds = result.sessions.map((s) => s.sessionId);
    expect(sessionIds).not.toContain("ses_future_cancelled");
  });

  it("Check 4: Revalidation fails for past session in validateSessionSelection", async () => {
    const adapter = new MockSessionSelectionAdapter({
      packages: [mockPkg],
      details: { pkg_stale_test: mockDetail },
      now: testClock,
    });

    const validation = await adapter.validateSessionSelection(
      "pkg_stale_test",
      "ses_past_open",
    );
    expect(validation.valid).toBe(false);
    expect(validation.reason).toBe("CLOSED");
    expect(validation.message).toContain("tidak tersedia");
  });

  it("Check 4b: Checkout fails revalidation for past session in getCheckout and submitCheckout", async () => {
    sessionStore.setUser({
      id: "usr_test_checkout",
      name: "User Test",
      email: "user@test.id",
      phone: "081234567890",
      onboardingStatus: "COMPLETED",
    });

    const checkoutAdapter = new MockCheckoutAdapter({
      packages: [mockPkg],
      details: { pkg_stale_test: mockDetail },
      verifiedPhoneStore: { usr_test_checkout: true },
      now: testClock,
    });

    const getRes = await checkoutAdapter.getCheckout("ses_past_open");
    expect(getRes.state).toBe("SESSION_UNAVAILABLE");

    const submitRes = await checkoutAdapter.submitCheckout({
      sessionId: "ses_past_open",
      travelerId: "usr_test_checkout",
      participantCount: 1,
      expectedUnitPricePerPerson: 200000,
      cancellationPolicyAcknowledged: true,
      idempotencyKey: "k_stale_tx_1",
    });
    expect(submitRes.status).toBe("SESSION_UNAVAILABLE");
  });

  it("Check 5: Future sessions are sorted chronologically", async () => {
    const adapter = new MockSessionSelectionAdapter({
      packages: [mockPkg],
      details: { pkg_stale_test: mockDetail },
      now: testClock,
    });

    const result = await adapter.getPackageSessions("pkg_stale_test");
    expect(result.sessions.length).toBe(2);
    expect(result.sessions[0].sessionId).toBe("ses_future_open_1"); // Sep 25
    expect(result.sessions[1].sessionId).toBe("ses_future_open_2"); // Oct 05
  });

  it("Package Detail preview does not include past sessions as upcoming", async () => {
    const packageAdapter = new MockPackageDetailAdapter({
      packages: [mockPkg],
      details: { pkg_stale_test: mockDetail },
      now: testClock,
    });

    const result = await packageAdapter.getPackageDetail("pkg_stale_test");
    expect(result.state).toBe("READY");
    const previews = result.detail!.upcomingSessionPreviews;
    expect(previews.some((s) => s.sessionId === "ses_past_open")).toBe(false);
    expect(previews.some((s) => s.sessionId === "ses_future_cancelled")).toBe(
      false,
    );
    expect(previews.length).toBe(2);
    expect(previews[0].sessionId).toBe("ses_future_open_1");
  });
});
