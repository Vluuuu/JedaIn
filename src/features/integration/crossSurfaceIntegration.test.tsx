// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { adminSessionStore } from "../admin/adminSessionStore";
import { mockAdminDecisionService } from "../admin/mockAdminDecisionService";
import { AdminRouteGuard } from "../admin/AdminRouteGuard";
import { AdminOverviewScreen } from "../admin/AdminOverviewScreen";
import { AdminTrustStatusScreen } from "../admin/AdminTrustStatusScreen";
import { mockContactVerificationStore } from "../contactVerification/mockContactVerificationStore";
import { defaultCheckoutAdapter } from "../checkout/mockAdapter";
import { mockTransactionStore } from "../checkout/mockTransactionStore";
import { resetCompetitionDemoState } from "../demo/demoReset";
import { DestinationRouteGuard } from "../destination/DestinationRouteGuard";
import { DestinationOverviewScreen } from "../destination/DestinationOverviewScreen";
import { DestinationScheduleScreen } from "../destination/DestinationScheduleScreen";
import { DestinationReviewsScreen } from "../destination/DestinationReviewsScreen";
import { mockDestinationStore } from "../eo/mockDestinationStore";
import { mockEoPackageStore } from "../eo/mockEoPackageStore";
import { partnerSessionStore } from "../eo/partnerSessionStore";
import { PartnerRouteGuard } from "../eo/PartnerRouteGuard";
import { EoOverviewScreen } from "../eo/EoOverviewScreen";
import { EoReviewsScreen } from "../eo/EoReviewsScreen";
import { defaultExploreAdapter } from "../explore/mockAdapter";
import { defaultPackageDetailAdapter } from "../packageDetail/mockAdapter";
import { defaultSessionSelectionAdapter } from "../sessionSelection/mockAdapter";
import { defaultTripsAdapter } from "../trips/mockAdapter";
import { defaultReviewAdapter } from "../reviews/mockAdapter";
import { mockReviewStore } from "../reviews/mockReviewStore";
import { sessionStore } from "../onboarding/sessionStore";

let container: HTMLDivElement;
let root: Root;

beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});

async function renderComponent(
  element: React.ReactElement,
  initialEntries = ["/"],
) {
  await act(() =>
    root.render(createElement(MemoryRouter, { initialEntries }, element)),
  );
  return container;
}

