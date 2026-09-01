// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import type { AuthUser } from "../auth/types";
import { sessionStore } from "../onboarding/sessionStore";
import { DEMO_TRAVELER_HISTORY } from "../trips/demoHistory";
import { TripDetailScreen } from "../trips/TripDetailScreen";
import { MockReviewAdapter } from "./mockAdapter";
import { mockReviewStore } from "./mockReviewStore";
import { TripReviewScreen } from "./TripReviewScreen";

let container: HTMLDivElement;
let root: Root;

beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});

afterEach(async () => {
  await act(() => root?.unmount());
  container?.remove();
  sessionStore.reset();
  mockReviewStore.reset();
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

async function renderReview(
  bookingId = DEMO_TRAVELER_HISTORY.booking.bookingId,
  targetType: "destination" | "eo" = "destination",
  props: { adapter?: MockReviewAdapter } = {},
) {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);

  let currentPath = "";

  await act(async () => {
    root.render(
      createElement(
        MemoryRouter,
        { initialEntries: [`/trips/${bookingId}/review?target=${targetType}`] },
        createElement(LocationObserver, {
          onLocation: (p) => {
            currentPath = p;
          },
        }),
        createElement(
          Routes,
          undefined,
          createElement(Route, {
            path: "/trips/:bookingId/review",
            element: createElement(TripReviewScreen, props),
          }),
          createElement(Route, {
            path: "/trips/:bookingId",
            element: createElement(TripDetailScreen),
          }),
        ),
      ),
    );
  });

  return { container, getPath: () => currentPath };
}

describe("Reviews Feature (T19 & T20) Tests", () => {
  it("1. destination review submission records DESTINATION review and returns to Completed Trip", async () => {
    const traveler: AuthUser = {
      id: "usr_rev_dest",
      onboardingStatus: "COMPLETED",
    };
    sessionStore.setUser(traveler);

    const bId = `bk_demo_completed_${traveler.id}`;
    const { container, getPath } = await renderReview(bId, "destination");

    expect(container.textContent).toContain("Nilai Destinasi");
    expect(container.textContent).toContain("Kirim Penilaian Destinasi");

    // Select star rating (e.g. 5)
    const star5Btn = Array.from(
      container.querySelectorAll(".review-star-btn"),
    )[4] as HTMLButtonElement;
    await act(async () => {
      star5Btn.click();
    });

    // Click submit
    const submitBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Kirim Penilaian Destinasi"),
    )!;

    await act(async () => {
      submitBtn.click();
    });

    // Returned to /trips/:bookingId
    expect(getPath()).toBe(`/trips/${bId}`);

    // Verified in mockReviewStore
    expect(mockReviewStore.hasReviewForBookingTarget(bId, "DESTINATION")).toBe(
      true,
    );
    expect(mockReviewStore.hasReviewForBookingTarget(bId, "EO_GUIDE")).toBe(
      false,
    );
  });

  it("2. EO / Guide review submission records separate EO_GUIDE review and updates progress", async () => {
    const traveler: AuthUser = {
      id: "usr_rev_eo",
      onboardingStatus: "COMPLETED",
    };
    sessionStore.setUser(traveler);

    const bId = `bk_demo_completed_${traveler.id}`;
    const { container, getPath } = await renderReview(bId, "eo");

    expect(container.textContent).toContain("Nilai EO / Guide");
    expect(container.textContent).toContain("Kirim Penilaian EO");

    // Select star rating (e.g. 4)
    const star4Btn = Array.from(
      container.querySelectorAll(".review-star-btn"),
    )[3] as HTMLButtonElement;
    await act(async () => {
      star4Btn.click();
    });

    const submitBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Kirim Penilaian EO"),
    )!;

    await act(async () => {
      submitBtn.click();
    });

    expect(getPath()).toBe(`/trips/${bId}`);

    // Verified in mockReviewStore
    expect(mockReviewStore.hasReviewForBookingTarget(bId, "EO_GUIDE")).toBe(
      true,
    );
  });

  it("3. shared review store helpers correctly resolve reviews for booking, destination, and organizer", () => {
    const bId = "bk_test_store_rev";
    mockReviewStore.submitReview({
      bookingId: bId,
      travelerId: "usr_1",
      targetType: "DESTINATION",
      targetRef: "Lereng Hijau Batu",
      rating: 5,
      comment: "Pemandangan sangat indah",
    });

    mockReviewStore.submitReview({
      bookingId: bId,
      travelerId: "usr_1",
      targetType: "EO_GUIDE",
      targetRef: "org_lereng_guide",
      rating: 4,
      comment: "Guide sangat ramah",
    });

    expect(mockReviewStore.getReviewsForBooking(bId).length).toBe(2);
    expect(
      mockReviewStore.getReviewsForDestination("Lereng Hijau Batu").length,
    ).toBe(1);
    expect(
      mockReviewStore.getReviewsForOrganizer("org_lereng_guide").length,
    ).toBe(1);
  });

  it("P. wrong owner review context is blocked (returns null)", async () => {
    const travelerA: AuthUser = {
      id: "usr_rev_owner_A",
      onboardingStatus: "COMPLETED",
    };
    sessionStore.setUser(travelerA);

    const bId = `bk_demo_completed_${travelerA.id}`;
    const adapter = new MockReviewAdapter();

    // Context valid for Traveler A
    const ctxA = await adapter.getReviewContext(bId, "DESTINATION");
    expect(ctxA).not.toBeNull();

    // Switch to Traveler B -> context blocked
    const travelerB: AuthUser = {
      id: "usr_rev_owner_B",
      onboardingStatus: "COMPLETED",
    };
    sessionStore.setUser(travelerB);

    const ctxB = await adapter.getReviewContext(bId, "DESTINATION");
    expect(ctxB).toBeNull();
  });

  it("Q. wrong owner submit creates zero reviews", async () => {
    const travelerA: AuthUser = {
      id: "usr_rev_owner_A",
      onboardingStatus: "COMPLETED",
    };
    sessionStore.setUser(travelerA);
    const bId = `bk_demo_completed_${travelerA.id}`;

    // Switch to Traveler B
    const travelerB: AuthUser = {
      id: "usr_rev_owner_B",
      onboardingStatus: "COMPLETED",
    };
    sessionStore.setUser(travelerB);

    const adapter = new MockReviewAdapter();
    const res = await adapter.submitReview({
      bookingId: bId,
      targetType: "DESTINATION",
      rating: 5,
    });

    expect(res.success).toBe(false);
    expect(mockReviewStore.getAllReviews().length).toBe(0);
  });

  it("R, S, T. rating 0, 6, and non-integer 1.5 are rejected with zero review created", async () => {
    const traveler: AuthUser = {
      id: "usr_rating_val",
      onboardingStatus: "COMPLETED",
    };
    sessionStore.setUser(traveler);
    const bId = `bk_demo_completed_${traveler.id}`;
    const adapter = new MockReviewAdapter();

    // R: rating 0
    const res0 = await adapter.submitReview({
      bookingId: bId,
      targetType: "DESTINATION",
      rating: 0,
    });
    expect(res0.success).toBe(false);

    // S: rating 6
    const res6 = await adapter.submitReview({
      bookingId: bId,
      targetType: "DESTINATION",
      rating: 6,
    });
    expect(res6.success).toBe(false);

    // T: non-integer 1.5
    const resFloat = await adapter.submitReview({
      bookingId: bId,
      targetType: "DESTINATION",
      rating: 1.5,
    });
    expect(resFloat.success).toBe(false);

    expect(mockReviewStore.getAllReviews().length).toBe(0);
  });

  it("U. valid integer ratings 1–5 succeed", async () => {
    const traveler: AuthUser = {
      id: "usr_valid_rating",
      onboardingStatus: "COMPLETED",
    };
    sessionStore.setUser(traveler);
    const bId = `bk_demo_completed_${traveler.id}`;
    const adapter = new MockReviewAdapter();

    const res = await adapter.submitReview({
      bookingId: bId,
      targetType: "DESTINATION",
      rating: 4,
      comment: "Bagus sekali",
    });

    expect(res.success).toBe(true);
    expect(mockReviewStore.getReviewsForBooking(bId).length).toBe(1);
    expect(mockReviewStore.getReviewsForBooking(bId)[0].rating).toBe(4);
  });

  it("V. duplicate same target submission is idempotent for same owner", async () => {
    const traveler: AuthUser = {
      id: "usr_idemp_rev",
      onboardingStatus: "COMPLETED",
    };
    sessionStore.setUser(traveler);
    const bId = `bk_demo_completed_${traveler.id}`;
    const adapter = new MockReviewAdapter();

    const res1 = await adapter.submitReview({
      bookingId: bId,
      targetType: "DESTINATION",
      rating: 5,
      comment: "First",
    });
    expect(res1.success).toBe(true);

    const res2 = await adapter.submitReview({
      bookingId: bId,
      targetType: "DESTINATION",
      rating: 5,
      comment: "Retry",
    });
    expect(res2.success).toBe(true);

    expect(mockReviewStore.getReviewsForBooking(bId).length).toBe(1);
  });

  it("W. destination and EO reviews remain separate records", async () => {
    const traveler: AuthUser = {
      id: "usr_sep_rev",
      onboardingStatus: "COMPLETED",
    };
    sessionStore.setUser(traveler);
    const bId = `bk_demo_completed_${traveler.id}`;
    const adapter = new MockReviewAdapter();

    await adapter.submitReview({
      bookingId: bId,
      targetType: "DESTINATION",
      rating: 5,
    });

    await adapter.submitReview({
      bookingId: bId,
      targetType: "EO_GUIDE",
      rating: 4,
    });

    expect(mockReviewStore.hasReviewForBookingTarget(bId, "DESTINATION")).toBe(
      true,
    );
    expect(mockReviewStore.hasReviewForBookingTarget(bId, "EO_GUIDE")).toBe(
      true,
    );
    expect(mockReviewStore.getReviewsForBooking(bId).length).toBe(2);
  });
});
