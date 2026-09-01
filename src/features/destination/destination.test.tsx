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
import { DestinationApplicationScreen } from "./DestinationApplicationScreen";
import { DestinationVerificationStatusScreen } from "./DestinationVerificationStatusScreen";
import { generateUniqueDestinationPartnerId } from "./destinationContext";
import { PartnerLoginScreen } from "../eo/PartnerLoginScreen";

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
  describe("1. Access Control & Authority Chain (A–F)", () => {
    it("A. foo.bar@example.com and foo_bar@example.com get distinct partner IDs and cannot access each other's application", () => {
      const idA = generateUniqueDestinationPartnerId("foo.bar@example.com");
      const idB = generateUniqueDestinationPartnerId("foo_bar@example.com");
      expect(idA).not.toBe(idB);

      // Partner A submits an application
      partnerSessionStore.setPartner({
        id: idA,
        email: "foo.bar@example.com",
        name: "Partner A",
        role: "DESTINATION",
        businessName: "Kawasan A",
      });

      const resA = mockDestinationPartnerService.submitApplication({
        partnerIdentityId: idA,
        name: "Kawasan Hening A",
        locationLabel: "Batu",
        province: "Jawa Timur",
        city: "Batu",
        managementName: "Pokdarwis A",
        contactPerson: "Person A",
        phone: "08121111",
        email: "foo.bar@example.com",
        description: "Desc A",
        highlights: ["Alam A"],
        capacityPerSession: 15,
        baseCostPerPerson: 100000,
        guideReady: true,
        guideReadinessEvidence: "Evidence A",
        agreedToSop: true,
      });
      expect(resA.success).toBe(true);

      // Partner B looks up application by partnerIdentityId
      const appB = mockDestinationVerificationStore.getByPartnerId(idB);
      expect(appB).toBeUndefined();
    });

    it("B. case normalization matches same prototype login identity after application exists", async () => {
      partnerSessionStore.setPartner({
        id: "dest_partner_case_test",
        email: "case.test@example.com",
        name: "Case Partner",
        role: "DESTINATION",
        businessName: "Case Entity",
      });

      mockDestinationPartnerService.submitApplication({
        partnerIdentityId: "dest_partner_case_test",
        name: "Kawasan Case",
        locationLabel: "Malang",
        province: "Jawa Timur",
        city: "Malang",
        managementName: "Pokdarwis Case",
        contactPerson: "Case Lead",
        phone: "08129999",
        email: "case.test@example.com",
        description: "Desc",
        highlights: ["H"],
        capacityPerSession: 10,
        baseCostPerPerson: 80000,
        guideReady: true,
        guideReadinessEvidence: "Ready",
        agreedToSop: true,
      });

      const view = await renderComponent(createElement(PartnerLoginScreen));
      const emailInput =
        view.querySelector<HTMLInputElement>("#partner-email")!;
      await act(async () => {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value",
        )?.set;
        nativeInputValueSetter?.call(emailInput, "Case.Test@Example.Com");
        emailInput.dispatchEvent(new Event("change", { bubbles: true }));
      });

      const submitBtn = view.querySelector<HTMLButtonElement>(
        "button[type='submit']",
      )!;
      await act(async () => {
        submitBtn.click();
      });

      expect(partnerSessionStore.get()?.id).toBe("dest_partner_case_test");
    });

    it("A. unknown destination email must NOT login as approved Lereng Hijau partner", async () => {
      const view = await renderComponent(createElement(PartnerLoginScreen));
      const emailInput =
        view.querySelector<HTMLInputElement>("#partner-email")!;
      await act(async () => {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value",
        )?.set;
        nativeInputValueSetter?.call(emailInput, "randomdestinasi@example.com");
        emailInput.dispatchEvent(new Event("change", { bubbles: true }));
      });

      const submitBtn = view.querySelector<HTMLButtonElement>(
        "button[type='submit']",
      )!;
      await act(async () => {
        submitBtn.click();
      });

      // Must establish a separate new identity, not dest_partner_lereng_hijau
      expect(partnerSessionStore.get()?.id).not.toBe(
        "dest_partner_lereng_hijau",
      );
      expect(partnerSessionStore.get()?.role).toBe("DESTINATION");
    });

    it("B. exact registered destination email logs in as the matching application partner", async () => {
      const view = await renderComponent(createElement(PartnerLoginScreen));
      const emailInput =
        view.querySelector<HTMLInputElement>("#partner-email")!;
      await act(async () => {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value",
        )?.set;
        nativeInputValueSetter?.call(emailInput, "destinasi@lerenghijau.id");
        emailInput.dispatchEvent(new Event("change", { bubbles: true }));
      });

      const submitBtn = view.querySelector<HTMLButtonElement>(
        "button[type='submit']",
      )!;
      await act(async () => {
        submitBtn.click();
      });

      expect(partnerSessionStore.get()?.id).toBe("dest_partner_lereng_hijau");
    });

    it("A & B. forged session destinationIdentityId is ignored, screens resolve Lereng Hijau from application ownership", async () => {
      partnerSessionStore.setPartner({
        id: "dest_partner_lereng_hijau",
        email: "destinasi@lerenghijau.id",
        name: "Hadi Purnomo",
        role: "DESTINATION",
        businessName: "Pengelola Lereng Hijau Batu",
        destinationIdentityId: "dest_hutan_trawas", // Forged!
      });

      // Overview
      const ovView = await renderComponent(
        createElement(DestinationOverviewScreen),
      );
      expect(ovView.textContent).toContain("Lereng Hijau Batu");
      expect(ovView.textContent).not.toContain("Hutan Bambu Trawas");

      // Profile
      const profView = await renderComponent(
        createElement(DestinationProfileScreen),
      );
      expect(profView.textContent).toContain("Lereng Hijau Batu");
      expect(profView.textContent).not.toContain("Hutan Bambu Trawas");

      // Verification Badge
      const badgeView = await renderComponent(
        createElement(DestinationVerificationBadgeScreen),
      );
      expect(badgeView.textContent).toContain("Terverifikasi Dasar (BASIC)");
      expect(badgeView.textContent).toContain(
        "Siap sebagai Pemandu (Guide Ready)",
      );

      // Schedule
      const schedView = await renderComponent(
        createElement(DestinationScheduleScreen),
      );
      expect(schedView.textContent).toContain("Sehari Pelan di Lereng Hijau");

      // Capacity
      const capView = await renderComponent(
        createElement(DestinationCapacityScreen),
      );
      expect(capView.textContent).toContain("20");

      // Reviews
      const revView = await renderComponent(
        createElement(DestinationReviewsScreen),
      );
      expect(revView.textContent).toContain("Ulasan & Rating Destinasi");
    });

    it("C. blank province, city, management, contact, or guide evidence fails submission with zero mutation", () => {
      partnerSessionStore.setPartner({
        id: "dest_partner_blank_test",
        email: "blank@test.id",
        name: "Blank Test",
        role: "DESTINATION",
        businessName: "Blank Test Entity",
      });

      // Blank province
      const res1 = mockDestinationPartnerService.submitApplication({
        partnerIdentityId: "dest_partner_blank_test",
        name: "Kawasan Valid",
        locationLabel: "Batu",
        province: "", // Blank!
        city: "Batu",
        managementName: "Pokdarwis",
        contactPerson: "Budi",
        phone: "0812",
        email: "budi@test.id",
        description: "Desc",
        highlights: ["H"],
        capacityPerSession: 15,
        baseCostPerPerson: 100000,
        guideReady: true,
        guideReadinessEvidence: "Evidence",
        agreedToSop: true,
      });
      expect(res1.success).toBe(false);

      // Blank city
      const res2 = mockDestinationPartnerService.submitApplication({
        partnerIdentityId: "dest_partner_blank_test",
        name: "Kawasan Valid",
        locationLabel: "Batu",
        province: "Jawa Timur",
        city: "", // Blank!
        managementName: "Pokdarwis",
        contactPerson: "Budi",
        phone: "0812",
        email: "budi@test.id",
        description: "Desc",
        highlights: ["H"],
        capacityPerSession: 15,
        baseCostPerPerson: 100000,
        guideReady: true,
        guideReadinessEvidence: "Evidence",
        agreedToSop: true,
      });
      expect(res2.success).toBe(false);

      // Blank management or contact
      const res3 = mockDestinationPartnerService.submitApplication({
        partnerIdentityId: "dest_partner_blank_test",
        name: "Kawasan Valid",
        locationLabel: "Batu",
        province: "Jawa Timur",
        city: "Batu",
        managementName: "", // Blank!
        contactPerson: "Budi",
        phone: "0812",
        email: "budi@test.id",
        description: "Desc",
        highlights: ["H"],
        capacityPerSession: 15,
        baseCostPerPerson: 100000,
        guideReady: true,
        guideReadinessEvidence: "Evidence",
        agreedToSop: true,
      });
      expect(res3.success).toBe(false);

      // Blank guide evidence
      const res4 = mockDestinationPartnerService.submitApplication({
        partnerIdentityId: "dest_partner_blank_test",
        name: "Kawasan Valid",
        locationLabel: "Batu",
        province: "Jawa Timur",
        city: "Batu",
        managementName: "Pokdarwis",
        contactPerson: "Budi",
        phone: "0812",
        email: "budi@test.id",
        description: "Desc",
        highlights: ["H"],
        capacityPerSession: 15,
        baseCostPerPerson: 100000,
        guideReady: true,
        guideReadinessEvidence: "", // Blank!
        agreedToSop: true,
      });
      expect(res4.success).toBe(false);
    });

    it("C2. declaredGuideReady=false with non-empty evidence persists false and is preserved on reapply", () => {
      partnerSessionStore.setPartner({
        id: "dest_partner_guide_decl",
        email: "decl@test.id",
        name: "Decl Partner",
        role: "DESTINATION",
        businessName: "Decl Entity",
      });

      const res = mockDestinationPartnerService.submitApplication({
        partnerIdentityId: "dest_partner_guide_decl",
        name: "Kawasan Non Guide",
        locationLabel: "Pasuruan",
        province: "Jawa Timur",
        city: "Pasuruan",
        managementName: "Pokdarwis Pasuruan",
        contactPerson: "Agus",
        phone: "0812",
        email: "decl@test.id",
        description: "Kawasan hening",
        highlights: ["Bambu"],
        capacityPerSession: 12,
        baseCostPerPerson: 90000,
        guideReady: false, // Declared false!
        guideReadinessEvidence: "Belum memiliki pemandu lokal resmi.",
        agreedToSop: true,
      });

      expect(res.success).toBe(true);
      const app = mockDestinationVerificationStore.getByPartnerId(
        "dest_partner_guide_decl",
      );
      expect(app?.declaredGuideReady).toBe(false);
    });

    it("C3. two new destinations with same name get unique destinationIdentityIds and never collide with canonical", () => {
      partnerSessionStore.setPartner({
        id: "dest_partner_dup_1",
        email: "dup1@test.id",
        name: "Dup 1",
        role: "DESTINATION",
        businessName: "Dup 1 Entity",
      });

      const res1 = mockDestinationPartnerService.submitApplication({
        partnerIdentityId: "dest_partner_dup_1",
        name: "Lereng Hijau Batu", // Same name as existing canonical!
        locationLabel: "Batu Baru",
        province: "Jawa Timur",
        city: "Batu",
        managementName: "Pokdarwis Baru 1",
        contactPerson: "Budi",
        phone: "0812",
        email: "dup1@test.id",
        description: "Kawasan baru",
        highlights: ["Kebun"],
        capacityPerSession: 15,
        baseCostPerPerson: 100000,
        guideReady: true,
        guideReadinessEvidence: "Pemandu ada",
        agreedToSop: true,
      });

      expect(res1.success).toBe(true);
      const app1 =
        mockDestinationVerificationStore.getByPartnerId("dest_partner_dup_1");
      expect(app1?.destinationIdentityId).not.toBe("dest_lereng_hijau");

      partnerSessionStore.setPartner({
        id: "dest_partner_dup_2",
        email: "dup2@test.id",
        name: "Dup 2",
        role: "DESTINATION",
        businessName: "Dup 2 Entity",
      });

      const res2 = mockDestinationPartnerService.submitApplication({
        partnerIdentityId: "dest_partner_dup_2",
        name: "Lereng Hijau Batu",
        locationLabel: "Batu Baru 2",
        province: "Jawa Timur",
        city: "Batu",
        managementName: "Pokdarwis Baru 2",
        contactPerson: "Budi 2",
        phone: "0813",
        email: "dup2@test.id",
        description: "Kawasan baru 2",
        highlights: ["Kebun 2"],
        capacityPerSession: 15,
        baseCostPerPerson: 100000,
        guideReady: true,
        guideReadinessEvidence: "Pemandu ada",
        agreedToSop: true,
      });

      expect(res2.success).toBe(true);
      const app2 =
        mockDestinationVerificationStore.getByPartnerId("dest_partner_dup_2");
      expect(app2?.destinationIdentityId).not.toBe(app1?.destinationIdentityId);
    });

    it("C. new applicant supplying forged destinationIdentityId has it ignored/generated internally", () => {
      partnerSessionStore.setPartner({
        id: "dest_partner_brand_new",
        email: "new@dest.id",
        name: "New Partner",
        role: "DESTINATION",
        businessName: "New Venue Entity",
      });

      const res = mockDestinationPartnerService.submitApplication({
        partnerIdentityId: "dest_partner_brand_new",
        destinationIdentityId: "dest_lereng_hijau", // Caller tries to forge existing canonical ID!
        name: "Lembah Baru Asri",
        locationLabel: "Malang",
        province: "Jawa Timur",
        city: "Malang",
        managementName: "Pokdarwis Baru",
        contactPerson: "Budi",
        phone: "0812",
        email: "new@dest.id",
        description: "Deskripsi",
        highlights: ["Alam"],
        capacityPerSession: 15,
        baseCostPerPerson: 100000,
        guideReady: true,
        guideReadinessEvidence: "Ready",
        agreedToSop: true,
      });

      expect(res.success).toBe(true);
      const app = mockDestinationVerificationStore.getByPartnerId(
        "dest_partner_brand_new",
      );
      expect(app?.destinationIdentityId).not.toBe("dest_lereng_hijau");
      expect(app?.destinationIdentityId).toMatch(/^dest_/);
    });

    it("D. rejected Coban application reapply preserves destinationIdentityId dest_coban_rondo even if caller supplies another", () => {
      partnerSessionStore.setPartner({
        id: "dest_partner_coban_rondo",
        email: "partner@cobanrondo.id",
        name: "Pengelola Coban Rondo",
        role: "DESTINATION",
        businessName: "Pengelola Coban Rondo",
        destinationIdentityId: "dest_coban_rondo",
      });

      // Reject first
      adminSessionStore.loginAsDemoAdmin();
      mockAdminDecisionService.rejectDestinationVerification(
        "dest_app_coban_rondo",
        "Alasan revisi",
      );

      // Partner reapplies and caller tries to supply dest_lereng_hijau
      partnerSessionStore.setPartner({
        id: "dest_partner_coban_rondo",
        email: "partner@cobanrondo.id",
        name: "Pengelola Coban Rondo",
        role: "DESTINATION",
        businessName: "Pengelola Coban Rondo",
      });

      const reapplyRes = mockDestinationPartnerService.submitApplication({
        partnerIdentityId: "dest_partner_coban_rondo",
        destinationIdentityId: "dest_lereng_hijau", // Forged!
        name: "Hutan Pinus Coban Rondo",
        locationLabel: "Pujon, Malang",
        province: "Jawa Timur",
        city: "Batu",
        managementName: "Pengelola Coban Rondo",
        contactPerson: "Hadi",
        phone: "0812",
        email: "partner@cobanrondo.id",
        description: "Revisi jalur.",
        highlights: ["Jalur aman"],
        capacityPerSession: 25,
        baseCostPerPerson: 110000,
        guideReady: true,
        guideReadinessEvidence: "Ready",
        agreedToSop: true,
      });

      expect(reapplyRes.success).toBe(true);
      const app = mockDestinationVerificationStore.getByPartnerId(
        "dest_partner_coban_rondo",
      );
      expect(app?.destinationIdentityId).toBe("dest_coban_rondo"); // Preserved!
    });

    it("E. Admin approval of forged attempt does not alter canonical dest_lereng_hijau", () => {
      partnerSessionStore.setPartner({
        id: "dest_partner_tree_sample",
        email: "tree@sample.id",
        name: "Tree Partner",
        role: "DESTINATION",
        businessName: "Tree Entity",
      });

      const subRes = mockDestinationPartnerService.submitApplication({
        partnerIdentityId: "dest_partner_tree_sample",
        destinationIdentityId: "dest_lereng_hijau",
        name: "Rumah Pohon Baru",
        locationLabel: "Batu",
        province: "Jatim",
        city: "Batu",
        managementName: "Pokdarwis",
        contactPerson: "Budi",
        phone: "0812",
        email: "tree@sample.id",
        description: "Desc",
        highlights: ["H"],
        capacityPerSession: 15,
        baseCostPerPerson: 100000,
        guideReady: true,
        guideReadinessEvidence: "Ready",
        agreedToSop: true,
      });

      adminSessionStore.loginAsDemoAdmin();
      mockAdminDecisionService.approveDestinationVerification(
        subRes.applicationId!,
        true,
        "Approved",
      );

      const canonicalLereng = mockDestinationStore.getById("dest_lereng_hijau");
      expect(canonicalLereng?.name).toBe("Lereng Hijau Batu");
      expect(canonicalLereng?.baseCostPerPerson).toBe(125000);
    });

    it("F & G. logged-out user accessing /partner/apply/destination cannot submit, direct service submit fails with zero mutation", async () => {
      partnerSessionStore.logout();

      const view = await renderComponent(createElement(App), [
        "/partner/apply/destination",
      ]);
      expect(view.textContent).toContain("Pendaftaran Mitra Destinasi");
      expect(view.textContent).toContain(
        "Silakan masuk atau buat akun kemitraan destinasi",
      );

      // Direct service submit
      const res = mockDestinationPartnerService.submitApplication({
        partnerIdentityId: "dest_anon",
        name: "Anon",
        locationLabel: "Anon",
        province: "Anon",
        city: "Anon",
        managementName: "Anon",
        contactPerson: "Anon",
        phone: "0812",
        email: "anon@test.com",
        description: "Desc",
        highlights: ["H"],
        capacityPerSession: 10,
        baseCostPerPerson: 50000,
        guideReady: false,
        guideReadinessEvidence: "No",
        agreedToSop: true,
      });

      expect(res.success).toBe(false);
      expect(res.message).toContain("Akses ditolak");
    });

    it("H. EO authenticated session direct Destination submit fails with zero mutation and session remains EO", () => {
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE"); // role = EO

      const res = mockDestinationPartnerService.submitApplication({
        partnerIdentityId: "eo_jeda_alam",
        name: "EO Trying to be Dest",
        locationLabel: "Malang",
        province: "Jatim",
        city: "Malang",
        managementName: "EO",
        contactPerson: "EO",
        phone: "0812",
        email: "eo@test.com",
        description: "Desc",
        highlights: ["H"],
        capacityPerSession: 10,
        baseCostPerPerson: 50000,
        guideReady: false,
        guideReadinessEvidence: "No",
        agreedToSop: true,
      });

      expect(res.success).toBe(false);
      expect(res.message).toContain("Akses ditolak");
      expect(partnerSessionStore.get()?.role).toBe("EO");
    });
  });

  describe("2. Metadata Persistence & Admin Review (K–N)", () => {
    it("K & L. management/legal/contact metadata persists in shared store and is visible in Admin detail", () => {
      partnerSessionStore.setPartner({
        id: "dest_partner_meta_test",
        email: "legal@meta.id",
        name: "Meta Lead",
        role: "DESTINATION",
        businessName: "Kawasan Meta Asri",
      });

      const res = mockDestinationPartnerService.submitApplication({
        partnerIdentityId: "dest_partner_meta_test",
        name: "Kawasan Wisata Meta Asri",
        locationLabel: "Batu / Malang",
        province: "Jawa Timur",
        city: "Batu",
        managementName: "Yayasan Hutan Lestari",
        contactPerson: "Siti Rahma",
        phone: "0812334455",
        email: "legal@meta.id",
        legalEntityDoc: {
          name: "Akta_Yayasan_Hutan_Lestari_2026.pdf",
          uploadedAt: "2026-08-20T10:00:00Z",
          status: "ATTACHED",
        },
        description:
          "Kawasan hutan hening dengan izin pemanfaatan hutan kemasyarakatan.",
        highlights: ["Saung hening", "Jalur pinus"],
        capacityPerSession: 20,
        baseCostPerPerson: 120000,
        guideReady: true,
        guideReadinessEvidence: "2 pemandu lokal binaan bersertifikasi.",
        agreedToSop: true,
      });

      expect(res.success).toBe(true);

      const app = mockDestinationVerificationStore.getById(res.applicationId!);
      expect(app?.managementName).toBe("Yayasan Hutan Lestari");
      expect(app?.contactPerson).toBe("Siti Rahma");
      expect(app?.legalEntityDocument?.name).toBe(
        "Akta_Yayasan_Hutan_Lestari_2026.pdf",
      );
    });

    it("M & N. returned snapshots cannot mutate store by reference and reset restores seed state", () => {
      const app = mockDestinationVerificationStore.getById(
        "dest_app_coban_rondo",
      )!;
      app.name = "Mutated Offline Name";
      if (app.legalEntityDocument) {
        app.legalEntityDocument.name = "Mutated_Doc.pdf";
      }

      const fresh = mockDestinationVerificationStore.getById(
        "dest_app_coban_rondo",
      );
      expect(fresh?.name).toBe("Hutan Pinus Coban Rondo");

      mockDestinationVerificationStore.reset();
      expect(mockDestinationVerificationStore.getAll().length).toBe(4);
    });
  });

  describe("3. DP04 Status & Dimensions (O–S)", () => {
    it("O. approved Destination shows Level BASIC and Guide Readiness separately", async () => {
      partnerSessionStore.loginAsDemoDestination();

      const view = await renderComponent(
        createElement(DestinationVerificationStatusScreen),
      );
      expect(view.textContent).toContain("Destinasi Terverifikasi");
      expect(view.textContent).toContain("Level: BASIC");
      expect(view.textContent).toContain("Guide Ready ✓");
    });

    it("P & Q. pending and rejected show exact shared state and Admin rejection reason", async () => {
      // Pending
      partnerSessionStore.setPartner({
        id: "dest_partner_coban_rondo",
        email: "partner@cobanrondo.id",
        name: "Pengelola Coban Rondo",
        role: "DESTINATION",
        businessName: "Pengelola Coban Rondo",
        destinationIdentityId: "dest_coban_rondo",
      });

      const pendingView = await renderComponent(
        createElement(DestinationVerificationStatusScreen),
      );
      expect(pendingView.textContent).toContain("Menunggu Verifikasi Admin");

      // Rejected
      partnerSessionStore.setPartner({
        id: "dest_partner_rejected",
        email: "partner@curahrawan.id",
        name: "Pengelola Curah Rawan",
        role: "DESTINATION",
        businessName: "Pengelola Curah Rawan",
        destinationIdentityId: "dest_curah_rawan",
      });

      const rejView = await renderComponent(
        createElement(DestinationVerificationStatusScreen),
      );
      expect(rejView.textContent).toContain("Perlu Perbaikan");
      expect(rejView.textContent).toContain(
        "Akses evakuasi darurat belum memadai",
      );
    });

    it("R. missing application in status screen shows 'Belum Ada Formulir Pengajuan' without claiming PENDING_REVIEW", async () => {
      partnerSessionStore.setPartner({
        id: "dest_partner_no_app",
        email: "noapp@dest.id",
        name: "Partner No App",
        role: "DESTINATION",
        businessName: "Pengelola Baru No App",
      });

      const view = await renderComponent(
        createElement(DestinationVerificationStatusScreen),
      );
      expect(view.textContent).toContain("Belum Ada Pengajuan");
      expect(view.textContent).toContain(
        "Belum Ada Formulir Pengajuan Verifikasi",
      );
      expect(view.textContent).not.toContain("Menunggu Verifikasi Admin");
    });

    it("S. UI reapply pre-populates existing application data", async () => {
      partnerSessionStore.setPartner({
        id: "dest_partner_rejected",
        email: "partner@curahrawan.id",
        name: "Pengelola Curah Rawan",
        role: "DESTINATION",
        businessName: "Pengelola Curah Rawan",
        destinationIdentityId: "dest_curah_rawan",
      });

      const view = await renderComponent(
        createElement(DestinationApplicationScreen),
      );
      const mgmtInput = view.querySelector<HTMLInputElement>("#dest-mgmt-name");
      const phoneInput = view.querySelector<HTMLInputElement>("#dest-phone");
      expect(mgmtInput?.value).toBe("Pengelola Curah Rawan");
      expect(phoneInput?.value).toBe("081298765432");
    });
  });

  describe("4. Schedule, Capacity & Reviews (T–AG)", () => {
    it("U & V & W & X. Schedule screen shows only venue sessions, calculates confirmed participants from transaction store, and hides traveler PII", async () => {
      partnerSessionStore.loginAsDemoDestination();

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

    it("AB & AC & AD. Destination Reviews shows only venue reviews, excludes EO_GUIDE reviews, and computes average rating", async () => {
      partnerSessionStore.loginAsDemoDestination();

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

      mockReviewStore.submitReview({
        bookingId: "bk_eo_rev_exc",
        travelerId: "usr_3",
        targetType: "EO_GUIDE",
        targetRef: "org_lereng_batu",
        rating: 1,
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

  describe("5. Overview & Settings Screens (DP05 & DP11)", () => {
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

    it("operational screens with invalid/unapproved context render safe unavailable state without falling back to Lereng Hijau", async () => {
      partnerSessionStore.setPartner({
        id: "dest_partner_rejected",
        email: "partner@curahrawan.id",
        name: "Pengelola Curah Rawan",
        role: "DESTINATION",
        businessName: "Pengelola Curah Rawan",
      });

      const ovView = await renderComponent(
        createElement(DestinationOverviewScreen),
      );
      expect(ovView.textContent).toContain("Data Destinasi Tidak Tersedia");
      expect(ovView.textContent).not.toContain("Lereng Hijau Batu");

      const profView = await renderComponent(
        createElement(DestinationProfileScreen),
      );
      expect(profView.textContent).toContain("Data Profil Tidak Tersedia");
      expect(profView.textContent).not.toContain("Lereng Hijau Batu");

      const badgeView = await renderComponent(
        createElement(DestinationVerificationBadgeScreen),
      );
      expect(badgeView.textContent).toContain("Data Lencana Tidak Tersedia");

      const schedView = await renderComponent(
        createElement(DestinationScheduleScreen),
      );
      expect(schedView.textContent).toContain("Data Jadwal Tidak Tersedia");

      const capView = await renderComponent(
        createElement(DestinationCapacityScreen),
      );
      expect(capView.textContent).toContain("Data Kapasitas Tidak Tersedia");

      const revView = await renderComponent(
        createElement(DestinationReviewsScreen),
      );
      expect(revView.textContent).toContain("Data Ulasan Tidak Tersedia");
    });
  });
});
