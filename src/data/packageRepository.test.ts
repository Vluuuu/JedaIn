import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mockEoPackageStore } from "../features/eo/mockEoPackageStore";
import { partnerSessionStore } from "../features/eo/partnerSessionStore";
import { packageRepository } from "./packageRepository";

describe("packageRepository - Ownership, Validation & Lifecycle Guards", () => {
  beforeEach(() => {
    mockEoPackageStore.reset();
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
  });

  afterEach(() => {
    mockEoPackageStore.reset();
    partnerSessionStore.reset();
  });

  describe("approveOwnPackageForDemo guards", () => {
    it("1. rejects approval when actor is not authenticated or not an EO", async () => {
      partnerSessionStore.logout();

      const res = await packageRepository.approveOwnPackageForDemo(
        "pkg_pacet_mindful_retreat",
      );
      expect(res.success).toBe(false);
      expect(res.message).toContain("Hanya TO terautentikasi");
    });

    it("2. rejects approval when package does not belong to current EO", async () => {
      // Switch to different EO
      partnerSessionStore.setPartner({
        id: "eo_other",
        email: "other@partner.id",
        name: "Other Partner",
        role: "EO",
        businessName: "Other EO",
      });

      const res = await packageRepository.approveOwnPackageForDemo(
        "pkg_pacet_mindful_retreat",
      );
      expect(res.success).toBe(false);
      expect(res.message).toContain("bukan milik TO ini");
    });

    it("3. rejects approval when package is not in PENDING_ADMIN_REVIEW (e.g., DRAFT)", async () => {
      // Create a draft package first
      const draftRes = await packageRepository.saveDraft({
        title: "Draf Baru Belum Submit",
        destinationId: "dest_lereng_hijau",
      });
      expect(draftRes.success).toBe(true);
      const pkgId = draftRes.package!.packageId;

      // Attempting to self-approve DRAFT must be rejected
      const res = await packageRepository.approveOwnPackageForDemo(pkgId);
      expect(res.success).toBe(false);
      expect(res.message).toContain(
        "Hanya paket dengan status PENDING_ADMIN_REVIEW",
      );
    });

    it("4. rejects approval when package is already LIVE", async () => {
      const res =
        await packageRepository.approveOwnPackageForDemo("slow_green_day");
      expect(res.success).toBe(false);
      expect(res.message).toContain(
        "Hanya paket dengan status PENDING_ADMIN_REVIEW",
      );
    });

    it("5. successfully transitions PENDING_ADMIN_REVIEW to APPROVED strictly", async () => {
      // pkg_pacet_mindful_retreat is seeded as PENDING_ADMIN_REVIEW for eo_jeda_alam
      const before = await packageRepository.getPackageById(
        "pkg_pacet_mindful_retreat",
      );
      expect(before?.status).toBe("PENDING_ADMIN_REVIEW");

      const res = await packageRepository.approveOwnPackageForDemo(
        "pkg_pacet_mindful_retreat",
      );
      expect(res.success).toBe(true);
      expect(res.package?.status).toBe("APPROVED");
      expect(res.package?.reviewedAt).toBeDefined();

      const after = await packageRepository.getPackageById(
        "pkg_pacet_mindful_retreat",
      );
      expect(after?.status).toBe("APPROVED");
    });
  });

  describe("publishApprovedPackage lifecycle", () => {
    it("1. rejects publishing package that is still in DRAFT or PENDING_ADMIN_REVIEW", async () => {
      const res = await packageRepository.publishApprovedPackage(
        "pkg_pacet_mindful_retreat",
      );
      // Initially PENDING_ADMIN_REVIEW
      expect(res.success).toBe(false);
      expect(res.message).toContain(
        "Hanya paket yang telah disetujui kurator Admin",
      );
    });

    it("2. allows publishing package only after it has been APPROVED -> LIVE", async () => {
      // First, approve for demo
      await packageRepository.approveOwnPackageForDemo(
        "pkg_pacet_mindful_retreat",
      );

      // Now publish
      const res = await packageRepository.publishApprovedPackage(
        "pkg_pacet_mindful_retreat",
      );
      expect(res.success).toBe(true);
      expect(res.package?.status).toBe("LIVE");

      const finalPkg = await packageRepository.getPackageById(
        "pkg_pacet_mindful_retreat",
      );
      expect(finalPkg?.status).toBe("LIVE");
    });

    it("3. idempotently returns success if package is already LIVE", async () => {
      // slow_green_day is seeded as LIVE
      const res =
        await packageRepository.publishApprovedPackage("slow_green_day");
      expect(res.success).toBe(true);
      expect(res.message).toBe("ALREADY_LIVE");
    });
  });
});
