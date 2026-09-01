import type { EoApplicationRecord, EoGuideStatus } from "./types";

export const INITIAL_EO_APPLICATIONS: EoApplicationRecord[] = [
  {
    applicationId: "app_eo_demo_approved",
    identityId: "eo_jeda_alam",
    businessName: "Jeda Alam Nusantara",
    contactPerson: "Budi Santoso",
    phone: "081234567890",
    email: "partner@jedaalam.id",
    province: "Jawa Timur",
    city: "Batu / Malang",
    experienceDescription:
      "Berpengalaman 5 tahun memandu perjalanan mindful retreat dan wisata alam di lereng Gunung Panderman dan Arjuno.",
    portfolioLink: "https://instagram.com/jedaalam.nusantara",
    yearsOfOperation: 5,
    guideStatus: "CERTIFIED_GUIDE",
    guideCertificateDoc: {
      name: "Sertifikat_Pemandu_Wisata_BNSP.pdf",
      uploadedAt: "2026-08-01T10:00:00Z",
      status: "VERIFIED",
    },
    insuranceDoc: {
      name: "Polis_Asuransi_Perjalanan_2026.pdf",
      uploadedAt: "2026-08-01T10:00:00Z",
      status: "VERIFIED",
    },
    agreedToSop: true,
    status: "APPROVED",
    submittedAt: "2026-08-01T10:30:00Z",
    reviewedAt: "2026-08-02T14:00:00Z",
  },
  {
    applicationId: "app_eo_demo_concept_approved",
    identityId: "eo_kreatif_desa",
    businessName: "Ruang Kreatif Wellness",
    contactPerson: "Dewi Lestari",
    phone: "081211223344",
    email: "partner@kreatifdesa.id",
    province: "Jawa Timur",
    city: "Malang",
    experienceDescription:
      "Spesialisasi workshop kesenian dan mindful crafting lokal.",
    yearsOfOperation: 3,
    guideStatus: "CONCEPT_ONLY",
    agreedToSop: true,
    status: "APPROVED",
    submittedAt: "2026-08-05T09:00:00Z",
    reviewedAt: "2026-08-06T11:00:00Z",
  },
  {
    applicationId: "app_eo_demo_rejected",
    identityId: "eo_rejected_user",
    businessName: "Kelana Liar Adventure",
    contactPerson: "Rian Pratama",
    phone: "081298765432",
    email: "rian@kelanaliar.com",
    province: "Jawa Timur",
    city: "Malang",
    experienceDescription: "Komunitas petualang alam bebas.",
    yearsOfOperation: 1,
    guideStatus: "CONCEPT_ONLY",
    agreedToSop: true,
    status: "REJECTED",
    submittedAt: "2026-08-10T09:00:00Z",
    reviewedAt: "2026-08-11T11:30:00Z",
    rejectionReason:
      "Dokumen SOP penanganan darurat belum lengkap dan portofolio kegiatan wellness belum mencukupi standar kurasi JedaIn.",
  },
];

let applications: EoApplicationRecord[] = INITIAL_EO_APPLICATIONS.map((a) => ({
  ...a,
  guideCertificateDoc: a.guideCertificateDoc
    ? { ...a.guideCertificateDoc }
    : undefined,
  insuranceDoc: a.insuranceDoc ? { ...a.insuranceDoc } : undefined,
}));

export const mockApplicationStore = {
  reset(): void {
    applications = INITIAL_EO_APPLICATIONS.map((a) => ({
      ...a,
      guideCertificateDoc: a.guideCertificateDoc
        ? { ...a.guideCertificateDoc }
        : undefined,
      insuranceDoc: a.insuranceDoc ? { ...a.insuranceDoc } : undefined,
    }));
  },

  getAll(): readonly EoApplicationRecord[] {
    return applications.map((a) => ({ ...a }));
  },

  getById(applicationId: string): EoApplicationRecord | undefined {
    const app = applications.find((a) => a.applicationId === applicationId);
    return app ? { ...app } : undefined;
  },

  getBySellerId(identityId: string): EoApplicationRecord | undefined {
    const app = applications.find((a) => a.identityId === identityId);
    return app ? { ...app } : undefined;
  },

  submitApplication(input: {
    identityId: string;
    businessName: string;
    contactPerson: string;
    phone: string;
    email: string;
    province: string;
    city: string;
    experienceDescription: string;
    portfolioLink?: string;
    yearsOfOperation: number;
    guideStatus: EoGuideStatus;
    guideCertificateFileName?: string;
    insuranceFileName?: string;
    agreedToSop: boolean;
  }): {
    success: boolean;
    application?: EoApplicationRecord;
    message?: string;
  } {
    if (!input.agreedToSop) {
      return {
        success: false,
        message: "Wajib menyetujui SOP dan standar operasional JedaIn.",
      };
    }

    if (
      !input.businessName.trim() ||
      !input.contactPerson.trim() ||
      !input.phone.trim()
    ) {
      return {
        success: false,
        message: "Informasi bisnis dan kontak wajib diisi lengkap.",
      };
    }

    // Check if application already exists for this identity (e.g. re-submitting after rejection)
    const existingIndex = applications.findIndex(
      (a) => a.identityId === input.identityId,
    );
    const nowIso = new Date().toISOString();

    const application: EoApplicationRecord = {
      applicationId:
        existingIndex >= 0
          ? applications[existingIndex].applicationId
          : `app_eo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      identityId: input.identityId,
      businessName: input.businessName.trim(),
      contactPerson: input.contactPerson.trim(),
      phone: input.phone.trim(),
      email: input.email.trim(),
      province: input.province.trim() || "Jawa Timur",
      city: input.city.trim() || "Malang",
      experienceDescription: input.experienceDescription.trim(),
      portfolioLink: input.portfolioLink?.trim() || undefined,
      yearsOfOperation: input.yearsOfOperation,
      guideStatus: input.guideStatus,
      guideCertificateDoc: input.guideCertificateFileName
        ? {
            name: input.guideCertificateFileName,
            uploadedAt: nowIso,
            status: "ATTACHED",
          }
        : undefined,
      insuranceDoc: input.insuranceFileName
        ? {
            name: input.insuranceFileName,
            uploadedAt: nowIso,
            status: "ATTACHED",
          }
        : undefined,
      agreedToSop: true,
      status: "PENDING_REVIEW",
      submittedAt: nowIso,
    };

    if (existingIndex >= 0) {
      applications[existingIndex] = application;
    } else {
      applications.push(application);
    }

    return { success: true, application: { ...application } };
  },

  // Admin decision helpers (Strict transition: only PENDING_REVIEW -> APPROVED / REJECTED)
  approveApplication(applicationId: string): boolean {
    const app = applications.find((a) => a.applicationId === applicationId);
    if (!app || app.status !== "PENDING_REVIEW") return false;
    app.status = "APPROVED";
    app.reviewedAt = new Date().toISOString();
    return true;
  },

  rejectApplication(applicationId: string, reason: string): boolean {
    const app = applications.find((a) => a.applicationId === applicationId);
    if (!app || app.status !== "PENDING_REVIEW" || !reason.trim()) return false;
    app.status = "REJECTED";
    app.rejectionReason = reason.trim();
    app.reviewedAt = new Date().toISOString();
    return true;
  },
};
