// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { packageRepository } from "../../data/packageRepository";
import { sessionRepository } from "../../data/sessionRepository";
import { App } from "../../App";
import {
  mapPackageRecordToRow,
  mapPackageRowToRecord,
} from "../../lib/supabase/mappers";
import type { PackageRow } from "../../lib/supabase/database.types";
import { CheckoutScreen } from "../checkout/CheckoutScreen";
import { ContactVerificationScreen } from "../contactVerification/ContactVerificationScreen";
import { demoContactVerificationBypass } from "../demo/demoContactVerificationBypass";
import { MyTripsScreen } from "../trips/MyTripsScreen";
import { buildTravelerDraftPreview } from "../eo/buildTravelerDraftPreview";
import { mockDestinationStore } from "../eo/mockDestinationStore";
import { MockCheckoutAdapter } from "../checkout/mockAdapter";
import { mockTransactionStore } from "../checkout/mockTransactionStore";
import {
  calculatePaymentBreakdown,
  getBookingPaymentBreakdown,
} from "../checkout/pricing";
import { EoPackageBuilderScreen } from "../eo/EoPackageBuilderScreen";
import { EoBookingsScreen } from "../eo/EoBookingsScreen";
import {
  mockEoPackageStore,
  SEEDED_LIVE_PACKAGE,
  validateEoPackage,
} from "../eo/mockEoPackageStore";
import { partnerSessionStore } from "../eo/partnerSessionStore";
import { buildTravelerPackageFromEo } from "../marketplace/marketplaceAdapter";
import { sessionStore } from "../onboarding/sessionStore";
import { PackageDetailScreen } from "../packageDetail/PackageDetailScreen";
import { SessionSelectionScreen } from "../sessionSelection/SessionSelectionScreen";
import { TripDetailScreen } from "../trips/TripDetailScreen";
import { DepartureChoices } from "./DepartureChoices";
import {
  getEoDepartureOptions,
  minimumDeparturePrice,
  type DepartureOption,
} from "./departureOptions";

const options: DepartureOption[] = [
  {
    id: "malang",
    areaLabel: "Malang",
    meetingPointLabel: "Alun-Alun Kota Malang",
    departureTimeLabel: "07.00 WIB",
    pricePerPerson: 249000,
  },
  {
    id: "surabaya",
    areaLabel: "Surabaya",
    meetingPointLabel: "Stasiun Surabaya Gubeng",
    departureTimeLabel: "05.00 WIB",
    pricePerPerson: 451400,
  },
];
const traveler = {
  id: "departure_traveler",
  name: "Traveler",
  phone: "08123456789",
  onboardingStatus: "COMPLETED" as const,
};
const pkg = {
  ...SEEDED_LIVE_PACKAGE,
  packageId: "departure_package",
  departureOptions: options,
  pricing: { ...SEEDED_LIVE_PACKAGE.pricing, customerPrice: 249000 },
};
let root: Root | undefined;
let view: HTMLDivElement;
beforeAll(() => Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }));
beforeEach(() => {
  window.sessionStorage.clear();
  mockTransactionStore.reset();
  mockEoPackageStore.reset();
  partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
  sessionStore.setUser(traveler);
  mockEoPackageStore.upsertPackage(pkg);
  mockEoPackageStore.upsertSession({
    sessionId: "departure_session",
    packageId: pkg.packageId,
    eoId: pkg.eoId,
    startAt: "2199-10-10T01:00:00Z",
    endAt: "2199-10-10T08:00:00Z",
    capacity: 12,
    remainingSlots: 12,
    pricePerPerson: 100000,
    status: "OPEN",
    createdAt: new Date().toISOString(),
  });
});
afterEach(async () => {
  vi.restoreAllMocks();
  if (root) await act(() => root!.unmount());
  root = undefined;
  view?.remove();
  mockEoPackageStore.reset();
  mockTransactionStore.reset();
  partnerSessionStore.reset();
  sessionStore.reset();
  window.sessionStorage.clear();
});
async function render(element: ReturnType<typeof createElement>, path = "/") {
  view = document.createElement("div");
  document.body.append(view);
  root = createRoot(view);
  await act(async () =>
    root!.render(
      createElement(MemoryRouter, { initialEntries: [path] }, element),
    ),
  );
  return view;
}
const button = (label: string) =>
  Array.from(view.querySelectorAll<HTMLButtonElement>("button")).find((b) =>
    b.textContent?.includes(label),
  )!;
