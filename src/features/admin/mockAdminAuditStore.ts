import type { AdminAuditEvent } from "./types";

export const INITIAL_AUDIT_EVENTS: AdminAuditEvent[] = [
  {
    auditId: "aud_seed_1",
    actorId: "admin_trust_demo",
    actorLabel: "Trust Operations Lead",
    actionType: "APPROVE_EO",
    entityType: "EO_APPLICATION",
    entityId: "app_eo_demo_approved",
    reason:
      "Sertifikasi kepemanduan BNSP valid dan portofolio retreat terverifikasi.",
    createdAt: "2026-08-02T14:00:00Z",
    previousStatus: "PENDING_REVIEW",
    nextStatus: "APPROVED",
  },
  {
    auditId: "aud_seed_2",
    actorId: "admin_trust_demo",
    actorLabel: "Trust Operations Lead",
    actionType: "APPROVE_PACKAGE",
    entityType: "PACKAGE_SUBMISSION",
    entityId: "slow_green_day",
    reason:
      "Itinerary memenuhi standar ritme mindful travel dan pricing terverifikasi.",
    createdAt: "2026-08-05T10:00:00Z",
    previousStatus: "PENDING_ADMIN_REVIEW",
    nextStatus: "APPROVED",
  },
];

let auditEvents: AdminAuditEvent[] = INITIAL_AUDIT_EVENTS.map((e) => ({
  ...e,
}));

export const mockAdminAuditStore = {
  reset(): void {
    auditEvents = INITIAL_AUDIT_EVENTS.map((e) => ({ ...e }));
  },

  getAll(): readonly AdminAuditEvent[] {
    return auditEvents.map((e) => ({ ...e }));
  },

  recordEvent(
    event: Omit<AdminAuditEvent, "auditId" | "createdAt">,
  ): AdminAuditEvent {
    const record: AdminAuditEvent = {
      ...event,
      auditId: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    auditEvents.unshift(record);
    return { ...record };
  },
};
