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

  describe("1. Authority Boundaries & Operational Mutations Hardening (A-G)", () => {
    it("A. DESTINATION partner spoofing EO id cannot createSession", () => {
      partnerSessionStore.setPartner({
        id: "eo_jeda_alam",
        email: "destinasi@lerenghijau.id",
        name: "Hadi Purnomo",
        role: "DESTINATION",
        businessName: "Pengelola Lereng Hijau Batu",
        destinationIdentityId: "dest_lereng_hijau",
      });

      const res = mockEoPackageStore.createSession({
        packageId: "slow_green_day",
        startAt: "2026-10-01T08:00:00Z",
        endAt: "2026-10-01T14:00:00Z",
        capacity: 6,
        pricePerPerson: 275000,
      });

      expect(res.success).toBe(false);
      expect(res.message).toContain("Hanya EO terautentikasi");
    });

    it("B. DESTINATION partner spoofing EO id cannot saveDraft", () => {
      partnerSessionStore.setPartner({
        id: "eo_jeda_alam",
        email: "destinasi@lerenghijau.id",
        name: "Hadi Purnomo",
        role: "DESTINATION",
        businessName: "Pengelola Lereng Hijau Batu",
        destinationIdentityId: "dest_lereng_hijau",
      });

      const res = mockEoPackageStore.saveDraft({
        title: "Paket Palsu Destinasi",
        destinationId: "dest_lereng_hijau",
        pricing: {
          destinationBaseCost: 125000,
          eoMargin: 100000,
          customerPrice: 225000,
        },
      });

      expect(res.success).toBe(false);
      expect(res.message).toContain("Hanya EO terautentikasi");
    });

    it("C. DESTINATION partner spoofing EO id cannot submitForReview", () => {
      partnerSessionStore.setPartner({
        id: "eo_jeda_alam",
        email: "destinasi@lerenghijau.id",
        name: "Hadi Purnomo",
        role: "DESTINATION",
        businessName: "Pengelola Lereng Hijau Batu",
        destinationIdentityId: "dest_lereng_hijau",
      });

      const res = mockEoPackageStore.submitForReview("slow_green_day");
      expect(res.success).toBe(false);
      expect(res.validationResult.valid).toBe(false);
      expect(res.validationResult.errors[0].message).toContain(
        "Pengguna belum terautentikasi sebagai EO",
      );
    });

    it("D. DESTINATION partner spoofing EO id cannot updateSessionStatus", () => {
      partnerSessionStore.setPartner({
        id: "eo_jeda_alam",
        email: "destinasi@lerenghijau.id",
        name: "Hadi Purnomo",
        role: "DESTINATION",
        businessName: "Pengelola Lereng Hijau Batu",
        destinationIdentityId: "dest_lereng_hijau",
      });

      const ok = mockEoPackageStore.updateSessionStatus("ses_sgd_1", "CLOSED");
      expect(ok).toBe(false);
    });

    it("E. EO role whose authoritative application is NOT APPROVED cannot perform operational mutations", () => {
      partnerSessionStore.setPartner({
        id: "eo_pending_user",
        email: "maya@lestariwellness.id",
        name: "Maya Safira",
        role: "EO",
        businessName: "Lestari Wellness Journey",
        guideStatus: "CERTIFIED_GUIDE",
      });

      // saveDraft
      const draftRes = mockEoPackageStore.saveDraft({
        title: "Paket dari EO Pending",
        destinationId: "dest_lereng_hijau",
        pricing: {
          destinationBaseCost: 125000,
          eoMargin: 100000,
          customerPrice: 225000,
        },
      });
      expect(draftRes.success).toBe(false);
      expect(draftRes.message).toContain("belum berstatus APPROVED");

      // createSession
      const sessRes = mockEoPackageStore.createSession({
        packageId: "slow_green_day",
        startAt: "2026-10-01T08:00:00Z",
        endAt: "2026-10-01T14:00:00Z",
        capacity: 6,
        pricePerPerson: 275000,
      });
      expect(sessRes.success).toBe(false);
      expect(sessRes.message).toContain("belum berstatus APPROVED");
    });

    it("F. Foreign EO cannot publish another EO package", () => {
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

    it("G. Authenticated approved owner: APPROVED -> LIVE succeeds and becomes visible", () => {
      adminSessionStore.loginAsDemoAdmin();
      mockAdminDecisionService.approvePackage(
        "pkg_pacet_mindful_retreat",
        "Kurasi lolos",
      );

      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
      const pubRes = mockEoPackageStore.publishApprovedPackage(
        "pkg_pacet_mindful_retreat",
      );
      expect(pubRes.success).toBe(true);
      expect(pubRes.package?.status).toBe("LIVE");
    });
  });

  describe("2. Review Target Fail-Safe Integrity (13-14)", () => {
    it("13 & 14. Missing destination or organizer targets fail safely without fabricating org_default or bookingId references", async () => {
      sessionStore.setUser({
        id: "usr_fail_safe_test",
        name: "Test User",
        email: "test@example.com",
        phone: "081234567890",
        onboardingStatus: "COMPLETED",
      });

      // Directly insert an orphaned booking whose package has missing details
      mockTransactionStore.addDirectBooking({
        bookingId: "bk_orphaned_pkg",
        travelerId: "usr_fail_safe_test",
        packageId: "pkg_unknown_missing_in_catalog",
        sessionId: "ses_orphaned",
        participantCount: 1,
        unitPricePerPerson: 100000,
        totalAmount: 100000,
        status: "COMPLETED",
        reservedQuantity: 0,
        bookedQuantity: 1,
        createdAt: "2026-08-01T08:00:00Z",
        paymentExpiresAt: "2026-08-01T08:15:00Z",
        paidAt: "2026-08-01T08:05:00Z",
        completedAt: "2026-08-01T15:00:00Z",
      });

      // getReviewContext must return null instead of fabricating org_default
      const eoContext = await defaultReviewAdapter.getReviewContext(
        "bk_orphaned_pkg",
        "EO_GUIDE",
      );
      expect(eoContext).toBeNull();

      const destContext = await defaultReviewAdapter.getReviewContext(
        "bk_orphaned_pkg",
        "DESTINATION",
      );
      expect(destContext).toBeNull();

      // submitReview must fail safely without recording reviews
      const submitRes = await defaultReviewAdapter.submitReview({
        bookingId: "bk_orphaned_pkg",
        targetType: "EO_GUIDE",
        rating: 5,
        comment: "Ulasan palsu",
      });
      expect(submitRes.success).toBe(false);
      expect(mockReviewStore.getAllReviews().length).toBe(0);
    });
  });

  describe("3. ONE True Connected Golden Spine (Same Newly Created Record Across All 4 Surfaces)", () => {
    it("Proves the complete loop with the exact same record: ins_nature_batu_1d + dest_lereng_hijau -> EO Builder -> Admin Approval -> EO Publish -> Session -> Traveler Explore -> Checkout -> Payment -> MyTrips -> EO Bookings -> Admin Bookings -> Destination Schedule/Capacity -> Demo Complete -> Destination/EO Reviews -> Admin Trust", async () => {
      // 1. EO Login (Jeda Alam Nusantara)
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

      // 2. EO creates a NEW package based on ins_nature_batu_1d for dest_lereng_hijau
      const draftResult = mockEoPackageStore.saveDraft({
        title: "Pagi Hening Lereng Hijau Baru",
        shortSummary:
          "Sesi jeda hening dan jalan santai kebun teh bersama pemandu lokal terlatih.",
        valueProposition:
          "Pengalaman mindful di lereng pegunungan asri Batu dengan ritme tenang.",
        destinationId: "dest_lereng_hijau",
        insightId: "ins_nature_batu_1d",
        durationLabel: "1 hari",
        suitableGroupTypes: ["SOLO", "PARTNER", "FRIENDS"],
        highlights: [
          "Jalan santai kebun teh",
          "Sesi jeda napas",
          "Teh herbal lokal",
        ],
        itinerary: [
          {
            order: 1,
            title: "Pagi - Kumpul di Saung Kebun",
            description: "Penyambutan teh hangat.",
            timeOfDayLabel: "Pagi",
            durationLabel: "1 jam",
          },
          {
            order: 2,
            title: "Siang - Jalan Hening & Meditasi",
            description: "Jalan santai perkebunan teh.",
            timeOfDayLabel: "Siang",
            durationLabel: "2.5 jam",
          },
        ],
        includedItems: ["Tiket masuk", "Pemandu lokal", "Teh herbal"],
        excludedItems: ["Transportasi pribadi"],
        safetyNotes: ["Gunakan sepatu nyaman."],
        pricing: {
          destinationBaseCost: 125000,
          eoMargin: 150000,
          customerPrice: 275000,
        },
      });

      expect(draftResult.success).toBe(true);
      const goldenPackageId = draftResult.package!.packageId;
      expect(draftResult.package?.status).toBe("DRAFT");

      // 3. EO Submits for review -> PENDING_ADMIN_REVIEW
      const submitRes = mockEoPackageStore.submitForReview(goldenPackageId);
      expect(submitRes.success).toBe(true);
      expect(submitRes.package?.status).toBe("PENDING_ADMIN_REVIEW");

      // Verify not yet in Traveler Explore
      const explorePre = await defaultExploreAdapter.getExplorePackages({});
      expect(explorePre.packages.some((p) => p.id === goldenPackageId)).toBe(
        false,
      );

      // 4. Admin Login & Curate/Approve Package -> APPROVED
      adminSessionStore.loginAsDemoAdmin();
      const approveRes = mockAdminDecisionService.approvePackage(
        goldenPackageId,
        "Itinerary terstruktur baik, formula harga akurat, destinasi aktif.",
      );
      expect(approveRes.success).toBe(true);

      const pkgApproved = mockEoPackageStore.getPackageById(goldenPackageId);
      expect(pkgApproved?.status).toBe("APPROVED");

      // Verify still not in Traveler Explore (APPROVED is not LIVE)
      const exploreApproved = await defaultExploreAdapter.getExplorePackages(
        {},
      );
      expect(
        exploreApproved.packages.some((p) => p.id === goldenPackageId),
      ).toBe(false);

      // 5. EO Login & Publishes LIVE
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
      const publishRes =
        mockEoPackageStore.publishApprovedPackage(goldenPackageId);
      expect(publishRes.success).toBe(true);
      expect(publishRes.package?.status).toBe("LIVE");

      // 6. EO Creates OPEN Session on the SAME package
      const sessionRes = mockEoPackageStore.createSession({
        packageId: goldenPackageId,
        startAt: "2026-09-26T08:00:00+07:00",
        endAt: "2026-09-26T14:00:00+07:00",
        capacity: 6,
        pricePerPerson: 275000,
      });
      expect(sessionRes.success).toBe(true);
      const goldenSessionId = sessionRes.session!.sessionId;
      expect(sessionRes.session?.status).toBe("OPEN");

      // 7. Traveler Explore sees SAME package
      const exploreLive = await defaultExploreAdapter.getExplorePackages({});
      const foundInExplore = exploreLive.packages.find(
        (p) => p.id === goldenPackageId,
      );
      expect(foundInExplore).toBeDefined();
      expect(foundInExplore?.title).toBe("Pagi Hening Lereng Hijau Baru");
      expect(foundInExplore?.rating).toBeNull(); // No fake 5.0!
      expect(foundInExplore?.popularityRank).toBeNull(); // No fake rank!
      expect(foundInExplore?.experienceIntents).toContain("NATURE");

      // 8. Traveler Package Detail resolves SAME package
      const detailLive =
        await defaultPackageDetailAdapter.getPackageDetail(goldenPackageId);
      expect(detailLive.state).toBe("READY");
      expect(detailLive.detail?.packageId).toBe(goldenPackageId);
      expect(detailLive.detail?.organizer.displayName).toBe(
        "Jeda Alam Nusantara",
      );

      // 9. Traveler Session Selection sees SAME session
      const sessionsLive =
        await defaultSessionSelectionAdapter.getPackageSessions(
          goldenPackageId,
        );
      expect(sessionsLive.state).toBe("READY");
      const foundSession = sessionsLive.sessions.find(
        (s) => s.sessionId === goldenSessionId,
      );
      expect(foundSession).toBeDefined();
      expect(foundSession?.remainingSlots).toBe(6);

      // 10. Traveler Checkout & Payment
      sessionStore.setUser({
        id: "usr_golden_traveler",
        name: "Ahmad Traveler",
        email: "ahmad@traveler.id",
        phone: "081288990011",
        onboardingStatus: "COMPLETED",
      });
      mockContactVerificationStore.markPhoneVerified(
        "usr_golden_traveler",
        "081288990011",
      );

      const checkoutRes = await defaultCheckoutAdapter.submitCheckout({
        travelerId: "usr_golden_traveler",
        sessionId: goldenSessionId,
        participantCount: 2,
        expectedUnitPricePerPerson: 275000,
        cancellationPolicyAcknowledged: true,
        idempotencyKey: "idemp_golden_spine_1",
      });
      expect(checkoutRes.status).toBe("SUCCESS");
      const goldenBookingId = checkoutRes.bookingId!;

      const payRes = mockTransactionStore.executePaymentSuccess({
        bookingId: goldenBookingId,
      });
      expect(payRes.success).toBe(true);
      expect(payRes.booking?.status).toBe("PAID");

      // 11. Proof across surfaces:
      // a. Traveler MyTrips sees booking
      const travelerTrips = await defaultTripsAdapter.getMyTrips();
      expect(
        travelerTrips.upcomingTrips.some(
          (t) => t.booking.bookingId === goldenBookingId,
        ),
      ).toBe(true);

      // b. EO Bookings sees SAME booking
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
      const eoBookings = mockTransactionStore
        .getBookings()
        .filter((b) => b.packageId === goldenPackageId);
      expect(eoBookings.some((b) => b.bookingId === goldenBookingId)).toBe(
        true,
      );

      // c. Admin Bookings sees SAME booking and payment
      adminSessionStore.loginAsDemoAdmin();
      const adminBooking = mockTransactionStore.getBookingById(goldenBookingId);
      expect(adminBooking?.packageId).toBe(goldenPackageId);
      expect(adminBooking?.status).toBe("PAID");
      const adminPayment =
        mockTransactionStore.getPaymentAttemptForBooking(goldenBookingId);
      expect(adminPayment?.status).toBe("SUCCEEDED");

      // d. Destination Lereng Hijau sees SAME session & participant count
      partnerSessionStore.loginAsDemoDestination();
      const destScheduleView = await renderComponent(
        createElement(DestinationScheduleScreen),
      );
      expect(destScheduleView.textContent).toContain(
        "Jadwal Sesi Perjalanan di Lokasi",
      );
      expect(destScheduleView.textContent).toContain("2 / 6 Orang");

      // 12. Traveler completes trip (Prototype Demo Simulation)
      const completeRes = mockTransactionStore.completePaidBookingForDemo({
        travelerId: "usr_golden_traveler",
        bookingId: goldenBookingId,
      });
      expect(completeRes.success).toBe(true);
      expect(completeRes.booking?.status).toBe("COMPLETED");

      // 13. Traveler Submits Venue and EO Reviews
      sessionStore.setUser({
        id: "usr_golden_traveler",
        name: "Ahmad Traveler",
        email: "ahmad@traveler.id",
        phone: "081288990011",
        onboardingStatus: "COMPLETED",
      });

      const destReviewRes = await defaultReviewAdapter.submitReview({
        bookingId: goldenBookingId,
        targetType: "DESTINATION",
        rating: 5,
        comment: "Kawasan Lereng Hijau sangat tenang dan alami.",
      });
      expect(destReviewRes.success).toBe(true);

      const eoReviewRes = await defaultReviewAdapter.submitReview({
        bookingId: goldenBookingId,
        targetType: "EO_GUIDE",
        rating: 5,
        comment: "Pemandu Jeda Alam sangat ramah dan sabar.",
      });
      expect(eoReviewRes.success).toBe(true);

      // 14. Reviews Propagate to Destination, EO, and Admin Trust:
      // a. Destination Reviews
      partnerSessionStore.loginAsDemoDestination();
      const destReviewsView = await renderComponent(
        createElement(DestinationReviewsScreen),
      );
      expect(destReviewsView.textContent).toContain("★ 5.0");
      expect(destReviewsView.textContent).toContain(
        "Kawasan Lereng Hijau sangat tenang dan alami.",
      );
      expect(destReviewsView.textContent).not.toContain("usr_golden_traveler");

      // b. EO Reviews
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
      const eoReviewsView = await renderComponent(
        createElement(EoReviewsScreen),
      );
      expect(eoReviewsView.textContent).toContain("★ 5.0");
      expect(eoReviewsView.textContent).toContain(
        "Pemandu Jeda Alam sangat ramah dan sabar.",
      );
      expect(eoReviewsView.textContent).not.toContain("usr_golden_traveler");

      // c. Admin Trust
      adminSessionStore.loginAsDemoAdmin();
      const adminTrustView = await renderComponent(
        createElement(AdminTrustStatusScreen),
      );
      expect(adminTrustView.textContent).toContain(
        "Trust & Status Pengawasan Mitra",
      );
      expect(adminTrustView.textContent).toContain("★ 5.0 (1)");
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
    it("28, 29, 30. Reset restores clean baseline and ends with all roles logged out", async () => {
      // Mutate states
      adminSessionStore.loginAsDemoAdmin();
      mockAdminDecisionService.approvePackage(
        "pkg_pacet_mindful_retreat",
        "Lolos",
      );
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
      mockEoPackageStore.publishApprovedPackage("pkg_pacet_mindful_retreat");
      sessionStore.setUser({
        id: "usr_reset_test",
        name: "Reset User",
        email: "reset@test.com",
        phone: "0812345678",
        onboardingStatus: "COMPLETED",
      });

      // Perform centralized reset
      resetCompetitionDemoState();

      // Verify baseline restored and all logged out
      expect(adminSessionStore.get()).toBeNull();
      expect(partnerSessionStore.get()).toBeNull();
      expect(sessionStore.get().user).toBeNull();
      const pkg = mockEoPackageStore.getPackageById(
        "pkg_pacet_mindful_retreat",
      );
      expect(pkg?.status).toBe("PENDING_ADMIN_REVIEW");
      expect(mockTransactionStore.getBookings().length).toBe(0);
      expect(mockReviewStore.getAllReviews().length).toBe(0);

      // Re-login as EO & publish again
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
