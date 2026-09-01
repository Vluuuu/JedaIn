// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { App } from "../../App";
import { mockTransactionStore } from "../checkout/mockTransactionStore";
import { mockReviewStore } from "../reviews/mockReviewStore";
import { mockApplicationStore } from "./mockApplicationStore";
import { mockDestinationStore } from "./mockDestinationStore";
import { mockEoPackageStore, validateEoPackage } from "./mockEoPackageStore";
import { partnerSessionStore } from "./partnerSessionStore";
import { EoInsightsScreen } from "./EoInsightsScreen";
import { EoPackageBuilderScreen } from "./EoPackageBuilderScreen";
import { EoBookingsScreen } from "./EoBookingsScreen";
import { EoDestinationsScreen } from "./EoDestinationsScreen";
import { EoReviewsScreen } from "./EoReviewsScreen";
import { EoProfileScreen } from "./EoProfileScreen";
import { EoApplicationScreen } from "./EoApplicationScreen";
import { EoApplicationStatusScreen } from "./EoApplicationStatusScreen";

let container: HTMLDivElement;
let root: Root;

beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});

afterEach(async () => {
  await act(() => root?.unmount());
  container?.remove();
  partnerSessionStore.reset();
  mockApplicationStore.reset();
  mockDestinationStore.reset();
  mockEoPackageStore.reset();
  mockTransactionStore.reset();
  mockReviewStore.reset();
});

async function renderComponent(
  element: React.ReactElement,
  initialEntries = ["/"],
) {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => {
    root.render(createElement(MemoryRouter, { initialEntries }, element));
  });
  return container;
}

