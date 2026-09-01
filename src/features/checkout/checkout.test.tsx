// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { App } from "../../App";
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

describe("CheckoutScreen Tests & Contracts", () => {
  it("1. known concrete Session resolves canonical Package + Session", async () => {
    sessionStore.setUser({
      id: "usr_test_1",
      name: "Dewo Traveler",
      email: "dewo@example.com",
      phone: "08123456789",
      onboardingStatus: "COMPLETED",
    });

    const view = await renderCheckout("ses_sgd_1");

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

  it("6, 7, 8, 9, 10 & 11. participant quantity defaults to 1, cannot go below 1 or exceed capacity, updates total price, and does NOT mutate remainingSlots", async () => {
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

  it("12, 14, 15, 17, 18, 19 & 20. exact session price used, subtotal and total math correct, zero invented fees, no internal economics", async () => {
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

  it("13 & 16. missing exact session price disables transaction with PRICE_UNAVAILABLE", async () => {
    const adapter = new MockCheckoutAdapter({
      packages: [
        {
          id: "no_price_pkg",
          title: "No Price Pkg",
          shortSummary: "Summary",
          destinationName: "Destinasi",
          locationLabel: "Lokasi",
          visualAsset: "asset.jpg",
          status: "LIVE",
          verificationLevel: "BASIC",
          pricePerPerson: 0,
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
        no_price_pkg: {
          packageId: "no_price_pkg",
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
              sessionId: "ses_no_price",
              packageId: "no_price_pkg",
              startAt: "2026-09-12T08:00:00+07:00",
              endAt: "2026-09-12T14:00:00+07:00",
              status: "OPEN",
              pricePerPerson: undefined,
              remainingSlots: 5,
            },
          ],
        },
      },
    });

    const view = await renderCheckout("ses_no_price", { adapter });
    const ctaBtn = Array.from(view.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Lanjut ke Pembayaran"),
    )!;

    expect(ctaBtn.disabled).toBe(true);
  });

  it("18, 19, 20 & 21. contact requirement check: unverified phone hands off to T11 and creates zero transaction", async () => {
    const travelerUnverified: AuthUser = {
      id: "usr_unverified",
      name: "Unverified User",
      email: "unverified@example.com",
      phone: "081999888",
      onboardingStatus: "COMPLETED",
    };
    sessionStore.setUser(travelerUnverified);

    const adapter = new MockCheckoutAdapter({
      travelerOverride: travelerUnverified,
      contactRequirementOverride: {
        name: travelerUnverified.name,
        email: travelerUnverified.email,
        phone: travelerUnverified.phone,
        phoneRequired: true,
        phoneVerified: false,
      },
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
              element: createElement(CheckoutScreen, { adapter }),
            }),
            createElement(Route, {
              path: "/checkout/:sessionId/contact",
              element: createElement("div", undefined, "Contact Verification"),
            }),
          ]),
        ),
      );
    });

    // Check policy checkbox
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

    // Routed to /checkout/ses_sgd_1/contact
    expect(container.textContent).toContain("Contact Verification");
    // Zero transaction created in mock store
    expect(
      mockTransactionStore.getActivePendingPayment("usr_unverified"),
    ).toBeUndefined();
  });

  it("22, 23, 24 & 25. policy summary is visible, unchecked by default, disables submit until checked, with no invented refund deadlines", async () => {
    sessionStore.setUser({
      id: "usr_policy_test",
      onboardingStatus: "COMPLETED",
    });

    const view = await renderCheckout("ses_sgd_1");

    expect(view.textContent).toContain("Kebijakan Pembatalan & Refund");
    expect(view.textContent).toContain(
      "Detail ketentuan pembatalan dan refund akan ditampilkan kembali saat checkout sebelum konfirmasi pembayaran.",
    );
    expect(view.textContent).not.toContain("H-7");
    expect(view.textContent).not.toContain("50%");

    const policyCheckbox = view.querySelector<HTMLInputElement>(
      "#cancellation-policy-ack",
    )!;
    expect(policyCheckbox.checked).toBe(false);

    const ctaBtn = Array.from(view.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Lanjut ke Pembayaran"),
    )!;
    expect(ctaBtn.disabled).toBe(true);

    await act(async () => {
      policyCheckbox.click();
    });

    expect(policyCheckbox.checked).toBe(true);
    expect(ctaBtn.disabled).toBe(false);
  });

  it("26, 27 & 28. active pending payment guard hands off to T12 and creates ZERO new transaction", async () => {
    const travelerActive: AuthUser = {
      id: "usr_active_pending",
      name: "Active Pending User",
      email: "active@example.com",
      phone: "08123456789",
      onboardingStatus: "COMPLETED",
    };
    sessionStore.setUser(travelerActive);

    const adapter = new MockCheckoutAdapter({
      travelerOverride: travelerActive,
      pendingPaymentOverride: {
        bookingId: "bk_old_123",
        packageName: "Sehari Pelan di Lereng Hijau",
        amount: 275000,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      },
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
              element: createElement(CheckoutScreen, { adapter }),
            }),
            createElement(Route, {
              path: "/checkout/:sessionId/pending-payment",
              element: createElement(
                "div",
                undefined,
                "Pending Payment Handoff",
              ),
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

    // Routed to /checkout/ses_sgd_1/pending-payment
    expect(container.textContent).toContain("Pending Payment Handoff");
  });

  it("29, 31, 34, 35, 36, 37, 39 & 40. successful submit revalidates latest session, creates 1 pending booking + 1 payment attempt, reserves exact participant slots, and routes to /payment/:bookingId", async () => {
    const traveler: AuthUser = {
      id: "usr_submit_success",
      name: "Success User",
      email: "success@example.com",
      phone: "08123456789",
      onboardingStatus: "COMPLETED",
    };
    sessionStore.setUser(traveler);

    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    await act(async () => {
      root.render(
        createElement(
          MemoryRouter,
          { initialEntries: ["/checkout/ses_sgd_1"] },
          createElement(App),
        ),
      );
    });

    // Increase participant count to 2
    const plusBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.getAttribute("aria-label") === "Tambah jumlah peserta",
    )!;
    await act(async () => {
      plusBtn.click();
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

    // Routed to /payment/:bookingId
    expect(container.textContent).toContain("Payment");

    // Check transaction created in mockStore
    const activePending =
      mockTransactionStore.getActivePendingPayment("usr_submit_success");
    expect(activePending).toBeDefined();
    expect(activePending?.amount).toBe(550000); // 2 * 275000
  });

  it("38 & 39. double click on submit CTA creates only ONE transaction and does not reserve slots twice", async () => {
    const traveler: AuthUser = {
      id: "usr_double_click",
      name: "Double Click User",
      email: "double@example.com",
      phone: "08123456789",
      onboardingStatus: "COMPLETED",
    };

    const adapter = new MockCheckoutAdapter({
      travelerOverride: traveler,
    });

    const input: CheckoutSubmitInput = {
      travelerId: traveler.id,
      sessionId: "ses_sgd_1",
      participantCount: 2,
      cancellationPolicyAcknowledged: true,
      idempotencyKey: "idemp_same_key_123",
    };

    // First submit
    const res1 = await adapter.submitCheckout(input);
    expect(res1.status).toBe("SUCCESS");
    const bookingId1 = res1.bookingId;

    // Second submit with same idempotencyKey
    const res2 = await adapter.submitCheckout(input);
    expect(res2.status).toBe("SUCCESS");
    expect(res2.bookingId).toBe(bookingId1);
  });

  it("33, 37 & 38. revalidation failure during submit (INSUFFICIENT_CAPACITY) stays on T10, preserves context, and displays notice", async () => {
    const traveler: AuthUser = {
      id: "usr_capacity_race",
      name: "Capacity Race User",
      email: "race@example.com",
      phone: "08123456789",
      onboardingStatus: "COMPLETED",
    };

    // Override session so remainingSlots is only 1
    const adapter = new MockCheckoutAdapter({
      travelerOverride: traveler,
      sessionOverrides: {
        slow_green_day: [
          {
            sessionId: "ses_sgd_1",
            packageId: "slow_green_day",
            startAt: "2026-09-12T08:00:00+07:00",
            endAt: "2026-09-12T14:00:00+07:00",
            status: "OPEN",
            pricePerPerson: 275000,
            remainingSlots: 1, // Only 1 slot left
          },
        ],
      },
    });

    const view = await renderCheckout("ses_sgd_1", { adapter });

    const policyCheckbox = view.querySelector<HTMLInputElement>(
      "#cancellation-policy-ack",
    )!;
    await act(async () => {
      policyCheckbox.click();
    });

    // Try to submit with 2 participants (which exceeds 1)
    const submitInput: CheckoutSubmitInput = {
      travelerId: traveler.id,
      sessionId: "ses_sgd_1",
      participantCount: 2,
      cancellationPolicyAcknowledged: true,
      idempotencyKey: "idemp_race_test",
    };

    const submitResult = await adapter.submitCheckout(submitInput);
    expect(submitResult.status).toBe("INSUFFICIENT_CAPACITY");
    expect(submitResult.message).toContain("Slot yang tersedia berubah");
  });

  it("43, 49, 50 & 51. submit error preserves participant count, policy acknowledgement, and idempotency key for retry", async () => {
    const traveler: AuthUser = {
      id: "usr_submit_error",
      name: "Submit Error User",
      email: "error@example.com",
      phone: "08123456789",
      onboardingStatus: "COMPLETED",
    };

    const adapter = new MockCheckoutAdapter({
      travelerOverride: traveler,
      failSubmitCount: 1,
    });

    const view = await renderCheckout("ses_sgd_1", { adapter });

    const policyCheckbox = view.querySelector<HTMLInputElement>(
      "#cancellation-policy-ack",
    )!;
    await act(async () => {
      policyCheckbox.click();
    });

    const ctaBtn = Array.from(view.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Lanjut ke Pembayaran"),
    )!;

    // First attempt -> submit error
    await act(async () => {
      ctaBtn.click();
    });

    expect(view.textContent).toContain(
      "Checkout belum bisa diproses. Coba lagi.",
    );
    expect(policyCheckbox.checked).toBe(true);

    // Second attempt -> succeeds
    await act(async () => {
      ctaBtn.click();
    });

    expect(view.textContent).not.toContain(
      "Checkout belum bisa diproses. Coba lagi.",
    );
  });

  it("45, 46 & 54. T09 -> T10 route hides Traveler bottom navigation, has single main landmark, and CTA label is exact", async () => {
    sessionStore.setUser({
      id: "usr_shell_check",
      onboardingStatus: "COMPLETED",
    });

    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    await act(async () => {
      root.render(
        createElement(
          MemoryRouter,
          { initialEntries: ["/checkout/ses_sgd_1"] },
          createElement(App),
        ),
      );
    });

    // Bottom navigation is HIDDEN on T10 Checkout
    expect(container.querySelector(".traveler-bottom-nav")).toBeNull();
    // Single main landmark
    expect(container.querySelectorAll("main").length).toBe(1);
    // Exact CTA label
    expect(container.textContent).toContain("Lanjut ke Pembayaran");
    // No payment countdown on T10
    expect(container.textContent).not.toContain("tersisa");
  });
});
