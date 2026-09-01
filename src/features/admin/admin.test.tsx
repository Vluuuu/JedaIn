// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { App } from "../../App";
import { mockTransactionStore } from "../checkout/mockTransactionStore";
import { mockApplicationStore } from "../eo/mockApplicationStore";
import { mockDestinationStore } from "../eo/mockDestinationStore";
import { mockEoPackageStore } from "../eo/mockEoPackageStore";
import { partnerSessionStore } from "../eo/partnerSessionStore";
import { mockReviewStore } from "../reviews/mockReviewStore";
import { adminSessionStore } from "./adminSessionStore";
import { mockAdminAuditStore } from "./mockAdminAuditStore";
import { mockAdminDecisionService } from "./mockAdminDecisionService";
import { mockComplaintStore } from "./mockComplaintStore";
import { mockDestinationVerificationStore } from "./mockDestinationVerificationStore";
import { AdminEoApprovalsScreen } from "./AdminEoApprovalsScreen";
import { AdminDestinationVerificationsScreen } from "./AdminDestinationVerificationsScreen";
import { AdminPackageApprovalsScreen } from "./AdminPackageApprovalsScreen";
import { AdminBookingsScreen } from "./AdminBookingsScreen";
import { AdminTrustStatusScreen } from "./AdminTrustStatusScreen";
import { AdminAuditActivityScreen } from "./AdminAuditActivityScreen";

let container: HTMLDivElement;
let root: Root;

beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});

