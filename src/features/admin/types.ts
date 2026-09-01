export interface AdminUser {
  adminId: string;
  name: string;
  email: string;
  role: "ADMIN";
}

export type AdminActionType =
  | "APPROVE_EO"
  | "REJECT_EO"
  | "APPROVE_DESTINATION"
  | "REJECT_DESTINATION"
  | "APPROVE_PACKAGE"
  | "REJECT_PACKAGE"
  | "CLASSIFY_COMPLAINT"
  | "MANUAL_TRUST_ACTION";

export type AdminEntityType =
  | "EO_APPLICATION"
  | "DESTINATION_VERIFICATION"
  | "PACKAGE_SUBMISSION"
  | "COMPLAINT"
  | "TRUST_STATUS";

export interface AdminAuditEvent {
  auditId: string;
  actorId: string;
  actorLabel: string;
  actionType: AdminActionType;
  entityType: AdminEntityType;
  entityId: string;
  reason: string;
  createdAt: string;
  previousStatus?: string;
  nextStatus?: string;
  metadata?: Record<string, unknown>;
}

export type DestinationVerificationStatus =
  "PENDING_REVIEW" | "APPROVED" | "REJECTED";

export interface DestinationVerificationRecord {
  applicationId: string;
  partnerIdentityId: string;
  destinationIdentityId: string;
  name: string;
  locationLabel: string;
  province: string;
  city: string;
  baseCostPerPerson: number;
  description: string;
  highlights: string[];
  capacityPerSession: number;
  guideReadinessEvidence: string;
  submittedAt: string;
  status: DestinationVerificationStatus;
  reviewedAt?: string;
  rejectionReason?: string;
  approvedLevel?: "BASIC";
  approvedGuideReady?: boolean;
}

export type ComplaintPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type ComplaintStatus = "UNRESOLVED" | "CLASSIFIED" | "RESOLVED";

export interface ComplaintRecord {
  complaintId: string;
  bookingId?: string;
  packageId?: string;
  sessionId?: string;
  targetType?: "EO" | "DESTINATION" | "PACKAGE";
  targetRef?: string;
  category: string;
  priority: ComplaintPriority;
  summary: string;
  status: ComplaintStatus;
  createdAt: string;
  classifiedAt?: string;
  internalNote?: string;
}

export interface TrustEntitySummary {
  entityId: string;
  entityType: "EO" | "DESTINATION";
  name: string;
  locationOrBusiness: string;
  verificationLevelOrGuideStatus: string;
  reviewAverage?: string;
  reviewCount: number;
  complaintCount: number;
  status: "ACTIVE" | "PENDING_REVIEW" | "REJECTED" | "SUSPENDED";
}
