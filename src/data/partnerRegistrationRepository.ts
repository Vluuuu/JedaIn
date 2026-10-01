import { mockDestinationVerificationStore } from "../features/admin/mockDestinationVerificationStore";
import { mockApplicationStore } from "../features/eo/mockApplicationStore";
import { mockDestinationStore } from "../features/eo/mockDestinationStore";
import { partnerSessionStore } from "../features/eo/partnerSessionStore";
import type {
  DestinationRegistrationDetails,
  EoRegistrationDetails,
  PartnerApplicationRow,
  PartnerRegistrationInput,
} from "../features/eo/partnerRegistrationTypes";
import type { PartnerUser } from "../features/eo/types";
import { getSupabaseClient } from "../lib/supabase/client";
import { getDataMode } from "../lib/supabase/config";
import { requireAuthenticatedUser } from "../lib/supabase/demoAuth";
import { destinationRepository } from "./destinationRepository";

const mockPasswords = new Map<string, string>();
export const GUIDE_PHOTO_BUCKET = "partner-guide-photos";
export const GUIDE_PHOTO_MAX_BYTES = 5 * 1024 * 1024;

export function validateGuidePhoto(file: File): string | undefined {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    return "Foto pemandu harus JPG, PNG, atau WebP.";
  if (file.size === 0 || file.size > GUIDE_PHOTO_MAX_BYTES)
    return "Foto pemandu harus berukuran maksimal 5 MB dan tidak kosong.";
}

export function validatePartnerRegistration(
  input: PartnerRegistrationInput,
): string | undefined {
  const d = input.details;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim()))
    return "Masukkan email akun yang valid.";
  if (input.password.length < 8) return "Kata sandi akun minimal 8 karakter.";
  if (
    !d.contactPerson.trim() ||
    !d.phone.trim() ||
    !d.city.trim() ||
    !d.province.trim()
  )
    return "Lengkapi penanggung jawab, kontak, kota, dan provinsi.";
  if (!d.agreedToSop)
    return "Wajib menyetujui standar operasional dan SOP JedaIn.";
  if (input.role === "EO") {
    if (
      !input.details.businessName.trim() ||
      !input.details.experienceDescription.trim()
    )
      return "Lengkapi nama usaha dan pengalaman penyelenggara.";
    if (
      !Number.isInteger(input.details.yearsOfOperation) ||
      input.details.yearsOfOperation < 0
    )
      return "Lama operasi harus berupa tahun yang valid.";
  } else {
    const dest = input.details;
    if (
      !dest.name.trim() ||
      !dest.managementName.trim() ||
      !dest.locationLabel.trim() ||
      !dest.description.trim() ||
      !dest.highlights.length
    )
      return "Lengkapi informasi destinasi dan minimal satu fasilitas atau aktivitas.";
    if (
      !Number.isInteger(dest.capacityPerSession) ||
      dest.capacityPerSession < 1 ||
      !Number.isInteger(dest.baseCostPerPerson) ||
      dest.baseCostPerPerson <= 0
    )
      return "Kapasitas dan biaya dasar harus berupa angka positif.";
    const guide = dest.guideIdentity;
    if (
      !dest.guideReady ||
      !dest.guideReadinessEvidence.trim() ||
      !guide.fullName.trim() ||
      !guide.phone.trim() ||
      !guide.domicile.trim() ||
      !guide.experience.trim()
    )
      return "Lengkapi nama, kontak, domisili, pengalaman, dan keterangan kesiapan pemandu.";
    if (!input.guidePhoto && !guide.photoPath && !guide.photoPreview)
      return "Unggah foto pemandu yang bertanggung jawab.";
    if (input.guidePhoto) return validateGuidePhoto(input.guidePhoto);
  }
}

