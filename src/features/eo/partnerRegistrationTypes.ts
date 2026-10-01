import type { DestinationApplicationDraft } from "../destination/types";
import type { EoApplicationRecord } from "./types";

export interface LocalGuideIdentity {
  fullName: string;
  phone: string;
  domicile: string;
  experience: string;
  photoPath?: string;
  photoPreview?: string;
}

export type EoRegistrationDetails = Omit<
  EoApplicationRecord,
  | "applicationId"
  | "identityId"
  | "status"
  | "submittedAt"
  | "reviewedAt"
  | "rejectionReason"
> & { guideCertificateFileName?: string; insuranceFileName?: string };

export type DestinationRegistrationDetails = Omit<
  DestinationApplicationDraft,
  "applicationId" | "partnerIdentityId" | "destinationIdentityId"
> & { guideIdentity: LocalGuideIdentity };

export type PartnerRegistrationInput =
  | { role: "EO"; password: string; details: EoRegistrationDetails }
  | {
      role: "DESTINATION";
      password: string;
      details: DestinationRegistrationDetails;
      guidePhoto?: File;
    };

export interface PartnerApplicationRow {
  id: string;
  partner_id: string;
  auth_user_id: string;
  role: "EO" | "DESTINATION";
  email: string;
  status: "PENDING_REVIEW" | "APPROVED" | "REJECTED";
  payload: EoRegistrationDetails | DestinationRegistrationDetails;
  destination_id: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
  approval_mode: "ADMIN" | "DEMO" | null;
  email_notification: "NOT_SENT" | "SIMULATED";
}
