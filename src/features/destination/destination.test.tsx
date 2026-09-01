// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { App } from "../../App";
import { mockAdminDecisionService } from "../admin/mockAdminDecisionService";
import { mockDestinationVerificationStore } from "../admin/mockDestinationVerificationStore";
import { adminSessionStore } from "../admin/adminSessionStore";
import { mockTransactionStore } from "../checkout/mockTransactionStore";
import { mockDestinationStore } from "../eo/mockDestinationStore";
import { mockEoPackageStore } from "../eo/mockEoPackageStore";
import { partnerSessionStore } from "../eo/partnerSessionStore";
import { mockReviewStore } from "../reviews/mockReviewStore";
import { mockDestinationPartnerService } from "./mockDestinationPartnerService";
import { DestinationOverviewScreen } from "./DestinationOverviewScreen";
import { DestinationProfileScreen } from "./DestinationProfileScreen";
import { DestinationVerificationBadgeScreen } from "./DestinationVerificationBadgeScreen";
import { DestinationScheduleScreen } from "./DestinationScheduleScreen";
import { DestinationCapacityScreen } from "./DestinationCapacityScreen";
import { DestinationReviewsScreen } from "./DestinationReviewsScreen";
import { DestinationSettingsScreen } from "./DestinationSettingsScreen";

let container: HTMLDivElement;
let root: Root;

beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});

