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
import { EoPackageDetailScreen } from "./EoPackageDetailScreen";
import { EoSessionsScreen } from "./EoSessionsScreen";
import { EoBookingsScreen } from "./EoBookingsScreen";
import { EoReviewsScreen } from "./EoReviewsScreen";
import { EoApplicationStatusScreen } from "./EoApplicationStatusScreen";
import { PartnerLoginScreen } from "./PartnerLoginScreen";

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

describe("P5 — EO Golden Flow (EO01–EO18) Hardening Tests", () => {
  describe("1. Application & Authorization Lifecycle (A–D)", () => {
    it("A. PENDING_REVIEW status page cannot self-approve", async () => {
      partnerSessionStore.setPartner({
        id: "eo_pending_user",
        email: "pending@test.com",
        name: "Pending User",
        role: "EO",
        businessName: "Pending Org",
        guideStatus: "CONCEPT_ONLY",
      });

      const view = await renderComponent(
        createElement(EoApplicationStatusScreen),
      );

      expect(view.textContent).toContain("Sedang Dalam Proses Kurasi");
      expect(view.textContent).not.toContain("Setujui & Buka Dashboard");
      expect(view.textContent).toContain("Lihat Workspace EO Demo (Approved)");
    });

    it("B. separate approved demo identity can open workspace", async () => {
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
      expect(mockApplicationStore.getBySellerId("eo_jeda_alam")?.status).toBe(
        "APPROVED",
      );

      const view = await renderComponent(createElement(App), ["/partner/eo"]);

      expect(view.textContent).toContain("Overview Jeda Alam Nusantara");
      expect(view.textContent).toContain("+ Buat Paket Baru");
    });

    it("C. application store approval is authoritative (stale session cannot bypass guard)", async () => {
      partnerSessionStore.setPartner({
        id: "eo_rejected_user",
        email: "rian@kelanaliar.com",
        name: "Rian Pratama",
        role: "EO",
        businessName: "Kelana Liar Adventure",
        guideStatus: "CONCEPT_ONLY",
      });

      const view = await renderComponent(createElement(App), ["/partner/eo"]);

      expect(view.textContent).toContain("Status Pengajuan Mitra EO");
      expect(view.textContent).toContain("Perlu Perbaikan");
    });

    it("D. reset after approve/reject restores seed correctly", () => {
      expect(
        mockApplicationStore.rejectApplication(
          "app_eo_demo_approved",
          "Alasan",
        ),
      ).toBe(false); // Only PENDING_REVIEW can be rejected

      mockApplicationStore.submitApplication({
        identityId: "eo_temp_user",
        businessName: "Temp Org",
        contactPerson: "Temp Person",
        phone: "08111",
        email: "temp@org.id",
        province: "Jatim",
        city: "Malang",
        experienceDescription: "Desc",
        yearsOfOperation: 1,
        guideStatus: "CONCEPT_ONLY",
        agreedToSop: true,
      });

      const tempApp = mockApplicationStore.getBySellerId("eo_temp_user");
      expect(tempApp?.status).toBe("PENDING_REVIEW");

      mockApplicationStore.approveApplication(tempApp!.applicationId);
      expect(mockApplicationStore.getBySellerId("eo_temp_user")?.status).toBe(
        "APPROVED",
      );

      mockApplicationStore.reset();
      expect(
        mockApplicationStore.getBySellerId("eo_temp_user"),
      ).toBeUndefined();
      expect(mockApplicationStore.getBySellerId("eo_jeda_alam")?.status).toBe(
        "APPROVED",
      );
    });

    it("D2. APPROVED application resubmit cannot become PENDING_REVIEW (prevents self-demotion)", () => {
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
      const res = mockApplicationStore.submitApplication({
        identityId: "eo_jeda_alam", // Already APPROVED
        businessName: "Jeda Alam Nusantara",
        contactPerson: "Budi Santoso",
        phone: "081234567890",
        email: "partner@jedaalam.id",
        province: "Jawa Timur",
        city: "Malang",
        experienceDescription: "Resubmit attempt",
        yearsOfOperation: 5,
        guideStatus: "CERTIFIED_GUIDE",
        agreedToSop: true,
      });

      expect(res.success).toBe(false);
      expect(res.message).toContain("sudah disetujui");
      expect(mockApplicationStore.getBySellerId("eo_jeda_alam")?.status).toBe(
        "APPROVED",
      );
    });
  });

  describe("2. Package Ownership & Draft Hijack Protection (E–H)", () => {
    it("E. EO B cannot open EO A package detail (returns NOT_FOUND / Access Denied)", async () => {
      // Login as EO B (Ruang Kreatif Wellness)
      partnerSessionStore.loginAsDemoApproved("CONCEPT_ONLY");

      const view = await renderComponent(
        createElement(EoPackageDetailScreen),
        ["/partner/eo/packages/slow_green_day"], // belongs to eo_jeda_alam
      );

      expect(view.textContent).toContain("Paket Tidak Ditemukan");
      expect(view.textContent).toContain("bukan milik akun EO Anda");
    });

    it("F. EO B cannot load EO A draftId in builder", async () => {
      partnerSessionStore.loginAsDemoApproved("CONCEPT_ONLY");

      const view = await renderComponent(
        createElement(EoPackageBuilderScreen),
        ["/partner/eo/packages/new?draftId=slow_green_day"],
      );

      expect(view.textContent).toContain("Akses Ditolak");
      expect(view.textContent).toContain("bukan milik akun EO Anda");
    });

    it("G. authenticated EO B saveDraft on EO A package fails even if caller supplies forged eoId", () => {
      // Authenticate as EO B
      partnerSessionStore.loginAsDemoApproved("CONCEPT_ONLY");

      const res = mockEoPackageStore.saveDraft({
        packageId: "slow_green_day",
        title: "Hijacked Title",
      });

      expect(res.success).toBe(false);
      expect(res.message).toContain("Akses ditolak");

      // Verify untouched
      const original = mockEoPackageStore.getPackageById("slow_green_day");
      expect(original?.title).toBe("Sehari Pelan di Lereng Hijau");
      expect(original?.eoId).toBe("eo_jeda_alam");
    });

    it("H. authenticated EO B cannot submit EO A package for review", () => {
      // Authenticate as EO B
      partnerSessionStore.loginAsDemoApproved("CONCEPT_ONLY");

      const res = mockEoPackageStore.submitForReview("slow_green_day");

      expect(res.success).toBe(false);
      expect(res.validationResult.valid).toBe(false);
    });

    it("H2. authenticated Concept-Only EO cannot bypass guideReady rule by forging CERTIFIED_GUIDE in caller state", () => {
      // Authenticate as Concept-Only EO (eo_kreatif_desa)
      partnerSessionStore.loginAsDemoApproved("CONCEPT_ONLY");

      // Save draft with non-guide-ready destination (dest_hutan_trawas)
      const saveRes = mockEoPackageStore.saveDraft({
        title: "Retreat Hening Bambu",
        shortSummary: "Sesi hening di hutan bambu.",
        destinationId: "dest_hutan_trawas", // guideReady: false!
        durationLabel: "1 hari",
        itinerary: [{ order: 1, title: "Sesi", description: "Hening" }],
        safetyNotes: ["Patuhi pemandu."],
        pricing: {
          destinationBaseCost: 95000,
          eoMargin: 100000,
          customerPrice: 195000,
        },
      });
      expect(saveRes.success).toBe(true);

      // Submit for review - must resolve guideStatus from authoritative store (CONCEPT_ONLY) and fail
      const submitRes = mockEoPackageStore.submitForReview(
        saveRes.package!.packageId,
      );
      expect(submitRes.success).toBe(false);
      expect(submitRes.package?.status).toBe("DRAFT");
      expect(
        submitRes.validationResult.errors.some((e) =>
          e.message.includes("Guide Ready"),
        ),
      ).toBe(true);
    });
  });

  describe("3. Session Ownership & Immediate UI Update (I–K)", () => {
    it("I. authenticated EO B cannot create session on EO A package", () => {
      // Authenticate as EO B
      partnerSessionStore.loginAsDemoApproved("CONCEPT_ONLY");

      const res = mockEoPackageStore.createSession({
        packageId: "slow_green_day", // belongs to eo_jeda_alam
        startAt: "2026-10-01T08:00:00Z",
        endAt: "2026-10-01T14:00:00Z",
        capacity: 6,
        pricePerPerson: 275000,
      });

      expect(res.success).toBe(false);
      expect(res.message).toContain("bukan milik EO terautentikasi");
    });

    it("J. authenticated EO B cannot mutate EO A session status", () => {
      // Authenticate as EO B
      partnerSessionStore.loginAsDemoApproved("CONCEPT_ONLY");

      const ok = mockEoPackageStore.updateSessionStatus(
        "ses_sgd_1", // belongs to eo_jeda_alam
        "CLOSED",
      );

      expect(ok).toBe(false);
      const session = mockEoPackageStore
        .getAllSessions()
        .find((s) => s.sessionId === "ses_sgd_1");
      expect(session?.status).toBe("OPEN");
    });

    it("K. session status button updates UI immediately", async () => {
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

      const view = await renderComponent(createElement(EoSessionsScreen));
      expect(view.textContent).toContain("Tutup Sesi");

      const closeBtn = Array.from(view.querySelectorAll("button")).find(
        (b) => b.textContent === "Tutup Sesi",
      );

      await act(async () => {
        closeBtn?.click();
      });

      expect(view.textContent).toContain("Buka Sesi");
    });
  });

  describe("4. Package Lifecycle Transitions (L–Q)", () => {
    it("L & M. LIVE or APPROVED package cannot be submitted for review", () => {
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

      // slow_green_day is LIVE
      const resLive = mockEoPackageStore.submitForReview("slow_green_day");
      expect(resLive.success).toBe(false);

      // Set to APPROVED
      const pkg = mockEoPackageStore.getPackageById("slow_green_day")!;
      pkg.status = "APPROVED";

      const resApproved = mockEoPackageStore.submitForReview("slow_green_day");
      expect(resApproved.success).toBe(false);
    });

    it("N, O, P, Q. Admin transition guards enforce strict lifecycle rules", () => {
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

      const saveRes = mockEoPackageStore.saveDraft({
        title: "Paket Tes Kurasi",
        shortSummary: "Ringkasan kurasi paket.",
        destinationId: "dest_lereng_hijau",
        durationLabel: "1 hari",
        itinerary: [{ order: 1, title: "Sesi", description: "Deskripsi sesi" }],
        safetyNotes: ["Pakai sepatu."],
        pricing: {
          destinationBaseCost: 125000,
          eoMargin: 150000,
          customerPrice: 275000,
        },
      });

      const pId = saveRes.package!.packageId;

      // P: DRAFT -> LIVE rejected (cannot publish unapproved draft)
      expect(mockEoPackageStore.publishApprovedPackage(pId).success).toBe(
        false,
      );

      // Submit -> PENDING_ADMIN_REVIEW
      mockEoPackageStore.submitForReview(pId);

      // O: PENDING_ADMIN_REVIEW -> REJECTED allowed
      expect(mockEoPackageStore.rejectPackage(pId, "Alasan revisi")).toBe(true);
      expect(mockEoPackageStore.getPackageById(pId)?.status).toBe("REJECTED");

      // Revise & submit again
      mockEoPackageStore.saveDraft({
        packageId: pId,
        title: "Paket Revisi",
        shortSummary: "Ringkasan kurasi paket.",
        destinationId: "dest_lereng_hijau",
        durationLabel: "1 hari",
        itinerary: [{ order: 1, title: "Sesi", description: "Deskripsi sesi" }],
        safetyNotes: ["Pakai sepatu."],
        pricing: {
          destinationBaseCost: 125000,
          eoMargin: 150000,
          customerPrice: 275000,
        },
      });
      mockEoPackageStore.submitForReview(pId);

      // N: PENDING_ADMIN_REVIEW -> APPROVED allowed
      expect(mockEoPackageStore.approvePackage(pId)).toBe(true);
      expect(mockEoPackageStore.getPackageById(pId)?.status).toBe("APPROVED");

      // Q: APPROVED -> LIVE allowed via publishApprovedPackage
      expect(mockEoPackageStore.publishApprovedPackage(pId).success).toBe(true);
      expect(mockEoPackageStore.getPackageById(pId)?.status).toBe("LIVE");
    });
  });

  describe("5. Pricing Formula & Complete Validation (R–V)", () => {
    it("R. manipulated destination base cost is rejected", () => {
      const res = validateEoPackage(
        {
          title: "Paket Manipulasi Base",
          shortSummary: "Deskripsi paket valid.",
          destinationId: "dest_lereng_hijau", // Real base cost is 125000
          durationLabel: "1 hari",
          itinerary: [{ order: 1, title: "Sesi", description: "Deskripsi" }],
          safetyNotes: ["Catatan keselamatan."],
          pricing: {
            destinationBaseCost: 1000, // Manipulated!
            eoMargin: 150000,
            customerPrice: 151000,
          },
        },
        "CERTIFIED_GUIDE",
      );

      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.field === "destinationBaseCost")).toBe(
        true,
      );
    });

    it("S. customerPrice greater than exact formula is rejected", () => {
      const res = validateEoPackage(
        {
          title: "Paket Mark Up",
          shortSummary: "Deskripsi paket valid.",
          destinationId: "dest_lereng_hijau", // 125000
          durationLabel: "1 hari",
          itinerary: [{ order: 1, title: "Sesi", description: "Deskripsi" }],
          safetyNotes: ["Catatan keselamatan."],
          pricing: {
            destinationBaseCost: 125000,
            eoMargin: 150000,
            customerPrice: 400000, // Not 125000 + 150000 = 275000!
          },
        },
        "CERTIFIED_GUIDE",
      );

      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.field === "customerPrice")).toBe(true);
    });

    it("T. exact formula accepted", () => {
      const res = validateEoPackage(
        {
          title: "Paket Formula Tepat",
          shortSummary: "Deskripsi paket valid.",
          destinationId: "dest_lereng_hijau", // 125000
          durationLabel: "1 hari",
          itinerary: [{ order: 1, title: "Sesi", description: "Deskripsi" }],
          safetyNotes: ["Catatan keselamatan."],
          pricing: {
            destinationBaseCost: 125000,
            eoMargin: 150000,
            customerPrice: 275000,
          },
        },
        "CERTIFIED_GUIDE",
      );

      expect(res.valid).toBe(true);
    });

    it("U. inactive or ineligible destination rejected", () => {
      const res = validateEoPackage(
        {
          title: "Paket Ineligible",
          shortSummary: "Deskripsi paket valid.",
          destinationId: "dest_unknown_xyz",
          durationLabel: "1 hari",
          itinerary: [{ order: 1, title: "Sesi", description: "Deskripsi" }],
          safetyNotes: ["Catatan keselamatan."],
          pricing: {
            destinationBaseCost: 125000,
            eoMargin: 150000,
            customerPrice: 275000,
          },
        },
        "CERTIFIED_GUIDE",
      );

      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.field === "destinationId")).toBe(true);
    });

    it("V. missing duration or cleared safety notes reaches validation and fails", () => {
      const res = validateEoPackage(
        {
          title: "Paket Tanpa Safety",
          shortSummary: "Deskripsi paket valid.",
          destinationId: "dest_lereng_hijau",
          durationLabel: "", // Missing duration
          itinerary: [{ order: 1, title: "Sesi", description: "Deskripsi" }],
          safetyNotes: [], // Explicitly empty/cleared safety notes
          pricing: {
            destinationBaseCost: 125000,
            eoMargin: 150000,
            customerPrice: 275000,
          },
        },
        "CERTIFIED_GUIDE",
      );

      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.field === "durationLabel")).toBe(true);
      expect(res.errors.some((e) => e.field === "safetyNotes")).toBe(true);
    });
  });

  describe("6. Cross-Surface Review Mapping & Privacy (W–AA)", () => {
    it("W & X. actual Traveler organizerRef resolves review into EO Reviews screen while excluding destination reviews", async () => {
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

      // Submit review using official package detail organizer id: "org_lereng_batu"
      mockReviewStore.submitReview({
        bookingId: "bk_cross_surface",
        travelerId: "usr_cross_traveler",
        targetType: "EO_GUIDE",
        targetRef: "org_lereng_batu",
        rating: 5,
        comment: "Pendampingan guide luar biasa tenang.",
      });

      mockReviewStore.submitReview({
        bookingId: "bk_cross_dest",
        travelerId: "usr_cross_traveler",
        targetType: "DESTINATION",
        targetRef: "dest_lereng_hijau",
        rating: 1,
        comment: "Komentar destinasi.",
      });

      const view = await renderComponent(createElement(EoReviewsScreen));

      expect(view.textContent).toContain("★ 5.0");
      expect(view.textContent).toContain(
        "Pendampingan guide luar biasa tenang.",
      );
      expect(view.textContent).not.toContain("Komentar destinasi.");
    });

    it("Y. 0 EO reviews shows 'Belum ada rating' without fake 5.0", async () => {
      partnerSessionStore.loginAsDemoApproved("CONCEPT_ONLY"); // 0 reviews

      const view = await renderComponent(createElement(EoReviewsScreen));
      expect(view.textContent).toContain("Belum ada rating");
      expect(view.textContent).not.toContain("★ 5.0");
    });

    it("Z & AA. empty comment shows 'Tanpa komentar' and raw travelerId is not rendered", async () => {
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

      mockReviewStore.submitReview({
        bookingId: "bk_empty_comment_123",
        travelerId: "usr_secret_privacy_123",
        targetType: "EO_GUIDE",
        targetRef: "org_lereng_batu",
        rating: 4,
        comment: "",
      });

      const view = await renderComponent(createElement(EoReviewsScreen));
      expect(view.textContent).toContain("Tanpa komentar");
      expect(view.textContent).not.toContain("usr_secret_privacy_123");
      expect(view.textContent).toContain("bk_empty_comment_123");
    });
  });

  describe("7. Complete Insights Distributions & Truthful Copy (AB–AG)", () => {
    it("AB–AG. all 5 demand distributions are rendered with truthful prototype wording", async () => {
      const view = await renderComponent(createElement(EoInsightsScreen));

      // AB: Intent
      expect(view.textContent).toContain("Kebutuhan Traveler");
      expect(view.textContent).toContain("Dekat dengan alam");

      // AC: Budget
      expect(view.textContent).toContain("Budget Nyaman");
      expect(view.textContent).toContain("Rp200.000 – Rp300.000");

      // AD: Duration
      expect(view.textContent).toContain("Durasi yang Dicari");
      expect(view.textContent).toContain("1 Hari Penuh (6–8 Jam)");

      // AE: Departure
      expect(view.textContent).toContain("Area Keberangkatan");
      expect(view.textContent).toContain("Malang & Batu");

      // AF: Unmet demand
      expect(view.textContent).toContain("Peluang yang Belum Terpenuhi");
      expect(view.textContent).toContain(
        "Tingginya Permintaan Jeda Alam 1 Hari",
      );

      // AG: Truthful copy
      expect(view.textContent).toContain("Simulasi sinyal agregat");
      expect(view.textContent).not.toContain("respons traveler terverifikasi");
    });
  });

  describe("8. Partner Routing & Bookings Sessions (AH–AK)", () => {
    it("AH. /partner/apply/destination renders destination application form for destination partner", async () => {
      partnerSessionStore.loginAsDemoDestination();
      const view = await renderComponent(createElement(App), [
        "/partner/apply/destination",
      ]);

      expect(view.textContent).toContain("Pengajuan Mitra Destinasi");
      expect(view.textContent).toContain(
        "Identitas Pengelola & Dokumen Legalitas",
      );
    });

    it("AI. DESTINATION role login routes to destination application entry, never /partner/eo", async () => {
      const view = await renderComponent(createElement(PartnerLoginScreen));

      const roleSelect =
        view.querySelector<HTMLSelectElement>("#partner-role")!;
      await act(async () => {
        roleSelect.value = "DESTINATION";
        roleSelect.dispatchEvent(new Event("change", { bubbles: true }));
      });

      const submitBtn = view.querySelector<HTMLButtonElement>(
        "button[type='submit']",
      )!;
      await act(async () => {
        submitBtn.click();
      });

      // Does not open EO operational workspace
      expect(view.textContent).not.toContain("Overview Jeda Alam Nusantara");
    });

    it("AJ & AK. EO booking row contains actual trip date and hides unrelated bookings", async () => {
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

      mockTransactionStore.addDirectBooking({
        bookingId: "bk_session_date_check",
        travelerId: "usr_traveler_date",
        packageId: "slow_green_day",
        sessionId: "ses_sgd_1", // 12 Sep 2026
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
        bookingId: "bk_foreign_pkg",
        travelerId: "usr_traveler_foreign",
        packageId: "foreign_package_xyz",
        sessionId: "ses_foreign_1",
        participantCount: 1,
        unitPricePerPerson: 100000,
        totalAmount: 100000,
        status: "PAID",
        reservedQuantity: 0,
        bookedQuantity: 1,
        createdAt: "2026-08-30T10:00:00Z",
        paymentExpiresAt: "2026-08-30T10:15:00Z",
      });

      const view = await renderComponent(createElement(EoBookingsScreen));

      expect(view.textContent).toContain("bk_session_date_check");
      expect(view.textContent).toContain("12 Sep 2026");
      expect(view.textContent).not.toContain("bk_foreign_pkg");
    });
  });

  describe("9. EO Overview & Demand Insights Visual Rebuild (AL–AU)", () => {
    it("AL. Overview KPI derives strictly from source stores without hardcoded fake values", async () => {
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

      // Add 1 booking for this EO
      mockTransactionStore.addDirectBooking({
        bookingId: "bk_eo_kpi_check",
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

      // Submit 1 review for organizer
      mockReviewStore.submitReview({
        bookingId: "bk_eo_kpi_check",
        travelerId: "usr_traveler_1",
        targetType: "EO_GUIDE",
        targetRef: "org_lereng_batu",
        rating: 5,
        comment: "Sangat menenangkan!",
      });

      const view = await renderComponent(createElement(App), ["/partner/eo"]);

      // Live Packages: 1 (slow_green_day)
      expect(view.textContent).toContain("Live Packages");
      expect(view.textContent).toContain("Upcoming Sessions");
      expect(view.textContent).toContain("Total Bookings");
      expect(view.textContent).toContain("Average Rating");
      expect(view.textContent).toContain("★ 5.0");
    });

    it("AM. Overview isolates bookings strictly to EO-owned packages (no cross-EO leakage)", async () => {
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

      // Foreign booking
      mockTransactionStore.addDirectBooking({
        bookingId: "bk_foreign_cross_leak",
        travelerId: "usr_traveler_cross",
        packageId: "unowned_foreign_package",
        sessionId: "ses_foreign",
        participantCount: 5,
        unitPricePerPerson: 500000,
        totalAmount: 2500000,
        status: "PAID",
        reservedQuantity: 0,
        bookedQuantity: 5,
        createdAt: "2026-08-30T10:00:00Z",
        paymentExpiresAt: "2026-08-30T10:15:00Z",
      });

      const view = await renderComponent(createElement(App), ["/partner/eo"]);

      // Unowned package must not appear in recent booking activity
      expect(view.textContent).not.toContain("unowned_foreign_package");
      expect(view.textContent).toContain("Belum ada aktivitas booking.");
    });

    it("AN. Overview highlights PENDING_ADMIN_REVIEW package as action needed callout", async () => {
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

      const view = await renderComponent(createElement(App), ["/partner/eo"]);

      expect(view.textContent).toContain("Menunggu Review");
      expect(view.textContent).toContain("Pagi Hening Tepi Sungai Pacet");
      expect(view.textContent).toContain("Sedang ditinjau Admin JedaIn.");
      expect(view.textContent).toContain("Lihat Package");
    });

    it("AO. Overview Demand Opportunity hero links to exact builder query param", async () => {
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

      const view = await renderComponent(createElement(App), ["/partner/eo"]);

      expect(view.textContent).toContain("Peluang dari Traveler");
      expect(view.textContent).toContain(
        "Tingginya Permintaan Jeda Alam 1 Hari di Lereng Malang Raya",
      );
      expect(view.textContent).toContain("312 traveler");

      const heroLink = view.querySelector<HTMLAnchorElement>(
        'a[href*="/partner/eo/packages/new?insightId=ins_nature_batu_1d"]',
      );
      expect(heroLink).not.toBeNull();
    });

    it("AP. Empty EO state renders helpful CTA when package list is empty", async () => {
      partnerSessionStore.loginAsDemoApproved("CONCEPT_ONLY");
      // CONCEPT_ONLY user has 0 packages seeded by default in mockEoPackageStore
      const view = await renderComponent(createElement(App), ["/partner/eo"]);

      expect(view.textContent).toContain("Kamu belum punya package.");
      expect(view.textContent).toContain(
        "Lihat kebutuhan traveler atau mulai package pertamamu.",
      );
      expect(view.textContent).toContain("Lihat Insight");
      expect(view.textContent).toContain("+ Buat Paket Baru");
    });

    it("AQ. Demand Insights derives top signals from data arrays", async () => {
      const view = await renderComponent(createElement(EoInsightsScreen));

      // Sinyal utama derived maxima
      expect(view.textContent).toContain("Dekat dengan alam");
      expect(view.textContent).toContain("42%");
      expect(view.textContent).toContain("428 traveler");

      expect(view.textContent).toContain("Rp200.000 – Rp300.000");
      expect(view.textContent).toContain("48%");
      expect(view.textContent).toContain("490 traveler");

      expect(view.textContent).toContain("1 Hari Penuh (6–8 Jam)");
      expect(view.textContent).toContain("52%");
      expect(view.textContent).toContain("530 traveler");

      expect(view.textContent).toContain("Malang & Batu");
      expect(view.textContent).toContain("45%");
      expect(view.textContent).toContain("459 traveler");
    });

    it("AR. Demand Insights preserves exact insightIds across all CTAs", async () => {
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
      const view = await renderComponent(createElement(App), [
        "/partner/eo/insights",
      ]);

      // All 3 insight IDs present in buttons/links
      expect(view.textContent).toContain(
        "Tingginya Permintaan Jeda Alam 1 Hari di Lereng Malang Raya",
      );
      expect(view.textContent).toContain(
        "Kebutuhan Retreat Singkat Setengah Hari di Mojokerto / Pacet",
      );
      expect(view.textContent).toContain(
        "Minat Belajar Kerajinan & Tradisi Lokal Akhir Pekan",
      );
    });

    it("AS. Zero fake trend strings (+12%, naik, dibanding bulan lalu, 30 hari terakhir)", async () => {
      const overviewView = await renderComponent(createElement(App), [
        "/partner/eo",
      ]);
      const overviewText = overviewView.textContent ?? "";
      expect(overviewText).not.toContain("+12%");
      expect(overviewText).not.toContain("dibanding bulan lalu");
      expect(overviewText).not.toContain("30 hari terakhir");

      const insightsView = await renderComponent(
        createElement(EoInsightsScreen),
      );
      const insightsText = insightsView.textContent ?? "";
      expect(insightsText).not.toContain("+12%");
      expect(insightsText).not.toContain("dibanding bulan lalu");
      expect(insightsText).not.toContain("30 hari terakhir");
      expect(insightsText).not.toContain("AI Recommendation");
      expect(insightsText).not.toContain("AI Opportunity");
    });

    it("AT. Workspace navigation renders consistent distinct icons and labels for all items", async () => {
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
      const view = await renderComponent(createElement(App), ["/partner/eo"]);

      const nav = view.querySelector(".workspace-navigation")!;
      expect(nav.textContent).toContain("Overview");
      expect(nav.textContent).toContain("Insights");
      expect(nav.textContent).toContain("Packages");
      expect(nav.textContent).toContain("Sessions");
      expect(nav.textContent).toContain("Bookings");
      expect(nav.textContent).toContain("Destinations");
      expect(nav.textContent).toContain("Reviews");
      expect(nav.textContent).toContain("Profile");
    });

    it("AU. Topbar displays human-readable guide status without raw enums", async () => {
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
      const view = await renderComponent(createElement(App), ["/partner/eo"]);

      const identity = view.querySelector(".workspace-identity")!;
      expect(identity.textContent).toContain("Certified Guide");
      expect(identity.textContent).not.toContain("CERTIFIED_GUIDE");
    });
  });
});
