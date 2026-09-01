import { mockDestinationVerificationStore } from "../admin/mockDestinationVerificationStore";
import type { DestinationVerificationRecord } from "../admin/types";
import { mockDestinationStore } from "../eo/mockDestinationStore";
import { partnerSessionStore } from "../eo/partnerSessionStore";
import type { DestinationRecord, PartnerUser } from "../eo/types";

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
  if (typeof destination === "string") {
    return destination;
  }
  return destination.name;
}
