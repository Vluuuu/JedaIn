import type {
  PackageOrganizerProfile,
  PackageSessionPreview,
} from "../packageDetail/types";
import type { PackageRecommendationSource } from "../recommendation/types";

export type SessionSelectionState =
  "LOADING" | "READY" | "REVALIDATING" | "NOT_FOUND" | "ERROR";

export type ValidationFailureReason =
  | "FULL"
  | "CLOSED"
  | "CANCELLED"
  | "NOT_FOUND"
  | "PACKAGE_MISMATCH"
  | "CAPACITY_UNKNOWN"
  | "REQUEST_ERROR";

export interface SessionValidationResult {
  valid: boolean;
  reason?: ValidationFailureReason;
  message?: string;
}

export interface SessionSelectionViewModel {
  state: SessionSelectionState;
  package?: PackageRecommendationSource;
  organizer?: PackageOrganizerProfile;
  sessions: PackageSessionPreview[];
  hasSelectableSession: boolean;
  selectedSessionId?: string;
  errorMessage?: string;
}

export interface SessionSelectionAdapter {
  getPackageSessions(packageId: string): Promise<SessionSelectionViewModel>;
  validateSessionSelection(
    packageId: string,
    sessionId: string,
  ): Promise<SessionValidationResult>;
}
