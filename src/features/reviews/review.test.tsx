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
  bookingId = DEMO_TRAVELER_HISTORY.bookingId,
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

    const bId = DEMO_TRAVELER_HISTORY.bookingId;
    const { container, getPath } = await renderReview(bId, "destination");

    expect(container.textContent).toContain("Nilai Destinasi");
    expect(container.textContent).toContain("Kirim Penilaian Destinasi");

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

    const bId = DEMO_TRAVELER_HISTORY.bookingId;
    const { container, getPath } = await renderReview(bId, "eo");

    expect(container.textContent).toContain("Nilai EO / Guide");
    expect(container.textContent).toContain("Kirim Penilaian EO");

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
});
