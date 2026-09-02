import { mockDestinationVerificationStore } from "../admin/mockDestinationVerificationStore";
import type { DestinationVerificationRecord } from "../admin/types";
import { mockDestinationStore } from "../eo/mockDestinationStore";
import { partnerSessionStore } from "../eo/partnerSessionStore";
import type { DestinationRecord, PartnerUser } from "../eo/types";
import { resolveDestinationReviewRef } from "../identity/identityResolvers";

export interface AuthenticatedDestinationContext {
  partner: PartnerUser;
  application: DestinationVerificationRecord;
  destination: DestinationRecord;
}

export function resolveAuthenticatedDestinationContext(): AuthenticatedDestinationContext | null {
  const partner = partnerSessionStore.get();
  if (!partner || partner.role !== "DESTINATION") {
    return null;
  }

  const app = mockDestinationVerificationStore.getByPartnerId(partner.id);
  if (!app || app.status !== "APPROVED") {
    return null;
  }

  const destination = mockDestinationStore.getById(app.destinationIdentityId);
  if (!destination || destination.status !== "ACTIVE") {
    return null;
  }

  return {
    partner,
    application: app,
    destination,
  };
}

export function getDestinationReviewTargetRef(
  destination: { name: string } | string,
): string {
  return resolveDestinationReviewRef(destination);
}

export function generateUniqueDestinationPartnerId(email: string): string {
  const normalized = email.trim().toLowerCase();
  const existingApps = mockDestinationVerificationStore.getAll();

  // If an existing application belongs to this exact normalized email, preserve identity
  const exactApp = existingApps.find(
    (a) =>
      a.contactEmail?.trim().toLowerCase() === normalized ||
      a.partnerIdentityId.toLowerCase() === normalized,
  );
  if (exactApp) {
    return exactApp.partnerIdentityId;
  }

  // Compute deterministic hash of normalized email (preserves distinction between '.' and '_')
  let hash = 5381;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash * 33) ^ normalized.charCodeAt(i);
  }
  const hashStr = (hash >>> 0).toString(36);
  const slug = normalized
    .split("@")[0]
    .replace(/[^a-z0-9]/g, "_")
    .slice(0, 16);
  const candidateId = `dest_partner_${slug}_${hashStr}`;

  const takenIds = new Set(existingApps.map((a) => a.partnerIdentityId));
  if (!takenIds.has(candidateId)) {
    return candidateId;
  }

  let counter = 1;
  while (takenIds.has(`${candidateId}_${counter}`)) {
    counter++;
  }
  return `${candidateId}_${counter}`;
}
