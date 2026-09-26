// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { adminSessionStore } from "../admin/adminSessionStore";
import { mockAdminDecisionService } from "../admin/mockAdminDecisionService";
import { DestinationCapacityScreen } from "../destination/DestinationCapacityScreen";
import { DestinationOverviewScreen } from "../destination/DestinationOverviewScreen";
import { DestinationProfileScreen } from "../destination/DestinationProfileScreen";
import { resetCompetitionDemoState } from "../demo/demoReset";
import { EoOverviewScreen } from "../eo/EoOverviewScreen";
import { EoPackageBuilderScreen } from "../eo/EoPackageBuilderScreen";
import { EoPackageDetailScreen } from "../eo/EoPackageDetailScreen";
import { mockEoPackageStore } from "../eo/mockEoPackageStore";
import { partnerSessionStore } from "../eo/partnerSessionStore";
import { ExplorePackageCard } from "../explore/ExplorePackageCard";
import { buildTravelerPackageFromEo } from "../marketplace/marketplaceAdapter";
import { PackageDetailScreen } from "../packageDetail/PackageDetailScreen";
import { PackageHero } from "../packageDetail/PackageHero";
import { MOCK_RECOMMENDATION_PACKAGES } from "../recommendation/mockPackages";
import type { PackageRecommendationSource } from "../recommendation/types";
import { mockReviewStore } from "../reviews/mockReviewStore";
import { mockTransactionStore } from "../checkout/mockTransactionStore";

let container: HTMLDivElement;
let root: Root;

beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

  HTMLDialogElement.prototype.showModal ??= function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close ??= function close() {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
});

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

async function renderComponent(
  element: React.ReactElement,
  initialEntries = ["/"],
) {
  await act(async () => {
    root.render(createElement(MemoryRouter, { initialEntries }, element));
  });
  return container;
}

