import type { ComplaintRecord } from "./types";

export const INITIAL_COMPLAINTS: ComplaintRecord[] = [
  {
    complaintId: "cmp_crit_001",
    bookingId: "bk_demo_completed_usr_demo",
    packageId: "slow_green_day",
    sessionId: "ses_sgd_hist_usr_demo",
    targetType: "PACKAGE",
    targetRef: "slow_green_day",
    category: "OPERATIONAL_SAFETY",
    priority: "CRITICAL",
    summary:
      "Jalur tanah agak licin sehabis hujan pagi hari, mohon pemandu memastikan tongkat jalan cadangan siap.",
    status: "UNRESOLVED",
    createdAt: "2026-08-21T09:00:00Z",
  },
  {
    complaintId: "cmp_med_002",
    bookingId: "bk_seed_002",
    packageId: "slow_green_day",
    targetType: "EO",
    targetRef: "eo_jeda_alam",
    category: "PUNCTUALITY",
    priority: "MEDIUM",
    summary: "Waktu penjemputan di titik kumpul sempat mundur 15 menit.",
    status: "CLASSIFIED",
    createdAt: "2026-08-22T14:30:00Z",
    classifiedAt: "2026-08-23T10:00:00Z",
    internalNote: "Telah dikoordinasikan dengan EO untuk briefing penjemputan.",
  },
];

let complaints: ComplaintRecord[] = INITIAL_COMPLAINTS.map((c) => ({ ...c }));

export const mockComplaintStore = {
  reset(): void {
    complaints = INITIAL_COMPLAINTS.map((c) => ({ ...c }));
  },

  getAll(): readonly ComplaintRecord[] {
    return complaints.map((c) => ({ ...c }));
  },

  getById(complaintId: string): ComplaintRecord | undefined {
    const cmp = complaints.find((c) => c.complaintId === complaintId);
    return cmp ? { ...cmp } : undefined;
  },

  getCriticalUnresolvedCount(): number {
    return complaints.filter(
      (c) => c.priority === "CRITICAL" && c.status === "UNRESOLVED",
    ).length;
  },

  classifyComplaint(
    complaintId: string,
    params: {
      category: string;
      internalNote?: string;
    },
  ): { success: boolean; complaint?: ComplaintRecord; message?: string } {
    const cmp = complaints.find((c) => c.complaintId === complaintId);
    if (!cmp) {
      return { success: false, message: "Aduan tidak ditemukan." };
    }

    cmp.category = params.category.trim() || cmp.category;
    cmp.status = "CLASSIFIED";
    cmp.internalNote = params.internalNote?.trim();
    cmp.classifiedAt = new Date().toISOString();

    return { success: true, complaint: { ...cmp } };
  },
};
