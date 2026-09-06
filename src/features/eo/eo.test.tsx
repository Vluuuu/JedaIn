// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, useLocation } from "react-router";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { App } from "../../App";
import { mockTransactionStore } from "../checkout/mockTransactionStore";
import { mockReviewStore } from "../reviews/mockReviewStore";
import { mockApplicationStore } from "./mockApplicationStore";
import { mockDestinationStore } from "./mockDestinationStore";
import { mockEoPackageStore, validateEoPackage } from "./mockEoPackageStore";
import {
  mockInsightStore,
  OPPORTUNITY_ALLOWED_ORIGINS,
} from "./mockInsightStore";
import { partnerSessionStore } from "./partnerSessionStore";
import { EoInsightsScreen } from "./EoInsightsScreen";
import { EoPackagesScreen } from "./EoPackagesScreen";
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

  HTMLDialogElement.prototype.showModal ??= function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close ??= function close() {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
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

    it("H2. authenticated Concept-Only EO cannot submit package with guideSource = 'EO'", () => {
      // Authenticate as Concept-Only EO (eo_kreatif_desa)
      partnerSessionStore.loginAsDemoApproved("CONCEPT_ONLY");

      // Save draft with forged guideSource = "EO"
      const saveRes = mockEoPackageStore.saveDraft({
        title: "Retreat Hening Bambu",
        shortSummary: "Sesi hening di hutan bambu.",
        destinationId: "dest_hutan_trawas",
        durationLabel: "1 hari",
        itinerary: [{ order: 1, title: "Sesi", description: "Hening" }],
        safetyNotes: ["Patuhi pemandu."],
        guideSource: "EO", // Forbidden for Concept-Only!
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
        submitRes.validationResult.errors.some(
          (e) => e.field === "guideSource",
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
          guideSource: "DESTINATION",
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
    it("AB–AG. all 5 demand distributions are rendered with truthful prototype wording and creator brief context", async () => {
      const view = await renderComponent(createElement(EoInsightsScreen));

      // Page Title & Subtitle
      expect(view.textContent).toContain("Insight Permintaan Traveler");
      expect(view.textContent).toContain(
        "Pahami pola kebutuhan traveler dan ubah sinyal demand menjadi experience yang relevan.",
      );

      // Top signal summary band
      expect(view.textContent).toContain("Kebutuhan Utama");
      expect(view.textContent).toContain("Dekat dengan alam");

      expect(view.textContent).toContain("Budget Terbanyak");
      expect(view.textContent).toContain("Rp200.000 – Rp300.000");

      expect(view.textContent).toContain("Durasi Terbanyak");
      expect(view.textContent).toContain("1 Hari Penuh (6–8 Jam)");

      expect(view.textContent).toContain("Area Keberangkatan Terbesar");
      expect(view.textContent).toContain("Malang");

      // AF: Unmet demand (Default Peluang tab)
      expect(view.textContent).toContain("Peluang yang Belum Terpenuhi");
      expect(view.textContent).toContain(
        "Tingginya Permintaan Jeda Alam 1 Hari",
      );

      // AG: Truthful copy & creative brief context
      expect(view.textContent).toContain(
        "Simulasi data agregat · 1.020 respons pada seluruh periode prototype. Tidak menampilkan data pribadi traveler.",
      );
      expect(view.textContent).toContain(
        "Insight adalah creative brief dari kebutuhan traveler. EO tetap menentukan konsep, itinerary, dan pengalaman akhirnya.",
      );
      expect(view.textContent).toContain(
        "Gunakan insight sebagai arahan. Itinerary tetap disusun oleh EO.",
      );
      expect(view.textContent).not.toContain("respons traveler terverifikasi");
      expect(view.textContent).not.toContain("Destinasi cocok");
      expect(view.textContent).not.toContain("Recommended destination");
      expect(view.textContent).not.toContain("Compatible with");
      expect(view.textContent).not.toContain("Trip Builder");

      // Switch to Rincian Data tab and verify all 4 dimensions
      const tabs = Array.from(view.querySelectorAll(".eo-demand-tab-btn"));
      const rincianTab = tabs.find((t) =>
        t.textContent?.includes("Rincian Data Permintaan"),
      );
      expect(rincianTab).toBeDefined();

      await act(async () => {
        (rincianTab as HTMLButtonElement).click();
      });

      expect(view.textContent).toContain("Rincian Pola Permintaan");
      expect(view.textContent).toContain("Kebutuhan Traveler");
      expect(view.textContent).toContain("Budget Nyaman");
      expect(view.textContent).toContain("Durasi yang Dicari");
      expect(view.textContent).toContain("Area Keberangkatan");
      expect(view.textContent).toContain(
        "Titik awal keberangkatan traveler pada data agregat.",
      );
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
      expect(view.textContent).toContain("1 ulasan traveler");
    });

    it("AL2. Overview KPI renders clean empty state when no reviews exist", async () => {
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
      // By default no reviews seeded for organizer in fresh test run
      const view = await renderComponent(createElement(App), ["/partner/eo"]);

      expect(view.textContent).toContain("Average Rating");
      expect(view.textContent).toContain("—");
      expect(view.textContent).toContain("Belum ada ulasan");
      expect(view.textContent).not.toContain("Belum ada rating");
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

    it("AO2. Non-OPEN sessions do not appear in Upcoming Sessions preview but KPI remains aligned", async () => {
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

      // Add a non-OPEN session (e.g. CLOSED)
      const createRes = mockEoPackageStore.createSession({
        packageId: "slow_green_day",
        startAt: "2026-09-05T08:00:00+07:00",
        endAt: "2026-09-05T14:00:00+07:00",
        capacity: 6,
        pricePerPerson: 275000,
      });
      expect(createRes.success).toBe(true);

      if (createRes.session) {
        // Mutate session in store to CLOSED for testing non-OPEN filtering
        mockEoPackageStore.updateSessionStatus(
          createRes.session.sessionId,
          "CLOSED",
        );
      }

      const view = await renderComponent(createElement(App), ["/partner/eo"]);

      // Non-OPEN session must not appear in upcoming sessions panel
      const upcomingPanel = view.querySelector(
        '[aria-label="Jadwal sesi terdekat"]',
      )!;
      expect(upcomingPanel.textContent).not.toContain("CLOSED");
    });

    it("AO3. PENDING_PAYMENT booking displays participantCount not bookedQuantity", async () => {
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

      mockTransactionStore.addDirectBooking({
        bookingId: "bk_pending_qty_test",
        travelerId: "usr_traveler_pending",
        packageId: "slow_green_day",
        sessionId: "ses_sgd_1",
        participantCount: 2,
        unitPricePerPerson: 275000,
        totalAmount: 550000,
        status: "PENDING_PAYMENT",
        reservedQuantity: 2,
        bookedQuantity: 0, // Canonical PENDING_PAYMENT semantics: bookedQuantity is 0 until paid
        createdAt: "2026-09-01T10:00:00Z",
        paymentExpiresAt: "2026-09-01T10:15:00Z",
      });

      const view = await renderComponent(createElement(App), ["/partner/eo"]);

      const recentPanel = view.querySelector(
        '[aria-label="Aktivitas booking terbaru"]',
      )!;
      expect(recentPanel.textContent).toContain("2 peserta");
      expect(recentPanel.textContent).not.toContain("0 peserta");
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

      expect(view.textContent).toContain("Malang");
      expect(view.textContent).toContain("30%");
      expect(view.textContent).toContain("306 traveler");
    });

    it("AR. Demand Insights preserves exact insightIds across all CTAs", async () => {
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

      function LocationProbe() {
        const location = useLocation();
        return (
          <output data-testid="location">
            {location.pathname}
            {location.search}
          </output>
        );
      }

      const insightCases = [
        {
          title: "Tingginya Permintaan Jeda Alam 1 Hari di Lereng Malang Raya",
          insightId: "ins_nature_batu_1d",
          expectedDestination:
            "/partner/eo/packages/new?insightId=ins_nature_batu_1d",
        },
        {
          title: "Kebutuhan Retreat Singkat Setengah Hari di Mojokerto / Pacet",
          insightId: "ins_mindful_pacet_halfday",
          expectedDestination:
            "/partner/eo/packages/new?insightId=ins_mindful_pacet_halfday",
        },
        {
          title: "Minat Belajar Kerajinan & Tradisi Lokal Akhir Pekan",
          insightId: "ins_workshop_culture_weekend",
          expectedDestination:
            "/partner/eo/packages/new?insightId=ins_workshop_culture_weekend",
        },
      ];

      for (const testCase of insightCases) {
        await act(() => root?.unmount());
        container?.remove();

        const view = await renderComponent(
          createElement(
            "div",
            null,
            createElement(EoInsightsScreen),
            createElement(LocationProbe),
          ),
          ["/partner/eo/insights"],
        );

        // Find the article card for this specific opportunity
        const cards = Array.from(view.querySelectorAll("article"));
        const targetCard = cards.find((card) =>
          card.textContent?.includes(testCase.title),
        );
        expect(targetCard).toBeDefined();

        const ctaButton = Array.from(
          targetCard!.querySelectorAll("button"),
        ).find((btn) => btn.textContent?.includes("Buat Paket"));
        expect(ctaButton).toBeDefined();

        await act(async () => {
          ctaButton!.click();
        });

        const locationOutput = view.querySelector('[data-testid="location"]');
        expect(locationOutput?.textContent).toBe(testCase.expectedDestination);
      }
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
      expect(insightsText).not.toContain("AI Insight");
      expect(insightsText).not.toContain("AI score");
      expect(insightsText).not.toContain("forecast");
      expect(insightsText).not.toContain("conversion");
      expect(insightsText).not.toContain("GMV");
    });

    it("AS2. Opportunity cards clearly label departure context as 'Asal traveler' without destination claims", async () => {
      const view = await renderComponent(createElement(EoInsightsScreen));
      const text = view.textContent ?? "";

      expect(text).toContain("Asal traveler");
      expect(text).not.toContain("Destinasi cocok");
      expect(text).not.toContain("Recommended destination");
      expect(text).not.toContain("Compatible with");
    });

    it("AS3. Time filter (TODAY, YESTERDAY, THIS_WEEK, THIS_MONTH, CUSTOM, zero-response) updates counts truthfully", async () => {
      const view = await renderComponent(createElement(EoInsightsScreen));

      const getPeriodSelect = () =>
        view.querySelector<HTMLSelectElement>("#demand-period-select")!;

      expect(getPeriodSelect()).toBeDefined();

      // 1. ALL default: 1.020 responses
      expect(view.textContent).toContain("1.020 respons");
      expect(view.textContent).toContain("312 traveler mencari");

      // 2. TODAY (2026-09-05): 18 responses
      await act(async () => {
        const select = getPeriodSelect();
        select.value = "TODAY";
        select.dispatchEvent(new Event("change", { bubbles: true }));
      });
      expect(view.textContent).toContain("18 respons pada periode Hari ini");
      expect(view.textContent).not.toContain("1.020 respons");

      // 3. YESTERDAY (2026-09-04): 24 responses
      await act(async () => {
        const select = getPeriodSelect();
        select.value = "YESTERDAY";
        select.dispatchEvent(new Event("change", { bubbles: true }));
      });
      expect(view.textContent).toContain("24 respons pada periode Kemarin");

      // 4. THIS_WEEK: 126 responses
      await act(async () => {
        const select = getPeriodSelect();
        select.value = "THIS_WEEK";
        select.dispatchEvent(new Event("change", { bubbles: true }));
      });
      expect(view.textContent).toContain("126 respons pada periode Minggu ini");

      // 5. THIS_MONTH: 108 responses
      await act(async () => {
        const select = getPeriodSelect();
        select.value = "THIS_MONTH";
        select.dispatchEvent(new Event("change", { bubbles: true }));
      });
      expect(view.textContent).toContain("108 respons pada periode Bulan ini");

      // 6. CUSTOM date range with 0 responses (e.g. 2025-01-01 to 2025-01-02)
      await act(async () => {
        const select = getPeriodSelect();
        select.value = "CUSTOM";
        select.dispatchEvent(new Event("change", { bubbles: true }));
      });

      const dateInputs =
        view.querySelectorAll<HTMLInputElement>('input[type="date"]');
      expect(dateInputs.length).toBe(2);

      await act(async () => {
        const nativeSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value",
        )?.set;
        nativeSetter?.call(dateInputs[0], "2025-01-01");
        dateInputs[0].dispatchEvent(new Event("change", { bubbles: true }));
        nativeSetter?.call(dateInputs[1], "2025-01-02");
        dateInputs[1].dispatchEvent(new Event("change", { bubbles: true }));
      });

      expect(view.textContent).toContain("0 respons");
      expect(view.textContent).toContain("Belum ada respons pada periode ini.");
    });

    it("AS4. Departure area granularity, search, and Jakarta custom label support", async () => {
      const view = await renderComponent(createElement(EoInsightsScreen));

      // Switch to Rincian Data tab
      const tabs = Array.from(view.querySelectorAll(".eo-demand-tab-btn"));
      const rincianTab = tabs.find((t) =>
        t.textContent?.includes("Rincian Data Permintaan"),
      )!;

      await act(async () => {
        (rincianTab as HTMLButtonElement).click();
      });

      // Default shows top 5: Malang, Surabaya, Batu, Sidoarjo, Kediri
      expect(view.textContent).toContain("Malang");
      expect(view.textContent).toContain("Surabaya");
      expect(view.textContent).toContain("Batu");
      expect(view.textContent).toContain("Sidoarjo");
      expect(view.textContent).toContain("Kediri");

      // Click "Lihat semua area"
      const seeAllBtn = view.querySelector<HTMLButtonElement>(
        ".eo-demand-area-toggle-btn",
      )!;
      expect(seeAllBtn).toBeDefined();

      await act(async () => {
        seeAllBtn.click();
      });

      // Now expanded list includes Jakarta and Blitar
      expect(view.textContent).toContain("Jakarta");
      expect(view.textContent).toContain("35 traveler");
      expect(view.textContent).toContain("Blitar");
      expect(view.textContent).toContain("25 traveler");

      // Test searching "Jakarta" in the area search box
      const searchInput = view.querySelector<HTMLInputElement>(
        ".eo-demand-area-search-input",
      )!;
      expect(searchInput).toBeDefined();

      await act(async () => {
        const nativeSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value",
        )?.set;
        nativeSetter?.call(searchInput, "Jakarta");
        searchInput.dispatchEvent(new Event("change", { bubbles: true }));
      });

      const areaBlock = view.querySelector(
        '[aria-label="Distribusi wilayah asal keberangkatan"]',
      )!;
      expect(areaBlock.textContent).toContain("Jakarta");
      expect(areaBlock.textContent).not.toContain("Surabaya");
    });

    it("AS5. Tab switching preserves active period selection", async () => {
      const view = await renderComponent(createElement(EoInsightsScreen));

      const getPeriodSelect = () =>
        view.querySelector<HTMLSelectElement>("#demand-period-select")!;

      // Select THIS_WEEK on Peluang tab
      await act(async () => {
        const select = getPeriodSelect();
        select.value = "THIS_WEEK";
        select.dispatchEvent(new Event("change", { bubbles: true }));
      });
      expect(view.textContent).toContain("126 respons pada periode Minggu ini");

      // Switch to Rincian Data tab
      const tabs = Array.from(view.querySelectorAll(".eo-demand-tab-btn"));
      const rincianTab = tabs.find((t) =>
        t.textContent?.includes("Rincian Data Permintaan"),
      )!;

      await act(async () => {
        (rincianTab as HTMLButtonElement).click();
      });

      // Period remains THIS_WEEK (126 responses)
      expect(view.textContent).toContain("126 respons pada periode Minggu ini");
      expect(getPeriodSelect()?.value).toBe("THIS_WEEK");

      // Switch back to Peluang tab
      const peluangTab = tabs.find((t) =>
        t.textContent?.includes("Peluang Paket"),
      )!;
      await act(async () => {
        (peluangTab as HTMLButtonElement).click();
      });

      expect(view.textContent).toContain("126 respons pada periode Minggu ini");
      expect(getPeriodSelect()?.value).toBe("THIS_WEEK");
    });

    it("AS6. Period-aware distributions exhibit deterministic diversity without single-category monopoly", () => {
      // 1. TODAY diversity checks
      const todayOptions = { period: "TODAY" as const };
      const todayTotal = mockInsightStore.getTotalResponses(todayOptions);
      expect(todayTotal).toBe(18);

      const todaySignals = mockInsightStore.getSignals(todayOptions);
      const todayBudgets = mockInsightStore.getBudgetDistribution(todayOptions);
      const todayDurations =
        mockInsightStore.getDurationDistribution(todayOptions);
      const todayDepartures =
        mockInsightStore.getDepartureDistribution(todayOptions);
      const todayInsights = mockInsightStore.getAllInsights(todayOptions);

      // Invariant: sum of category counts equals total responses
      expect(todaySignals.reduce((s, i) => s + i.travelerCount, 0)).toBe(
        todayTotal,
      );
      expect(todayBudgets.reduce((s, b) => s + b.count, 0)).toBe(todayTotal);
      expect(todayDurations.reduce((s, d) => s + d.count, 0)).toBe(todayTotal);
      expect(todayDepartures.reduce((s, a) => s + a.count, 0)).toBe(todayTotal);

      // Diversity check: more than 1 category with non-zero count
      expect(
        todaySignals.filter((s) => s.travelerCount > 0).length,
      ).toBeGreaterThan(1);
      expect(todayBudgets.filter((b) => b.count > 0).length).toBeGreaterThan(1);
      expect(todayDurations.filter((d) => d.count > 0).length).toBeGreaterThan(
        1,
      );
      expect(todayDepartures.filter((a) => a.count > 0).length).toBeGreaterThan(
        1,
      );

      // Opportunity distribution: not all map to a single opportunity
      expect(
        todayInsights.filter((i) => i.travelerDemandCount > 0).length,
      ).toBeGreaterThan(1);

      // 2. THIS_WEEK diversity checks
      const weekOptions = { period: "THIS_WEEK" as const };
      const weekTotal = mockInsightStore.getTotalResponses(weekOptions);
      expect(weekTotal).toBe(126);

      const weekSignals = mockInsightStore.getSignals(weekOptions);
      const weekBudgets = mockInsightStore.getBudgetDistribution(weekOptions);
      const weekDurations =
        mockInsightStore.getDurationDistribution(weekOptions);
      const weekDepartures =
        mockInsightStore.getDepartureDistribution(weekOptions);
      const weekInsights = mockInsightStore.getAllInsights(weekOptions);

      expect(weekSignals.reduce((s, i) => s + i.travelerCount, 0)).toBe(
        weekTotal,
      );
      expect(weekBudgets.reduce((s, b) => s + b.count, 0)).toBe(weekTotal);
      expect(weekDurations.reduce((s, d) => s + d.count, 0)).toBe(weekTotal);
      expect(weekDepartures.reduce((s, a) => s + a.count, 0)).toBe(weekTotal);

      // All 4 intents, 4 budgets, 3 durations represented in the week
      expect(weekSignals.every((s) => s.travelerCount > 0)).toBe(true);
      expect(weekBudgets.every((b) => b.count > 0)).toBe(true);
      expect(weekDurations.every((d) => d.count > 0)).toBe(true);
      expect(weekDepartures.length).toBeGreaterThan(4);
      expect(weekInsights.every((i) => i.travelerDemandCount > 0)).toBe(true);

      // 3. ALL canonical reference values preserved exactly
      const allSignals = mockInsightStore.getSignals({ period: "ALL" });
      const allBudgets = mockInsightStore.getBudgetDistribution({
        period: "ALL",
      });
      const allDurations = mockInsightStore.getDurationDistribution({
        period: "ALL",
      });
      const allDepartures = mockInsightStore.getDepartureDistribution({
        period: "ALL",
      });
      const allInsights = mockInsightStore.getAllInsights({ period: "ALL" });

      expect(allSignals.find((s) => s.intent === "NATURE")?.travelerCount).toBe(
        428,
      );
      expect(allSignals.find((s) => s.intent === "CALM")?.travelerCount).toBe(
        286,
      );
      expect(
        allSignals.find((s) => s.intent === "EXPLORATION")?.travelerCount,
      ).toBe(164);
      expect(
        allSignals.find((s) => s.intent === "REFLECTION")?.travelerCount,
      ).toBe(142);

      expect(allBudgets.find((b) => b.id === "b_under_200k")?.count).toBe(224);
      expect(allBudgets.find((b) => b.id === "b_200_300k")?.count).toBe(490);
      expect(allBudgets.find((b) => b.id === "b_300_500k")?.count).toBe(214);
      expect(allBudgets.find((b) => b.id === "b_above_500k")?.count).toBe(92);

      expect(allDurations.find((d) => d.id === "d_halfday")?.count).toBe(357);
      expect(allDurations.find((d) => d.id === "d_fullday")?.count).toBe(530);
      expect(allDurations.find((d) => d.id === "d_2d1n")?.count).toBe(133);

      expect(allDepartures.find((a) => a.label === "Malang")?.count).toBe(306);
      expect(allDepartures.find((a) => a.label === "Surabaya")?.count).toBe(
        260,
      );
      expect(allDepartures.find((a) => a.label === "Batu")?.count).toBe(153);
      expect(allDepartures.find((a) => a.label === "Sidoarjo")?.count).toBe(
        148,
      );
      expect(allDepartures.find((a) => a.label === "Kediri")?.count).toBe(51);
      expect(allDepartures.find((a) => a.label === "Pasuruan")?.count).toBe(42);
      expect(allDepartures.find((a) => a.label === "Jakarta")?.count).toBe(35);
      expect(allDepartures.find((a) => a.label === "Blitar")?.count).toBe(25);

      expect(
        allInsights.find((i) => i.insightId === "ins_nature_batu_1d")
          ?.travelerDemandCount,
      ).toBe(312);
      expect(
        allInsights.find((i) => i.insightId === "ins_mindful_pacet_halfday")
          ?.travelerDemandCount,
      ).toBe(198);
      expect(
        allInsights.find((i) => i.insightId === "ins_workshop_culture_weekend")
          ?.travelerDemandCount,
      ).toBe(145);
    });

    it("AS7. True opportunity-origin invariants hold across all events in data store", () => {
      const allEvents = mockInsightStore.getAllEvents();
      expect(allEvents.length).toBe(1020);

      for (const ev of allEvents) {
        for (const oppId of ev.matchedOpportunityIds) {
          const allowed = OPPORTUNITY_ALLOWED_ORIGINS[oppId];
          expect(allowed).toBeDefined();
          expect(allowed).toContain(ev.departureAreaRaw);
        }
      }

      // Explicit verification per opportunity
      const natureEvents = allEvents.filter((e) =>
        e.matchedOpportunityIds.includes("ins_nature_batu_1d"),
      );
      expect(natureEvents.length).toBe(312);
      expect(
        natureEvents.every(
          (e) =>
            e.departureAreaRaw === "Malang" ||
            e.departureAreaRaw === "Surabaya",
        ),
      ).toBe(true);
      expect(natureEvents.some((e) => e.departureAreaRaw === "Batu")).toBe(
        false,
      );
      expect(natureEvents.some((e) => e.departureAreaRaw === "Sidoarjo")).toBe(
        false,
      );

      const pacetEvents = allEvents.filter((e) =>
        e.matchedOpportunityIds.includes("ins_mindful_pacet_halfday"),
      );
      expect(pacetEvents.length).toBe(198);
      expect(
        pacetEvents.every(
          (e) =>
            e.departureAreaRaw === "Surabaya" ||
            e.departureAreaRaw === "Sidoarjo",
        ),
      ).toBe(true);
      expect(pacetEvents.some((e) => e.departureAreaRaw === "Malang")).toBe(
        false,
      );
      expect(pacetEvents.some((e) => e.departureAreaRaw === "Pasuruan")).toBe(
        false,
      );

      const workshopEvents = allEvents.filter((e) =>
        e.matchedOpportunityIds.includes("ins_workshop_culture_weekend"),
      );
      expect(workshopEvents.length).toBe(145);
      expect(
        workshopEvents.every(
          (e) =>
            e.departureAreaRaw === "Malang" || e.departureAreaRaw === "Batu",
        ),
      ).toBe(true);
      expect(workshopEvents.some((e) => e.departureAreaRaw === "Kediri")).toBe(
        false,
      );
      expect(workshopEvents.some((e) => e.departureAreaRaw === "Blitar")).toBe(
        false,
      );
      expect(
        workshopEvents.some((e) => e.departureAreaRaw === "Surabaya"),
      ).toBe(false);
    });

    it("AS8. Rendered opportunity cards truthfully match underlying origin sets", async () => {
      const view = await renderComponent(createElement(EoInsightsScreen));

      // 1. Featured card: ins_nature_batu_1d
      const featuredCard = view.querySelector(".eo-demand-featured-card")!;
      expect(featuredCard).toBeDefined();
      expect(featuredCard.textContent).toContain("Asal traveler");
      expect(featuredCard.textContent).toContain("Malang / Surabaya");

      // 2. Secondary cards: ins_mindful_pacet_halfday and ins_workshop_culture_weekend
      const secCards = Array.from(
        view.querySelectorAll(".eo-demand-secondary-card"),
      );
      expect(secCards.length).toBe(2);

      const pacetCard = secCards.find((c) => c.textContent?.includes("Pacet"))!;
      expect(pacetCard.textContent).toContain("Surabaya / Sidoarjo");

      const workshopCard = secCards.find((c) =>
        c.textContent?.includes("Kerajinan"),
      )!;
      expect(workshopCard.textContent).toContain("Malang Raya");
    });

    it("AT. Workspace navigation renders exact 1 active link per route", async () => {
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

      // Route /partner/eo/insights
      const viewInsights = await renderComponent(createElement(App), [
        "/partner/eo/insights",
      ]);
      const activeInsights = viewInsights.querySelectorAll(
        '.workspace-navigation a[aria-current="page"]',
      );
      expect(activeInsights.length).toBe(1);
      expect(activeInsights[0].textContent).toContain("Insights");

      // Route /partner/eo
      const viewOverview = await renderComponent(createElement(App), [
        "/partner/eo",
      ]);
      const activeOverview = viewOverview.querySelectorAll(
        '.workspace-navigation a[aria-current="page"]',
      );
      expect(activeOverview.length).toBe(1);
      expect(activeOverview[0].textContent).toContain("Overview");

      // Route /partner/eo/packages
      const viewPackages = await renderComponent(createElement(App), [
        "/partner/eo/packages",
      ]);
      const activePackages = viewPackages.querySelectorAll(
        '.workspace-navigation a[aria-current="page"]',
      );
      expect(activePackages.length).toBe(1);
      expect(activePackages[0].textContent).toContain("Packages");
    });

    it("AU. Topbar displays human-readable guide status without raw enums", async () => {
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
      const view = await renderComponent(createElement(App), ["/partner/eo"]);

      const identity = view.querySelector(".workspace-identity")!;
      expect(identity.textContent).toContain("Certified Guide");
      expect(identity.textContent).not.toContain("CERTIFIED_GUIDE");
    });
  });

  describe("10. Phase B1: Packages Lifecycle Workspace & Detail Rebuild (AV–BF)", () => {
    it("AV. Packages screen displays humanized status labels and no raw enums", async () => {
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
      const view = await renderComponent(createElement(EoPackagesScreen));

      // H1 & Subtitle
      expect(view.textContent).toContain("Paket Experience");
      expect(view.textContent).toContain(
        "Kelola experience dari draf hingga tayang ke traveler.",
      );

      // Humanized tabs
      expect(view.textContent).toContain("Semua");
      expect(view.textContent).toContain("Draf");
      expect(view.textContent).toContain("Menunggu Review");
      expect(view.textContent).toContain("Perlu Perbaikan");
      expect(view.textContent).toContain("Disetujui");
      expect(view.textContent).toContain("Live");

      // No raw enum text exposed
      expect(view.textContent).not.toContain("PENDING_ADMIN_REVIEW");
      expect(view.textContent).not.toContain("CONCEPT_ONLY");

      // Seeded packages present
      expect(view.textContent).toContain("Sehari Pelan di Lereng Hijau");
      expect(view.textContent).toContain("Pagi Hening Tepi Sungai Pacet");
    });

    it("AW. Package cards show state-specific primary actions and session context", async () => {
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
      const view = await renderComponent(createElement(EoPackagesScreen));

      // LIVE package (slow_green_day)
      expect(view.textContent).toContain("Tayang ke traveler.");
      expect(view.textContent).toContain("2 jadwal keberangkatan mendatang");
      expect(view.textContent).toContain("Atur Jadwal");
      expect(view.textContent).toContain("Lihat Paket");

      // PENDING_ADMIN_REVIEW package (pkg_pacet_mindful_retreat)
      expect(view.textContent).toContain("Sedang ditinjau Admin JedaIn.");
      expect(view.textContent).toContain("Lihat Status");
      // Pending package must NOT have an edit button
      const pendingArticle = Array.from(view.querySelectorAll("article")).find(
        (a) => a.textContent?.includes("Pagi Hening Tepi Sungai Pacet"),
      )!;
      expect(pendingArticle).toBeDefined();
      expect(pendingArticle.textContent).not.toContain("Lanjut Edit");
      expect(pendingArticle.textContent).not.toContain("Perbaiki");
    });

    it("AX. DRAFT and REJECTED packages route to draft builder on primary action", async () => {
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

      // Save a DRAFT and a REJECTED package
      const draftRes = mockEoPackageStore.saveDraft({
        title: "Draf Baru Keren",
        shortSummary: "Ringkasan draf pengalaman.",
        destinationId: "dest_lereng_hijau",
        durationLabel: "1 hari",
        itinerary: [{ order: 1, title: "Sesi", description: "Desc" }],
        safetyNotes: ["Aman"],
        pricing: {
          destinationBaseCost: 125000,
          eoMargin: 75000,
          customerPrice: 200000,
        },
      });
      expect(draftRes.success).toBe(true);

      const rejRes = mockEoPackageStore.saveDraft({
        title: "Paket Butuh Perbaikan",
        shortSummary: "Ringkasan paket revisi.",
        destinationId: "dest_lereng_hijau",
        durationLabel: "1 hari",
        itinerary: [{ order: 1, title: "Sesi", description: "Desc" }],
        safetyNotes: ["Aman"],
        pricing: {
          destinationBaseCost: 125000,
          eoMargin: 75000,
          customerPrice: 200000,
        },
      });
      const rejPkgId = rejRes.package!.packageId;
      mockEoPackageStore.submitForReview(rejPkgId);
      mockEoPackageStore.rejectPackage(
        rejPkgId,
        "Mohon sesuaikan rincian jadwal makan siang.",
      );

      const view = await renderComponent(createElement(EoPackagesScreen));

      // Check DRAFT card action
      const draftCard = Array.from(view.querySelectorAll("article")).find((a) =>
        a.textContent?.includes("Draf Baru Keren"),
      )!;
      expect(draftCard).toBeDefined();
      expect(draftCard.textContent).toContain("Lanjut Edit");
      expect(draftCard.textContent).toContain("Belum diajukan untuk review.");

      // Check REJECTED card action & reason preview
      const rejCard = Array.from(view.querySelectorAll("article")).find((a) =>
        a.textContent?.includes("Paket Butuh Perbaikan"),
      )!;
      expect(rejCard).toBeDefined();
      expect(rejCard.textContent).toContain("Perbaiki Paket");
      expect(rejCard.textContent).toContain(
        "Catatan: Mohon sesuaikan rincian jadwal makan siang.",
      );
    });

    it("AY. Empty status filter differs truthfully from empty account state", async () => {
      // 1. Account with packages selecting empty filter (e.g. Draf when 0 drafts exist)
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
      const view = await renderComponent(createElement(EoPackagesScreen));

      const filterTabs = Array.from(
        view.querySelectorAll<HTMLButtonElement>(".eo-packages-filter__tab"),
      );
      const draftTab = filterTabs.find((t) => t.textContent?.includes("Draf"))!;

      await act(async () => {
        draftTab.click();
      });

      expect(view.textContent).toContain("Belum ada paket dengan status ini.");
      expect(view.textContent).toContain("Lihat Semua Paket");
      expect(view.textContent).not.toContain(
        "Kamu belum punya paket experience.",
      );

      // 2. Fresh account with 0 packages
      partnerSessionStore.loginAsDemoApproved("CONCEPT_ONLY");
      const emptyView = await renderComponent(createElement(EoPackagesScreen));

      expect(emptyView.textContent).toContain(
        "Kamu belum punya paket experience.",
      );
      expect(emptyView.textContent).toContain("Buat Paket Pertama");
      expect(emptyView.textContent).toContain("Lihat Insight");
      expect(emptyView.textContent).not.toContain(
        "Belum ada paket dengan status ini.",
      );
    });

    it("AZ. Package Detail renders SVG back button, clean Guide Ready, human pricing, and source-backed insight", async () => {
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

      const view = await renderComponent(createElement(App), [
        "/partner/eo/packages/slow_green_day",
      ]);

      // Back navigation with SVG icon (no raw arrow)
      expect(view.textContent).toContain("Kembali ke Daftar Paket");
      expect(view.textContent).not.toContain("← Kembali");
      expect(view.textContent).not.toContain("&larr;");
      const backSvg = view.querySelector(".eo-pkg-detail-back-icon");
      expect(backSvg).not.toBeNull();

      // Lifecycle callout
      expect(view.textContent).toContain("Paket Sedang Tayang (Live)");
      expect(view.textContent).toContain("2 jadwal keberangkatan mendatang");

      // Clean Guide Ready wording (no duplicate checkmarks like ✓ Guide Ready ✓)
      expect(view.textContent).toContain("Guide Ready");
      expect(view.textContent).not.toContain("✓ Guide Ready ✓");
      expect(view.textContent).toContain(
        "Pemandu lokal tersedia dari destinasi",
      );

      // Accurate pricing terminology
      expect(view.textContent).toContain("Biaya dasar destinasi");
      expect(view.textContent).toContain("Margin EO");
      expect(view.textContent).toContain("Harga traveler");
      expect(view.textContent).toContain("Rp125.000");
      expect(view.textContent).toContain("Rp150.000");
      expect(view.textContent).toContain("Rp275.000");
      expect(view.textContent).not.toContain("Modal Destinasi");
      expect(view.textContent).not.toContain("Harga Jual");
      expect(view.textContent).not.toContain("Margin Layanan & Kepemanduan EO");

      // Source-backed insight context (ins_nature_batu_1d)
      expect(view.textContent).toContain("Dibuat dari Insight Traveler");
      expect(view.textContent).toContain(
        "Tingginya Permintaan Jeda Alam 1 Hari di Lereng Malang Raya",
      );
      expect(view.textContent).not.toContain("AI generated");
    });
  });

  describe("11. Phase B2: Destination Discovery, Guide Source & Builder Step 1 (BG–BQ)", () => {
    it("BG. All active verified destinations in MVP provide local guide capability", () => {
      const allDests = mockDestinationStore.getAll();
      expect(allDests.length).toBeGreaterThan(0);
      for (const dest of allDests) {
        if (dest.status === "ACTIVE") {
          expect(dest.guideReady).toBe(true);
        }
      }
    });

    it("BH. EO Destination Directory renders cards with search, filters, and no duplicate checkmark", async () => {
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

      const view = await renderComponent(createElement(App), [
        "/partner/eo/destinations",
      ]);

      // Header
      expect(view.textContent).toContain("Destinasi Terverifikasi");
      expect(view.textContent).toContain(
        "Temukan mitra destinasi dan pelajari potensi aktivitasnya sebelum merancang package.",
      );

      // Search & Filter chips
      const searchInput = view.querySelector<HTMLInputElement>(
        ".eo-destinations-search-input",
      );
      expect(searchInput).not.toBeNull();
      expect(view.textContent).toContain("Terverifikasi Plus");
      expect(view.textContent).toContain("Terverifikasi Dasar");

      // Destination cards
      expect(view.textContent).toContain("Lereng Hijau Batu");
      expect(view.textContent).toContain("Lembah Alam Pacet");
      expect(view.textContent).toContain("Hutan Bambu Trawas");
      expect(view.textContent).toContain("Pemandu lokal tersedia");
      expect(view.textContent).not.toContain("Guide Ready ✓");
      expect(view.textContent).not.toContain("✓ Guide Ready ✓");
    });

    it("BI. Search filters destination cards by name and location", async () => {
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

      const view = await renderComponent(createElement(App), [
        "/partner/eo/destinations",
      ]);

      const searchInput = view.querySelector<HTMLInputElement>(
        ".eo-destinations-search-input",
      )!;

      await act(async () => {
        const nativeSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value",
        )?.set;
        nativeSetter?.call(searchInput, "Pacet");
        searchInput.dispatchEvent(new Event("change", { bubbles: true }));
      });

      expect(view.textContent).toContain("Lembah Alam Pacet");
      expect(view.textContent).not.toContain("Lereng Hijau Batu");
    });

    it("BJ. EO Destination Detail route renders full identity, activities, facilities, and CTA", async () => {
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

      const view = await renderComponent(createElement(App), [
        "/partner/eo/destinations/dest_lereng_hijau",
      ]);

      // Back button with SVG
      expect(view.textContent).toContain("Kembali ke Destinasi");
      expect(view.querySelector(".eo-dest-detail-back-icon")).not.toBeNull();

      // Content
      expect(view.textContent).toContain("Lereng Hijau Batu");
      expect(view.textContent).toContain("Batu / Malang Raya");
      expect(view.textContent).toContain("Tentang Destinasi");
      expect(view.textContent).toContain("Aktivitas yang Tersedia");
      expect(view.textContent).toContain("Fasilitas di Lokasi");
      expect(view.textContent).toContain("Pemanduan Lokal");
      expect(view.textContent).toContain("Pemandu Lokal Siap");
      expect(view.textContent).toContain("Biaya dasar destinasi");

      // CTA
      const ctaBtn = Array.from(view.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Buat Paket dengan Destinasi Ini"),
      );
      expect(ctaBtn).toBeDefined();
    });

    it("BK. Builder Step 1 preselects destination from destinationId query parameter", async () => {
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

      const view = await renderComponent(createElement(App), [
        "/partner/eo/packages/new?destinationId=dest_lembah_pacet",
      ]);

      // Step 1 title
      expect(view.textContent).toContain(
        "Langkah 1: Pilih Destinasi & Status Pemanduan",
      );

      // Selected card has Terpilih indicator
      const pacetCard = Array.from(
        view.querySelectorAll(".eo-builder-dest-card"),
      ).find((c) => c.textContent?.includes("Lembah Alam Pacet"))!;
      expect(pacetCard).toBeDefined();
      expect(pacetCard.textContent).toContain("Terpilih ✓");
    });

    it("BL. Builder guide source selection: Concept Only is locked to destination guide, Certified Guide has choice", async () => {
      // 1. Concept Only
      partnerSessionStore.loginAsDemoApproved("CONCEPT_ONLY");
      const viewConcept = await renderComponent(createElement(App), [
        "/partner/eo/packages/new",
      ]);

      expect(viewConcept.textContent).toContain("Pemandu dari Destinasi");
      expect(viewConcept.textContent).toContain(
        "Tersedia melalui mitra destinasi",
      );
      expect(viewConcept.textContent).toContain(
        "Kamu fokus merancang experience. Pemanduan akan disiapkan oleh mitra destinasi terverifikasi di lokasi.",
      );
      expect(viewConcept.textContent).not.toContain("Pemandu dari EO");

      // 2. Certified Guide
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
      const viewCertified = await renderComponent(createElement(App), [
        "/partner/eo/packages/new",
      ]);

      expect(viewCertified.textContent).toContain("Pemandu dari Destinasi");
      expect(viewCertified.textContent).toContain(
        "Pemandu dari EO (Certified Guide)",
      );
    });

    it("BM. Inspecting destination in Builder opens Dialog without selecting destination", async () => {
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

      const view = await renderComponent(createElement(App), [
        "/partner/eo/packages/new",
      ]);

      // Click "Lihat Detail" on dest_hutan_trawas card
      const trawasCard = Array.from(
        view.querySelectorAll(".eo-builder-dest-card"),
      ).find((c) => c.textContent?.includes("Hutan Bambu Trawas"))!;
      expect(trawasCard).toBeDefined();

      const inspectBtn = Array.from(trawasCard.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("Lihat Detail"),
      )!;
      expect(inspectBtn).toBeDefined();

      await act(async () => {
        inspectBtn.click();
      });

      // Dialog opens showing details
      expect(view.textContent).toContain("Kawasan hutan bambu hening");
      // Trawas card is not yet marked selected
      expect(trawasCard.textContent).toContain("Pilih");
    });

    it("BN. Package sessions screen shows contextual back button when packageId is in route, but global sessions does not", async () => {
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

      // 1. Route with packageId
      const viewPackageSessions = await renderComponent(createElement(App), [
        "/partner/eo/packages/slow_green_day/sessions",
      ]);
      expect(viewPackageSessions.textContent).toContain("Kembali ke Paket");
      expect(
        viewPackageSessions.querySelector(".eo-pkg-detail-back-icon"),
      ).not.toBeNull();

      // 2. Global sessions route
      const viewGlobalSessions = await renderComponent(createElement(App), [
        "/partner/eo/sessions",
      ]);
      expect(viewGlobalSessions.textContent).not.toContain("Kembali ke Paket");
    });

    it("BO. Future ACTIVE + guideReady=false destination is excluded from both Directory and Builder", async () => {
      // Inactive/pre-availability destination with guideReady = false
      mockDestinationStore.upsertVerifiedDestination({
        destinationId: "dest_future_noguide",
        name: "Lembah Purba No Guide",
        locationLabel: "Pasuruan Barat",
        province: "Jawa Timur",
        city: "Pasuruan",
        verificationLevel: "BASIC",
        guideReady: false, // Not ready!
        baseCostPerPerson: 75000,
        description: "Destinasi belum memiliki pemandu lokal.",
        highlights: ["Hutan asri"],
        capacityPerSession: 10,
        status: "ACTIVE",
      });

      // 1. Selector check
      const conceptEligible =
        mockDestinationStore.getEligibleForEo("CONCEPT_ONLY");
      const certifiedEligible =
        mockDestinationStore.getEligibleForEo("CERTIFIED_GUIDE");
      expect(
        conceptEligible.some((d) => d.destinationId === "dest_future_noguide"),
      ).toBe(false);
      expect(
        certifiedEligible.some(
          (d) => d.destinationId === "dest_future_noguide",
        ),
      ).toBe(false);

      // 2. Directory check
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
      const viewDir = await renderComponent(createElement(App), [
        "/partner/eo/destinations",
      ]);
      expect(viewDir.textContent).not.toContain("Lembah Purba No Guide");

      // 3. Builder Step 1 check
      const viewBuilder = await renderComponent(createElement(App), [
        "/partner/eo/packages/new",
      ]);
      expect(viewBuilder.textContent).not.toContain("Lembah Purba No Guide");
    });

    it("BP. Package guideSource is strictly validated: missing rejected, Concept Only locked, Certified Guide flexible", () => {
      partnerSessionStore.loginAsDemoApproved("CONCEPT_ONLY");

      // 1. Missing guideSource is rejected
      const missingRes = validateEoPackage(
        {
          destinationId: "dest_lereng_hijau",
          title: "Paket Uji Coba",
          shortSummary: "Ringkasan pengalaman valid minimal 10 chars.",
          durationLabel: "1 hari",
          itinerary: [{ order: 1, title: "Sesi", description: "Hening" }],
          safetyNotes: ["Aman"],
          pricing: {
            destinationBaseCost: 125000,
            eoMargin: 75000,
            customerPrice: 200000,
          },
          guideSource: undefined as unknown as "DESTINATION",
        },
        "CONCEPT_ONLY",
      );
      expect(missingRes.valid).toBe(false);
      expect(missingRes.errors.some((e) => e.field === "guideSource")).toBe(
        true,
      );

      // 2. Concept Only with DESTINATION passes
      const conceptDestRes = validateEoPackage(
        {
          destinationId: "dest_lereng_hijau",
          title: "Paket Uji Coba",
          shortSummary: "Ringkasan pengalaman valid minimal 10 chars.",
          durationLabel: "1 hari",
          itinerary: [{ order: 1, title: "Sesi", description: "Hening" }],
          safetyNotes: ["Aman"],
          pricing: {
            destinationBaseCost: 125000,
            eoMargin: 75000,
            customerPrice: 200000,
          },
          guideSource: "DESTINATION",
        },
        "CONCEPT_ONLY",
      );
      expect(conceptDestRes.valid).toBe(true);

      // 3. Concept Only with EO fails
      const conceptEoRes = validateEoPackage(
        {
          destinationId: "dest_lereng_hijau",
          title: "Paket Uji Coba",
          shortSummary: "Ringkasan pengalaman valid minimal 10 chars.",
          durationLabel: "1 hari",
          itinerary: [{ order: 1, title: "Sesi", description: "Hening" }],
          safetyNotes: ["Aman"],
          pricing: {
            destinationBaseCost: 125000,
            eoMargin: 75000,
            customerPrice: 200000,
          },
          guideSource: "EO",
        },
        "CONCEPT_ONLY",
      );
      expect(conceptEoRes.valid).toBe(false);
      expect(conceptEoRes.errors.some((e) => e.field === "guideSource")).toBe(
        true,
      );

      // 4. Certified Guide with DESTINATION passes
      const certDestRes = validateEoPackage(
        {
          destinationId: "dest_lereng_hijau",
          title: "Paket Uji Coba",
          shortSummary: "Ringkasan pengalaman valid minimal 10 chars.",
          durationLabel: "1 hari",
          itinerary: [{ order: 1, title: "Sesi", description: "Hening" }],
          safetyNotes: ["Aman"],
          pricing: {
            destinationBaseCost: 125000,
            eoMargin: 75000,
            customerPrice: 200000,
          },
          guideSource: "DESTINATION",
        },
        "CERTIFIED_GUIDE",
      );
      expect(certDestRes.valid).toBe(true);

      // 5. Certified Guide with EO passes
      const certEoRes = validateEoPackage(
        {
          destinationId: "dest_lereng_hijau",
          title: "Paket Uji Coba",
          shortSummary: "Ringkasan pengalaman valid minimal 10 chars.",
          durationLabel: "1 hari",
          itinerary: [{ order: 1, title: "Sesi", description: "Hening" }],
          safetyNotes: ["Aman"],
          pricing: {
            destinationBaseCost: 125000,
            eoMargin: 75000,
            customerPrice: 200000,
          },
          guideSource: "EO",
        },
        "CERTIFIED_GUIDE",
      );
      expect(certEoRes.valid).toBe(true);
    });

    it("BQ. Seeded LIVE and PENDING packages have valid DESTINATION guideSource and saveDraft persists guideSource", () => {
      const livePkg = mockEoPackageStore.getPackageById("slow_green_day");
      const pendingPkg = mockEoPackageStore.getPackageById(
        "pkg_pacet_mindful_retreat",
      );

      expect(livePkg?.guideSource).toBe("DESTINATION");
      expect(pendingPkg?.guideSource).toBe("DESTINATION");

      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
      const savedRes = mockEoPackageStore.saveDraft({
        title: "Paket Pemandu EO",
        shortSummary: "Ringkasan pengalaman valid minimal 10 chars.",
        destinationId: "dest_lereng_hijau",
        durationLabel: "1 hari",
        itinerary: [{ order: 1, title: "Sesi", description: "Hening" }],
        safetyNotes: ["Aman"],
        guideSource: "EO",
        pricing: {
          destinationBaseCost: 125000,
          eoMargin: 75000,
          customerPrice: 200000,
        },
      });

      expect(savedRes.success).toBe(true);
      expect(savedRes.package?.guideSource).toBe("EO");
    });
  });
});