async function hydrate(row: PartnerApplicationRow): Promise<PartnerUser> {
  let partner: PartnerUser;
  if (row.role === "EO") {
    const d = row.payload as EoRegistrationDetails;
    mockApplicationStore.upsertFromBackend({
      ...d,
      applicationId: row.id,
      identityId: row.partner_id,
      email: row.email,
      status: row.status,
      submittedAt: row.submitted_at,
      reviewedAt: row.reviewed_at ?? undefined,
      rejectionReason: row.rejection_reason ?? undefined,
      demoEmailRecipient:
        row.email_notification === "SIMULATED" ? row.email : undefined,
      guideCertificateDoc: d.guideCertificateFileName
        ? {
            name: d.guideCertificateFileName,
            uploadedAt: row.submitted_at,
            status: "ATTACHED",
          }
        : undefined,
      insuranceDoc: d.insuranceFileName
        ? {
            name: d.insuranceFileName,
            uploadedAt: row.submitted_at,
            status: "ATTACHED",
          }
        : undefined,
    });
    partner = {
      id: row.partner_id,
      email: row.email,
      name: d.contactPerson,
      businessName: d.businessName,
      role: "EO",
      guideStatus: d.guideStatus,
    };
  } else {
    const d = row.payload as DestinationRegistrationDetails;
    let guideIdentity = { ...d.guideIdentity };
    if (guideIdentity.photoPath) {
      const url = await getSupabaseClient()
        ?.storage.from(GUIDE_PHOTO_BUCKET)
        .createSignedUrl(guideIdentity.photoPath, 3600);
      if (url?.data?.signedUrl)
        guideIdentity = { ...guideIdentity, photoPreview: url.data.signedUrl };
    }
    mockDestinationVerificationStore.upsertFromBackend({
      ...d,
      guideIdentity,
      applicationId: row.id,
      partnerIdentityId: row.partner_id,
      destinationIdentityId: row.destination_id!,
      contactPhone: d.phone,
      contactEmail: row.email,
      legalEntityDocument: d.legalEntityDoc
        ? {
            name: d.legalEntityDoc.name,
            attachedAt: d.legalEntityDoc.uploadedAt,
            status: d.legalEntityDoc.status,
          }
        : undefined,
      declaredGuideReady: d.guideReady,
      status: row.status,
      submittedAt: row.submitted_at,
      reviewedAt: row.reviewed_at ?? undefined,
      rejectionReason: row.rejection_reason ?? undefined,
      approvedGuideReady: row.status === "APPROVED",
      approvedLevel: row.status === "APPROVED" ? "BASIC" : undefined,
      demoEmailRecipient:
        row.email_notification === "SIMULATED" ? row.email : undefined,
    });
    partner = {
      id: row.partner_id,
      email: row.email,
      name: d.contactPerson,
      businessName: d.managementName,
      role: "DESTINATION",
      destinationIdentityId: row.destination_id!,
    };
    if (row.status === "APPROVED") {
      const destination = await destinationRepository.getById(
        row.destination_id!,
        { strict: true },
      );
      if (!destination)
        throw new Error(
          "Destinasi yang disetujui belum dapat dimuat. Coba lagi.",
        );
      mockDestinationStore.upsertVerifiedDestination(destination);
    }
  }
  partnerSessionStore.setPartner(partner);
  return partner;
}

