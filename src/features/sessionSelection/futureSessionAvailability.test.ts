// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prototypeClock } from "../../lib/clock";
import { MockCheckoutAdapter } from "../checkout/mockAdapter";
import { mockTransactionStore } from "../checkout/mockTransactionStore";
import { sessionStore } from "../onboarding/sessionStore";
import { MockPackageDetailAdapter } from "../packageDetail/mockAdapter";
import { MockSessionSelectionAdapter } from "./mockAdapter";

describe("F1 Regression: Future Session Availability & Stale-Session Protection", () => {
  beforeEach(() => {
    // Controlled system date around 2026-09-25 (HOLOGY finals presentation window)
    prototypeClock.setNow(() => new Date("2026-09-25T10:00:00+07:00"));
    sessionStore.setUser({
      id: "usr_f1_test",
      name: "Traveler F1",
      email: "f1@example.com",
      phone: "081234567890",
      onboardingStatus: "COMPLETED",
    });
    mockTransactionStore.reset();
  });

  afterEach(() => {
    prototypeClock.reset();
    sessionStore.reset();
    mockTransactionStore.reset();
  });

  it("proves baseline packages have selectable future OPEN sessions under presentation clock (2026-09-25)", async () => {
    const pkgAdapter = new MockPackageDetailAdapter();
    const sessionAdapter = new MockSessionSelectionAdapter();

    const baselinePackageIds = [
      "slow_green_day",
      "mindful_morning",
      "creative_village_halfday",
      "light_mountain_explore",
      "weekend_nature_reset",
    ];

    const nowMs = prototypeClock.nowMs();

    for (const pkgId of baselinePackageIds) {
      const detailRes = await pkgAdapter.getPackageDetail(pkgId);
      expect(detailRes.state).toBe("READY");
      expect(detailRes.hasOpenSession).toBe(true);
      expect(detailRes.detail?.upcomingSessionPreviews?.length).toBeGreaterThan(
        0,
      );

      const sessionRes = await sessionAdapter.getPackageSessions(pkgId);
      expect(sessionRes.state).toBe("READY");
      expect(sessionRes.hasSelectableSession).toBe(true);
      expect(sessionRes.sessions.length).toBeGreaterThan(0);

      // Verify all resolved sessions have startAt > nowMs (2026-09-25)
      for (const session of sessionRes.sessions) {
        expect(new Date(session.startAt).getTime()).toBeGreaterThan(nowMs);
        expect(session.status).toBe("OPEN");
      }
    }
  });

  it("proves stale-session guard remains active and strictly filters past sessions", async () => {
    // Inject an explicit past session for slow_green_day
    const pastSession = {
      sessionId: "ses_sgd_past_test",
      packageId: "slow_green_day",
      startAt: "2026-09-12T08:00:00+07:00", // in the past relative to 2026-09-25
      endAt: "2026-09-12T14:00:00+07:00",
      status: "OPEN" as const,
      pricePerPerson: 275000,
      remainingSlots: 6,
    };

    const customAdapter = new MockSessionSelectionAdapter({
      sessionOverrides: {
        slow_green_day: [
          pastSession,
          {
            sessionId: "ses_sgd_future_valid",
            packageId: "slow_green_day",
            startAt: "2026-10-10T08:00:00+07:00",
            endAt: "2026-10-10T14:00:00+07:00",
            status: "OPEN" as const,
            pricePerPerson: 275000,
            remainingSlots: 6,
          },
        ],
      },
    });

    const res = await customAdapter.getPackageSessions("slow_green_day");
    expect(res.state).toBe("READY");
    const sessionIds = res.sessions.map((s) => s.sessionId);
    // Past session must be filtered out by stale-session guard
    expect(sessionIds).not.toContain("ses_sgd_past_test");
    // Future session must remain available
    expect(sessionIds).toContain("ses_sgd_future_valid");
  });

  it("proves future session proceeds toward checkout while past session checkout is rejected", async () => {
    const checkoutAdapter = new MockCheckoutAdapter({
      verifiedPhoneStore: { usr_f1_test: true },
    });

    // 1. Future session proceeds to checkout
    const checkoutRes = await checkoutAdapter.getCheckout("ses_sgd_1");
    expect(checkoutRes.state).toBe("READY");
    expect(checkoutRes.session?.sessionId).toBe("ses_sgd_1");
    expect(new Date(checkoutRes.session!.startAt).getTime()).toBeGreaterThan(
      prototypeClock.nowMs(),
    );

    // 2. Checkout submit succeeds for valid future session
    const submitRes = await checkoutAdapter.submitCheckout({
      sessionId: "ses_sgd_1",
      travelerId: "usr_f1_test",
      participantCount: 1,
      expectedUnitPricePerPerson: 275000,
      cancellationPolicyAcknowledged: true,
      idempotencyKey: "idemp_f1_valid_test",
    });
    expect(submitRes.status).toBe("SUCCESS");

    // 3. Directly trying to submit checkout for a past session is rejected by stale session guard
    // Use a clean traveler without active pending payment
    sessionStore.setUser({
      id: "usr_f1_past_test",
      name: "Traveler F1 Past",
      email: "f1past@example.com",
      phone: "081234567891",
      onboardingStatus: "COMPLETED",
    });

    const pastCheckoutAdapter = new MockCheckoutAdapter({
      verifiedPhoneStore: { usr_f1_past_test: true },
      sessionOverrides: {
        slow_green_day: [
          {
            sessionId: "ses_past_submit_test",
            packageId: "slow_green_day",
            startAt: "2026-09-12T08:00:00+07:00", // Past
            endAt: "2026-09-12T14:00:00+07:00",
            status: "OPEN" as const,
            pricePerPerson: 275000,
            remainingSlots: 6,
          },
        ],
      },
    });

    const pastSubmitRes = await pastCheckoutAdapter.submitCheckout({
      sessionId: "ses_past_submit_test",
      travelerId: "usr_f1_past_test",
      participantCount: 1,
      expectedUnitPricePerPerson: 275000,
      cancellationPolicyAcknowledged: true,
      idempotencyKey: "idemp_f1_past_test",
    });
    expect(pastSubmitRes.status).toBe("SESSION_UNAVAILABLE");
  });
});