afterEach(async () => {
  await act(() => root?.unmount());
  container?.remove();
  partnerSessionStore.reset();
  adminSessionStore.reset();
  mockDestinationStore.reset();
  mockDestinationVerificationStore.reset();
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

describe("P7 — Destination Partner Golden Flow (DP01–DP11) Tests", () => {
  describe("1. Access Control & Guards (A–F)", () => {
    it("A. logged-out user accessing /partner/destination is redirected to /partner/login", async () => {
      partnerSessionStore.logout();

      const view = await renderComponent(createElement(App), [
        "/partner/destination",
      ]);

      expect(view.textContent).toContain("Masuk ke Portal Partner");
      expect(view.textContent).toContain("Tipe Kemitraan");
    });

    it("B. EO authenticated user cannot enter Destination workspace", async () => {
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE"); // role = EO

      const view = await renderComponent(createElement(App), [
        "/partner/destination",
      ]);

      expect(view.textContent).toContain("Masuk ke Portal Partner");
      expect(view.textContent).not.toContain("Kapasitas & Alokasi");
    });

    it("C. approved Destination demo user can enter operational workspace", async () => {
      partnerSessionStore.loginAsDemoDestination(); // role = DESTINATION, dest_lereng_hijau

      const view = await renderComponent(createElement(App), [
        "/partner/destination",
      ]);

      expect(view.textContent).toContain("Lereng Hijau Batu");
      expect(view.textContent).toContain("Mitra Destinasi Terverifikasi");
      expect(view.textContent).toContain("Jadwal Sesi EO di Lokasi Anda");
    });

    it("D & E. PENDING and REJECTED destination identities are blocked from operational workspace", async () => {
      // Pending
      partnerSessionStore.setPartner({
        id: "dest_partner_coban_rondo",
        email: "partner@cobanrondo.id",
        name: "Pengelola Coban Rondo",
        role: "DESTINATION",
        businessName: "Pengelola Coban Rondo",
        destinationIdentityId: "dest_coban_rondo",
      });

      const pendingView = await renderComponent(createElement(App), [
        "/partner/destination",
      ]);
      expect(pendingView.textContent).toContain("Status Verifikasi Destinasi");
      expect(pendingView.textContent).toContain("Sedang Ditinjau");

      // Rejected
      partnerSessionStore.setPartner({
        id: "dest_partner_rejected",
        email: "partner@curahrawan.id",
        name: "Pengelola Curah Rawan",
        role: "DESTINATION",
        businessName: "Pengelola Curah Rawan",
        destinationIdentityId: "dest_curah_rawan",
      });

      const rejView = await renderComponent(createElement(App), [
        "/partner/destination",
      ]);
      expect(rejView.textContent).toContain("Status Verifikasi Destinasi");
      expect(rejView.textContent).toContain("Perlu Perbaikan");
    });

    it("F. forged destinationId mutation without authenticated partner fails", () => {
      partnerSessionStore.logout();

      const res = mockDestinationPartnerService.submitApplication({
        partnerIdentityId: "forged_partner",
        destinationIdentityId: "forged_dest",
        name: "Forged Venue",
        locationLabel: "Malang",
        province: "Jatim",
        city: "Batu",
        managementName: "Forged",
        contactPerson: "Forged",
        phone: "0812",
        email: "forged@test.com",
        description: "Desc",
        highlights: ["High"],
        capacityPerSession: 20,
        baseCostPerPerson: 100000,
        guideReady: true,
        guideReadinessEvidence: "Ready",
        agreedToSop: true,
      });

      expect(res.success).toBe(false);
      expect(res.message).toContain("Akses ditolak");
    });
  });

  describe("2. Destination Application & Admin Cross-Surface Bridge (G–O)", () => {
    it("G & H & I. new destination submit creates shared PENDING_REVIEW record visible in Admin queue, with duplicate submit blocked", () => {
      partnerSessionStore.setPartner({
        id: "dest_partner_new_tree",
        email: "contact@rumahpohon.id",
        name: "Pengelola Omah Kayu",
        role: "DESTINATION",
        businessName: "Rumah Pohon Paralayang",
      });

      const res = mockDestinationPartnerService.submitApplication({
        partnerIdentityId: "dest_partner_new_tree",
        destinationIdentityId: "dest_omah_kayu",
        name: "Rumah Pohon Paralayang Batu",
        locationLabel: "Batu / Malang",
        province: "Jawa Timur",
        city: "Batu",
        managementName: "Pokdarwis Gunung Banyak",
        contactPerson: "Bambang",
        phone: "0812998877",
        email: "contact@rumahpohon.id",
        description: "Kawasan kabin pohon hening di puncak bukit.",
        highlights: ["Pemandangan lembah", "Udara sejuk"],
        capacityPerSession: 15,
        baseCostPerPerson: 130000,
        guideReady: true,
        guideReadinessEvidence: "Pemandu lokal standby di pos utama.",
        agreedToSop: true,
      });

      expect(res.success).toBe(true);
      expect(res.applicationId).toBeDefined();

      // H: Admin queue sees SAME application record
      adminSessionStore.loginAsDemoAdmin();
      const adminApps = mockDestinationVerificationStore.getAll();
      const foundInAdmin = adminApps.find(
        (a) => a.destinationIdentityId === "dest_omah_kayu",
      );
      expect(foundInAdmin).toBeDefined();
      expect(foundInAdmin?.status).toBe("PENDING_REVIEW");

      // I: Duplicate submit while PENDING_REVIEW is blocked
      partnerSessionStore.setPartner({
        id: "dest_partner_new_tree",
        email: "contact@rumahpohon.id",
        name: "Pengelola Omah Kayu",
        role: "DESTINATION",
        businessName: "Rumah Pohon Paralayang",
      });
      const dup = mockDestinationPartnerService.submitApplication({
        partnerIdentityId: "dest_partner_new_tree",
        name: "Rumah Pohon Paralayang Batu",
        locationLabel: "Batu",
        province: "Jatim",
        city: "Batu",
        managementName: "Pokdarwis",
        contactPerson: "Bambang",
        phone: "0812",
        email: "contact@rumahpohon.id",
        description: "Desc",
        highlights: ["H"],
        capacityPerSession: 15,
        baseCostPerPerson: 130000,
        guideReady: true,
        guideReadinessEvidence: "Evidence",
        agreedToSop: true,
      });
      expect(dup.success).toBe(false);
      expect(dup.message).toContain("sedang dalam proses verifikasi");
    });

    it("J & K & L. Admin approve BASIC + guide_ready makes Partner operational, updates canonical directory, and never grants PLUS on initial approval", () => {
      adminSessionStore.loginAsDemoAdmin();

      const approveRes =
        mockAdminDecisionService.approveDestinationVerification(
          "dest_app_coban_rondo",
          true, // guideReady = true
          "Kawasan hutan pinus Coban Rondo memenuhi standar kurasi.",
        );
      expect(approveRes.success).toBe(true);

      const app = mockDestinationVerificationStore.getById(
        "dest_app_coban_rondo",
      );
      expect(app?.status).toBe("APPROVED");
      expect(app?.approvedLevel).toBe("BASIC"); // L: Never PLUS on initial approval
      expect(app?.approvedGuideReady).toBe(true);

      // J & K: Partner identity becomes operational
      partnerSessionStore.setPartner({
        id: "dest_partner_coban_rondo",
        email: "partner@cobanrondo.id",
        name: "Pengelola Hutan Pinus Coban Rondo",
        role: "DESTINATION",
        businessName: "Pengelola Coban Rondo",
        destinationIdentityId: "dest_coban_rondo",
      });

      const canonical =
        mockDestinationPartnerService.getCanonicalDestinationForPartner();
      expect(canonical).toBeDefined();
      expect(canonical?.name).toBe("Hutan Pinus Coban Rondo");
      expect(canonical?.guideReady).toBe(true);

      // EO Eligibility can consume it
      const eligibleForConcept =
        mockDestinationStore.getEligibleForEo("CONCEPT_ONLY");
      expect(
        eligibleForConcept.some((d) => d.destinationId === "dest_coban_rondo"),
      ).toBe(true);
    });

    it("M & N & O. Admin reject exact reason surfaces in Partner UI, reapply preserves same identity, and APPROVED cannot self-demote", () => {
      adminSessionStore.loginAsDemoAdmin();

      mockAdminDecisionService.rejectDestinationVerification(
        "dest_app_coban_rondo",
        "Akses jalur evakuasi hujan perlu ditata ulang.",
      );

      // M: Reason visible in Partner status
      partnerSessionStore.setPartner({
        id: "dest_partner_coban_rondo",
        email: "partner@cobanrondo.id",
        name: "Pengelola Hutan Pinus Coban Rondo",
        role: "DESTINATION",
        businessName: "Pengelola Coban Rondo",
        destinationIdentityId: "dest_coban_rondo",
      });

      const app = mockDestinationVerificationStore.getByPartnerId(
        "dest_partner_coban_rondo",
      );
      expect(app?.status).toBe("REJECTED");
      expect(app?.rejectionReason).toBe(
        "Akses jalur evakuasi hujan perlu ditata ulang.",
      );

      // N: Reapply with same partner identity
      const reapplyRes = mockDestinationPartnerService.submitApplication({
        partnerIdentityId: "dest_partner_coban_rondo",
        destinationIdentityId: "dest_coban_rondo",
        name: "Hutan Pinus Coban Rondo",
        locationLabel: "Pujon, Malang",
        province: "Jawa Timur",
        city: "Batu",
        managementName: "Pengelola Coban Rondo",
        contactPerson: "Hadi",
        phone: "0812",
        email: "partner@cobanrondo.id",
        description: "Revisi jalur evakuasi telah diperbaiki.",
        highlights: ["Jalur aman"],
        capacityPerSession: 25,
        baseCostPerPerson: 110000,
        guideReady: true,
        guideReadinessEvidence: "Pemandu bersiap di pos evakuasi.",
        agreedToSop: true,
      });
      expect(reapplyRes.success).toBe(true);
      expect(
        mockDestinationVerificationStore.getByPartnerId(
          "dest_partner_coban_rondo",
        )?.status,
      ).toBe("PENDING_REVIEW");

      // O: APPROVED partner cannot self-resubmit
      partnerSessionStore.loginAsDemoDestination(); // APPROVED
      const approvedSubmit = mockDestinationPartnerService.submitApplication({
        partnerIdentityId: "dest_partner_lereng_hijau",
        name: "Lereng Hijau",
        locationLabel: "Batu",
        province: "Jatim",
        city: "Batu",
        managementName: "Pokdarwis",
        contactPerson: "Hadi",
        phone: "0812",
        email: "destinasi@lerenghijau.id",
        description: "Desc",
        highlights: ["H"],
        capacityPerSession: 20,
        baseCostPerPerson: 125000,
        guideReady: true,
        guideReadinessEvidence: "Ready",
        agreedToSop: true,
      });
      expect(approvedSubmit.success).toBe(false);
      expect(approvedSubmit.message).toContain("sudah disetujui (APPROVED)");
    });
  });

  describe("3. Profile & Verification Badge Dimensions (P–T)", () => {
    it("P & Q & R. verification level and guide readiness are displayed independently and cannot be toggled by partner", async () => {
      partnerSessionStore.loginAsDemoDestination();

      const view = await renderComponent(
        createElement(DestinationVerificationBadgeScreen),
      );

      expect(view.textContent).toContain(
        "Verifikasi & Lencana Kualitas Destinasi",
      );
      expect(view.textContent).toContain("Dimensi 1: Fasilitas & SOP");
      expect(view.textContent).toContain("Level BASIC");
      expect(view.textContent).toContain("Dimensi 2: Pemandu Lokal");
      expect(view.textContent).toContain("Guide Ready ✓");

      // No toggle buttons
      expect(view.querySelectorAll("button").length).toBe(0);
    });

    it("S & T. Destination Profile reads shared destination store and returned snapshots do not mutate store by reference", async () => {
      partnerSessionStore.loginAsDemoDestination();

      const view = await renderComponent(
        createElement(DestinationProfileScreen),
      );

      expect(view.textContent).toContain("Profil Kawasan Destinasi");
      expect(view.textContent).toContain("Lereng Hijau Batu");
      expect(view.textContent).toContain("Rp125.000");
      expect(view.textContent).toContain("20 Orang / sesi");

      // Test snapshot isolation
      const snap = mockDestinationStore.getById("dest_lereng_hijau")!;
      snap.name = "Mutated Offline Name";
      expect(mockDestinationStore.getById("dest_lereng_hijau")?.name).toBe(
        "Lereng Hijau Batu",
      );
    });
  });

  describe("4. Schedule & Capacity Integration (U–AA)", () => {
    it("U & V & W & X. Schedule screen shows only venue sessions, calculates confirmed participants from transaction store, and hides traveler PII", async () => {
      partnerSessionStore.loginAsDemoDestination();

      // Add a confirmed booking for slow_green_day at dest_lereng_hijau
      mockTransactionStore.addDirectBooking({
        bookingId: "bk_venue_sched_test",
        travelerId: "usr_secret_traveler_123",
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

      const view = await renderComponent(
        createElement(DestinationScheduleScreen),
      );

      expect(view.textContent).toContain("Jadwal Sesi Perjalanan di Lokasi");
      expect(view.textContent).toContain("Sehari Pelan di Lereng Hijau");
      expect(view.textContent).toContain("2 / 6 Orang");

      // Privacy: no traveler private info
      expect(view.textContent).not.toContain("usr_secret_traveler_123");
      expect(view.textContent).not.toContain("0812");
    });

    it("Y & Z & AA. Capacity screen displays base venue capacity vs EO session allocation without allowing EO session mutation", async () => {
      partnerSessionStore.loginAsDemoDestination();

      const view = await renderComponent(
        createElement(DestinationCapacityScreen),
      );

      expect(view.textContent).toContain(
        "Kapasitas & Alokasi Pengunjung Venue",
      );
      expect(view.textContent).toContain("Batas Kapasitas Venue");
      expect(view.textContent).toContain("20");
      expect(view.textContent).toContain(
        "Alokasi Kapasitas per Sesi Perjalanan",
      );

      // Read-only: no edit session capacity buttons
      expect(view.textContent).not.toContain("Ubah Kuota");
      expect(view.textContent).not.toContain("Buka Sesi");
    });
  });

  describe("5. Destination Reviews & Privacy (AB–AG)", () => {
    it("AB & AC & AD. Destination Reviews shows only venue reviews, excludes EO_GUIDE reviews, and computes average rating", async () => {
      partnerSessionStore.loginAsDemoDestination();

      // Submit destination review
      mockReviewStore.submitReview({
        bookingId: "bk_dest_rev_1",
        travelerId: "usr_1",
        targetType: "DESTINATION",
        targetRef: "Lereng Hijau Batu",
        rating: 5,
        comment: "Kawasan kebun teh sangat asri dan sejuk.",
      });

      mockReviewStore.submitReview({
        bookingId: "bk_dest_rev_2",
        travelerId: "usr_2",
        targetType: "DESTINATION",
        targetRef: "Lereng Hijau Batu",
        rating: 4,
        comment: "Fasilitas saung bersih.",
      });

      // Submit EO_GUIDE review (must be excluded)
      mockReviewStore.submitReview({
        bookingId: "bk_eo_rev_exc",
        travelerId: "usr_3",
        targetType: "EO_GUIDE",
        targetRef: "org_lereng_batu",
        rating: 1, // Should not pollute venue rating
        comment: "Komentar guide.",
      });

      const view = await renderComponent(
        createElement(DestinationReviewsScreen),
      );

      expect(view.textContent).toContain("Ulasan & Rating Destinasi");
      expect(view.textContent).toContain("★ 4.5"); // (5 + 4) / 2 = 4.5
      expect(view.textContent).toContain(
        "Kawasan kebun teh sangat asri dan sejuk.",
      );
      expect(view.textContent).not.toContain("Komentar guide.");
    });

    it("AE & AF & AG. zero reviews shows 'Belum ada rating', empty comment shows 'Tanpa komentar', and travelerId is hidden", async () => {
      // Switch to a destination with 0 reviews (Hutan Bambu Trawas)
      partnerSessionStore.setPartner({
        id: "dest_partner_trawas_bambu",
        email: "partner@trawas.id",
        name: "Pengelola Trawas",
        role: "DESTINATION",
        businessName: "Pengelola Bambu Trawas",
        destinationIdentityId: "dest_hutan_trawas",
      });

      const emptyView = await renderComponent(
        createElement(DestinationReviewsScreen),
      );
      expect(emptyView.textContent).toContain("Belum ada rating");
      expect(emptyView.textContent).not.toContain("★ 5.0");

      // Add review with empty comment
      mockReviewStore.submitReview({
        bookingId: "bk_empty_comment_dest",
        travelerId: "usr_secret_privacy_dest",
        targetType: "DESTINATION",
        targetRef: "Hutan Bambu Trawas",
        rating: 5,
        comment: "",
      });

      const revView = await renderComponent(
        createElement(DestinationReviewsScreen),
      );
      expect(revView.textContent).toContain("Tanpa komentar");
      expect(revView.textContent).not.toContain("usr_secret_privacy_dest");
      expect(revView.textContent).toContain("bk_empty_comment_dest");
    });
  });

  describe("6. Overview & Settings Screens (DP05 & DP11)", () => {
    it("renders Destination Overview with completeness metrics and Settings info", async () => {
      partnerSessionStore.loginAsDemoDestination();

      const overviewView = await renderComponent(
        createElement(DestinationOverviewScreen),
      );
      expect(overviewView.textContent).toContain("Lereng Hijau Batu");
      expect(overviewView.textContent).toContain("6/6 Informasi Inti Lengkap");

      const settingsView = await renderComponent(
        createElement(DestinationSettingsScreen),
      );
      expect(settingsView.textContent).toContain("Profil Kemitraan Destinasi");
      expect(settingsView.textContent).toContain("Pengelola Lereng Hijau Batu");
      expect(settingsView.textContent).toContain("Hadi Purnomo");
      expect(settingsView.textContent).toContain(
        "Perjanjian Kemitraan Destinasi Aktif",
      );
    });
  });
});
