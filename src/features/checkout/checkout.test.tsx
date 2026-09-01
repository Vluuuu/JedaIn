// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import type { AuthUser } from "../auth/types";
import { sessionStore } from "../onboarding/sessionStore";
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

  it("4. direct URL reload resolves same session from sessionId", async () => {
    sessionStore.setUser({
      id: "usr_reload",
      onboardingStatus: "COMPLETED",
    });

    const view = await renderCheckout("ses_sgd_2");
    expect(view.textContent).toContain("19 September 2026");
  });

  it("5. participant quantity defaults to 1, updates price, and does NOT mutate remainingSlots", async () => {
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

  it("6. exact session price used, subtotal and total math correct, zero invented fees", async () => {
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

  it("7. exact Session price missing + Package price exists -> PRICE_UNAVAILABLE", async () => {
    sessionStore.setUser({ id: "usr_1", onboardingStatus: "COMPLETED" });

    const adapter = new MockCheckoutAdapter({
      verifiedPhoneStore: { usr_1: true },
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
      expectedUnitPricePerPerson: 275000,
      cancellationPolicyAcknowledged: true,
      idempotencyKey: "k1",
    });
    expect(submitRes.status).toBe("PRICE_UNAVAILABLE");
    expect(mockTransactionStore.getBookings().length).toBe(0);
    expect(mockTransactionStore.getPaymentAttempts().length).toBe(0);
  });

  // SEPARATE DIRECT-LOAD STATUS TESTS (BLOCKER 4 & 5)
  it("8. FULL direct Session -> direct SESSION_UNAVAILABLE state with recovery link", async () => {
    const adapter = new MockCheckoutAdapter({
      sessionOverrides: {
        slow_green_day: [
          {
            sessionId: "ses_full_test",
            packageId: "slow_green_day",
            startAt: "2026-09-12T08:00:00+07:00",
            endAt: "2026-09-12T14:00:00+07:00",
            status: "FULL",
            remainingSlots: 0,
          },
        ],
      },
    });

    const vm = await adapter.getCheckout("ses_full_test");
    expect(vm.state).toBe("SESSION_UNAVAILABLE");

    const view = await renderCheckout("ses_full_test", { adapter });
    expect(view.textContent).toContain("Jadwal ini baru saja tidak tersedia.");
    expect(view.textContent).toContain("Pilih Jadwal Lain");
    expect(view.querySelector("#cancellation-policy-ack")).toBeNull();
  });

  it("9. CLOSED direct Session -> direct SESSION_UNAVAILABLE state with recovery link", async () => {
    const adapter = new MockCheckoutAdapter({
      sessionOverrides: {
        slow_green_day: [
          {
            sessionId: "ses_closed_test",
            packageId: "slow_green_day",
            startAt: "2026-09-12T08:00:00+07:00",
            endAt: "2026-09-12T14:00:00+07:00",
            status: "CLOSED",
            remainingSlots: 5,
          },
        ],
      },
    });

    const vm = await adapter.getCheckout("ses_closed_test");
    expect(vm.state).toBe("SESSION_UNAVAILABLE");

    const view = await renderCheckout("ses_closed_test", { adapter });
    expect(view.textContent).toContain("Jadwal ini baru saja tidak tersedia.");
    expect(view.textContent).toContain("Pilih Jadwal Lain");
    expect(view.querySelector("#cancellation-policy-ack")).toBeNull();
  });

  it("10. CANCELLED direct Session -> direct SESSION_UNAVAILABLE state with recovery link", async () => {
    const adapter = new MockCheckoutAdapter({
      sessionOverrides: {
        slow_green_day: [
          {
            sessionId: "ses_cancelled_test",
            packageId: "slow_green_day",
            startAt: "2026-09-12T08:00:00+07:00",
            endAt: "2026-09-12T14:00:00+07:00",
            status: "CANCELLED",
            remainingSlots: 5,
          },
        ],
      },
    });

    const vm = await adapter.getCheckout("ses_cancelled_test");
    expect(vm.state).toBe("SESSION_UNAVAILABLE");

    const view = await renderCheckout("ses_cancelled_test", { adapter });
    expect(view.textContent).toContain("Jadwal ini baru saja tidak tersedia.");
    expect(view.textContent).toContain("Pilih Jadwal Lain");
    expect(view.querySelector("#cancellation-policy-ack")).toBeNull();
  });

  it("11. Session with zero effective remaining slots due to active reservations -> SESSION_UNAVAILABLE UI", async () => {
    // Fill session capacity (6) with active reservation
    mockTransactionStore.createTransaction({
      travelerId: "usr_other",
      packageId: "slow_green_day",
      sessionId: "ses_sgd_1",
      participantCount: 6,
      unitPricePerPerson: 275000,
      capacitySnapshot: 6,
      idempotencyKey: "k_fill_6",
    });

    const adapter = new MockCheckoutAdapter();
    const vm = await adapter.getCheckout("ses_sgd_1");
    expect(vm.state).toBe("SESSION_UNAVAILABLE");
    expect(vm.session?.remainingSlots).toBe(0);

    const view = await renderCheckout("ses_sgd_1", { adapter });
    expect(view.textContent).toContain("Jadwal ini baru saja tidak tersedia.");
    expect(view.textContent).toContain("Pilih Jadwal Lain");
    expect(view.querySelector("#cancellation-policy-ack")).toBeNull();
  });

  // REAL SCREEN-LEVEL CAPACITY RACE TEST (BLOCKER 2 & 3)
  it("12. real screen-level capacity race: capacity drops 6 -> 2, participant count 4 stays 4, warning displayed, CTA disabled until decremented", async () => {
    const traveler: AuthUser = {
      id: "usr_cap_screen",
      name: "Cap Screen User",
      email: "capscreen@example.com",
      phone: "08123456789",
      onboardingStatus: "COMPLETED",
    };
    sessionStore.setUser(traveler);

    const adapter = new MockCheckoutAdapter({
      travelerOverride: traveler,
      verifiedPhoneStore: { usr_cap_screen: true },
    });

    const view = await renderCheckout("ses_sgd_1", { adapter });

    // Step 1: Increase participant count to 4 (default 1 -> click plus 3 times)
    const plusBtn = Array.from(view.querySelectorAll("button")).find(
      (b) => b.getAttribute("aria-label") === "Tambah jumlah peserta",
    )!;
    await act(async () => {
      plusBtn.click();
    });
    await act(async () => {
      plusBtn.click();
    });
    await act(async () => {
      plusBtn.click();
    });
    expect(view.textContent).toContain("4 × Rp275.000");

    // Step 2: Check policy acknowledgement
    const policyCb = view.querySelector<HTMLInputElement>(
      "#cancellation-policy-ack",
    )!;
    await act(async () => {
      policyCb.click();
    });

    // Step 3: Simulate another traveler reserving 4 slots (leaving 2 slots available)
    mockTransactionStore.createTransaction({
      travelerId: "usr_other_tx",
      packageId: "slow_green_day",
      sessionId: "ses_sgd_1",
      participantCount: 4,
      unitPricePerPerson: 275000,
      capacitySnapshot: 6,
      idempotencyKey: "k_other_res_4",
    });

    // Step 4: Click submit CTA
    const ctaBtn = Array.from(view.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Lanjut ke Pembayaran"),
    )!;
    await act(async () => {
      ctaBtn.click();
    });

    // Step 5: Assertions after failed submit race
    // - Stay on checkout (no payment nav)
    expect(view.textContent).toContain("Checkout");
    // - Warning notice visible
    expect(view.textContent).toContain("Slot yang tersedia berubah");
    // - Participant count STILL 4 (not silently changed to 2)
    expect(view.textContent).toContain("4 × Rp275.000");
    // - CTA disabled because 4 > latest available 2
    expect(ctaBtn.disabled).toBe(true);

    // Step 6: Explicitly decrement participant count twice (4 -> 3 -> 2)
    const minusBtn = Array.from(view.querySelectorAll("button")).find(
      (b) => b.getAttribute("aria-label") === "Kurangi jumlah peserta",
    )!;
    await act(async () => {
      minusBtn.click();
    });
    await act(async () => {
      minusBtn.click();
    });

    expect(view.textContent).toContain("2 × Rp275.000");
    // CTA re-enabled for 2 participants!
    expect(ctaBtn.disabled).toBe(false);
  });

  // PRICE-CHANGED SCREEN FLOW TEST (BLOCKER 7)
  it("13. real screen-level price race: price updates 275k -> 300k, notice displayed, new total rendered, second CTA click succeeds", async () => {
    const traveler: AuthUser = {
      id: "usr_price_screen",
      name: "Price Screen User",
      email: "pricescreen@example.com",
      phone: "08123456789",
      onboardingStatus: "COMPLETED",
    };
    sessionStore.setUser(traveler);

    const adapter = new MockCheckoutAdapter({
      travelerOverride: traveler,
      verifiedPhoneStore: { usr_price_screen: true },
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
              element: createElement("div", undefined, "Payment Target Screen"),
            }),
          ]),
        ),
      );
    });

    // Check policy
    const policyCb = container.querySelector<HTMLInputElement>(
      "#cancellation-policy-ack",
    )!;
    await act(async () => {
      policyCb.click();
    });

    // Change server session price to 300000 before submit click
    adapter["sessionOverrides"] = {
      slow_green_day: [
        {
          sessionId: "ses_sgd_1",
          packageId: "slow_green_day",
          startAt: "2026-09-12T08:00:00+07:00",
          endAt: "2026-09-12T14:00:00+07:00",
          status: "OPEN",
          pricePerPerson: 300000, // Updated price
          remainingSlots: 6,
        },
      ],
    };

    // First submit click
    const ctaBtn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Lanjut ke Pembayaran"),
    )!;
    await act(async () => {
      ctaBtn.click();
    });

    // Assert:
    // - Stayed on checkout
    expect(container.textContent).toContain("Harga jadwal berubah");
    // - Zero booking created so far
    expect(mockTransactionStore.getBookings().length).toBe(0);
    // - Display updated unit & total
    expect(container.textContent).toContain("Rp300.000 / orang");
    expect(container.textContent).toContain("Rp300.000");

    // Second submit click with reviewed price (300000)
    await act(async () => {
      ctaBtn.click();
    });

    // Success route to Payment!
    expect(container.textContent).toContain("Payment Target Screen");
    expect(currentPath).toMatch(/^\/payment\/bk_/);
    expect(mockTransactionStore.getBookings().length).toBe(1);
    expect(mockTransactionStore.getBookings()[0].unitPricePerPerson).toBe(
      300000,
    );
  });

  // CONTACT TEST — ACTUAL CONTINUE (BLOCKER 9)
  it("14. verified phone user continues directly to /payment/:bookingId, unverified phone hands off to T11 with zero transaction", async () => {
    const travelerVerified: AuthUser = {
      id: "usr_verified_flow",
      name: "Verified Traveler",
      email: "verified@example.com",
      phone: "08123456789",
      onboardingStatus: "COMPLETED",
    };

    const adapterVerified = new MockCheckoutAdapter({
      travelerOverride: travelerVerified,
      verifiedPhoneStore: { usr_verified_flow: true },
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
              element: createElement(CheckoutScreen, {
                adapter: adapterVerified,
              }),
            }),
            createElement(Route, {
              path: "/payment/:bookingId",
              element: createElement("div", undefined, "Payment Screen"),
            }),
          ]),
        ),
      );
    });

    const policyCb = container.querySelector<HTMLInputElement>(
      "#cancellation-policy-ack",
    )!;
    await act(async () => {
      policyCb.click();
    });

    const ctaBtn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Lanjut ke Pembayaran"),
    )!;
    await act(async () => {
      ctaBtn.click();
    });

    expect(container.textContent).toContain("Payment Screen");
    expect(currentPath).toMatch(/^\/payment\/bk_/);
    expect(mockTransactionStore.getBookings().length).toBe(1);
  });

  // DRAFT VALIDATION & MANDATORY EXPECTED PRICE (BLOCKER 6 & 8)
  it("15. submitCheckout validates draft & requires expectedUnitPricePerPerson integer", async () => {
    const adapter = new MockCheckoutAdapter();
    sessionStore.setUser({
      id: "usr_draft_test",
      onboardingStatus: "COMPLETED",
    });

    // Missing expectedUnitPricePerPerson (invalid type check)
    const resInvalidPrice = await adapter.submitCheckout({
      travelerId: "usr_draft_test",
      sessionId: "ses_sgd_1",
      participantCount: 1,
      expectedUnitPricePerPerson: undefined as unknown as number,
      cancellationPolicyAcknowledged: true,
      idempotencyKey: "k_inv_p",
    });
    expect(resInvalidPrice.status).toBe("INVALID_DRAFT");

    // Non-integer expectedUnitPricePerPerson
    const resFloatPrice = await adapter.submitCheckout({
      travelerId: "usr_draft_test",
      sessionId: "ses_sgd_1",
      participantCount: 1,
      expectedUnitPricePerPerson: 275000.5,
      cancellationPolicyAcknowledged: true,
      idempotencyKey: "k_float_p",
    });
    expect(resFloatPrice.status).toBe("INVALID_DRAFT");

    expect(mockTransactionStore.getBookings().length).toBe(0);
  });

  // TRANSACTION STORE / LOAD CONSISTENCY TEST (BLOCKER 1 & 11)
  it("16. getCheckout reflects active reservations dynamically: base 6 -> 4 reserved -> effective 2 -> +2 reserved -> SESSION_UNAVAILABLE", async () => {
    const adapter = new MockCheckoutAdapter();

    // Initial load: 6 slots
    const vm1 = await adapter.getCheckout("ses_sgd_1");
    expect(vm1.state).toBe("READY");
    expect(vm1.session?.remainingSlots).toBe(6);

    // Create 4 slots reservation
    mockTransactionStore.createTransaction({
      travelerId: "usr_tx_1",
      packageId: "slow_green_day",
      sessionId: "ses_sgd_1",
      participantCount: 4,
      unitPricePerPerson: 275000,
      capacitySnapshot: 6,
      idempotencyKey: "k_tx_1",
    });

    // Re-load: effective remaining slots is 2
    const vm2 = await adapter.getCheckout("ses_sgd_1");
    expect(vm2.state).toBe("READY");
    expect(vm2.session?.remainingSlots).toBe(2);

    // Create remaining 2 slots reservation
    mockTransactionStore.createTransaction({
      travelerId: "usr_tx_2",
      packageId: "slow_green_day",
      sessionId: "ses_sgd_1",
      participantCount: 2,
      unitPricePerPerson: 275000,
      capacitySnapshot: 6,
      idempotencyKey: "k_tx_2",
    });

    // Re-load: session is now SESSION_UNAVAILABLE
    const vm3 = await adapter.getCheckout("ses_sgd_1");
    expect(vm3.state).toBe("SESSION_UNAVAILABLE");
    expect(vm3.session?.remainingSlots).toBe(0);
  });

  // PENDING PAYMENT HANDOFF SEMANTICS (BLOCKER 10)
  it("17. PendingPaymentHandoff contains packageId field rather than calling an ID packageName", async () => {
    const traveler: AuthUser = {
      id: "usr_handoff_test",
      name: "Handoff User",
      email: "handoff@example.com",
      phone: "08123456789",
      onboardingStatus: "COMPLETED",
    };
    sessionStore.setUser(traveler);

    mockTransactionStore.createTransaction({
      travelerId: "usr_handoff_test",
      packageId: "slow_green_day",
      sessionId: "ses_sgd_1",
      participantCount: 1,
      unitPricePerPerson: 275000,
      capacitySnapshot: 6,
      idempotencyKey: "k_handoff_1",
    });

    const activePending =
      mockTransactionStore.getActivePendingPayment("usr_handoff_test");
    expect(activePending).toBeDefined();
    expect(activePending?.packageId).toBe("slow_green_day");
  });

  // CROSS-TRAVELER & IDEMPOTENCY REGRESSIONS
  it("18. cross-traveler capacity enforcement: Traveler A (4) succeeds, Traveler B (4) fails when max 6; Traveler A (4) + B (2) both succeed fill to 6", async () => {
    sessionStore.setUser({ id: "usr_A", onboardingStatus: "COMPLETED" });
    const adapterA = new MockCheckoutAdapter({
      verifiedPhoneStore: { usr_A: true, usr_B: true },
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
    });

    // Traveler A (4) -> success
    const resA = await adapterA.submitCheckout({
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
    sessionStore.setUser({ id: "usr_B", onboardingStatus: "COMPLETED" });
    const adapterB = new MockCheckoutAdapter({
      verifiedPhoneStore: { usr_A: true, usr_B: true },
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
    });

    const resB_fail = await adapterB.submitCheckout({
      travelerId: "usr_B",
      sessionId: "ses_sgd_1",
      participantCount: 4,
      expectedUnitPricePerPerson: 275000,
      cancellationPolicyAcknowledged: true,
      idempotencyKey: "k_trav_B",
    });
    expect(resB_fail.status).toBe("INSUFFICIENT_CAPACITY");
    expect(resB_fail.latestRemainingSlots).toBe(2);

    expect(mockTransactionStore.getBookings().length).toBe(1);

    // Reset store for M
    mockTransactionStore.reset();

    // Traveler A (4) + Traveler B (2) -> both succeed
    sessionStore.setUser({ id: "usr_A", onboardingStatus: "COMPLETED" });
    const resA_m = await adapterA.submitCheckout({
      travelerId: "usr_A",
      sessionId: "ses_sgd_1",
      participantCount: 4,
      expectedUnitPricePerPerson: 275000,
      cancellationPolicyAcknowledged: true,
      idempotencyKey: "k_m_A",
    });
    expect(resA_m.status).toBe("SUCCESS");

    sessionStore.setUser({ id: "usr_B", onboardingStatus: "COMPLETED" });
    const resB_m = await adapterB.submitCheckout({
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

  it("19. idempotent retry returns same booking; conflicting payload with same key is safely rejected", async () => {
    sessionStore.setUser({ id: "usr_idemp", onboardingStatus: "COMPLETED" });
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

    // Retry SAME intent + SAME key -> returns SAME bookingId & no double reserve
    const res2 = await adapter.submitCheckout(input);
    expect(res2.status).toBe("SUCCESS");
    expect(res2.bookingId).toBe(bId);
    expect(mockTransactionStore.getBookings().length).toBe(1);

    // Same key + CONFLICTING payload -> safely rejected
    const conflictingInput: CheckoutSubmitInput = {
      ...input,
      participantCount: 5,
    };
    const resConflict = await adapter.submitCheckout(conflictingInput);
    expect(resConflict.status).toBe("IDEMPOTENCY_CONFLICT");
    expect(mockTransactionStore.getBookings().length).toBe(1);
  });
});