export const partnerRegistrationRepository = {
  matchesMockPassword(email: string, password: string): boolean {
    return mockPasswords.get(email.trim().toLowerCase()) === password;
  },

  async submit(
    input: PartnerRegistrationInput,
  ): Promise<{ success: boolean; message?: string }> {
    const validation = validatePartnerRegistration(input);
    if (validation) return { success: false, message: validation };
    const email = input.details.email.trim().toLowerCase();
    if (getDataMode() !== "supabase") {
      const prior =
        input.role === "EO"
          ? mockApplicationStore
              .getAll()
              .find((app) => app.email.toLowerCase() === email)?.identityId
          : mockDestinationVerificationStore
              .getAll()
              .find((app) => app.contactEmail?.toLowerCase() === email)
              ?.partnerIdentityId;
      const identityId = prior ?? `partner_${crypto.randomUUID()}`;
      if (input.role === "EO") {
        const result = mockApplicationStore.submitApplication({
          ...input.details,
          email,
          identityId,
        });
        if (!result.success || !result.application) return result;
        const d = result.application;
        partnerSessionStore.setPartner({
          id: d.identityId,
          email,
          name: d.contactPerson,
          businessName: d.businessName,
          role: "EO",
          guideStatus: d.guideStatus,
        });
      } else {
        const result = mockDestinationVerificationStore.submitApplication({
          ...input.details,
          email,
          partnerIdentityId: identityId,
        });
        if (!result.success || !result.application) return result;
        mockDestinationVerificationStore.upsertFromBackend({
          ...result.application,
          guideIdentity: { ...input.details.guideIdentity },
        });
        partnerSessionStore.setPartner({
          id: identityId,
          email,
          name: input.details.contactPerson,
          businessName: input.details.managementName,
          role: "DESTINATION",
          destinationIdentityId: result.application.destinationIdentityId,
        });
      }
      mockPasswords.set(email, input.password);
      return { success: true };
    }

    const client = getSupabaseClient();
    if (!client)
      return {
        success: false,
        message: "Supabase belum dikonfigurasi. Pengajuan belum tersimpan.",
      };
    let uploadedPath: string | undefined;
    let persisted = false;
    try {
      const current = await client.auth.getSession();
      if (current.error) throw current.error;
      if (current.data.session?.user.email?.toLowerCase() !== email) {
        const signedOut = await client.auth.signOut();
        if (signedOut.error) throw signedOut.error;
        partnerSessionStore.logout();
        const signup = await client.auth.signUp({
          email,
          password: input.password,
        });
        if (!signup.data.session) {
          const login = await client.auth.signInWithPassword({
            email,
            password: input.password,
          });
          if (login.error || !login.data.session)
            throw new Error(
              "Akun belum dapat digunakan. Periksa email konfirmasi atau masuk dengan kata sandi akun yang sudah terdaftar.",
            );
        }
      }
      const session = await client.auth.getSession();
      const user = session.data.session?.user;
      if (session.error || !user || user.email?.toLowerCase() !== email)
        throw new Error("Sesi akun pendaftaran tidak valid.");
      const existing = await this.loadCurrent();
      if (existing?.role === input.role && existing.status === "PENDING_REVIEW")
        return { success: true };
      const payload = { ...input.details, email };
      if (input.role === "DESTINATION") {
        const guide = { ...input.details.guideIdentity };
        delete guide.photoPreview;
        if (input.guidePhoto) {
          const ext =
            input.guidePhoto.type === "image/jpeg"
              ? "jpg"
              : input.guidePhoto.type.split("/")[1];
          uploadedPath = `${user.id}/${crypto.randomUUID()}.${ext}`;
          const upload = await client.storage
            .from(GUIDE_PHOTO_BUCKET)
            .upload(uploadedPath, input.guidePhoto, {
              upsert: false,
              contentType: input.guidePhoto.type,
            });
          if (upload.error)
            throw new Error(
              "Foto pemandu belum tersimpan. Coba unggah kembali.",
            );
          guide.photoPath = uploadedPath;
        }
        (payload as DestinationRegistrationDetails).guideIdentity = guide;
      }
      const saved = await client.rpc("register_partner_application", {
        p_role: input.role,
        p_payload: payload,
      });
      if (saved.error || !saved.data)
        throw new Error(saved.error?.message ?? "Pengajuan belum tersimpan.");
      persisted = true;
      const verified = await this.loadCurrent();
      if (
        !verified ||
        verified.partner_id !== (saved.data as PartnerApplicationRow).partner_id
      )
        throw new Error(
          "Pengajuan tersimpan tetapi belum dapat dimuat kembali. Coba lagi.",
        );
      return { success: true };
    } catch (error) {
      if (uploadedPath && !persisted)
        await client.storage.from(GUIDE_PHOTO_BUCKET).remove([uploadedPath]);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Pengajuan belum tersimpan. Coba lagi.",
      };
    }
  },

  async loadCurrent(): Promise<PartnerApplicationRow | null> {
    if (getDataMode() !== "supabase") return null;
    const client = getSupabaseClient();
    if (!client) throw new Error("Supabase belum dikonfigurasi.");
    const session = await client.auth.getSession();
    if (session.error) throw session.error;
    if (!session.data.session) return null;
    const result = await client
      .from("partner_applications")
      .select("*")
      .eq("auth_user_id", session.data.session.user.id)
      .maybeSingle();
    if (result.error)
      throw new Error("Status pengajuan belum dapat dimuat. Coba lagi.");
    if (!result.data) return null;
    const row = result.data as PartnerApplicationRow;
    const linked = await requireAuthenticatedUser(row.role);
    if (!linked.success || linked.partnerUser?.id !== row.partner_id)
      throw new Error("Profil akun belum terhubung ke pengajuan.");
    await hydrate(row);
    return row;
  },

  async restoreSession(): Promise<void> {
    if (getDataMode() !== "supabase") return;
    const client = getSupabaseClient();
    if (!client) throw new Error("Supabase belum dikonfigurasi.");
    const session = await client.auth.getSession();
    if (session.error) throw session.error;
    if (!session.data.session) {
      partnerSessionStore.logout();
      return;
    }
    const linked = await requireAuthenticatedUser();
    if (!linked.success || !linked.partnerUser) {
      partnerSessionStore.logout();
      return;
    }
    partnerSessionStore.setPartner(linked.partnerUser);
    await this.loadCurrent();
  },

  async approveDemo(): Promise<void> {
    const partner = partnerSessionStore.get();
    if (!partner)
      throw new Error("Masuk dengan akun pengajuan terlebih dahulu.");
    if (getDataMode() === "supabase") {
      const client = getSupabaseClient();
      if (!client) throw new Error("Supabase belum dikonfigurasi.");
      const result = await client.rpc("approve_partner_application_demo");
      if (result.error) throw new Error(result.error.message);
      const row = await this.loadCurrent();
      if (row?.status !== "APPROVED" || row.partner_id !== partner.id)
        throw new Error("Persetujuan belum terverifikasi. Coba lagi.");
    } else if (partner.role === "EO") {
      const app = mockApplicationStore.getBySellerId(partner.id);
      if (!app || !mockApplicationStore.approveApplication(app.applicationId))
        throw new Error("Pengajuan tidak sedang menunggu tinjauan.");
      mockApplicationStore.upsertFromBackend({
        ...mockApplicationStore.getById(app.applicationId)!,
        demoEmailRecipient: app.email,
      });
    } else {
      const app = mockDestinationVerificationStore.getByPartnerId(partner.id);
      if (!app) throw new Error("Pengajuan tidak ditemukan.");
      const result = mockDestinationVerificationStore.approveApplication(
        app.applicationId,
      );
      if (!result.success) throw new Error(result.message);
      mockDestinationVerificationStore.upsertFromBackend({
        ...mockDestinationVerificationStore.getById(app.applicationId)!,
        demoEmailRecipient: app.contactEmail,
      });
    }
  },
};