const adapter = () =>
  new MockCheckoutAdapter({ verifiedPhoneStore: { [traveler.id]: true } });
async function book(optionId = "surabaya", count = 2, key = "departure_key") {
  return adapter().submitCheckout({
    travelerId: traveler.id,
    sessionId: "departure_session",
    departureOptionId: optionId,
    participantCount: count,
    expectedUnitPricePerPerson: options.find((o) => o.id === optionId)!
      .pricePerPerson,
    cancellationPolicyAcknowledged: true,
    idempotencyKey: key,
  });
}

describe("Departure options and per-person Traveler pricing", () => {
  it.each([1, 2])(
    "allows %i authored options and retains their IDs on repeated draft saves",
    (count) => {
      const saved = mockEoPackageStore.saveDraft({
        ...pkg,
        packageId: undefined,
        departureOptions: options.slice(0, count),
      }).package!;
      const again = mockEoPackageStore.saveDraft({ ...saved }).package!;
      expect(again.departureOptions).toEqual(options.slice(0, count));
      expect(validateEoPackage(again, "CERTIFIED_GUIDE").valid).toBe(true);
    },
  );
  it.each(
    [
      [],
      [{ ...options[0], pricePerPerson: 0 }],
      [{ ...options[0], pricePerPerson: -1 }],
      [{ ...options[0], areaLabel: " " }],
      [options[0], options[0]],
    ].map((departures) => ({ departures })),
  )(
    "rejects empty, incomplete, nonpositive or duplicate options at submission",
    ({ departures }) => {
      const saved = mockEoPackageStore.saveDraft({
        ...pkg,
        packageId: undefined,
        departureOptions: departures,
      }).package!;
      const result = mockEoPackageStore.submitForReview(saved.packageId);
      expect(result.success).toBe(false);
      expect(
        result.validationResult.errors.some((e) =>
          e.field.startsWith("departureOptions"),
        ),
      ).toBe(true);
      expect(mockEoPackageStore.getPackageById(saved.packageId)?.status).toBe(
        "DRAFT",
      );
    },
  );
  it("uses the minimum option price for the catalog even with a stale legacy customer price", () => {
    expect(minimumDeparturePrice(options)).toBe(249000);
    expect(
      buildTravelerPackageFromEo({
        ...pkg,
        pricing: { ...pkg.pricing, customerPrice: 1 },
      })?.pricePerPerson,
    ).toBe(249000);
  });
  it.each([1, 2, 4])("charges Rp7.500 times %i participants", (count) => {
    expect(calculatePaymentBreakdown(249000, count)).toEqual({
      unitPrice: 249000,
      participantCount: count,
      subtotal: 249000 * count,
      serviceFee: 7500 * count,
      total: 256500 * count,
    });
  });
  it("keeps the selected Surabaya option through detail, session and checkout navigation", async () => {
    await render(
      createElement(
        Routes,
        {},
        createElement(Route, {
          path: "/packages/:packageId",
          element: createElement(PackageDetailScreen),
        }),
        createElement(Route, {
          path: "/packages/:packageId/sessions",
          element: createElement(SessionSelectionScreen),
        }),
        createElement(Route, {
          path: "/checkout/:sessionId",
          element: createElement(CheckoutScreen, { adapter: adapter() }),
        }),
      ),
      `/packages/${pkg.packageId}`,
    );
    const radio = view.querySelector<HTMLInputElement>(
      'input[value="surabaya"]',
    )!;
    await act(() => radio.click());
    expect(radio.checked).toBe(true);
    await act(() => button("Pilih Jadwal").click());
    expect(
      view.querySelector<HTMLInputElement>('input[value="surabaya"]')?.checked,
    ).toBe(true);
    await act(() =>
      view
        .querySelector<HTMLInputElement>('input[name="session-choice"]')!
        .click(),
    );
    await act(() => button("Lanjut Checkout").click());
    expect(view.textContent).toContain("Stasiun Surabaya Gubeng");
    expect(view.textContent).toContain("Rp451.400 × 1");
    expect(view.textContent).toContain("Rp458.900");
  });
  it("offers departure choice on a direct session route and prevents checkout without a choice", async () => {
    await render(
      createElement(
        Routes,
        {},
        createElement(Route, {
          path: "/packages/:packageId/sessions",
          element: createElement(SessionSelectionScreen),
        }),
      ),
      `/packages/${pkg.packageId}/sessions`,
    );
    await act(() =>
      view
        .querySelector<HTMLInputElement>('input[name="session-choice"]')!
        .click(),
    );
    expect(button("Lanjut Checkout").disabled).toBe(true);
    await act(() =>
      view.querySelector<HTMLInputElement>('input[value="malang"]')!.click(),
    );
    expect(button("Lanjut Checkout").disabled).toBe(false);
  });
  it("requires a valid choice and revalidates the selected option price, never the session/minimum price", async () => {
    const input = {
      travelerId: traveler.id,
      sessionId: "departure_session",
      participantCount: 2,
      expectedUnitPricePerPerson: 249000,
      cancellationPolicyAcknowledged: true,
      idempotencyKey: "invalid",
    };
    expect((await adapter().submitCheckout(input)).status).toBe(
      "INVALID_DRAFT",
    );
    expect(
      (
        await adapter().submitCheckout({
          ...input,
          departureOptionId: "removed",
        })
      ).status,
    ).toBe("INVALID_DRAFT");
    expect(
      (
        await adapter().submitCheckout({
          ...input,
          departureOptionId: "surabaya",
        })
      ).status,
    ).toBe("PRICE_CHANGED");
    expect(mockTransactionStore.getBookings()).toHaveLength(0);
  });
  it("snapshots departure, paid price and fee across package edits, payment and reload; rejects a different-option retry", async () => {
    const result = await book();
    expect(result.status).toBe("SUCCESS");
    const booking = mockTransactionStore.getBookingById(result.bookingId!)!;
    expect(booking).toMatchObject({
      departureOptionId: "surabaya",
      departureAreaLabel: "Surabaya",
      meetingPointLabel: "Stasiun Surabaya Gubeng",
      departureTimeLabel: "05.00 WIB",
      unitPricePerPerson: 451400,
      subtotal: 902800,
      serviceFee: 15000,
      totalAmount: 917800,
    });
    mockEoPackageStore.upsertPackage({
      ...pkg,
      departureOptions: [{ ...options[0], pricePerPerson: 1 }],
    });
    expect((await book("surabaya", 2)).status).toBe("SUCCESS");
    expect((await book("malang", 2)).status).toBe("IDEMPOTENCY_CONFLICT");
    mockTransactionStore.clearMemoryForTesting();
    mockTransactionStore.hydrateFromStorage();
    expect(mockTransactionStore.getBookingById(booking.bookingId)).toEqual(
      booking,
    );
    expect((await book("surabaya", 2)).status).toBe("SUCCESS");
    expect(getBookingPaymentBreakdown(booking).total).toBe(917800);
  });
  it("shows the chosen meeting point in My Trips/Ticket and the organizer booking view", async () => {
    const result = await book();
    const payment = mockTransactionStore.getPaymentAttemptForBooking(
      result.bookingId!,
    );
    expect(payment).toBeDefined();
    // Existing payment boundary creates a paid booking, without repricing.
    expect(
      mockTransactionStore.executePaymentSuccess({
        bookingId: result.bookingId!,
      }).success,
    ).toBe(true);
    await render(
      createElement(
        Routes,
        {},
        createElement(Route, {
          path: "/trips/:bookingId",
          element: createElement(TripDetailScreen),
        }),
      ),
      `/trips/${result.bookingId}`,
    );
    expect(view.textContent).toContain("Stasiun Surabaya Gubeng");
    expect(view.textContent).toContain("05.00 WIB");
    await act(() => root!.unmount());
    root = undefined;
    view.remove();
    await render(createElement(EoBookingsScreen));
    expect(view.textContent).toContain("Surabaya");
    expect(view.textContent).toContain("Stasiun Surabaya Gubeng");
  });
  it("loads the organizer's remote packages after a cold reload before filtering booking snapshots", async () => {
    const result = await book();
    const sessions = [...mockEoPackageStore.getAllSessions()];
    mockEoPackageStore.replaceFromBackend([], []);
    const packageRead = vi
      .spyOn(packageRepository, "getPackagesByEo")
      .mockResolvedValue([pkg]);
    vi.spyOn(sessionRepository, "getSessionsByEo").mockResolvedValue(sessions);
    await render(createElement(EoBookingsScreen));
    expect(packageRead).toHaveBeenCalledWith(pkg.eoId);
    expect(view.textContent).toContain(result.bookingId);
    expect(view.textContent).toContain("Stasiun Surabaya Gubeng");
    expect(view.textContent).toContain("Rp917.800");
  });
  it("round-trips JSONB options through Supabase mappers with stable IDs and a legacy fallback", () => {
    const row = mapPackageRecordToRow(pkg) as PackageRow;
    expect(mapPackageRowToRecord(row).departureOptions).toEqual(options);
    expect(
      getEoDepartureOptions(
        mapPackageRowToRecord({ ...row, departure_options: undefined }),
      )[0].id,
    ).toBe(`legacy_${pkg.packageId}`);
  });
  it("keeps departure, quantity and policy across contact verification and snapshots the resulting payment", async () => {
    const checkout = new MockCheckoutAdapter({
      verifiedPhoneStore: { [traveler.id]: false },
    });
    await render(
      createElement(
        Routes,
        {},
        createElement(Route, {
          path: "/checkout/:sessionId",
          element: createElement(CheckoutScreen, { adapter: checkout }),
        }),
        createElement(Route, {
          path: "/checkout/:sessionId/contact",
          element: createElement(ContactVerificationScreen),
        }),
        createElement(Route, {
          path: "/payment/:bookingId",
          element: createElement("div", {}, "Payment target"),
        }),
      ),
      "/checkout/departure_session?departure=surabaya",
    );
    await act(() =>
      view
        .querySelector<HTMLButtonElement>(
          'button[aria-label="Tambah jumlah peserta"]',
        )!
        .click(),
    );
    await act(() =>
      view.querySelector<HTMLInputElement>("#cancellation-policy-ack")!.click(),
    );
    await act(() => button("Lanjut ke Pembayaran").click());
    expect(view.textContent).toContain("Verifikasi Nomor HP");
    await act(() => button("Lewati").click());
    expect(view.textContent).toContain("Rp451.400 × 2");
    expect(
      view.querySelector<HTMLInputElement>("#cancellation-policy-ack")!.checked,
    ).toBe(true);
    await act(() => button("Lanjut ke Pembayaran").click());
    expect(view.textContent).toContain("Payment target");
    expect(mockTransactionStore.getBookings()[0]).toMatchObject({
      departureOptionId: "surabaya",
      participantCount: 2,
      totalAmount: 917800,
    });
    demoContactVerificationBypass.clear(traveler.id, "departure_session");
  });
  it("offers a choice on direct checkout and blocks payment until one is selected", async () => {
    await render(
      createElement(
        Routes,
        {},
        createElement(Route, {
          path: "/checkout/:sessionId",
          element: createElement(CheckoutScreen, { adapter: adapter() }),
        }),
      ),
      "/checkout/departure_session",
    );
    expect(button("Lanjut ke Pembayaran").disabled).toBe(true);
    await act(() =>
      view.querySelector<HTMLInputElement>('input[value="surabaya"]')!.click(),
    );
    expect(button("Lanjut ke Pembayaran").disabled).toBe(false);
    expect(view.textContent).toContain("Rp458.900");
  });
  it("shows both options in the shared Traveler draft preview without changing the draft URL", async () => {
    const preview = buildTravelerDraftPreview({
      destination: mockDestinationStore.getById(pkg.destinationId),
      organizerId: pkg.eoId,
      organizerName: pkg.eoDisplayName,
      guideStatus: pkg.guideStatus,
      title: pkg.title,
      summary: pkg.shortSummary,
      durationLabel: pkg.durationLabel,
      imageUrls: [],
      itinerary: pkg.itinerary,
      customerPrice: 1,
      departureOptions: options,
      safetyNotes: "",
      includedItems: "",
      excludedItems: "",
      accessNotes: "",
      meetingPointLabel: "",
      departureTimeLabel: "",
      outboundTransport: "",
      returnTransport: "",
    });
    expect(preview.package?.pricePerPerson).toBe(249000);
    await render(
      createElement(PackageDetailScreen, {
        preview: {
          viewModel: preview,
          durationLabel: pkg.durationLabel,
          onClose: () => {},
        },
      }),
      "/partner/eo/packages/new?draftId=existing",
    );
    expect(view.querySelectorAll('input[type="radio"]')).toHaveLength(2);
    await act(() =>
      view.querySelector<HTMLInputElement>('input[value="surabaya"]')!.click(),
    );
    expect(
      view.querySelector<HTMLInputElement>('input[value="surabaya"]')!.checked,
    ).toBe(true);
    expect(view.textContent).not.toContain("Lanjut Checkout");
  });
  it("retains publish/session guards and reserves one shared capacity pool across departures", async () => {
    const draft = mockEoPackageStore.saveDraft({
      ...pkg,
      packageId: undefined,
    }).package!;
    expect(
      mockEoPackageStore.publishApprovedPackage(draft.packageId).success,
    ).toBe(false);
    expect(mockEoPackageStore.submitForReview(draft.packageId).success).toBe(
      true,
    );
    expect(mockEoPackageStore.approvePackage(draft.packageId)).toBe(true);
    expect(
      mockEoPackageStore.publishApprovedPackage(draft.packageId).success,
    ).toBe(true);
    expect(
      mockEoPackageStore.saveDraft({ ...draft, departureOptions: [options[0]] })
        .success,
    ).toBe(false);
    const session = mockEoPackageStore.createSession({
      packageId: draft.packageId,
      startAt: "2199-10-11T01:00:00Z",
      endAt: "2199-10-11T08:00:00Z",
      capacity: 3,
      pricePerPerson: 1,
    }).session!;
    const input = {
      travelerId: traveler.id,
      sessionId: session.sessionId,
      participantCount: 2,
      departureOptionId: "surabaya",
      expectedUnitPricePerPerson: 451400,
      cancellationPolicyAcknowledged: true,
      idempotencyKey: "shared-pool",
    };
    const result = await adapter().submitCheckout(input);
    expect(result.status).toBe("SUCCESS");
    expect(
      (await adapter().getCheckout(session.sessionId)).session?.remainingSlots,
    ).toBe(1);
    expect(
      mockTransactionStore.executePaymentSuccess({
        bookingId: result.bookingId!,
      }).success,
    ).toBe(true);
    expect(
      (
        await adapter().submitCheckout({
          ...input,
          departureOptionId: "malang",
          expectedUnitPricePerPerson: 249000,
          idempotencyKey: "other-option",
        })
      ).status,
    ).toBe("INSUFFICIENT_CAPACITY");
    await render(createElement(MyTripsScreen));
    expect(view.textContent).toContain("Stasiun Surabaya Gubeng");
  });
  it("renders accessible selected state and preserves one option in the builder", async () => {
    await render(
      createElement(DepartureChoices, {
        options,
        selectedId: "surabaya",
        onSelect: () => {},
      }),
    );
    expect(
      view.querySelector<HTMLInputElement>('input[value="surabaya"]')?.checked,
    ).toBe(true);
    expect(view.textContent).toContain("✓ Terpilih");
    await act(() => root!.unmount());
    root = undefined;
    view.remove();
    await render(createElement(EoPackageBuilderScreen));
    await act(() =>
      Array.from(view.querySelectorAll<HTMLButtonElement>(".eo-step-item"))
        .find((b) => b.textContent?.includes("Perjalanan"))!
        .click(),
    );
    expect(view.querySelectorAll(".eo-departure-card")).toHaveLength(1);
    expect(button("Hapus opsi")).toBeUndefined();
    await act(() => button("+ Tambah Titik").click());
    expect(view.querySelectorAll(".eo-departure-card")).toHaveLength(2);
    await act(() => button("Hapus opsi").click());
    expect(view.querySelectorAll(".eo-departure-card")).toHaveLength(1);
  });
  it("removes destination registration from partner entry/login and keeps the old URL informative", async () => {
    await render(createElement(App), "/partner");
    await act(() => button("Masuk sebagai Mitra Destinasi").click());
    expect(view.textContent).not.toContain("Ajukan kemitraan");
    expect(view.textContent).toContain("tim JedaIn");
    await act(() => root!.unmount());
    root = undefined;
    view.remove();
    await render(createElement(App), "/partner/apply/destination");
    expect(view.textContent).toContain("Destinasi dikurasi oleh tim JedaIn");
    expect(view.querySelector("form")).toBeNull();
  });
});
