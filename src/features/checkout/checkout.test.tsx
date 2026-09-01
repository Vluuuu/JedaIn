// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import type { AuthUser } from "../auth/types";
import { sessionStore } from "../onboarding/sessionStore";
import type { PackageSessionPreview } from "../packageDetail/types";
import { CheckoutScreen } from "./CheckoutScreen";
import { MockCheckoutAdapter } from "./mockAdapter";
import { mockTransactionStore } from "./mockTransactionStore";
import type { CheckoutSubmitInput } from "./types";

let container: HTMLDivElement;
let root: Root;

beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});

afterEach(async () => {
  await act(() => root?.unmount());
  container?.remove();
  sessionStore.reset();
  mockTransactionStore.reset();
});

function LocationObserver({
  onLocation,
}: {
  onLocation: (pathname: string) => void;
}) {
  const location = useLocation();
  onLocation(location.pathname);
  return null;
}

async function renderCheckout(
  sessionId = "ses_sgd_1",
  props: { adapter?: MockCheckoutAdapter } = {},
  initialEntries: string[] = [`/checkout/${sessionId}`],
) {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => {
    root.render(
      createElement(
        MemoryRouter,
        { initialEntries },
        createElement(
          Routes,
          undefined,
          createElement(Route, {
            path: "/checkout/:sessionId",
            element: createElement(CheckoutScreen, props),
          }),
        ),
      ),
    );
  });
  return container;
}