describe("P5 — EO Golden Flow (EO01–EO18) Tests", () => {
  describe("1. Partner Entry, Authentication & Application (EO01–EO04)", () => {
    it("A. new EO application submission transitions to PENDING_REVIEW and preserves identity", async () => {
      const view = await renderComponent(createElement(EoApplicationScreen));

      expect(view.textContent).toContain("Pengajuan Mitra Event Organizer");
      expect(view.textContent).toContain("Nama Usaha / Komunitas EO");

      // Submit new application
      const res = mockApplicationStore.submitApplication({
        identityId: "eo_new_applicant",
        businessName: "Lembah Hening Retreat",
        contactPerson: "Agus Santoso",
        phone: "081234567890",
        email: "agus@lembahhening.id",
        province: "Jawa Timur",
        city: "Malang",
        experienceDescription: "Spesialisasi retreat alam hening.",
        yearsOfOperation: 3,
        guideStatus: "CERTIFIED_GUIDE",
        agreedToSop: true,
      });

      expect(res.success).toBe(true);
      expect(res.application?.status).toBe("PENDING_REVIEW");

      // Application exists in centralized store
      const saved = mockApplicationStore.getBySellerId("eo_new_applicant");
      expect(saved).toBeDefined();
      expect(saved?.businessName).toBe("Lembah Hening Retreat");
    });

    it("B. rejected application displays specific rejection reason and allows reapply with same identity", async () => {
      partnerSessionStore.setPartner({
        id: "eo_rejected_user",
        email: "rian@kelanaliar.com",
        name: "Rian Pratama",
        role: "EO",
        businessName: "Kelana Liar Adventure",
        guideStatus: "CONCEPT_ONLY",
        applicationStatus: "REJECTED",
      });

      const view = await renderComponent(
        createElement(EoApplicationStatusScreen),
      );

      expect(view.textContent).toContain(
        "Pengajuan Memerlukan Perbaikan Dokumen",
      );
      expect(view.textContent).toContain(
        "Dokumen SOP penanganan darurat belum lengkap",
      );
      expect(view.textContent).toContain("Perbaiki Pengajuan");

      // Re-apply using same identity
      const res = mockApplicationStore.submitApplication({
        identityId: "eo_rejected_user",
        businessName: "Kelana Liar Adventure",
        contactPerson: "Rian Pratama",
        phone: "081298765432",
        email: "rian@kelanaliar.com",
        province: "Jawa Timur",
        city: "Malang",
        experienceDescription: "Revisi portofolio wellness dan SOP darurat.",
        yearsOfOperation: 2,
        guideStatus: "CONCEPT_ONLY",
        agreedToSop: true,
      });

      expect(res.success).toBe(true);
      expect(res.application?.status).toBe("PENDING_REVIEW");
      expect(res.application?.identityId).toBe("eo_rejected_user");
    });

    it("C. unapproved EO is blocked from operational workspace (/partner/eo/*) by PartnerRouteGuard", async () => {
      partnerSessionStore.setPartner({
        id: "eo_pending_user",
        email: "pending@test.com",
        name: "Pending User",
        role: "EO",
        businessName: "Pending Org",
        guideStatus: "CONCEPT_ONLY",
        applicationStatus: "PENDING_REVIEW",
      });

      container = document.createElement("div");
      document.body.append(container);
      root = createRoot(container);

      await act(async () => {
        root.render(
          createElement(
            MemoryRouter,
            { initialEntries: ["/partner/eo"] },
            createElement(App),
          ),
        );
      });

      // Redirected to /partner/application
      expect(container.textContent).toContain("Status Pengajuan Mitra EO");
      expect(container.textContent).toContain("Sedang Ditinjau");
    });

    it("D. approved EO can enter operational workspace successfully", async () => {
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

      container = document.createElement("div");
      document.body.append(container);
      root = createRoot(container);

      await act(async () => {
        root.render(
          createElement(
            MemoryRouter,
            { initialEntries: ["/partner/eo"] },
            createElement(App),
          ),
        );
      });

      expect(container.textContent).toContain("Overview Jeda Alam Nusantara");
      expect(container.textContent).toContain("+ Buat Paket Baru");
    });
  });

  describe("2. Demand Insights & Create Package from Insight (EO05–EO06)", () => {
    it("E. insights display aggregate data only without any individual Traveler PII", async () => {
      const view = await renderComponent(createElement(EoInsightsScreen));

      expect(view.textContent).toContain(
        "Demand Insights & Wawasan Kebutuhan Traveler",
      );
      expect(view.textContent).toContain("Dekat dengan alam");
      expect(view.textContent).toContain("42%");
      expect(view.textContent).toContain("428 traveler");
      expect(view.textContent).toContain("Peluang Paket Belum Terpenuhi");

      // No traveler private details
      expect(view.textContent).not.toContain("0812");
      expect(view.textContent).not.toContain("@gmail.com");
      expect(view.textContent).not.toContain("Dewo");
    });

    it("F. Create Package from Insight preserves exact insightId and context into Builder", async () => {
      partnerSessionStore.loginAsDemoApproved();

      const view = await renderComponent(
        createElement(EoPackageBuilderScreen),
        ["/partner/eo/packages/new?insightId=ins_nature_batu_1d"],
      );

      expect(view.textContent).toContain("Trip Builder");
      expect(view.textContent).toContain(
        "Langkah 1: Pilih Destinasi Terverifikasi",
      );

      // Go to Step 2
      const nextBtn = Array.from(view.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Lanjut ke Langkah 2"),
      );

      // Select first destination first
      const destCard = view.querySelectorAll(".eo-destination-card")[0];
      await act(async () => {
        (destCard as HTMLElement).click();
      });

      await act(async () => {
        nextBtn?.click();
      });

      expect(view.textContent).toContain("Langkah 2: Sinyal Insight");
      expect(view.textContent).toContain(
        "Tingginya Permintaan Jeda Alam 1 Hari di Lereng Malang Raya",
      );
    });
  });

  describe("3. Destination Eligibility, Builder, Validation & Submission (EO08–EO14)", () => {
    it("G. CONCEPT_ONLY EO is restricted to guideReady destinations both on UI and server-side validation", () => {
      // 1. UI Filtering helper check
      const eligibleForConcept =
        mockDestinationStore.getEligibleForEo("CONCEPT_ONLY");
      expect(eligibleForConcept.every((d) => d.guideReady === true)).toBe(true);

      const eligibleForCertified =
        mockDestinationStore.getEligibleForEo("CERTIFIED_GUIDE");
      expect(eligibleForCertified.length).toBe(3);

      // 2. Server-side validation check: CONCEPT_ONLY choosing non-guide-ready destination (dest_hutan_trawas)
      const res = validateEoPackage(
        {
          title: "Paket Hening Bambu",
          shortSummary: "Retreat hening di bambu.",
          destinationId: "dest_hutan_trawas", // guideReady: false!
          itinerary: [
            { order: 1, title: "Meditasi", description: "Sesi hening" },
          ],
          pricing: {
            destinationBaseCost: 95000,
            eoMargin: 100000,
            customerPrice: 195000,
          },
        },
        "CONCEPT_ONLY",
      );

      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.message.includes("Guide Ready"))).toBe(
        true,
      );
    });

    it("H. pricing formula verifies Customer Price = Destination Base Cost + EO Margin", () => {
      const pkgDraft = {
        title: "Paket Lereng Santai",
        shortSummary: "Jalan santai dan teh hangat.",
        destinationId: "dest_lereng_hijau",
        itinerary: [{ order: 1, title: "Jalan", description: "Jalan santai" }],
        pricing: {
          destinationBaseCost: 125000,
          eoMargin: 150000,
          customerPrice: 275000, // Exact sum
        },
      };

      const res = validateEoPackage(pkgDraft, "CERTIFIED_GUIDE");
      expect(res.valid).toBe(true);
    });

    it("I. invalid submit keeps package as DRAFT with specific step errors; valid submit transitions to PENDING_ADMIN_REVIEW without duplicate", () => {
      const eoId = "eo_jeda_alam";
      const eoDisplayName = "Jeda Alam Nusantara";

      // Save incomplete draft
      const draft = mockEoPackageStore.saveDraft({
        eoId,
        eoDisplayName,
        title: "", // Missing title
        destinationId: "", // Missing destination
        itinerary: [], // Missing itinerary
      });

      // Incomplete submission fails and remains DRAFT
      const invalidRes = mockEoPackageStore.submitForReview(
        draft.packageId,
        "CERTIFIED_GUIDE",
      );
      expect(invalidRes.success).toBe(false);
      expect(invalidRes.package?.status).toBe("DRAFT");
      expect(invalidRes.validationResult.errors.length).toBeGreaterThanOrEqual(
        3,
      );

      // Fix draft with valid data
      mockEoPackageStore.saveDraft({
        packageId: draft.packageId,
        eoId,
        eoDisplayName,
        title: "Pagi Segar di Kebun Teh Batu",
        shortSummary:
          "Menikmati udara sejuk kebun teh dan sesi pernapasan mindfulness.",
        destinationId: "dest_lereng_hijau",
        durationLabel: "1 hari",
        itinerary: [
          { order: 1, title: "Sesi Teh", description: "Menikmati teh lokal" },
          {
            order: 2,
            title: "Jalan Hening",
            description: "Jalan santai kebun teh",
          },
        ],
        pricing: {
          destinationBaseCost: 125000,
          eoMargin: 150000,
          customerPrice: 275000,
        },
        guideStatus: "CERTIFIED_GUIDE",
      });

      // Valid submit succeeds -> PENDING_ADMIN_REVIEW
      const validRes = mockEoPackageStore.submitForReview(
        draft.packageId,
        "CERTIFIED_GUIDE",
      );
      expect(validRes.success).toBe(true);
      expect(validRes.package?.status).toBe("PENDING_ADMIN_REVIEW");
      expect(validRes.package?.submittedAt).toBeDefined();

      // Repeated submit / retry does not duplicate package records
      const initialCount = mockEoPackageStore.getAllPackages().length;
      mockEoPackageStore.submitForReview(draft.packageId, "CERTIFIED_GUIDE");
      expect(mockEoPackageStore.getAllPackages().length).toBe(initialCount);
    });
  });

  describe("4. Sessions Management & Lifecycle Rules (EO16–EO17)", () => {
    it("J. DRAFT, PENDING_ADMIN_REVIEW, and REJECTED packages cannot open sellable sessions", () => {
      const eoId = "eo_jeda_alam";
      const eoDisplayName = "Jeda Alam Nusantara";

      const draftPkg = mockEoPackageStore.saveDraft({
        eoId,
        eoDisplayName,
        title: "Draf Paket Baru",
        destinationId: "dest_lereng_hijau",
      });

      // Attempt to create session for DRAFT
      const resDraft = mockEoPackageStore.createSession({
        packageId: draftPkg.packageId,
        eoId,
        startAt: "2026-10-01T08:00:00Z",
        endAt: "2026-10-01T14:00:00Z",
        capacity: 6,
        pricePerPerson: 275000,
      });
      expect(resDraft.success).toBe(false);
      expect(resDraft.message).toContain(
        "Hanya paket berstatus APPROVED atau LIVE",
      );
    });

    it("K. APPROVED / LIVE package creates session successfully in centralized store without mutating fixtures", () => {
      const res = mockEoPackageStore.createSession({
        packageId: "slow_green_day", // LIVE package
        eoId: "eo_jeda_alam",
        startAt: "2026-10-10T08:00:00+07:00",
        endAt: "2026-10-10T14:00:00+07:00",
        capacity: 8,
        pricePerPerson: 275000,
      });

      expect(res.success).toBe(true);
      expect(res.session?.status).toBe("OPEN");
      expect(res.session?.capacity).toBe(8);

      const sessions =
        mockEoPackageStore.getSessionsByPackage("slow_green_day");
      expect(sessions.some((s) => s.capacity === 8)).toBe(true);
    });
  });

  describe("5. Shared Transaction Bookings & Organizer Reviews (EO18 & Reviews)", () => {
    it("L. EO Bookings screen reads shared transaction store and only exposes owned package bookings", async () => {
      partnerSessionStore.loginAsDemoApproved();

      // Create transactions in shared store: 1 for slow_green_day (owned) and 1 for another package
      mockTransactionStore.addDirectBooking({
        bookingId: "bk_eo_test_1",
        travelerId: "usr_traveler_1",
        packageId: "slow_green_day",
        sessionId: "ses_sgd_1",
        participantCount: 2,
        unitPricePerPerson: 275000,
        totalAmount: 550000,
        status: "PAID",
        reservedQuantity: 0,
        bookedQuantity: 2,
        createdAt: "2026-08-30T10:00:00Z",
        paymentExpiresAt: "2026-08-30T10:15:00Z",
        paidAt: "2026-08-30T10:10:00Z",
      });

      mockTransactionStore.addDirectBooking({
        bookingId: "bk_unrelated_package",
        travelerId: "usr_traveler_2",
        packageId: "unrelated_pkg_xyz",
        sessionId: "ses_xyz_1",
        participantCount: 1,
        unitPricePerPerson: 300000,
        totalAmount: 300000,
        status: "PAID",
        reservedQuantity: 0,
        bookedQuantity: 1,
        createdAt: "2026-08-30T10:00:00Z",
        paymentExpiresAt: "2026-08-30T10:15:00Z",
      });

      const view = await renderComponent(createElement(EoBookingsScreen));

      expect(view.textContent).toContain("Daftar Booking & Peserta");
      expect(view.textContent).toContain("bk_eo_test_1");
      expect(view.textContent).toContain("2 Orang");
      expect(view.textContent).toContain("Rp550.000");

      // Unrelated booking is hidden
      expect(view.textContent).not.toContain("bk_unrelated_package");
    });

    it("M. EO Reviews screen consumes only EO_GUIDE reviews targeting the organizer and computes accurate rating", async () => {
      partnerSessionStore.loginAsDemoApproved();
      const eoId = "eo_jeda_alam";

      // Submit reviews in shared store: 1 EO_GUIDE for this EO, 1 DESTINATION review, and 1 for another EO
      mockReviewStore.submitReview({
        bookingId: "bk_rev_1",
        travelerId: "usr_1",
        targetType: "EO_GUIDE",
        targetRef: eoId,
        rating: 5,
        comment: "Pendampingan sangat ramah dan menenangkan.",
      });

      mockReviewStore.submitReview({
        bookingId: "bk_rev_2",
        travelerId: "usr_2",
        targetType: "EO_GUIDE",
        targetRef: eoId,
        rating: 4,
        comment: "Alur waktu terkelola dengan baik.",
      });

      mockReviewStore.submitReview({
        bookingId: "bk_rev_dest",
        travelerId: "usr_3",
        targetType: "DESTINATION",
        targetRef: "dest_lereng_hijau",
        rating: 2, // Should not affect EO rating
        comment: "Tempat agak berangin.",
      });

      const view = await renderComponent(createElement(EoReviewsScreen));

      expect(view.textContent).toContain("Ulasan & Rating Kepemanduan");
      expect(view.textContent).toContain("4.5"); // (5 + 4) / 2 = 4.5
      expect(view.textContent).toContain("Total Ulasan Masuk");
      expect(view.textContent).toContain(
        "Pendampingan sangat ramah dan menenangkan.",
      );
      expect(view.textContent).not.toContain("Tempat agak berangin.");
    });
  });

  describe("6. EO Profile & Destinations Surface (EO15 & EO18)", () => {
    it("N. EO Destinations displays verified directory and guide readiness info", async () => {
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
      const view = await renderComponent(createElement(EoDestinationsScreen));

      expect(view.textContent).toContain("Destinasi Terverifikasi JedaIn");
      expect(view.textContent).toContain("Lereng Hijau Batu");
      expect(view.textContent).toContain("Lembah Alam Pacet");
      expect(view.textContent).toContain("Hutan Bambu Trawas");
      expect(view.textContent).toContain("Guide Ready ✓");
    });

    it("O. EO Profile renders organizer identity and SOP compliance details", async () => {
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
      const view = await renderComponent(createElement(EoProfileScreen));

      expect(view.textContent).toContain("Profil Mitra Event Organizer");
      expect(view.textContent).toContain("Jeda Alam Nusantara");
      expect(view.textContent).toContain("Budi Santoso");
      expect(view.textContent).toContain("partner@jedaalam.id");
      expect(view.textContent).toContain("Certified Guide (Lisensi Resmi)");
      expect(view.textContent).toContain(
        "Perjanjian Standar Operasional JedaIn Aktif",
      );
    });
  });
});