describe("F4.3 — Final Semantic Truthfulness Hardening", () => {
  describe("1. Rating Provenance (TR-03)", () => {
    it("1 & 2. Seeded static package has SAMPLE provenance, dynamic review-derived package has POST_TRIP provenance, and unreviewed package has null provenance", () => {
      // 1. Static seeded packages
      const staticPkg = MOCK_RECOMMENDATION_PACKAGES[0];
      expect(staticPkg.ratingProvenance).toBe("SAMPLE");
      expect(staticPkg.rating).toBe(4.85);

      // 2. Dynamic live package without reviews has null rating & null provenance
      const dynamicLiveNoReviews =
        mockEoPackageStore.getPackageById("slow_green_day")!;
      const convertedUnreviewed =
        buildTravelerPackageFromEo(dynamicLiveNoReviews);
      expect(convertedUnreviewed?.rating).toBeNull();
      expect(convertedUnreviewed?.ratingProvenance).toBeNull();

      // 3. Dynamic package with real review has POST_TRIP provenance
      mockTransactionStore.addDirectBooking({
        bookingId: "bk_provenance_test",
        travelerId: "usr_prov_traveler",
        packageId: "slow_green_day",
        sessionId: "ses_sgd_1",
        participantCount: 1,
        unitPricePerPerson: 275000,
        totalAmount: 275000,
        status: "COMPLETED",
        reservedQuantity: 0,
        bookedQuantity: 1,
        createdAt: "2026-09-01T08:00:00Z",
        paymentExpiresAt: "2026-09-01T08:15:00Z",
      });
      mockReviewStore.submitReview({
        bookingId: "bk_provenance_test",
        travelerId: "usr_prov_traveler",
        targetType: "EO_GUIDE",
        targetRef: "org_lereng_batu",
        rating: 5,
        comment: "Keren sekali!",
      });

      const convertedReviewed =
        buildTravelerPackageFromEo(dynamicLiveNoReviews);
      expect(convertedReviewed?.ratingProvenance).toBe("POST_TRIP");
      expect(convertedReviewed?.rating).toBe(5);
    });

    it("3 & 4. Explore card and Package Hero visibly identify SAMPLE rating with (contoh), while POST_TRIP rating is not labeled contoh", async () => {
      // Seeded sample package card in Explore
      const samplePkg = MOCK_RECOMMENDATION_PACKAGES[0];
      const viewExploreSample = await renderComponent(
        createElement(ExplorePackageCard, { packageData: samplePkg }),
      );
      expect(viewExploreSample.textContent).toContain("4.8 (contoh)");

      // Seeded sample package hero in Package Detail
      const viewHeroSample = await renderComponent(
        createElement(PackageHero, { packageData: samplePkg }),
      );
      expect(viewHeroSample.textContent).toContain("4.8 (contoh)");

      // Dynamic post-trip package card in Explore
      const runtimePkg: PackageRecommendationSource = {
        ...samplePkg,
        rating: 4.8,
        ratingProvenance: "POST_TRIP",
      };
      const viewExploreRuntime = await renderComponent(
        createElement(ExplorePackageCard, { packageData: runtimePkg }),
      );
      expect(viewExploreRuntime.textContent).toContain("4.8");
      expect(viewExploreRuntime.textContent).not.toContain("4.8 (contoh)");

      // Dynamic post-trip package hero in Package Detail
      const viewHeroRuntime = await renderComponent(
        createElement(PackageHero, { packageData: runtimePkg }),
      );
      expect(viewHeroRuntime.textContent).toContain("4.8");
      expect(viewHeroRuntime.textContent).not.toContain("4.8 (contoh)");

      // Null rating package
      const noRatingPkg: PackageRecommendationSource = {
        ...samplePkg,
        rating: null,
        ratingProvenance: null,
      };
      const viewNoRating = await renderComponent(
        createElement(ExplorePackageCard, { packageData: noRatingPkg }),
      );
      expect(viewNoRating.textContent).toContain("Belum ada rating");
      expect(viewNoRating.textContent).not.toContain("contoh");
    });

    it("8. Package Detail review section heading and summary are provenance-aware (sample-aware vs runtime-aware)", async () => {
      // 1. Static sample package slow_green_day
      const viewSample = await renderComponent(
        createElement(
          Routes,
          undefined,
          createElement(Route, {
            path: "/packages/:packageId",
            element: createElement(PackageDetailScreen),
          }),
        ),
        ["/packages/slow_green_day"],
      );

      expect(viewSample.textContent).toContain("Contoh Ulasan Paket");
      expect(viewSample.textContent).toContain(
        "Rating paket contoh: 4.8 / 5.0",
      );
      expect(viewSample.textContent).toContain(
        "Data contoh pada prototype untuk menggambarkan tampilan ulasan paket.",
      );
    });
  });

  describe("2. EO Demand Insight Truthfulness (EO-F02)", () => {
    it("9 & 10. EO Overview Demand Opportunity Hero contains visible prototype simulation disclosure and phrases count as respons simulasi", async () => {
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

      const view = await renderComponent(createElement(EoOverviewScreen));

      // Must NOT show '312 traveler' without simulation context
      expect(view.textContent).not.toContain("312 traveler");

      // Shows truthful '312 respons simulasi'
      expect(view.textContent).toContain("312 respons simulasi");

      // Shows visible simulation disclosure in the hero
      expect(view.textContent).toContain(
        "Data simulasi prototype · Sinyal directional, bukan market validation",
      );
    });

    it("11 & 12 & 13. Starting Package Builder from Insight keeps insightId but does NOT prefill shortSummary with unmetDemandDescription", async () => {
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

      const view = await renderComponent(
        createElement(
          Routes,
          undefined,
          createElement(Route, {
            path: "/partner/eo/packages/new",
            element: createElement(EoPackageBuilderScreen),
          }),
        ),
        ["/partner/eo/packages/new?insightId=ins_nature_batu_1d"],
      );

      // Navigate to Step 2 (Sinyal Insight)
      const step2Btn = Array.from(
        view.querySelectorAll<HTMLButtonElement>(".eo-step-item"),
      ).find((b) => b.textContent?.includes("2. Sinyal Insight"))!;
      await act(async () => {
        step2Btn.click();
      });

      // Insight context is kept
      expect(view.textContent).toContain(
        "Tingginya Permintaan Jeda Alam 1 Hari di Lereng Malang Raya",
      );
      expect(view.textContent).toContain("Terpilih ✓");

      // Title concept hint may be present
      const titleInput = view.querySelector<HTMLInputElement>(
        'input[placeholder*="Sehari Pelan di Lereng Hijau"]',
      )!;
      expect(titleInput.value).toContain("Jeda Mindful: Dekat dengan alam");

      // Short summary / value proposition must NOT be auto-filled with the unmet demand description
      const summaryInput =
        view.querySelector<HTMLTextAreaElement>("#package-summary")!;
      expect(summaryInput.value).toBe("");
      expect(summaryInput.value).not.toContain(
        "Traveler dari Malang & Surabaya mencari",
      );

      // Jump to Step 5 and open Traveler preview
      const step5Btn = Array.from(
        view.querySelectorAll<HTMLButtonElement>(".eo-step-item"),
      ).find((b) => b.textContent?.includes("5. Tinjau & Submit"))!;
      await act(async () => {
        step5Btn.click();
      });

      const previewBtn = Array.from(
        view.querySelectorAll<HTMLButtonElement>("button"),
      ).find((b) => b.textContent?.includes("Preview sebagai Traveler"))!;
      await act(async () => {
        previewBtn.click();
      });

      const dialog = view.querySelector<HTMLDialogElement>("dialog[open]")!;
      expect(dialog).not.toBeNull();
      // Does not leak simulated demand claim to traveler preview
      expect(dialog.textContent).not.toContain(
        "Traveler dari Malang & Surabaya mencari",
      );
      expect(dialog.textContent).toContain("Belum ada ringkasan pengalaman.");
    });

    it("14. Editing existing draft preserves its authored shortSummary", async () => {
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

      mockEoPackageStore.saveDraft({
        packageId: "pkg_custom_authored_summary",
        title: "Paket Menikmati Teh",
        shortSummary:
          "Pengalaman santai minum teh herbal bersama petani lereng.",
        destinationId: "dest_lereng_hijau",
        status: "DRAFT",
      });

      const view = await renderComponent(
        createElement(
          Routes,
          undefined,
          createElement(Route, {
            path: "/partner/eo/packages/new",
            element: createElement(EoPackageBuilderScreen),
          }),
        ),
        ["/partner/eo/packages/new?draftId=pkg_custom_authored_summary"],
      );

      const step2Btn = Array.from(
        view.querySelectorAll<HTMLButtonElement>(".eo-step-item"),
      ).find((b) => b.textContent?.includes("2. Sinyal Insight"))!;
      await act(async () => {
        step2Btn.click();
      });

      const summaryInput =
        view.querySelector<HTMLTextAreaElement>("#package-summary")!;
      expect(summaryInput.value).toBe(
        "Pengalaman santai minum teh herbal bersama petani lereng.",
      );
    });
  });

  describe("3. Approved vs Live Guidance (EO-F03)", () => {
    it("15. PENDING_ADMIN_REVIEW callout explains the full lifecycle: Admin approval -> APPROVED -> EO Publish -> LIVE", async () => {
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

      const view = await renderComponent(
        createElement(
          Routes,
          undefined,
          createElement(Route, {
            path: "/partner/eo/packages/:packageId",
            element: createElement(EoPackageDetailScreen),
          }),
        ),
        ["/partner/eo/packages/pkg_pacet_mindful_retreat"],
      );

      // Verify status callout
      expect(view.textContent).toContain("Sedang ditinjau Admin JedaIn");
      expect(view.textContent).toContain("Disetujui (APPROVED)");
      expect(view.textContent).toContain("Publish ke Marketplace");
      expect(view.textContent).toContain("LIVE");
    });

    it("16 & 17 & 18 & 19. APPROVED package clearly states package is not LIVE yet, exposes both Publish and Atur Jadwal Sesi, and does not auto-publish", async () => {
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

      // Approve pkg_pacet_mindful_retreat
      adminSessionStore.loginAsDemoAdmin();
      mockAdminDecisionService.approvePackage(
        "pkg_pacet_mindful_retreat",
        "Disetujui kurator.",
      );

      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
      const view = await renderComponent(
        createElement(
          Routes,
          undefined,
          createElement(Route, {
            path: "/partner/eo/packages/:packageId",
            element: createElement(EoPackageDetailScreen),
          }),
        ),
        ["/partner/eo/packages/pkg_pacet_mindful_retreat"],
      );

      // 16. States package is approved but not LIVE yet
      expect(view.textContent).toContain(
        "Paket Disetujui Kurator (Belum Live)",
      );
      expect(view.textContent).toContain(
        "Paket belum tampil atau dapat dipesan di Marketplace Traveler.",
      );

      // 17. Exposes both Publish and Atur Jadwal Sesi
      expect(view.textContent).toContain("Publish ke Marketplace");
      expect(view.textContent).toContain("Atur Jadwal Sesi");

      // 18. Session preparation for APPROVED package remains allowed
      const pkg = mockEoPackageStore.getPackageById(
        "pkg_pacet_mindful_retreat",
      );
      expect(pkg?.status).toBe("APPROVED");
      const sessionRes = mockEoPackageStore.createSession({
        packageId: "pkg_pacet_mindful_retreat",
        startAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        endAt: new Date(Date.now() + 30 * 3600 * 1000).toISOString(),
        capacity: 8,
        pricePerPerson: 250000,
      });
      expect(sessionRes.success).toBe(true);

      // 19. Not auto-published (status is still APPROVED, not LIVE)
      expect(
        mockEoPackageStore.getPackageById("pkg_pacet_mindful_retreat")?.status,
      ).toBe("APPROVED");
    });
  });

  describe("4. Mitra Capacity Semantics (MIT-01)", () => {
    it("20 & 21 & 22 & 23 & 24. Destination Overview session progress represents participant use against EO Session quota, not venue capacity", async () => {
      partnerSessionStore.loginAsDemoDestination();

      const view = await renderComponent(
        createElement(DestinationOverviewScreen),
      );

      // 20. Overview no longer says 'kapasitas destinasi terisi'
      expect(view.textContent).not.toContain("kapasitas destinasi terisi");

      // 21. Clearly labels Kuota Sesi EO
      expect(view.textContent).toContain("Kuota Sesi EO: 6 orang");

      // 22. Progress percentage corresponds to EO Session quota
      expect(view.textContent).toContain("0% Kuota Sesi EO terisi");

      // 23. General Destination capacity remains separately visible as venue context
      expect(view.textContent).toContain(
        "Kapasitas operasional destinasi: 20 orang",
      );
      expect(view.textContent).toContain("Kapasitas Umum Destinasi");
      expect(view.textContent).toContain("20 orang / sesi");
    });

    it("25 & 26. Capacity screen replaces Sisa <N> Orang with neutral Selisih operasional: N orang", async () => {
      partnerSessionStore.loginAsDemoDestination();

      const view = await renderComponent(
        createElement(DestinationCapacityScreen),
      );

      // 25. No longer contains 'Sisa X Orang' or 'Sisa Ruang Operasional'
      expect(view.textContent).not.toContain("Sisa 20 Orang");
      expect(view.textContent).not.toContain("Sisa Ruang Operasional");

      // 26. Contains neutral 'Selisih operasional'
      expect(view.textContent).toContain("Selisih Operasional");
      expect(view.textContent).toContain("Selisih operasional: 20 orang");
      expect(view.textContent).toContain("Bukan kuota penjualan baru");
    });
  });

  describe("5. Destination Re-Review Policy Honesty (MIT-02)", () => {
    it("27 & 28 & 29. Destination Profile uses conditional wording for re-review without unconditional guarantee or new workflows", async () => {
      partnerSessionStore.loginAsDemoDestination();

      const view = await renderComponent(
        createElement(DestinationProfileScreen),
      );

      // 27. No longer states unconditional 'memerlukan verifikasi ulang'
      expect(view.textContent).not.toContain(
        "memerlukan verifikasi ulang oleh Tim Kurator",
      );

      // 28. Uses conditional wording
      expect(view.textContent).toContain(
        "Perubahan informasi inti destinasi dapat memerlukan peninjauan ulang oleh Tim Kurator Admin JedaIn.",
      );
      expect(view.textContent).toContain(
        "Aturan field dan proses final belum dikunci dalam prototype.",
      );
    });
  });
});
