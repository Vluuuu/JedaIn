import { mockApplicationStore } from "../features/eo/mockApplicationStore";
import {
  mockEoPackageStore,
  validateEoPackage,
} from "../features/eo/mockEoPackageStore";
import { partnerSessionStore } from "../features/eo/partnerSessionStore";
import type {
  EoGuideStatus,
  EoPackageRecord,
  EoValidationResult,
} from "../features/eo/types";
import { getSupabaseClient } from "../lib/supabase/client";
import { isSupabaseMode } from "../lib/supabase/config";
import type { PackageRow } from "../lib/supabase/database.types";
import { requireAuthenticatedUser } from "../lib/supabase/demoAuth";
import {
  mapPackageRecordToRow,
  mapPackageRowToRecord,
} from "../lib/supabase/mappers";
import { destinationRepository } from "./destinationRepository";

export const packageRepository = {
  async getAllPackages(): Promise<EoPackageRecord[]> {
    if (!isSupabaseMode()) {
      return [...mockEoPackageStore.getAllPackages()];
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return [...mockEoPackageStore.getAllPackages()];
    }

    try {
      const { data, error } = await supabase
        .from("packages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error || !data) {
        console.warn(
          "Supabase packages fetch failed, using fallback:",
          error?.message,
        );
        return [...mockEoPackageStore.getAllPackages()];
      }

      return (data as PackageRow[]).map(mapPackageRowToRecord);
    } catch {
      return [...mockEoPackageStore.getAllPackages()];
    }
  },

  async getPackagesByEo(eoId: string): Promise<EoPackageRecord[]> {
    if (!isSupabaseMode()) {
      return [...mockEoPackageStore.getPackagesByEo(eoId)];
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return [...mockEoPackageStore.getPackagesByEo(eoId)];
    }

    try {
      const { data, error } = await supabase
        .from("packages")
        .select("*")
        .eq("eo_id", eoId)
        .order("created_at", { ascending: false });

      if (error || !data) {
        return [...mockEoPackageStore.getPackagesByEo(eoId)];
      }

      return (data as PackageRow[]).map(mapPackageRowToRecord);
    } catch {
      return [...mockEoPackageStore.getPackagesByEo(eoId)];
    }
  },

  async getPackageById(
    packageId: string,
  ): Promise<EoPackageRecord | undefined> {
    if (!isSupabaseMode()) {
      return mockEoPackageStore.getPackageById(packageId);
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return mockEoPackageStore.getPackageById(packageId);
    }

    try {
      const { data, error } = await supabase
        .from("packages")
        .select("*")
        .eq("id", packageId)
        .maybeSingle();

      if (error || !data) {
        return mockEoPackageStore.getPackageById(packageId);
      }

      return mapPackageRowToRecord(data as PackageRow);
    } catch {
      return mockEoPackageStore.getPackageById(packageId);
    }
  },

  async getPackageForEo(
    packageId: string,
    eoId: string,
  ): Promise<EoPackageRecord | undefined> {
    if (!isSupabaseMode()) {
      return mockEoPackageStore.getPackageForEo(packageId, eoId);
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return mockEoPackageStore.getPackageForEo(packageId, eoId);
    }

    try {
      const { data, error } = await supabase
        .from("packages")
        .select("*")
        .eq("id", packageId)
        .eq("eo_id", eoId)
        .maybeSingle();

      if (error || !data) {
        return mockEoPackageStore.getPackageForEo(packageId, eoId);
      }

      return mapPackageRowToRecord(data as PackageRow);
    } catch {
      return mockEoPackageStore.getPackageForEo(packageId, eoId);
    }
  },

  async saveDraft(draft: Partial<EoPackageRecord>): Promise<{
    success: boolean;
    package?: EoPackageRecord;
    message?: string;
  }> {
    if (!isSupabaseMode()) {
      const actor = partnerSessionStore.get();
      if (!actor || actor.role !== "EO") {
        return {
          success: false,
          message:
            "Akses ditolak: Hanya EO terautentikasi yang dapat mengelola draf paket.",
        };
      }
      return mockEoPackageStore.saveDraft(draft);
    }

    // Supabase mode requires authenticated EO session
    const authCheck = await requireAuthenticatedUser("EO");
    if (!authCheck.success) {
      return {
        success: false,
        message: authCheck.error,
      };
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return {
        success: false,
        message: "Klien Supabase tidak tersedia untuk menyimpan draf paket.",
      };
    }

    const actorEoId = authCheck.partnerUser?.id || "eo_jeda_alam";
    const app = mockApplicationStore.getBySellerId(actorEoId);

    try {
      // Check existing package in Supabase if updating
      let existingRecord: EoPackageRecord | undefined;
      if (draft.packageId) {
        existingRecord = await this.getPackageForEo(draft.packageId, actorEoId);
        if (existingRecord) {
          if (
            existingRecord.status !== "DRAFT" &&
            existingRecord.status !== "REJECTED"
          ) {
            return {
              success: false,
              message:
                "Paket yang sedang ditinjau atau sudah disetujui tidak dapat diedit langsung.",
            };
          }
        }
      }

      const packageId =
        existingRecord?.packageId ||
        draft.packageId ||
        `pkg_eo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      const actorDisplayName =
        authCheck.partnerUser?.businessName ||
        app?.businessName ||
        "EO Partner";
      const authorGuideStatus: EoGuideStatus =
        app?.guideStatus ??
        authCheck.partnerUser?.guideStatus ??
        "CERTIFIED_GUIDE";

      // Authoritative pricing: query live destination from destinationRepository
      const dest = draft.destinationId
        ? await destinationRepository.getById(draft.destinationId)
        : undefined;
      const baseCost = dest?.baseCostPerPerson ?? 100000;
      const margin = draft.pricing?.eoMargin ?? 150000;
      const effectiveGuideSource = draft.guideSource || "DESTINATION";
      const localGuideFee =
        effectiveGuideSource === "DESTINATION"
          ? (dest?.localGuideFeePerPerson ?? 0)
          : 0;
      const customerPrice = baseCost + localGuideFee + margin;

      const imageUrls =
        draft.imageUrls ??
        (draft.imageUrl ? [draft.imageUrl] : existingRecord?.imageUrls);
      const imageUrl = draft.imageUrl ?? imageUrls?.[0];

      const nowIso = new Date().toISOString();

      const record: EoPackageRecord = {
        packageId,
        eoId: actorEoId,
        eoDisplayName: actorDisplayName,
        title: draft.title || "",
        shortSummary: draft.shortSummary || "",
        valueProposition: draft.valueProposition || draft.shortSummary || "",
        destinationId: draft.destinationId || "",
        imageUrl,
        imageUrls: imageUrls ? [...new Set(imageUrls)] : undefined,
        insightId: draft.insightId,
        durationLabel: draft.durationLabel || "1 hari",
        suitableGroupTypes: draft.suitableGroupTypes || [
          "SOLO",
          "PARTNER",
          "FRIENDS",
        ],
        highlights: draft.highlights || [],
        itinerary: draft.itinerary || [],
        includedItems:
          draft.includedItems !== undefined
            ? draft.includedItems
            : existingRecord?.includedItems || [],
        excludedItems:
          draft.excludedItems !== undefined
            ? draft.excludedItems
            : existingRecord?.excludedItems || [],
        safetyNotes:
          draft.safetyNotes !== undefined
            ? draft.safetyNotes
            : existingRecord?.safetyNotes || [],
        meetingPointLabel:
          draft.meetingPointLabel !== undefined
            ? draft.meetingPointLabel
            : existingRecord?.meetingPointLabel,
        departureTimeLabel:
          draft.departureTimeLabel !== undefined
            ? draft.departureTimeLabel
            : existingRecord?.departureTimeLabel,
        outboundTransport:
          draft.outboundTransport !== undefined
            ? draft.outboundTransport
            : existingRecord?.outboundTransport,
        returnTransport:
          draft.returnTransport !== undefined
            ? draft.returnTransport
            : existingRecord?.returnTransport,
        accessNotes:
          draft.accessNotes !== undefined
            ? draft.accessNotes
            : existingRecord?.accessNotes,
        pricing: {
          destinationBaseCost: baseCost,
          localGuideFee,
          eoMargin: margin,
          customerPrice,
        },
        guideStatus: authorGuideStatus,
        guideSource: draft.guideSource || "DESTINATION",
        status: "DRAFT",
        createdAt: existingRecord?.createdAt || nowIso,
        updatedAt: nowIso,
      };

      const rowPayload = mapPackageRecordToRow(record);
      const { data, error } = await supabase
        .from("packages")
        .upsert(rowPayload as PackageRow)
        .select()
        .single();

      if (error || !data) {
        return {
          success: false,
          message: error?.message || "Gagal menyimpan draf paket ke Supabase.",
        };
      }

      const saved = mapPackageRowToRecord(data as PackageRow);
      // Synchronize in-memory fallback cache on success
      mockEoPackageStore.upsertPackage(saved);
      return { success: true, package: saved };
    } catch (err: unknown) {
      return {
        success: false,
        message: err instanceof Error ? err.message : "Kesalahan sistem.",
      };
    }
  },

  async submitForReview(packageId: string): Promise<{
    success: boolean;
    package?: EoPackageRecord;
    validationResult: EoValidationResult;
    message?: string;
  }> {
    if (!isSupabaseMode()) {
      return mockEoPackageStore.submitForReview(packageId);
    }

    const authCheck = await requireAuthenticatedUser("EO");
    if (!authCheck.success) {
      return {
        success: false,
        validationResult: {
          valid: false,
          errors: [
            {
              step: 1,
              field: "auth",
              message:
                authCheck.error || "Pengguna belum terautentikasi sebagai EO.",
            },
          ],
        },
      };
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return {
        success: false,
        validationResult: {
          valid: false,
          errors: [
            {
              step: 1,
              field: "system",
              message: "Klien Supabase tidak tersedia.",
            },
          ],
        },
      };
    }

    const actorEoId = authCheck.partnerUser?.id || "eo_jeda_alam";
    const app = mockApplicationStore.getBySellerId(actorEoId);

    try {
      const pkg = await this.getPackageForEo(packageId, actorEoId);
      if (!pkg) {
        return {
          success: false,
          validationResult: {
            valid: false,
            errors: [
              {
                step: 1,
                field: "packageId",
                message:
                  "Paket tidak ditemukan atau bukan milik EO terautentikasi.",
              },
            ],
          },
        };
      }

      if (pkg.status === "PENDING_ADMIN_REVIEW") {
        return {
          success: true,
          package: pkg,
          validationResult: { valid: true, errors: [] },
          message: "ALREADY_SUBMITTED",
        };
      }

      if (pkg.status !== "DRAFT" && pkg.status !== "REJECTED") {
        return {
          success: false,
          validationResult: {
            valid: false,
            errors: [
              {
                step: 1,
                field: "status",
                message:
                  "Hanya draf atau revisi paket yang dapat diajukan untuk review.",
              },
            ],
          },
        };
      }

      const authorGuideStatus: EoGuideStatus =
        app?.guideStatus ??
        authCheck.partnerUser?.guideStatus ??
        "CERTIFIED_GUIDE";
      const validationResult = validateEoPackage(pkg, authorGuideStatus);

      if (!validationResult.valid) {
        return { success: false, package: pkg, validationResult };
      }

      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from("packages")
        .update({
          status: "PENDING_ADMIN_REVIEW",
          submitted_at: nowIso,
          updated_at: nowIso,
          validation_result: validationResult,
        })
        .eq("id", packageId)
        .eq("eo_id", actorEoId)
        .select()
        .single();

      if (error || !data) {
        return {
          success: false,
          validationResult: {
            valid: false,
            errors: [
              {
                step: 1,
                field: "database",
                message:
                  error?.message || "Gagal mengajukan paket ke Supabase.",
              },
            ],
          },
        };
      }

      const updated = mapPackageRowToRecord(data as PackageRow);
      mockEoPackageStore.upsertPackage(updated);
      return { success: true, package: updated, validationResult };
    } catch (err: unknown) {
      return {
        success: false,
        validationResult: {
          valid: false,
          errors: [
            {
              step: 1,
              field: "system",
              message: err instanceof Error ? err.message : "Kesalahan sistem.",
            },
          ],
        },
      };
    }
  },

  /**
   * Prototype Demo-Only Package Self-Approval:
   * Transitions PENDING_ADMIN_REVIEW -> APPROVED strictly.
   * Does NOT allow arbitrary status transitions or skipping to LIVE.
   */
  async approveOwnPackageForDemo(packageId: string): Promise<{
    success: boolean;
    package?: EoPackageRecord;
    message?: string;
  }> {
    if (!isSupabaseMode()) {
      const actor = partnerSessionStore.get();
      if (!actor || actor.role !== "EO") {
        return {
          success: false,
          message:
            "Akses ditolak: Hanya EO terautentikasi yang dapat melakukan ACC Paket (Demo).",
        };
      }

      const actorEoId = actor.id;
      const pkg = await this.getPackageForEo(packageId, actorEoId);
      if (!pkg) {
        return {
          success: false,
          message:
            "Akses ditolak: Paket tidak ditemukan atau bukan milik EO ini.",
        };
      }

      if (pkg.status !== "PENDING_ADMIN_REVIEW") {
        return {
          success: false,
          message: `Hanya paket dengan status PENDING_ADMIN_REVIEW yang dapat disetujui. Status saat ini: ${pkg.status}`,
        };
      }

      const ok = mockEoPackageStore.approvePackage(packageId);
      if (!ok) {
        return {
          success: false,
          message: "Gagal menyetujui paket di mock store.",
        };
      }
      const updated = mockEoPackageStore.getPackageById(packageId);
      return { success: true, package: updated };
    }

    const authCheck = await requireAuthenticatedUser("EO");
    if (!authCheck.success) {
      return {
        success: false,
        message: authCheck.error,
      };
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return {
        success: false,
        message: "Klien Supabase tidak tersedia untuk ACC Paket.",
      };
    }

    const actorEoId = authCheck.partnerUser?.id || "eo_jeda_alam";
    const pkg = await this.getPackageForEo(packageId, actorEoId);
    if (!pkg) {
      return {
        success: false,
        message:
          "Akses ditolak: Paket tidak ditemukan atau bukan milik EO ini.",
      };
    }

    if (pkg.status !== "PENDING_ADMIN_REVIEW") {
      return {
        success: false,
        message: `Hanya paket dengan status PENDING_ADMIN_REVIEW yang dapat disetujui. Status saat ini: ${pkg.status}`,
      };
    }

    const nowIso = new Date().toISOString();

    try {
      const { data, error } = await supabase
        .from("packages")
        .update({
          status: "APPROVED",
          reviewed_at: nowIso,
          updated_at: nowIso,
        })
        .eq("id", packageId)
        .eq("eo_id", actorEoId)
        .eq("status", "PENDING_ADMIN_REVIEW")
        .select()
        .single();

      if (error || !data) {
        return {
          success: false,
          message: error?.message || "Gagal menyetujui paket di Supabase.",
        };
      }

      const updated = mapPackageRowToRecord(data as PackageRow);
      mockEoPackageStore.upsertPackage(updated);
      return { success: true, package: updated };
    } catch (err: unknown) {
      return {
        success: false,
        message: err instanceof Error ? err.message : "Kesalahan sistem.",
      };
    }
  },

  async publishApprovedPackage(packageId: string): Promise<{
    success: boolean;
    package?: EoPackageRecord;
    message?: string;
  }> {
    if (!isSupabaseMode()) {
      return mockEoPackageStore.publishApprovedPackage(packageId);
    }

    const authCheck = await requireAuthenticatedUser("EO");
    if (!authCheck.success) {
      return {
        success: false,
        message: authCheck.error,
      };
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return {
        success: false,
        message: "Klien Supabase tidak tersedia untuk mempublikasikan paket.",
      };
    }

    const actorEoId = authCheck.partnerUser?.id || "eo_jeda_alam";
    const pkg = await this.getPackageForEo(packageId, actorEoId);
    if (!pkg) {
      return {
        success: false,
        message: "Paket tidak ditemukan atau bukan milik EO ini.",
      };
    }

    if (pkg.status === "LIVE") {
      return {
        success: true,
        package: pkg,
        message: "ALREADY_LIVE",
      };
    }

    if (pkg.status !== "APPROVED") {
      return {
        success: false,
        message:
          "Hanya paket yang telah disetujui kurator Admin (APPROVED) yang dapat dipublikasikan.",
      };
    }

    const nowIso = new Date().toISOString();

    try {
      const { data, error } = await supabase
        .from("packages")
        .update({
          status: "LIVE",
          updated_at: nowIso,
        })
        .eq("id", packageId)
        .eq("eo_id", actorEoId)
        .eq("status", "APPROVED")
        .select()
        .single();

      if (error || !data) {
        return {
          success: false,
          message: error?.message || "Gagal mempublikasikan paket di Supabase.",
        };
      }

      const updated = mapPackageRowToRecord(data as PackageRow);
      mockEoPackageStore.upsertPackage(updated);
      return { success: true, package: updated };
    } catch (err: unknown) {
      return {
        success: false,
        message: err instanceof Error ? err.message : "Kesalahan sistem.",
      };
    }
  },
};