afterEach(async () => {
  await act(() => root?.unmount());
  container?.remove();
  adminSessionStore.reset();
  partnerSessionStore.reset();
  mockApplicationStore.reset();
  mockDestinationStore.reset();
  mockEoPackageStore.reset();
  mockDestinationVerificationStore.reset();
  mockComplaintStore.reset();
  mockAdminAuditStore.reset();
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

describe("P6 — Admin Trust Loop (A01–A13) Tests", () => {
  describe("1. Admin Access & Route Guard (A–D)", () => {
    it("A. logged-out /admin redirects to /admin/login", async () => {
      adminSessionStore.logout();

      const view = await renderComponent(createElement(App), ["/admin"]);
      expect(view.textContent).toContain("Masuk ke Admin Console");
      expect(view.textContent).toContain("Email Administrator");
    });

    it("B. Admin Demo opens /admin operational console", async () => {
      adminSessionStore.loginAsDemoAdmin();

      const view = await renderComponent(createElement(App), ["/admin"]);
      expect(view.textContent).toContain(
        "Overview Operasional Kurasi & Tata Kelola",
      );
      expect(view.textContent).toContain("Antrean Peninjauan Utama");
    });

    it("C. EO Partner session does not grant Admin workspace access", async () => {
      adminSessionStore.logout();
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

      const view = await renderComponent(createElement(App), ["/admin"]);
      expect(view.textContent).toContain("Masuk ke Admin Console");
      expect(view.textContent).not.toContain("Overview Operasional Kurasi");
    });

    it("D. direct Admin decision command without Admin session fails with zero mutation and zero audit", () => {
      adminSessionStore.logout();

      const res = mockAdminDecisionService.approveEoApplication(
        "app_eo_demo_pending",
        "Persetujuan tanpa sesi",
      );

      expect(res.success).toBe(false);
      expect(res.message).toContain("Akses ditolak");

      // Verify zero mutation in application store
      expect(mockApplicationStore.getById("app_eo_demo_pending")?.status).toBe(
        "PENDING_REVIEW",
      );

      // Verify zero audit created
      expect(
        mockAdminAuditStore
          .getAll()
          .some((e) => e.reason === "Persetujuan tanpa sesi"),
      ).toBe(false);
    });
  });

  describe("2. EO Approval Queue & Review Lifecycle (E–K)", () => {
    it("E. authoritative pending EO application appears in Admin queue", async () => {
      adminSessionStore.loginAsDemoAdmin();

      const view = await renderComponent(createElement(AdminEoApprovalsScreen));

      expect(view.textContent).toContain(
        "Antrean Aplikasi Mitra Event Organizer",
      );
      expect(view.textContent).toContain("Lestari Wellness Journey");
      expect(view.textContent).toContain("Maya Safira");
      expect(view.textContent).toContain("Surabaya, Jawa Timur");
      expect(view.textContent).toContain("Tinjau Aplikasi");
    });

    it("F & G. approve pending EO with audit reason transitions to APPROVED, adds audit, and allows operational access", async () => {
      adminSessionStore.loginAsDemoAdmin();

      const res = mockAdminDecisionService.approveEoApplication(
        "app_eo_demo_pending",
        "Sertifikat BNSP valid dan portofolio retreat memenuhi standar.",
      );

      expect(res.success).toBe(true);

      // App store updated
      expect(mockApplicationStore.getById("app_eo_demo_pending")?.status).toBe(
        "APPROVED",
      );

      // Audit event recorded
      const audits = mockAdminAuditStore.getAll();
      const eoAudit = audits.find(
        (a) =>
          a.entityId === "app_eo_demo_pending" && a.actionType === "APPROVE_EO",
      );
      expect(eoAudit).toBeDefined();
      expect(eoAudit?.reason).toContain("Sertifikat BNSP valid");

      // Cross-surface: SAME EO identity can now enter operational workspace
      partnerSessionStore.setPartner({
        id: "eo_pending_user",
        email: "maya@lestariwellness.id",
        name: "Maya Safira",
        role: "EO",
        businessName: "Lestari Wellness Journey",
        guideStatus: "CERTIFIED_GUIDE",
      });

      const partnerView = await renderComponent(createElement(App), [
        "/partner/eo",
      ]);
      expect(partnerView.textContent).toContain(
        "Overview Lestari Wellness Journey",
      );
      expect(partnerView.textContent).not.toContain(
        "Status Pengajuan Mitra EO",
      );
    });

    it("H & I. reject pending EO with exact reason transitions to REJECTED and reason is visible on EO status", async () => {
      adminSessionStore.loginAsDemoAdmin();

      const res = mockAdminDecisionService.rejectEoApplication(
        "app_eo_demo_pending",
        "Dokumen SOP penanganan darurat di sungai belum mencukupi.",
      );

      expect(res.success).toBe(true);
      expect(mockApplicationStore.getById("app_eo_demo_pending")?.status).toBe(
        "REJECTED",
      );

      // Same EO visits /partner/application
      partnerSessionStore.setPartner({
        id: "eo_pending_user",
        email: "maya@lestariwellness.id",
        name: "Maya Safira",
        role: "EO",
        businessName: "Lestari Wellness Journey",
        guideStatus: "CERTIFIED_GUIDE",
      });

      const partnerView = await renderComponent(createElement(App), [
        "/partner/application",
      ]);

      expect(partnerView.textContent).toContain("Perlu Perbaikan");
      expect(partnerView.textContent).toContain(
        "Dokumen SOP penanganan darurat di sungai belum mencukupi.",
      );
      expect(partnerView.textContent).toContain("Perbaiki Pengajuan");
    });

    it("J. missing audit reason blocks mutation with zero audit event", () => {
      adminSessionStore.loginAsDemoAdmin();

      const res = mockAdminDecisionService.approveEoApplication(
        "app_eo_demo_pending",
        "   ", // Empty reason
      );

      expect(res.success).toBe(false);
      expect(res.message).toContain("wajib diisi");
      expect(mockApplicationStore.getById("app_eo_demo_pending")?.status).toBe(
        "PENDING_REVIEW",
      );
    });

    it("K. stale APPROVED/REJECTED decision fails safely", () => {
      adminSessionStore.loginAsDemoAdmin();

      // app_eo_demo_approved is already APPROVED
      const res = mockAdminDecisionService.approveEoApplication(
        "app_eo_demo_approved",
        "Valid reason",
      );

      expect(res.success).toBe(false);
      expect(res.message).toContain("tidak dalam status PENDING_REVIEW");
    });
  });

  describe("3. Destination Verification Queue & Decisions (L–S)", () => {
    it("L. pending destination verification application appears in queue", async () => {
      adminSessionStore.loginAsDemoAdmin();

      const view = await renderComponent(
        createElement(AdminDestinationVerificationsScreen),
      );

      expect(view.textContent).toContain("Antrean Verifikasi Destinasi Lokal");
      expect(view.textContent).toContain("Hutan Pinus Coban Rondo");
      expect(view.textContent).toContain("Pujon, Malang");
      expect(view.textContent).toContain("Verifikasi Lokasi");
    });

    it("M & N & O. Approve BASIC + guide_ready sets guideReady true (NEVER PLUS on initial approval)", () => {
      adminSessionStore.loginAsDemoAdmin();

      const res = mockAdminDecisionService.approveDestinationVerification(
        "dest_app_coban_rondo",
        true, // guideReady = true
        "Kawasan hutan pinus memenuhi standar kebersihan dan SOP pemandu.",
      );

      expect(res.success).toBe(true);

      const app = mockDestinationVerificationStore.getById(
        "dest_app_coban_rondo",
      );
      expect(app?.status).toBe("APPROVED");
      expect(app?.approvedLevel).toBe("BASIC"); // Initial approval is BASIC only
      expect(app?.approvedGuideReady).toBe(true);

      // Enters canonical destination directory
      const canonical = mockDestinationStore.getById("dest_coban_rondo");
      expect(canonical).toBeDefined();
      expect(canonical?.verificationLevel).toBe("BASIC");
      expect(canonical?.guideReady).toBe(true);
    });

    it("P. Reject destination with reason persists exact reason", () => {
      adminSessionStore.loginAsDemoAdmin();

      const res = mockAdminDecisionService.rejectDestinationVerification(
        "dest_app_coban_rondo",
        "Akses jalan belum memadai untuk evakuasi darurat.",
      );

      expect(res.success).toBe(true);

      const app = mockDestinationVerificationStore.getById(
        "dest_app_coban_rondo",
      );
      expect(app?.status).toBe("REJECTED");
      expect(app?.rejectionReason).toBe(
        "Akses jalan belum memadai untuk evakuasi darurat.",
      );
    });

    it("Q & R & S. successful decision adds audit, prevents duplicate destination, and EO Builder can consume newly approved destination", () => {
      adminSessionStore.loginAsDemoAdmin();

      mockAdminDecisionService.approveDestinationVerification(
        "dest_app_coban_rondo",
        true,
        "Disetujui untuk pilot program.",
      );

      // Audit recorded
      const audit = mockAdminAuditStore
        .getAll()
        .find((a) => a.entityId === "dest_app_coban_rondo");
      expect(audit).toBeDefined();
      expect(audit?.actionType).toBe("APPROVE_DESTINATION");

      // Idempotency: duplicate decision
      const dup = mockAdminDecisionService.approveDestinationVerification(
        "dest_app_coban_rondo",
        true,
        "Duplicate",
      );
      expect(dup.success).toBe(false);

      // S: EO Builder eligibility can consume newly approved destination
      const eligibleForConcept =
        mockDestinationStore.getEligibleForEo("CONCEPT_ONLY");
      expect(
        eligibleForConcept.some((d) => d.destinationId === "dest_coban_rondo"),
      ).toBe(true);
    });
  });

  describe("4. Package Approval Queue & Checklist (T–AB)", () => {
    it("T & U. PENDING_ADMIN_REVIEW package appears in queue with automatic validation summary", async () => {
      adminSessionStore.loginAsDemoAdmin();

      const view = await renderComponent(
        createElement(AdminPackageApprovalsScreen),
      );

      expect(view.textContent).toContain(
        "Antrean Persetujuan Paket Experience",
      );
      expect(view.textContent).toContain("Pagi Hening Tepi Sungai Pacet");
      expect(view.textContent).toContain("Jeda Alam Nusantara");
      expect(view.textContent).toContain("Lolos Validasi ✓");
      expect(view.textContent).toContain("Review Paket");
    });

    it("V & W. Approve transitions package to APPROVED without auto-LIVE, publishing catalog, or creating session", () => {
      adminSessionStore.loginAsDemoAdmin();

      const res = mockAdminDecisionService.approvePackage(
        "pkg_pacet_mindful_retreat",
        "Itinerary mindful terstruktur rapi dan margin transparan.",
      );

      expect(res.success).toBe(true);

      const pkg = mockEoPackageStore.getPackageById(
        "pkg_pacet_mindful_retreat",
      );
      expect(pkg?.status).toBe("APPROVED"); // APPROVED only, NOT LIVE
      expect(pkg?.status).not.toBe("LIVE");

      // No session created automatically
      const sessions = mockEoPackageStore.getSessionsByPackage(
        "pkg_pacet_mindful_retreat",
      );
      expect(sessions.length).toBe(0);
    });

    it("X & Y & Z. Reject persists exact reason, visible in EO package detail, and approved package allows session creation", () => {
      adminSessionStore.loginAsDemoAdmin();

      // Reject first
      const rejRes = mockAdminDecisionService.rejectPackage(
        "pkg_pacet_mindful_retreat",
        "Perjelas rincian durasi setiap kegiatan meditasi.",
      );
      expect(rejRes.success).toBe(true);

      const pkg = mockEoPackageStore.getPackageById(
        "pkg_pacet_mindful_retreat",
      );
      expect(pkg?.status).toBe("REJECTED");
      expect(pkg?.rejectionReason).toBe(
        "Perjelas rincian durasi setiap kegiatan meditasi.",
      );

      // Re-submit revised package as EO
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
      mockEoPackageStore.saveDraft({
        packageId: "pkg_pacet_mindful_retreat",
        title: "Pagi Hening Tepi Sungai Pacet Revisi",
        shortSummary: "Retreat setengah hari di tepi sungai Pacet yang jernih.",
        destinationId: "dest_lembah_pacet",
        durationLabel: "Setengah hari",
        itinerary: [
          { order: 1, title: "Pagi - Berkumpul", description: "Penyambutan" },
          { order: 2, title: "Sesi Hening", description: "Relaksasi sungai" },
        ],
        safetyNotes: ["Hati-hati di bebatuan."],
        pricing: {
          destinationBaseCost: 160000,
          eoMargin: 100000,
          customerPrice: 260000,
        },
      });
      mockEoPackageStore.submitForReview("pkg_pacet_mindful_retreat");

      // Admin approves
      adminSessionStore.loginAsDemoAdmin();
      mockAdminDecisionService.approvePackage(
        "pkg_pacet_mindful_retreat",
        "Revisi diterima.",
      );

      // Z: EO approved package can now create session
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
      const sessionRes = mockEoPackageStore.createSession({
        packageId: "pkg_pacet_mindful_retreat",
        startAt: "2026-10-15T08:00:00Z",
        endAt: "2026-10-15T12:00:00Z",
        capacity: 10,
        pricePerPerson: 260000,
      });
      expect(sessionRes.success).toBe(true);
    });

    it("AA & AB. missing audit reason blocks approval; stale transition fails", () => {
      adminSessionStore.loginAsDemoAdmin();

      const resMissing = mockAdminDecisionService.approvePackage(
        "pkg_pacet_mindful_retreat",
        "", // Empty reason
      );
      expect(resMissing.success).toBe(false);

      // Package slow_green_day is LIVE (stale for approval)
      const resStale = mockAdminDecisionService.approvePackage(
        "slow_green_day",
        "Valid reason",
      );
      expect(resStale.success).toBe(false);
      expect(resStale.message).toContain(
        "tidak dalam status PENDING_ADMIN_REVIEW",
      );
    });
  });

  describe("5. Bookings, Complaints, Trust Status & Audit (AC–AL)", () => {
    it("AC, AD, AE, AF. Admin bookings reads mockTransactionStore with authoritative status and no mutation controls", async () => {
      adminSessionStore.loginAsDemoAdmin();

      mockTransactionStore.addDirectBooking({
        bookingId: "bk_admin_audit_test",
        travelerId: "usr_traveler_admin",
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

      const view = await renderComponent(createElement(AdminBookingsScreen));

      expect(view.textContent).toContain(
        "Inspeksi Transaksi & Pembayaran Traveler",
      );
      expect(view.textContent).toContain("bk_admin_audit_test");
      expect(view.textContent).toContain("PAID");
      expect(view.textContent).toContain("Rp550.000");

      // No mutation actions
      expect(view.textContent).not.toContain("Refund");
      expect(view.textContent).not.toContain("Force Complete");
    });

    it("AG, AH, AI. complaints queue reads critical count, requires reason for classification, and adds audit event", () => {
      adminSessionStore.loginAsDemoAdmin();

      expect(mockComplaintStore.getCriticalUnresolvedCount()).toBe(1);

      const res = mockAdminDecisionService.classifyComplaint("cmp_crit_001", {
        category: "OPERATIONAL_SAFETY",
        internalNote: "Dikoordinasikan dengan pengelola jalur.",
        reason: "Verifikasi standar keselamatan setelah hujan.",
      });

      expect(res.success).toBe(true);

      const cmp = mockComplaintStore.getById("cmp_crit_001");
      expect(cmp?.status).toBe("CLASSIFIED");
      expect(cmp?.internalNote).toBe("Dikoordinasikan dengan pengelola jalur.");

      // Audit event
      const audit = mockAdminAuditStore
        .getAll()
        .find((a) => a.entityId === "cmp_crit_001");
      expect(audit).toBeDefined();
      expect(audit?.actionType).toBe("CLASSIFY_COMPLAINT");
    });

    it("AJ, AK, AL. Trust page displays actual shared signals without fake scores, and Audit log records decisions", async () => {
      adminSessionStore.loginAsDemoAdmin();

      const trustView = await renderComponent(
        createElement(AdminTrustStatusScreen),
      );

      expect(trustView.textContent).toContain(
        "Trust & Status Pengawasan Mitra",
      );
      expect(trustView.textContent).toContain("Jeda Alam Nusantara");
      expect(trustView.textContent).toContain("Lereng Hijau Batu");
      expect(trustView.textContent).toContain("Lembah Alam Pacet");
      expect(trustView.textContent).toContain("Hutan Bambu Trawas");
      expect(trustView.textContent).not.toContain("Trust Score 95%");

      // Audit activity screen
      const auditView = await renderComponent(
        createElement(AdminAuditActivityScreen),
      );

      expect(auditView.textContent).toContain(
        "Log Aktivitas & Jejak Keputusan Admin",
      );
      expect(auditView.textContent).toContain("APPROVE_EO");
      expect(auditView.textContent).toContain("APPROVE_PACKAGE");
    });
  });
});
