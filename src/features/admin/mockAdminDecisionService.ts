import { mockApplicationStore } from "../eo/mockApplicationStore";
import { mockEoPackageStore } from "../eo/mockEoPackageStore";
import { adminSessionStore } from "./adminSessionStore";
import { mockAdminAuditStore } from "./mockAdminAuditStore";
import { mockComplaintStore } from "./mockComplaintStore";
import { mockDestinationVerificationStore } from "./mockDestinationVerificationStore";

export const mockAdminDecisionService = {
  // 1. EO Application Decisions
  approveEoApplication(
    applicationId: string,
    reason: string,
  ): { success: boolean; message?: string } {
    const admin = adminSessionStore.get();
    if (!admin || admin.role !== "ADMIN") {
      return {
        success: false,
        message: "Akses ditolak: Hanya Admin yang dapat memproses persetujuan.",
      };
    }

    if (!reason || !reason.trim()) {
      return {
        success: false,
        message: "Alasan audit persetujuan wajib diisi.",
      };
    }

    const app = mockApplicationStore.getById(applicationId);
    if (!app || app.status !== "PENDING_REVIEW") {
      return {
        success: false,
        message: "Aplikasi EO tidak dalam status PENDING_REVIEW.",
      };
    }

    const ok = mockApplicationStore.approveApplication(applicationId);
    if (!ok) {
      return { success: false, message: "Gagal menyetujui aplikasi EO." };
    }

    mockAdminAuditStore.recordEvent({
      actorId: admin.adminId,
      actorLabel: admin.name,
      actionType: "APPROVE_EO",
      entityType: "EO_APPLICATION",
      entityId: applicationId,
      reason: reason.trim(),
      previousStatus: "PENDING_REVIEW",
      nextStatus: "APPROVED",
      metadata: {
        businessName: app.businessName,
        guideStatus: app.guideStatus,
      },
    });

    return { success: true };
  },

  rejectEoApplication(
    applicationId: string,
    reason: string,
  ): { success: boolean; message?: string } {
    const admin = adminSessionStore.get();
    if (!admin || admin.role !== "ADMIN") {
      return {
        success: false,
        message: "Akses ditolak: Hanya Admin yang dapat memproses penolakan.",
      };
    }

    if (!reason || !reason.trim()) {
      return {
        success: false,
        message: "Alasan penolakan aplikasi wajib diisi.",
      };
    }

    const app = mockApplicationStore.getById(applicationId);
    if (!app || app.status !== "PENDING_REVIEW") {
      return {
        success: false,
        message: "Aplikasi EO tidak dalam status PENDING_REVIEW.",
      };
    }

    const ok = mockApplicationStore.rejectApplication(
      applicationId,
      reason.trim(),
    );
    if (!ok) {
      return { success: false, message: "Gagal menolak aplikasi EO." };
    }

    mockAdminAuditStore.recordEvent({
      actorId: admin.adminId,
      actorLabel: admin.name,
      actionType: "REJECT_EO",
      entityType: "EO_APPLICATION",
      entityId: applicationId,
      reason: reason.trim(),
      previousStatus: "PENDING_REVIEW",
      nextStatus: "REJECTED",
      metadata: { businessName: app.businessName },
    });

    return { success: true };
  },

  // 2. Destination Verification Decisions
  approveDestinationVerification(
    applicationId: string,
    guideReady: boolean,
    reason: string,
  ): { success: boolean; message?: string } {
    const admin = adminSessionStore.get();
    if (!admin || admin.role !== "ADMIN") {
      return {
        success: false,
        message:
          "Akses ditolak: Hanya Admin yang dapat memproses verifikasi destinasi.",
      };
    }

    if (!reason || !reason.trim()) {
      return {
        success: false,
        message: "Alasan audit verifikasi destinasi wajib diisi.",
      };
    }

    const app = mockDestinationVerificationStore.getById(applicationId);
    if (!app || app.status !== "PENDING_REVIEW") {
      return {
        success: false,
        message: "Aplikasi destinasi tidak dalam status PENDING_REVIEW.",
      };
    }

    const res = mockDestinationVerificationStore.approveApplication(
      applicationId,
      guideReady,
    );
    if (!res.success) {
      return {
        success: false,
        message: res.message ?? "Gagal memproses verifikasi destinasi.",
      };
    }

    mockAdminAuditStore.recordEvent({
      actorId: admin.adminId,
      actorLabel: admin.name,
      actionType: "APPROVE_DESTINATION",
      entityType: "DESTINATION_VERIFICATION",
      entityId: applicationId,
      reason: reason.trim(),
      previousStatus: "PENDING_REVIEW",
      nextStatus: "APPROVED",
      metadata: {
        destinationName: app.name,
        verificationLevel: "BASIC",
        guideReady,
      },
    });

    return { success: true };
  },

  rejectDestinationVerification(
    applicationId: string,
    reason: string,
  ): { success: boolean; message?: string } {
    const admin = adminSessionStore.get();
    if (!admin || admin.role !== "ADMIN") {
      return {
        success: false,
        message: "Akses ditolak: Hanya Admin yang dapat memproses penolakan.",
      };
    }

    if (!reason || !reason.trim()) {
      return {
        success: false,
        message: "Alasan penolakan destinasi wajib diisi.",
      };
    }

    const app = mockDestinationVerificationStore.getById(applicationId);
    if (!app || app.status !== "PENDING_REVIEW") {
      return {
        success: false,
        message: "Aplikasi destinasi tidak dalam status PENDING_REVIEW.",
      };
    }

    const res = mockDestinationVerificationStore.rejectApplication(
      applicationId,
      reason.trim(),
    );
    if (!res.success) {
      return {
        success: false,
        message: res.message ?? "Gagal menolak aplikasi destinasi.",
      };
    }

    mockAdminAuditStore.recordEvent({
      actorId: admin.adminId,
      actorLabel: admin.name,
      actionType: "REJECT_DESTINATION",
      entityType: "DESTINATION_VERIFICATION",
      entityId: applicationId,
      reason: reason.trim(),
      previousStatus: "PENDING_REVIEW",
      nextStatus: "REJECTED",
      metadata: { destinationName: app.name },
    });

    return { success: true };
  },

  // 3. Package Approval Decisions
  approvePackage(
    packageId: string,
    reason: string,
  ): { success: boolean; message?: string } {
    const admin = adminSessionStore.get();
    if (!admin || admin.role !== "ADMIN") {
      return {
        success: false,
        message:
          "Akses ditolak: Hanya Admin yang dapat memproses kurasi paket.",
      };
    }

    if (!reason || !reason.trim()) {
      return {
        success: false,
        message: "Alasan audit persetujuan paket wajib diisi.",
      };
    }

    const pkg = mockEoPackageStore.getPackageById(packageId);
    if (!pkg || pkg.status !== "PENDING_ADMIN_REVIEW") {
      return {
        success: false,
        message: "Paket tidak dalam status PENDING_ADMIN_REVIEW.",
      };
    }

    const ok = mockEoPackageStore.approvePackage(packageId);
    if (!ok) {
      return { success: false, message: "Gagal menyetujui paket kurasi." };
    }

    mockAdminAuditStore.recordEvent({
      actorId: admin.adminId,
      actorLabel: admin.name,
      actionType: "APPROVE_PACKAGE",
      entityType: "PACKAGE_SUBMISSION",
      entityId: packageId,
      reason: reason.trim(),
      previousStatus: "PENDING_ADMIN_REVIEW",
      nextStatus: "APPROVED",
      metadata: { title: pkg.title, eoId: pkg.eoId },
    });

    return { success: true };
  },

  rejectPackage(
    packageId: string,
    reason: string,
  ): { success: boolean; message?: string } {
    const admin = adminSessionStore.get();
    if (!admin || admin.role !== "ADMIN") {
      return {
        success: false,
        message:
          "Akses ditolak: Hanya Admin yang dapat memproses kurasi paket.",
      };
    }

    if (!reason || !reason.trim()) {
      return {
        success: false,
        message: "Alasan penolakan / catatan revisi wajib diisi.",
      };
    }

    const pkg = mockEoPackageStore.getPackageById(packageId);
    if (!pkg || pkg.status !== "PENDING_ADMIN_REVIEW") {
      return {
        success: false,
        message: "Paket tidak dalam status PENDING_ADMIN_REVIEW.",
      };
    }

    const ok = mockEoPackageStore.rejectPackage(packageId, reason.trim());
    if (!ok) {
      return { success: false, message: "Gagal menolak paket kurasi." };
    }

    mockAdminAuditStore.recordEvent({
      actorId: admin.adminId,
      actorLabel: admin.name,
      actionType: "REJECT_PACKAGE",
      entityType: "PACKAGE_SUBMISSION",
      entityId: packageId,
      reason: reason.trim(),
      previousStatus: "PENDING_ADMIN_REVIEW",
      nextStatus: "REJECTED",
      metadata: { title: pkg.title, eoId: pkg.eoId },
    });

    return { success: true };
  },

  // 4. Complaint Classification
  classifyComplaint(
    complaintId: string,
    params: {
      category: string;
      internalNote?: string;
      reason: string;
    },
  ): { success: boolean; message?: string } {
    const admin = adminSessionStore.get();
    if (!admin || admin.role !== "ADMIN") {
      return {
        success: false,
        message:
          "Akses ditolak: Hanya Admin yang dapat mengklasifikasikan aduan.",
      };
    }

    if (!params.reason || !params.reason.trim()) {
      return {
        success: false,
        message: "Alasan audit klasifikasi wajib diisi.",
      };
    }

    const res = mockComplaintStore.classifyComplaint(complaintId, {
      category: params.category,
      internalNote: params.internalNote,
    });

    if (!res.success) {
      return {
        success: false,
        message: res.message ?? "Gagal mengklasifikasikan aduan.",
      };
    }

    mockAdminAuditStore.recordEvent({
      actorId: admin.adminId,
      actorLabel: admin.name,
      actionType: "CLASSIFY_COMPLAINT",
      entityType: "COMPLAINT",
      entityId: complaintId,
      reason: params.reason.trim(),
      previousStatus: "UNRESOLVED",
      nextStatus: "CLASSIFIED",
      metadata: {
        category: params.category,
        internalNote: params.internalNote,
      },
    });

    return { success: true };
  },
};