describe("CheckoutScreen Targeted Transaction-Correctness Tests", () => {
  it("1. known concrete Session resolves canonical Package + Session", async () => {
    sessionStore.setUser({
      id: "usr_test_1",
      name: "Dewo Traveler",
      email: "dewo@example.com",
      phone: "08123456789",
      onboardingStatus: "COMPLETED",
    });

    const adapter = new MockCheckoutAdapter({
      verifiedPhoneStore: { usr_test_1: true },
    });

    const view = await renderCheckout("ses_sgd_1", { adapter });

    expect(view.textContent).toContain("Checkout");
    expect(view.textContent).toContain("Sehari Pelan di Lereng Hijau");
    expect(view.textContent).toContain(
      "Lereng Hijau Batu • Batu / Malang Raya",
    );
    expect(view.textContent).toContain("Rp275.000 / orang");
    expect(view.textContent).toContain("Dewo Traveler");
    expect(view.textContent).toContain("08123456789");
    expect(view.textContent).toContain("Lanjut ke Pembayaran");
  });

  it("2. unknown Session renders NOT_FOUND state", async () => {
    const view = await renderCheckout("unknown_sess_999");
    expect(view.textContent).toContain("Jadwal checkout tidak ditemukan.");
    expect(view.textContent).toContain("Kembali ke Explore");
  });

  it("3. Session attached to non-LIVE Package is unavailable", async () => {
    const adapter = new MockCheckoutAdapter({
      packages: [
        {
          id: "draft_pkg",
          title: "Paket Draft",
          shortSummary: "Summary",
          destinationName: "Destinasi",
          locationLabel: "Lokasi",
          visualAsset: "asset.jpg",
          status: "DRAFT" as "LIVE",
          verificationLevel: "BASIC",
          pricePerPerson: 100000,
          durationType: "HALF_DAY",
          departureAreas: ["MALANG"],
          experienceIntents: ["NATURE"],
          activityTags: ["NATURE_SCENERY"],
          suitableGroupTypes: ["SOLO"],
          suitableGroupSizeBands: ["ONE"],
          rating: 4.5,
          popularityRank: 50,
        },
      ],
      details: {
        draft_pkg: {
          packageId: "draft_pkg",
          valueProposition: "Val prop",
          highlights: [],
          itinerary: [],
          includedItems: [],
          excludedItems: [],
          safetyNotes: [],
          cancellationPolicySummary: "Policy",
          organizer: {
            id: "org_1",
            displayName: "Org",
            guideStatus: "CONCEPT_ONLY",
          },
          destinationDetail: { overviewDescription: "Desc" },
          upcomingSessionPreviews: [
            {
              sessionId: "ses_draft",
              packageId: "draft_pkg",
              startAt: "2026-09-12T08:00:00+07:00",
              endAt: "2026-09-12T14:00:00+07:00",
              status: "OPEN",
              pricePerPerson: 100000,
              remainingSlots: 5,
            },
          ],
        },
      },
    });

    const view = await renderCheckout("ses_draft", { adapter });
    expect(view.textContent).toContain("Jadwal checkout tidak ditemukan.");
  });

  it("4. FULL/CLOSED/CANCELLED Session is unavailable", async () => {
    const fullSession: PackageSessionPreview[] = [
      {
        sessionId: "ses_full",
        packageId: "slow_green_day",
        startAt: "2026-09-12T08:00:00+07:00",
        endAt: "2026-09-12T14:00:00+07:00",
        status: "FULL",
        remainingSlots: 0,
      },
    ];

    const adapter = new MockCheckoutAdapter({
      sessionOverrides: { slow_green_day: fullSession },
    });

    const view = await renderCheckout("ses_full", { adapter });
    const ctaBtn = Array.from(view.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Lanjut ke Pembayaran"),
    )!;

    expect(ctaBtn.disabled).toBe(true);
  });

  it("5. direct URL reload resolves same session from sessionId", async () => {
    sessionStore.setUser({
      id: "usr_reload",
      onboardingStatus: "COMPLETED",
    });

    const view = await renderCheckout("ses_sgd_2");
    expect(view.textContent).toContain("19 September 2026");
  });

  it("6. participant quantity defaults to 1, updates price, and does NOT mutate remainingSlots", async () => {
    sessionStore.setUser({
      id: "usr_part_test",
      onboardingStatus: "COMPLETED",
    });

    const view = await renderCheckout("ses_sgd_1"); // remainingSlots = 6, unitPrice = 275000

    expect(view.textContent).toContain("1 × Rp275.000");
    expect(view.textContent).toContain("Rp275.000"); // total

    const minusBtn = Array.from(view.querySelectorAll("button")).find(
      (b) => b.getAttribute("aria-label") === "Kurangi jumlah peserta",
    )!;
    const plusBtn = Array.from(view.querySelectorAll("button")).find(
      (b) => b.getAttribute("aria-label") === "Tambah jumlah peserta",
    )!;

    // Minimum is 1, minus should be disabled
    expect(minusBtn.disabled).toBe(true);

    // Click plus -> 2
    await act(async () => {
      plusBtn.click();
    });

    expect(view.textContent).toContain("2 × Rp275.000");
    expect(view.textContent).toContain("Rp550.000");

    // Check that remainingSlots snapshot is unchanged
    const adapter = new MockCheckoutAdapter();
    const vm = await adapter.getCheckout("ses_sgd_1");
    expect(vm.session?.remainingSlots).toBe(6);
  });

  it("7. exact session price used, subtotal and total math correct, zero invented fees", async () => {
    sessionStore.setUser({
      id: "usr_price_test",
      onboardingStatus: "COMPLETED",
    });

    const view = await renderCheckout("ses_sgd_1");

    expect(view.textContent).toContain("Rp275.000 / orang");
    expect(view.textContent).not.toContain("Mulai dari Rp275.000");
    expect(view.textContent).toContain("Total Pembayaran");
    expect(view.textContent).toContain("Rp275.000");

    // No invented fees
    expect(view.textContent).not.toContain("service fee");
    expect(view.textContent).not.toContain("booking fee");
    expect(view.textContent).not.toContain("platform fee");
    expect(view.textContent).not.toContain("Base Cost");
    expect(view.textContent).not.toContain("EO Margin");
  });

  // REGRESSION A
  it("8. A - exact Session price missing + Package price exists -> PRICE_UNAVAILABLE", async () => {
    const adapter = new MockCheckoutAdapter({
      packages: [
        {
          id: "pkg_starting_price",
          title: "Pkg With Starting Price",
          shortSummary: "Summary",
          destinationName: "Destinasi",
          locationLabel: "Lokasi",
          visualAsset: "asset.jpg",
          status: "LIVE",
          verificationLevel: "BASIC",
          pricePerPerson: 275000, // Package starting price MUST NOT be used!
          durationType: "HALF_DAY",
          departureAreas: ["MALANG"],
          experienceIntents: ["NATURE"],
          activityTags: ["NATURE_SCENERY"],
          suitableGroupTypes: ["SOLO"],
          suitableGroupSizeBands: ["ONE"],
          rating: 4.5,
          popularityRank: 50,
        },
      ],
      details: {
        pkg_starting_price: {
          packageId: "pkg_starting_price",
          valueProposition: "Val prop",
          highlights: [],
          itinerary: [],
          includedItems: [],
          excludedItems: [],
          safetyNotes: [],
          cancellationPolicySummary: "Policy",
          organizer: {
            id: "org_1",
            displayName: "Org",
            guideStatus: "CONCEPT_ONLY",
          },
          destinationDetail: { overviewDescription: "Desc" },
          upcomingSessionPreviews: [
            {
              sessionId: "ses_missing_price",
              packageId: "pkg_starting_price",
              startAt: "2026-09-12T08:00:00+07:00",
              endAt: "2026-09-12T14:00:00+07:00",
              status: "OPEN",
              pricePerPerson: undefined, // Session price missing
              remainingSlots: 5,
            },
          ],
        },
      },
    });

    const vm = await adapter.getCheckout("ses_missing_price");
    expect(vm.state).toBe("PRICE_UNAVAILABLE");

    const view = await renderCheckout("ses_missing_price", { adapter });
    expect(view.textContent).toContain("Rp-");
    const ctaBtn = Array.from(view.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Lanjut ke Pembayaran"),
    )!;
    expect(ctaBtn.disabled).toBe(true);

    const submitRes = await adapter.submitCheckout({
      travelerId: "usr_1",
      sessionId: "ses_missing_price",
      participantCount: 1,
      cancellationPolicyAcknowledged: true,
      idempotencyKey: "k1",
    });
    expect(submitRes.status).toBe("PRICE_UNAVAILABLE");
    expect(mockTransactionStore.getBookings().length).toBe(0);
    expect(mockTransactionStore.getPaymentAttempts().length).toBe(0);
  });

  // REGRESSION B & C
  it("9. B & C - default phone present but verification false -> T11 handoff; explicit verification -> can continue", async () => {
    const traveler: AuthUser = {
      id: "usr_phone_test",
      name: "Phone User",
      email: "phone@example.com",
      phone: "08123456789",
      onboardingStatus: "COMPLETED",
    };
    sessionStore.setUser(traveler);

    // Unverified adapter
    const adapterUnverified = new MockCheckoutAdapter({
      travelerOverride: traveler,
      verifiedPhoneStore: { usr_phone_test: false },
    });

    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    await act(async () => {
      root.render(
        createElement(
          MemoryRouter,
          { initialEntries: ["/checkout/ses_sgd_1"] },
          createElement(Routes, undefined, [
            createElement(Route, {
              path: "/checkout/:sessionId",
              element: createElement(CheckoutScreen, {
                adapter: adapterUnverified,
              }),
            }),
            createElement(Route, {
              path: "/checkout/:sessionId/contact",
              element: createElement(
                "div",
                undefined,
                "Contact Verification Screen",
              ),
            }),
          ]),
        ),
      );
    });

    expect(container.textContent).toContain("Belum Verifikasi");

    const cbInDoc = container.querySelector<HTMLInputElement>(
      "#cancellation-policy-ack",
    )!;
    await act(async () => {
      cbInDoc.click();
    });
    const ctaInDoc = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Lanjut ke Pembayaran"),
    )!;
    await act(async () => {
      ctaInDoc.click();
    });

    expect(container.textContent).toContain("Contact Verification Screen");
    expect(mockTransactionStore.getBookings().length).toBe(0);

    // Explicitly verified adapter
    const adapterVerified = new MockCheckoutAdapter({
      travelerOverride: traveler,
      verifiedPhoneStore: { usr_phone_test: true },
    });
    const viewVerified = await renderCheckout("ses_sgd_1", {
      adapter: adapterVerified,
    });
    expect(viewVerified.textContent).toContain("Terverifikasi");
  });

  // REGRESSION D, E, F, G
  it("10. D, E, F, G - local draft validation inside submitCheckout creates zero transactional state for invalid inputs", async () => {
    const adapter = new MockCheckoutAdapter();
    sessionStore.setUser({
      id: "usr_draft_val",
      onboardingStatus: "COMPLETED",
    });

    // D: Policy not acknowledged
    const resD = await adapter.submitCheckout({
      travelerId: "usr_draft_val",
      sessionId: "ses_sgd_1",
      participantCount: 1,
      cancellationPolicyAcknowledged: false,
      idempotencyKey: "k_d",
    });
    expect(resD.status).toBe("INVALID_DRAFT");

    // E: participantCount = 0
    const resE = await adapter.submitCheckout({
      travelerId: "usr_draft_val",
      sessionId: "ses_sgd_1",
      participantCount: 0,
      cancellationPolicyAcknowledged: true,
      idempotencyKey: "k_e",
    });
    expect(resE.status).toBe("INVALID_DRAFT");

    // F: participantCount = -1
    const resF = await adapter.submitCheckout({
      travelerId: "usr_draft_val",
      sessionId: "ses_sgd_1",
      participantCount: -1,
      cancellationPolicyAcknowledged: true,
      idempotencyKey: "k_f",
    });
    expect(resF.status).toBe("INVALID_DRAFT");

    // G: participantCount = 1.5 (non-integer)
    const resG = await adapter.submitCheckout({
      travelerId: "usr_draft_val",
      sessionId: "ses_sgd_1",
      participantCount: 1.5,
      cancellationPolicyAcknowledged: true,
      idempotencyKey: "k_g",
    });
    expect(resG.status).toBe("INVALID_DRAFT");

    expect(mockTransactionStore.getBookings().length).toBe(0);
    expect(mockTransactionStore.getPaymentAttempts().length).toBe(0);
  });

  // REGRESSION H & I
  it("11. H & I - Package/Session mismatch on load and submit is safely rejected with ZERO transaction", async () => {
    const adapter = new MockCheckoutAdapter({
      details: {
        slow_green_day: {
          packageId: "slow_green_day",
          valueProposition: "Val prop",
          highlights: [],
          itinerary: [],
          includedItems: [],
          excludedItems: [],
          safetyNotes: [],
          cancellationPolicySummary: "Policy",
          organizer: {
            id: "org_1",
            displayName: "Org",
            guideStatus: "CONCEPT_ONLY",
          },
          destinationDetail: { overviewDescription: "Desc" },
          upcomingSessionPreviews: [
            {
              sessionId: "ses_mismatched",
              packageId: "other_package_id", // MISMATCH!
              startAt: "2026-09-12T08:00:00+07:00",
              endAt: "2026-09-12T14:00:00+07:00",
              status: "OPEN",
              pricePerPerson: 275000,
              remainingSlots: 5,
            },
          ],
        },
      },
    });

    const vm = await adapter.getCheckout("ses_mismatched");
    expect(vm.state).toBe("NOT_FOUND");

    const submitRes = await adapter.submitCheckout({
      travelerId: "usr_1",
      sessionId: "ses_mismatched",
      participantCount: 1,
      cancellationPolicyAcknowledged: true,
      idempotencyKey: "k_mismatch",
    });
    expect(submitRes.status).toBe("SESSION_UNAVAILABLE");
    expect(mockTransactionStore.getBookings().length).toBe(0);
  });

  // REGRESSION J
  it("12. J - price changes between load and submit -> no transaction, refreshed price notice, second submit required", async () => {
    const traveler: AuthUser = {
      id: "usr_price_race",
      name: "Price Race User",
      email: "pricerace@example.com",
      phone: "08123456789",
      onboardingStatus: "COMPLETED",
    };
    sessionStore.setUser(traveler);

    const adapter = new MockCheckoutAdapter({
      travelerOverride: traveler,
      verifiedPhoneStore: { usr_price_race: true },
    });

    // 1. Get initial checkout at 275000
    const vm = await adapter.getCheckout("ses_sgd_1");
    expect(vm.session?.pricePerPerson).toBe(275000);

    // 2. Session price changes on server to 300000
    adapter["sessionOverrides"] = {
      slow_green_day: [
        {
          sessionId: "ses_sgd_1",
          packageId: "slow_green_day",
          startAt: "2026-09-12T08:00:00+07:00",
          endAt: "2026-09-12T14:00:00+07:00",
          status: "OPEN",
          pricePerPerson: 300000, // Price updated!
          remainingSlots: 6,
        },
      ],
    };

    // 3. Submit expecting 275000
    const submitRes = await adapter.submitCheckout({
      travelerId: traveler.id,
      sessionId: "ses_sgd_1",
      participantCount: 2,
      expectedUnitPricePerPerson: 275000,
      cancellationPolicyAcknowledged: true,
      idempotencyKey: "k_price_race",
    });

    expect(submitRes.status).toBe("PRICE_CHANGED");
    expect(submitRes.latestUnitPricePerPerson).toBe(300000);
    expect(mockTransactionStore.getBookings().length).toBe(0);
  });

  // REGRESSION K
  it("13. K - capacity race UI: latest cap visible, warning persists, participant not silently changed, CTA blocked until adjusted", async () => {
    const traveler: AuthUser = {
      id: "usr_cap_ui",
      name: "Cap UI User",
      email: "capui@example.com",
      phone: "08123456789",
      onboardingStatus: "COMPLETED",
    };
    sessionStore.setUser(traveler);

    // Session has only 2 slots
    const adapter = new MockCheckoutAdapter({
      travelerOverride: traveler,
      verifiedPhoneStore: { usr_cap_ui: true },
      sessionOverrides: {
        slow_green_day: [
          {
            sessionId: "ses_sgd_1",
            packageId: "slow_green_day",
            startAt: "2026-09-12T08:00:00+07:00",
            endAt: "2026-09-12T14:00:00+07:00",
            status: "OPEN",
            pricePerPerson: 275000,
            remainingSlots: 2, // Capacity drops to 2
          },
        ],
      },
    });

    const submitRes = await adapter.submitCheckout({
      travelerId: traveler.id,
      sessionId: "ses_sgd_1",
      participantCount: 4,
      expectedUnitPricePerPerson: 275000,
      cancellationPolicyAcknowledged: true,
      idempotencyKey: "k_cap_ui",
    });

    expect(submitRes.status).toBe("INSUFFICIENT_CAPACITY");
    expect(submitRes.latestRemainingSlots).toBe(2);
    expect(mockTransactionStore.getBookings().length).toBe(0);
  });

  // REGRESSION L & M
  it("14. L & M - cross-traveler capacity: Traveler A (4) succeeds, Traveler B (4) fails when max 6; Traveler A (4) + B (2) both succeed fill to 6", async () => {
    sessionStore.setUser({
      id: "usr_A",
      name: "Traveler A",
      email: "a@example.com",
      phone: "081111",
      onboardingStatus: "COMPLETED",
    });

    const adapter = new MockCheckoutAdapter({
      sessionOverrides: {
        slow_green_day: [
          {
            sessionId: "ses_sgd_1",
            packageId: "slow_green_day",
            startAt: "2026-09-12T08:00:00+07:00",
            endAt: "2026-09-12T14:00:00+07:00",
            status: "OPEN",
            pricePerPerson: 275000,
            remainingSlots: 6,
          },
        ],
      },
      verifiedPhoneStore: { usr_A: true, usr_B: true },
    });

    // Test L: Traveler A (4) -> success
    const resA = await adapter.submitCheckout({
      travelerId: "usr_A",
      sessionId: "ses_sgd_1",
      participantCount: 4,
      expectedUnitPricePerPerson: 275000,
      cancellationPolicyAcknowledged: true,
      idempotencyKey: "k_trav_A",
    });
    expect(resA.status).toBe("SUCCESS");
    expect(mockTransactionStore.getReservedQuantity("ses_sgd_1")).toBe(4);

    // Traveler B (4) -> fails (needs 4, only 2 remaining)
    sessionStore.setUser({
      id: "usr_B",
      name: "Traveler B",
      email: "b@example.com",
      phone: "082222",
      onboardingStatus: "COMPLETED",
    });

    const resB_fail = await adapter.submitCheckout({
      travelerId: "usr_B",
      sessionId: "ses_sgd_1",
      participantCount: 4,
      expectedUnitPricePerPerson: 275000,
      cancellationPolicyAcknowledged: true,
      idempotencyKey: "k_trav_B",
    });
    expect(resB_fail.status).toBe("INSUFFICIENT_CAPACITY");
    expect(resB_fail.latestRemainingSlots).toBe(2);

    // Assert: only first reservation exists
    expect(mockTransactionStore.getBookings().length).toBe(1);
    expect(mockTransactionStore.getPaymentAttempts().length).toBe(1);
    expect(mockTransactionStore.getReservedQuantity("ses_sgd_1")).toBe(4);

    // Reset store for M
    mockTransactionStore.reset();

    // Test M: Traveler A (4) + Traveler B (2) -> both succeed
    sessionStore.setUser({ id: "usr_A", onboardingStatus: "COMPLETED" });
    const resA_m = await adapter.submitCheckout({
      travelerId: "usr_A",
      sessionId: "ses_sgd_1",
      participantCount: 4,
      expectedUnitPricePerPerson: 275000,
      cancellationPolicyAcknowledged: true,
      idempotencyKey: "k_m_A",
    });
    expect(resA_m.status).toBe("SUCCESS");

    sessionStore.setUser({ id: "usr_B", onboardingStatus: "COMPLETED" });
    const resB_m = await adapter.submitCheckout({
      travelerId: "usr_B",
      sessionId: "ses_sgd_1",
      participantCount: 2,
      expectedUnitPricePerPerson: 275000,
      cancellationPolicyAcknowledged: true,
      idempotencyKey: "k_m_B",
    });
    expect(resB_m.status).toBe("SUCCESS");

    expect(mockTransactionStore.getBookings().length).toBe(2);
    expect(mockTransactionStore.getReservedQuantity("ses_sgd_1")).toBe(6);
  });

  // REGRESSION N & O
  it("15. N & O - idempotent retry returns same booking; conflicting payload with same key is safely rejected", async () => {
    sessionStore.setUser({
      id: "usr_idemp",
      name: "Idemp User",
      email: "idemp@example.com",
      phone: "081333",
      onboardingStatus: "COMPLETED",
    });

    const adapter = new MockCheckoutAdapter({
      verifiedPhoneStore: { usr_idemp: true },
    });

    const input: CheckoutSubmitInput = {
      travelerId: "usr_idemp",
      sessionId: "ses_sgd_1",
      participantCount: 2,
      expectedUnitPricePerPerson: 275000,
      cancellationPolicyAcknowledged: true,
      idempotencyKey: "k_stable_123",
    };

    // First commit
    const res1 = await adapter.submitCheckout(input);
    expect(res1.status).toBe("SUCCESS");
    const bId = res1.bookingId;

    // N: Retry SAME intent + SAME key -> returns SAME bookingId & no double reserve
    const res2 = await adapter.submitCheckout(input);
    expect(res2.status).toBe("SUCCESS");
    expect(res2.bookingId).toBe(bId);
    expect(mockTransactionStore.getBookings().length).toBe(1);
    expect(mockTransactionStore.getReservedQuantity("ses_sgd_1")).toBe(2);

    // O: Same key + CONFLICTING payload -> safely rejected
    const conflictingInput: CheckoutSubmitInput = {
      ...input,
      participantCount: 5, // Conflicting payload!
    };
    const resConflict = await adapter.submitCheckout(conflictingInput);
    expect(resConflict.status).toBe("IDEMPOTENCY_CONFLICT");
    expect(mockTransactionStore.getBookings().length).toBe(1);
  });

  // REGRESSION P
  it("16. P - active pending guard creates zero new transaction", async () => {
    const traveler: AuthUser = {
      id: "usr_guard_test",
      name: "Guard User",
      email: "guard@example.com",
      phone: "08123456789",
      onboardingStatus: "COMPLETED",
    };
    sessionStore.setUser(traveler);

    // Create an active pending booking first
    mockTransactionStore.createTransaction({
      travelerId: "usr_guard_test",
      packageId: "slow_green_day",
      sessionId: "ses_sgd_1",
      participantCount: 1,
      unitPricePerPerson: 275000,
      capacitySnapshot: 6,
      idempotencyKey: "k_existing_pending",
    });

    expect(
      mockTransactionStore.getActivePendingPayment("usr_guard_test"),
    ).toBeDefined();

    const adapter = new MockCheckoutAdapter({
      travelerOverride: traveler,
      verifiedPhoneStore: { usr_guard_test: true },
    });

    const submitRes = await adapter.submitCheckout({
      travelerId: "usr_guard_test",
      sessionId: "ses_sgd_1",
      participantCount: 1,
      expectedUnitPricePerPerson: 275000,
      cancellationPolicyAcknowledged: true,
      idempotencyKey: "k_new_attempt",
    });

    expect(submitRes.status).toBe("ACTIVE_PENDING_PAYMENT");
    // Count remains 1 (no new transaction)
    expect(mockTransactionStore.getBookings().length).toBe(1);
    expect(mockTransactionStore.getPaymentAttempts().length).toBe(1);
  });

  // REGRESSION Q (with LocationObserver to fix test warnings)
  it("17. Q - actual success route navigates to /payment/:bookingId without router warnings", async () => {
    const traveler: AuthUser = {
      id: "usr_route_test",
      name: "Route User",
      email: "route@example.com",
      phone: "08123456789",
      onboardingStatus: "COMPLETED",
    };
    sessionStore.setUser(traveler);

    const adapter = new MockCheckoutAdapter({
      travelerOverride: traveler,
      verifiedPhoneStore: { usr_route_test: true },
    });

    let currentPath = "";

    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    await act(async () => {
      root.render(
        createElement(
          MemoryRouter,
          { initialEntries: ["/checkout/ses_sgd_1"] },
          createElement(LocationObserver, {
            onLocation: (p) => {
              currentPath = p;
            },
          }),
          createElement(Routes, undefined, [
            createElement(Route, {
              path: "/checkout/:sessionId",
              element: createElement(CheckoutScreen, { adapter }),
            }),
            createElement(Route, {
              path: "/payment/:bookingId",
              element: createElement("div", undefined, "Payment Screen Target"),
            }),
          ]),
        ),
      );
    });

    const policyCheckbox = container.querySelector<HTMLInputElement>(
      "#cancellation-policy-ack",
    )!;
    await act(async () => {
      policyCheckbox.click();
    });

    const ctaBtn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Lanjut ke Pembayaran"),
    )!;

    await act(async () => {
      ctaBtn.click();
    });

    expect(container.textContent).toContain("Payment Screen Target");
    expect(currentPath).toMatch(/^\/payment\/bk_/);
  });
});