describe("Phase 8 Cross-Surface Integration & Hardening (P8-01 - P8-30)", () => {
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    resetCompetitionDemoState();
  });

  afterEach(async () => {
    await act(() => root?.unmount());
    container?.remove();
    resetCompetitionDemoState();
  });

  describe("1. Marketplace Publication & Catalog Bridge (1-7)", () => {
    it("1. Admin-approved package remains APPROVED and absent from Traveler before EO publish", async () => {
      adminSessionStore.loginAsDemoAdmin();
      // SEEDED_PENDING_PACKAGE is pkg_pacet_mindful_retreat
      const approved = mockAdminDecisionService.approvePackage(
        "pkg_pacet_mindful_retreat",
        "Kurasi lolos untuk ritme mindful",
      );
      expect(approved.success).toBe(true);

      const pkg = mockEoPackageStore.getPackageById(
        "pkg_pacet_mindful_retreat",
      );
      expect(pkg?.status).toBe("APPROVED");

      // Check Traveler explore catalog
      const exploreRes = await defaultExploreAdapter.getExplorePackages({});
      const inExplore = exploreRes.packages.some(
        (p) => p.id === "pkg_pacet_mindful_retreat",
      );
      expect(inExplore).toBe(false);

      // Check Traveler package detail
      const detailRes = await defaultPackageDetailAdapter.getPackageDetail(
        "pkg_pacet_mindful_retreat",
      );
      expect(detailRes.state).toBe("NOT_FOUND");
    });

    it("2. Authenticated owner EO publishes APPROVED -> LIVE", async () => {
      adminSessionStore.loginAsDemoAdmin();
      mockAdminDecisionService.approvePackage(
        "pkg_pacet_mindful_retreat",
        "Kurasi lolos untuk ritme mindful",
      );

      // EO login as owner (eo_jeda_alam)
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
      const pubRes = mockEoPackageStore.publishApprovedPackage(
        "pkg_pacet_mindful_retreat",
      );
      expect(pubRes.success).toBe(true);
      expect(pubRes.package?.status).toBe("LIVE");

      const pkg = mockEoPackageStore.getPackageById(
        "pkg_pacet_mindful_retreat",
      );
      expect(pkg?.status).toBe("LIVE");
    });

    it("3. Foreign EO cannot publish another EO package", async () => {
      adminSessionStore.loginAsDemoAdmin();
      mockAdminDecisionService.approvePackage(
        "pkg_pacet_mindful_retreat",
        "Kurasi lolos",
      );

      // Log in as a different EO (eo_kreatif_desa)
      partnerSessionStore.loginAsDemoApproved("CONCEPT_ONLY");
      const pubRes = mockEoPackageStore.publishApprovedPackage(
        "pkg_pacet_mindful_retreat",
      );
      expect(pubRes.success).toBe(false);
      expect(pubRes.message).toContain("bukan pemilik");

      const pkg = mockEoPackageStore.getPackageById(
        "pkg_pacet_mindful_retreat",
      );
      expect(pkg?.status).toBe("APPROVED");
    });

    it("4. Non-approved lifecycle cannot publish", async () => {
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
      // DRAFT package cannot publish directly without Admin approval
      const draftRes = mockEoPackageStore.saveDraft({
        title: "Draf Baru Belum Lolos",
        destinationId: "dest_lereng_hijau",
        shortSummary: "Ringkasan draf 10 karakter minimum",
        durationLabel: "1 hari",
        itinerary: [{ order: 1, title: "A", description: "B" }],
        safetyNotes: ["Aman"],
        pricing: {
          destinationBaseCost: 125000,
          eoMargin: 100000,
          customerPrice: 225000,
        },
      });
      expect(draftRes.success).toBe(true);
      const draftPkgId = draftRes.package!.packageId;

      const pubDraft = mockEoPackageStore.publishApprovedPackage(draftPkgId);
      expect(pubDraft.success).toBe(false);

      // PENDING package cannot publish
      mockEoPackageStore.submitForReview(draftPkgId);
      const pubPending = mockEoPackageStore.publishApprovedPackage(draftPkgId);
      expect(pubPending.success).toBe(false);
    });

    it("5. Published LIVE package becomes visible through Traveler catalog adapter", async () => {
      adminSessionStore.loginAsDemoAdmin();
      mockAdminDecisionService.approvePackage(
        "pkg_pacet_mindful_retreat",
        "Kurasi lolos",
      );

      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
      mockEoPackageStore.publishApprovedPackage("pkg_pacet_mindful_retreat");

      const exploreRes = await defaultExploreAdapter.getExplorePackages({});
      const inExplore = exploreRes.packages.find(
        (p) => p.id === "pkg_pacet_mindful_retreat",
      );
      expect(inExplore).toBeDefined();
      expect(inExplore?.title).toBe("Pagi Hening Tepi Sungai Pacet");
      expect(inExplore?.pricePerPerson).toBe(260000);

      const detailRes = await defaultPackageDetailAdapter.getPackageDetail(
        "pkg_pacet_mindful_retreat",
      );
      expect(detailRes.state).toBe("READY");
      expect(detailRes.detail?.packageId).toBe("pkg_pacet_mindful_retreat");
      expect(detailRes.detail?.organizer.displayName).toBe(
        "Jeda Alam Nusantara",
      );
    });

    it("6. Rejected/non-LIVE package remains hidden", async () => {
      adminSessionStore.loginAsDemoAdmin();
      mockAdminDecisionService.rejectPackage(
        "pkg_pacet_mindful_retreat",
        "Perbaiki durasi sesi hening",
      );

      const exploreRes = await defaultExploreAdapter.getExplorePackages({});
      expect(
        exploreRes.packages.some((p) => p.id === "pkg_pacet_mindful_retreat"),
      ).toBe(false);

      const detailRes = await defaultPackageDetailAdapter.getPackageDetail(
        "pkg_pacet_mindful_retreat",
      );
      expect(detailRes.state).toBe("NOT_FOUND");
    });

    it("7. Inactive destination prevents Traveler marketplace eligibility", async () => {
      // Mark dest_lembah_pacet as INACTIVE
      const dest = mockDestinationStore.getById("dest_lembah_pacet");
      expect(dest).toBeDefined();
      mockDestinationStore.upsertVerifiedDestination({
        ...dest!,
        status: "INACTIVE",
      });

      adminSessionStore.loginAsDemoAdmin();
      mockAdminDecisionService.approvePackage(
        "pkg_pacet_mindful_retreat",
        "Kurasi lolos",
      );
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
      mockEoPackageStore.publishApprovedPackage("pkg_pacet_mindful_retreat");

      const exploreRes = await defaultExploreAdapter.getExplorePackages({});
      expect(
        exploreRes.packages.some((p) => p.id === "pkg_pacet_mindful_retreat"),
      ).toBe(false);
    });
  });

  describe("2. Sessions, Capacity & Shared Booking Flow (8-15)", () => {
    it("8 & 9. EO-created session for LIVE package becomes visible to Traveler", async () => {
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
      const sessRes = mockEoPackageStore.createSession({
        packageId: "slow_green_day",
        startAt: "2026-09-26T08:00:00+07:00",
        endAt: "2026-09-26T14:00:00+07:00",
        capacity: 8,
        pricePerPerson: 275000,
      });
      expect(sessRes.success).toBe(true);
      const newSessionId = sessRes.session!.sessionId;

      const sessionsViewModel =
        await defaultSessionSelectionAdapter.getPackageSessions(
          "slow_green_day",
        );
      expect(sessionsViewModel.state).toBe("READY");
      const foundSession = sessionsViewModel.sessions.find(
        (s) => s.sessionId === newSessionId,
      );
      expect(foundSession).toBeDefined();
      expect(foundSession?.remainingSlots).toBe(8);
      expect(foundSession?.pricePerPerson).toBe(275000);
    });

    it("10. Traveler session capacity uses shared transaction occupancy", async () => {
      // Create pending reservation for 2 participants on ses_sgd_1
      mockTransactionStore.createTransaction({
        travelerId: "usr_other_1",
        packageId: "slow_green_day",
        sessionId: "ses_sgd_1",
        participantCount: 2,
        unitPricePerPerson: 275000,
        capacitySnapshot: 6,
        idempotencyKey: "idemp_occ_test_1",
      });

      const sessionsViewModel =
        await defaultSessionSelectionAdapter.getPackageSessions(
          "slow_green_day",
        );
      const session1 = sessionsViewModel.sessions.find(
        (s) => s.sessionId === "ses_sgd_1",
      );
      expect(session1?.remainingSlots).toBe(4); // 6 initial - 2 reserved
    });

    it("11, 12, 13, 14, 15. Checkout creates ONE shared booking record visible to Traveler, EO, Admin, and Destination", async () => {
      sessionStore.setUser({
        id: "usr_traveler_cross",
        name: "Rina Kusuma",
        email: "rina@example.com",
        phone: "081299887766",
        onboardingStatus: "COMPLETED",
      });
      mockContactVerificationStore.markPhoneVerified(
        "usr_traveler_cross",
        "081299887766",
      );

      const checkoutRes = await defaultCheckoutAdapter.submitCheckout({
        travelerId: "usr_traveler_cross",
        sessionId: "ses_sgd_1",
        participantCount: 2,
        expectedUnitPricePerPerson: 275000,
        cancellationPolicyAcknowledged: true,
        idempotencyKey: "idemp_cross_booking_1",
      });

      expect(checkoutRes.status).toBe("SUCCESS");
      const bookingId = checkoutRes.bookingId!;

      // Pay booking
      const payRes = mockTransactionStore.executePaymentSuccess({ bookingId });
      expect(payRes.success).toBe(true);

      // 1. Traveler sees booking in MyTrips
      const myTrips = await defaultTripsAdapter.getMyTrips();
      expect(
        myTrips.upcomingTrips.some((t) => t.booking.bookingId === bookingId),
      ).toBe(true);

      // 2. EO sees the SAME booking
      const eoBookings = mockTransactionStore
        .getBookings()
        .filter((b) => b.packageId === "slow_green_day");
      expect(eoBookings.some((b) => b.bookingId === bookingId)).toBe(true);

      // 3. Admin sees the SAME booking and payment
      const adminBooking = mockTransactionStore.getBookingById(bookingId);
      expect(adminBooking).toBeDefined();
      expect(adminBooking?.status).toBe("PAID");
      const paymentAttempt =
        mockTransactionStore.getPaymentAttemptForBooking(bookingId);
      expect(paymentAttempt?.status).toBe("SUCCEEDED");

      // 4. Destination sees confirmed participant count on SAME session
      partnerSessionStore.loginAsDemoDestination();
      const view = await renderComponent(
        createElement(DestinationScheduleScreen),
      );
      expect(view.textContent).toContain("Jadwal Sesi Perjalanan di Lokasi");
      expect(view.textContent).toContain("2 / 6 Orang");
    });
  });

  describe("3. Demo Completion & Review Propagation (16-22)", () => {
    it("16 & 17. Demo completion allows ONLY PAID -> COMPLETED on the same booking", async () => {
      sessionStore.setUser({
        id: "usr_traveler_comp",
        name: "Dewi",
        email: "dewi@example.com",
        phone: "081233344455",
        onboardingStatus: "COMPLETED",
      });
      mockContactVerificationStore.markPhoneVerified(
        "usr_traveler_comp",
        "081233344455",
      );

      // Create transaction
      const tx = mockTransactionStore.createTransaction({
        travelerId: "usr_traveler_comp",
        packageId: "slow_green_day",
        sessionId: "ses_sgd_1",
        participantCount: 1,
        unitPricePerPerson: 275000,
        capacitySnapshot: 6,
        idempotencyKey: "idemp_comp_test",
      });
      expect(tx.success).toBe(true);
      if (!tx.success) return;
      const bookingId = tx.booking.bookingId;

      // PENDING_PAYMENT cannot complete
      const failComp = mockTransactionStore.completePaidBookingForDemo({
        travelerId: "usr_traveler_comp",
        bookingId,
      });
      expect(failComp.success).toBe(false);

      // Foreign traveler cannot complete
      mockTransactionStore.executePaymentSuccess({ bookingId });
      const failOwner = mockTransactionStore.completePaidBookingForDemo({
        travelerId: "usr_wrong_traveler",
        bookingId,
      });
      expect(failOwner.success).toBe(false);

      // Valid PAID completion
      const okComp = mockTransactionStore.completePaidBookingForDemo({
        travelerId: "usr_traveler_comp",
        bookingId,
      });
      expect(okComp.success).toBe(true);
      expect(okComp.booking?.status).toBe("COMPLETED");

      // Idempotent repeat
      const repeatComp = mockTransactionStore.completePaidBookingForDemo({
        travelerId: "usr_traveler_comp",
        bookingId,
      });
      expect(repeatComp.success).toBe(true);
      expect(repeatComp.booking?.status).toBe("COMPLETED");
    });

    it("18, 19, 20, 21, 22. Completed booking unlocks Destination + EO review submission and propagates to Destination, EO, and Admin Trust without PII leakage", async () => {
      sessionStore.setUser({
        id: "usr_traveler_rev",
        name: "Budi Reviewer",
        email: "budi@example.com",
        phone: "081277788899",
        onboardingStatus: "COMPLETED",
      });
      mockContactVerificationStore.markPhoneVerified(
        "usr_traveler_rev",
        "081277788899",
      );

      const tx = mockTransactionStore.createTransaction({
        travelerId: "usr_traveler_rev",
        packageId: "slow_green_day",
        sessionId: "ses_sgd_1",
        participantCount: 1,
        unitPricePerPerson: 275000,
        capacitySnapshot: 6,
        idempotencyKey: "idemp_rev_test",
      });
      expect(tx.success).toBe(true);
      if (!tx.success) return;
      const bookingId = tx.booking.bookingId;
      mockTransactionStore.executePaymentSuccess({ bookingId });
      mockTransactionStore.completePaidBookingForDemo({
        travelerId: "usr_traveler_rev",
        bookingId,
      });

      // Submit Destination review
      const destRev = await defaultReviewAdapter.submitReview({
        bookingId,
        targetType: "DESTINATION",
        rating: 5,
        comment: "Kawasan kebun teh sangat sejuk dan damai.",
      });
      expect(destRev.success).toBe(true);

      // Submit EO review
      const eoRev = await defaultReviewAdapter.submitReview({
        bookingId,
        targetType: "EO_GUIDE",
        rating: 5,
        comment: "Pemandu sangat perhatian dan ritme mindful terjaga.",
      });
      expect(eoRev.success).toBe(true);

      // 1. Destination Reviews surface sees the venue review
      partnerSessionStore.loginAsDemoDestination();
      const destView = await renderComponent(
        createElement(DestinationReviewsScreen),
      );
      expect(destView.textContent).toContain("★ 5.0");
      expect(destView.textContent).toContain(
        "Kawasan kebun teh sangat sejuk dan damai.",
      );
      // Verify no traveler PII
      expect(destView.textContent).not.toContain("Budi Reviewer");
      expect(destView.textContent).not.toContain("budi@example.com");

      // 2. EO Reviews surface sees the guide review
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
      const eoView = await renderComponent(createElement(EoReviewsScreen));
      expect(eoView.textContent).toContain("★ 5.0");
      expect(eoView.textContent).toContain(
        "Pemandu sangat perhatian dan ritme mindful terjaga.",
      );
      expect(eoView.textContent).not.toContain("Budi Reviewer");

      // 3. Admin Trust surface derives rating/count from the same review records
      adminSessionStore.loginAsDemoAdmin();
      const adminView = await renderComponent(
        createElement(AdminTrustStatusScreen),
      );
      expect(adminView.textContent).toContain(
        "Trust & Status Pengawasan Mitra",
      );
      expect(adminView.textContent).toContain("★ 5.0 (1)");
    });
  });

  describe("4. Route Guards & Session Isolation (23-27)", () => {
    it("23. Traveler session cannot enter Admin workspace via URL", async () => {
      adminSessionStore.reset();
      const view = await renderComponent(
        createElement(
          Routes,
          null,
          createElement(Route, {
            path: "/admin",
            element: createElement(
              AdminRouteGuard,
              null,
              createElement(AdminOverviewScreen),
            ),
          }),
          createElement(Route, {
            path: "/admin/login",
            element: createElement("div", null, "Admin Login Page"),
          }),
        ),
        ["/admin"],
      );
      expect(view.textContent).toContain("Admin Login Page");
    });

    it("24. EO partner cannot enter Destination operational workspace", async () => {
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
      const view = await renderComponent(
        createElement(
          Routes,
          null,
          createElement(Route, {
            path: "/partner/destination",
            element: createElement(
              DestinationRouteGuard,
              null,
              createElement(DestinationOverviewScreen),
            ),
          }),
          createElement(Route, {
            path: "/partner/login",
            element: createElement("div", null, "Partner Login Page"),
          }),
        ),
        ["/partner/destination"],
      );
      expect(view.textContent).toContain("Partner Login Page");
    });

    it("25. Destination partner cannot enter EO operational workspace", async () => {
      partnerSessionStore.loginAsDemoDestination();
      const view = await renderComponent(
        createElement(
          Routes,
          null,
          createElement(Route, {
            path: "/partner/eo",
            element: createElement(
              PartnerRouteGuard,
              null,
              createElement(EoOverviewScreen),
            ),
          }),
          createElement(Route, {
            path: "/partner/application",
            element: createElement("div", null, "Partner Application Page"),
          }),
        ),
        ["/partner/eo"],
      );
      expect(view.textContent).toContain("Partner Application Page");
    });

    it("26. Admin session does not grant Partner workspace authority", async () => {
      adminSessionStore.loginAsDemoAdmin();
      partnerSessionStore.logout();

      const view = await renderComponent(
        createElement(
          Routes,
          null,
          createElement(Route, {
            path: "/partner/eo",
            element: createElement(
              PartnerRouteGuard,
              null,
              createElement(EoOverviewScreen),
            ),
          }),
          createElement(Route, {
            path: "/partner/login",
            element: createElement("div", null, "Partner Login Page"),
          }),
        ),
        ["/partner/eo"],
      );
      expect(view.textContent).toContain("Partner Login Page");
    });
  });

  describe("5. Deterministic Demo Seed & Reset (28-30)", () => {
    it("28, 29, 30. Reset restores baseline and allows full flow re-run without collision", async () => {
      // 1. Mutate states
      adminSessionStore.loginAsDemoAdmin();
      mockAdminDecisionService.approvePackage(
        "pkg_pacet_mindful_retreat",
        "Lolos",
      );
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
      mockEoPackageStore.publishApprovedPackage("pkg_pacet_mindful_retreat");

      // 2. Perform centralized reset
      resetCompetitionDemoState();

      // 3. Verify baseline restored
      expect(adminSessionStore.get()).toBeNull();
      const pkg = mockEoPackageStore.getPackageById(
        "pkg_pacet_mindful_retreat",
      );
      expect(pkg?.status).toBe("PENDING_ADMIN_REVIEW");
      expect(mockTransactionStore.getBookings().length).toBe(0);
      expect(mockReviewStore.getAllReviews().length).toBe(0);

      // 4. Re-run flow again cleanly
      adminSessionStore.loginAsDemoAdmin();
      const appRes = mockAdminDecisionService.approvePackage(
        "pkg_pacet_mindful_retreat",
        "Kurasi ulang setelah reset",
      );
      expect(appRes.success).toBe(true);

      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
      const pubRes = mockEoPackageStore.publishApprovedPackage(
        "pkg_pacet_mindful_retreat",
      );
      expect(pubRes.success).toBe(true);
      expect(pubRes.package?.status).toBe("LIVE");
    });
  });
});
