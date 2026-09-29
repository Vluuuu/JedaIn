import { mockApplicationStore } from "../features/eo/mockApplicationStore";
import {
  formatSessionTimeWindow,
  mockEoPackageStore,
} from "../features/eo/mockEoPackageStore";
import { partnerSessionStore } from "../features/eo/partnerSessionStore";
import type { EoSessionRecord, EoSessionStatus } from "../features/eo/types";
import { getSupabaseClient } from "../lib/supabase/client";
import { isSupabaseMode } from "../lib/supabase/config";
import type { SessionRow } from "../lib/supabase/database.types";
import { requireAuthenticatedUser } from "../lib/supabase/demoAuth";
import {
  mapSessionRecordToRow,
  mapSessionRowToRecord,
} from "../lib/supabase/mappers";
import { destinationRepository } from "./destinationRepository";
import { packageRepository } from "./packageRepository";

export const sessionRepository = {
  async getAllSessions(): Promise<EoSessionRecord[]> {
    if (!isSupabaseMode()) {
      return [...mockEoPackageStore.getAllSessions()];
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return [...mockEoPackageStore.getAllSessions()];
    }

    try {
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .order("start_at", { ascending: true });

      if (error || !data) {
        console.warn(
          "Supabase sessions fetch failed, using fallback:",
          error?.message,
        );
        return [...mockEoPackageStore.getAllSessions()];
      }

      return (data as SessionRow[]).map(mapSessionRowToRecord);
    } catch {
      return [...mockEoPackageStore.getAllSessions()];
    }
  },

  async getSessionsByEo(eoId: string): Promise<EoSessionRecord[]> {
    if (!isSupabaseMode()) {
      return [...mockEoPackageStore.getSessionsByEo(eoId)];
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return [...mockEoPackageStore.getSessionsByEo(eoId)];
    }

    try {
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("eo_id", eoId)
        .order("start_at", { ascending: true });

      if (error || !data) {
        return [...mockEoPackageStore.getSessionsByEo(eoId)];
      }

      return (data as SessionRow[]).map(mapSessionRowToRecord);
    } catch {
      return [...mockEoPackageStore.getSessionsByEo(eoId)];
    }
  },

  async getSessionsByPackage(packageId: string): Promise<EoSessionRecord[]> {
    if (!isSupabaseMode()) {
      return [...mockEoPackageStore.getSessionsByPackage(packageId)];
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return [...mockEoPackageStore.getSessionsByPackage(packageId)];
    }

    try {
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("package_id", packageId)
        .order("start_at", { ascending: true });

      if (error || !data) {
        return [...mockEoPackageStore.getSessionsByPackage(packageId)];
      }

      return (data as SessionRow[]).map(mapSessionRowToRecord);
    } catch {
      return [...mockEoPackageStore.getSessionsByPackage(packageId)];
    }
  },

  async getOpenFutureSessions(
    packageId?: string,
    nowMs: number = Date.now(),
  ): Promise<EoSessionRecord[]> {
    const all = packageId
      ? await this.getSessionsByPackage(packageId)
      : await this.getAllSessions();

    return all.filter((s) => {
      const startMs = Date.parse(s.startAt);
      return s.status === "OPEN" && !Number.isNaN(startMs) && startMs > nowMs;
    });
  },

  async createSession(input: {
    packageId: string;
    startAt: string;
    endAt: string;
    capacity: number;
    pricePerPerson: number;
    operationalNote?: string;
    nowMs?: number;
  }): Promise<{
    success: boolean;
    session?: EoSessionRecord;
    message?: string;
  }> {
    if (!isSupabaseMode()) {
      const actor = partnerSessionStore.get();
      if (!actor || actor.role !== "EO") {
        return {
          success: false,
          message:
            "Akses ditolak: Hanya EO terautentikasi yang dapat membuka sesi.",
        };
      }

      const actorEoId = actor.id;
      const app = mockApplicationStore.getBySellerId(actorEoId);
      if (!app || app.status !== "APPROVED") {
        return {
          success: false,
          message: "Akses ditolak: Akun EO belum berstatus APPROVED.",
        };
      }
      return mockEoPackageStore.createSession(input);
    }

    // Supabase mode requires authenticated EO session
    const authCheck = await requireAuthenticatedUser("EO");
    if (!authCheck.success) {
      return {
        success: false,
        message: authCheck.error,
      };
    }

    const actorEoId = authCheck.partnerUser?.id || "eo_jeda_alam";
    const app = mockApplicationStore.getBySellerId(actorEoId);
    if (!app || app.status !== "APPROVED") {
      return {
        success: false,
        message: "Akses ditolak: Akun EO belum berstatus APPROVED.",
      };
    }

    const pkg = await packageRepository.getPackageById(input.packageId);
    if (!pkg || pkg.eoId !== actorEoId) {
      return {
        success: false,
        message: "Paket tidak ditemukan atau bukan milik EO terautentikasi.",
      };
    }

    if (pkg.status !== "APPROVED" && pkg.status !== "LIVE") {
      return {
        success: false,
        message:
          "Hanya paket berstatus APPROVED atau LIVE yang dapat membuka jadwal sesi.",
      };
    }

    if (input.capacity <= 0) {
      return { success: false, message: "Kapasitas peserta minimal 1 orang." };
    }

    // Temporal validation (EO-F01)
    const nowMs = input.nowMs ?? Date.now();
    const startMs = Date.parse(input.startAt);
    const endMs = Date.parse(input.endAt);

    if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
      return {
        success: false,
        message: "Format tanggal dan waktu sesi tidak valid.",
      };
    }

    if (startMs <= nowMs) {
      return {
        success: false,
        message:
          "Waktu mulai sesi harus di masa depan (tidak boleh di masa lalu atau waktu sekarang).",
      };
    }

    if (endMs <= startMs) {
      return {
        success: false,
        message: "Waktu selesai sesi harus setelah waktu mulai.",
      };
    }

    // Authoritative destination resolution
    if (!pkg.destinationId) {
      return {
        success: false,
        message: "Paket tidak memiliki destinasi yang valid.",
      };
    }

    const dest = await destinationRepository.getAuthoritativeById(
      pkg.destinationId,
    );
    if (!dest) {
      return {
        success: false,
        message: "Data resmi destinasi live tidak dapat dibaca dari server.",
      };
    }

    // Destination capacity limit check
    if (input.capacity > dest.capacityPerSession) {
      return {
        success: false,
        message: `Kapasitas sesi maksimal untuk ${dest.name} adalah ${dest.capacityPerSession} orang.`,
      };
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return {
        success: false,
        message: "Klien Supabase tidak tersedia untuk membuat sesi.",
      };
    }

    // Preflight conflict check across all packages & EOs for this destination
    try {
      const { data: destPackages } = await supabase
        .from("packages")
        .select("id")
        .eq("destination_id", pkg.destinationId);

      const destPkgIds = (destPackages || []).map((p: { id: string }) => p.id);
      if (destPkgIds.length > 0) {
        const { data: conflicts } = await supabase
          .from("sessions")
          .select("id, start_at, end_at, status")
          .in("package_id", destPkgIds)
          .neq("status", "CANCELLED")
          .lt("start_at", input.endAt)
          .gt("end_at", input.startAt)
          .limit(1);

        if (conflicts && conflicts.length > 0) {
          const conflictWindow = formatSessionTimeWindow(
            conflicts[0].start_at,
            conflicts[0].end_at,
          );
          return {
            success: false,
            message: `Destinasi sudah digunakan pada ${conflictWindow}. Pilih waktu lain.`,
          };
        }
      }
    } catch (preflightErr) {
      console.warn("Preflight session conflict check skipped:", preflightErr);
    }

    try {
      const nowIso = new Date(nowMs).toISOString();
      const cleanNote = input.operationalNote?.trim();
      const sessionId = `ses_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      const session: EoSessionRecord = {
        sessionId,
        packageId: input.packageId,
        eoId: pkg.eoId,
        startAt: input.startAt,
        endAt: input.endAt,
        capacity: input.capacity,
        remainingSlots: input.capacity,
        pricePerPerson: input.pricePerPerson,
        status: "OPEN",
        operationalNote: cleanNote || undefined,
        operationalNoteUpdatedAt: cleanNote ? nowIso : undefined,
        createdAt: nowIso,
      };

      const rowPayload = mapSessionRecordToRow(session);
      const { data, error } = await supabase
        .from("sessions")
        .insert(rowPayload as SessionRow)
        .select()
        .single();

      if (error || !data) {
        // Map database-level trigger rejections into clean, user-friendly messages
        const errLower = (error?.message || "").toLowerCase();
        if (
          errLower.includes("kapasitas") ||
          errLower.includes("melebihi batas") ||
          error?.code === "23514"
        ) {
          return {
            success: false,
            message: `Kapasitas sesi maksimal untuk ${dest.name} adalah ${dest.capacityPerSession} orang.`,
          };
        }
        if (
          errLower.includes("bertabrakan") ||
          errLower.includes("sudah memiliki sesi") ||
          error?.code === "23P01"
        ) {
          return {
            success: false,
            message:
              "Destinasi ini sudah memiliki sesi terjadwal pada waktu tersebut. Pilih waktu lain.",
          };
        }

        return {
          success: false,
          message: error?.message || "Gagal membuat sesi di Supabase.",
        };
      }

      const created = mapSessionRowToRecord(data as SessionRow);
      // Synchronize in-memory fallback cache on success
      mockEoPackageStore.upsertSession(created);
      return { success: true, session: created };
    } catch (err: unknown) {
      return {
        success: false,
        message: err instanceof Error ? err.message : "Kesalahan sistem.",
      };
    }
  },

  async updateSessionStatus(
    sessionId: string,
    status: EoSessionStatus,
    nowMs: number = Date.now(),
  ): Promise<{
    success: boolean;
    session?: EoSessionRecord;
    message?: string;
  }> {
    if (!isSupabaseMode()) {
      const actor = partnerSessionStore.get();
      if (!actor || actor.role !== "EO") {
        return {
          success: false,
          message:
            "Akses ditolak: Hanya EO terautentikasi yang dapat mengubah status sesi.",
        };
      }

      const ok = mockEoPackageStore.updateSessionStatus(
        sessionId,
        status,
        nowMs,
      );
      if (!ok) {
        const s = mockEoPackageStore
          .getAllSessions()
          .find((item) => item.sessionId === sessionId);
        const sStartMs = s ? Date.parse(s.startAt) : NaN;
        if (!Number.isNaN(sStartMs) && sStartMs <= (nowMs ?? Date.now())) {
          return {
            success: false,
            message:
              "Sesi yang sudah berlangsung atau berlalu tidak dapat dibuka kembali (OPEN).",
          };
        }
        return {
          success: false,
          message:
            "Destinasi ini sudah memiliki sesi terjadwal pada waktu tersebut. Pilih waktu lain.",
        };
      }
      const found = mockEoPackageStore
        .getAllSessions()
        .find((item) => item.sessionId === sessionId);
      return { success: true, session: found };
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
        message: "Klien Supabase tidak tersedia untuk mengubah status sesi.",
      };
    }

    const actorEoId = authCheck.partnerUser?.id || "eo_jeda_alam";

    try {
      // Find existing session in Supabase
      const { data: existingData, error: fetchErr } = await supabase
        .from("sessions")
        .select("*")
        .eq("id", sessionId)
        .maybeSingle();

      if (fetchErr || !existingData) {
        return { success: false, message: "Sesi tidak ditemukan di Supabase." };
      }

      const existing = mapSessionRowToRecord(existingData as SessionRow);
      if (existing.eoId !== actorEoId) {
        return {
          success: false,
          message: "Akses ditolak: Anda bukan pemilik sesi ini.",
        };
      }

      const sessionStartMs = Date.parse(existing.startAt);
      if (status === "OPEN" && sessionStartMs <= nowMs) {
        return {
          success: false,
          message:
            "Sesi yang sudah berlangsung atau berlalu tidak dapat dibuka kembali (OPEN).",
        };
      }

      // When reopening a cancelled session, check for schedule conflicts on destination
      if (existing.status === "CANCELLED" && status !== "CANCELLED") {
        const pkg = await packageRepository.getPackageById(existing.packageId);
        if (pkg?.destinationId) {
          const { data: destPackages } = await supabase
            .from("packages")
            .select("id")
            .eq("destination_id", pkg.destinationId);

          const destPkgIds = (destPackages || []).map(
            (p: { id: string }) => p.id,
          );
          if (destPkgIds.length > 0) {
            const { data: conflicts } = await supabase
              .from("sessions")
              .select("id, start_at, end_at, status")
              .in("package_id", destPkgIds)
              .neq("id", sessionId)
              .neq("status", "CANCELLED")
              .lt("start_at", existing.endAt)
              .gt("end_at", existing.startAt)
              .limit(1);

            if (conflicts && conflicts.length > 0) {
              const conflictWindow = formatSessionTimeWindow(
                conflicts[0].start_at,
                conflicts[0].end_at,
              );
              return {
                success: false,
                message: `Destinasi sudah digunakan pada ${conflictWindow}. Pilih waktu lain.`,
              };
            }
          }
        }
      }

      const { data, error } = await supabase
        .from("sessions")
        .update({
          status,
          updated_at: new Date(nowMs).toISOString(),
        })
        .eq("id", sessionId)
        .eq("eo_id", actorEoId)
        .select()
        .single();

      if (error || !data) {
        const errLower = (error?.message || "").toLowerCase();
        if (
          errLower.includes("bertabrakan") ||
          errLower.includes("sudah memiliki sesi") ||
          error?.code === "23P01"
        ) {
          return {
            success: false,
            message:
              "Destinasi ini sudah memiliki sesi terjadwal pada waktu tersebut. Pilih waktu lain.",
          };
        }

        return {
          success: false,
          message: error?.message || "Gagal mengubah status sesi di Supabase.",
        };
      }

      const updated = mapSessionRowToRecord(data as SessionRow);
      mockEoPackageStore.upsertSession(updated);
      return { success: true, session: updated };
    } catch (err: unknown) {
      return {
        success: false,
        message: err instanceof Error ? err.message : "Kesalahan sistem.",
      };
    }
  },

  async updateSessionOperationalNote(
    sessionId: string,
    operationalNote: string,
    nowMs: number = Date.now(),
  ): Promise<{
    success: boolean;
    session?: EoSessionRecord;
    message?: string;
  }> {
    if (!isSupabaseMode()) {
      const actor = partnerSessionStore.get();
      if (!actor || actor.role !== "EO") {
        return {
          success: false,
          message:
            "Akses ditolak: Hanya EO terautentikasi yang dapat mengubah catatan operasional sesi.",
        };
      }

      const ok = mockEoPackageStore.updateSessionOperationalNote(
        sessionId,
        operationalNote,
      );
      if (!ok) {
        return {
          success: false,
          message: "Sesi tidak ditemukan atau bukan milik EO ini.",
        };
      }
      const found = mockEoPackageStore
        .getAllSessions()
        .find((item) => item.sessionId === sessionId);
      return { success: true, session: found };
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
        message:
          "Klien Supabase tidak tersedia untuk memperbarui catatan sesi.",
      };
    }

    const actorEoId = authCheck.partnerUser?.id || "eo_jeda_alam";

    try {
      const cleanNote = operationalNote.trim();
      const nowIso = new Date(nowMs).toISOString();

      const { data, error } = await supabase
        .from("sessions")
        .update({
          operational_note: cleanNote,
          operational_note_updated_at: nowIso,
          updated_at: nowIso,
        })
        .eq("id", sessionId)
        .eq("eo_id", actorEoId)
        .select()
        .single();

      if (error || !data) {
        return {
          success: false,
          message:
            error?.message ||
            "Gagal memperbarui catatan operasional sesi di Supabase.",
        };
      }

      const updated = mapSessionRowToRecord(data as SessionRow);
      mockEoPackageStore.upsertSession(updated);
      return { success: true, session: updated };
    } catch (err: unknown) {
      return {
        success: false,
        message: err instanceof Error ? err.message : "Kesalahan sistem.",
      };
    }
  },
};
