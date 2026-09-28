import { mockDestinationStore } from "../features/eo/mockDestinationStore";
import type {
  DestinationMediaItem,
  DestinationRecord,
} from "../features/eo/types";
import { getSupabaseClient } from "../lib/supabase/client";
import { isSupabaseMode } from "../lib/supabase/config";
import type { DestinationRow } from "../lib/supabase/database.types";
import { mapDestinationRowToRecord } from "../lib/supabase/mappers";

export const destinationRepository = {
  async getAll(): Promise<DestinationRecord[]> {
    if (!isSupabaseMode()) {
      return [...mockDestinationStore.getAll()];
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return [...mockDestinationStore.getAll()];
    }

    try {
      const { data, error } = await supabase
        .from("destinations")
        .select("*")
        .order("name", { ascending: true });

      if (error || !data) {
        console.warn(
          "Supabase destinations fetch failed, using fallback:",
          error?.message,
        );
        return [...mockDestinationStore.getAll()];
      }

      return (data as DestinationRow[]).map(mapDestinationRowToRecord);
    } catch (err) {
      console.warn("Supabase destinations exception, using fallback:", err);
      return [...mockDestinationStore.getAll()];
    }
  },

  async getById(destinationId: string): Promise<DestinationRecord | undefined> {
    if (!isSupabaseMode()) {
      return mockDestinationStore.getById(destinationId);
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return mockDestinationStore.getById(destinationId);
    }

    try {
      const { data, error } = await supabase
        .from("destinations")
        .select("*")
        .eq("id", destinationId)
        .maybeSingle();

      if (error || !data) {
        return mockDestinationStore.getById(destinationId);
      }

      return mapDestinationRowToRecord(data as DestinationRow);
    } catch {
      return mockDestinationStore.getById(destinationId);
    }
  },

  async getEligibleForEo(
    guideStatus?: "CONCEPT_ONLY" | "CERTIFIED_GUIDE",
  ): Promise<DestinationRecord[]> {
    if (!isSupabaseMode()) {
      return [...mockDestinationStore.getEligibleForEo(guideStatus)];
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return [...mockDestinationStore.getEligibleForEo(guideStatus)];
    }

    try {
      const { data, error } = await supabase
        .from("destinations")
        .select("*")
        .eq("status", "ACTIVE")
        .eq("guide_ready", true)
        .order("name", { ascending: true });

      if (error || !data) {
        return [...mockDestinationStore.getEligibleForEo(guideStatus)];
      }

      return (data as DestinationRow[]).map(mapDestinationRowToRecord);
    } catch {
      return [...mockDestinationStore.getEligibleForEo(guideStatus)];
    }
  },

  async updateDescription(
    destinationId: string,
    description: string,
  ): Promise<{
    success: boolean;
    destination?: DestinationRecord;
    message?: string;
  }> {
    const trimmed = description.trim();

    if (!isSupabaseMode()) {
      const updated = mockDestinationStore.updateDescription(
        destinationId,
        trimmed,
      );
      if (!updated) {
        return { success: false, message: "Destinasi tidak ditemukan." };
      }
      return { success: true, destination: updated };
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      const updated = mockDestinationStore.updateDescription(
        destinationId,
        trimmed,
      );
      return { success: Boolean(updated), destination: updated };
    }

    try {
      const { data, error } = await supabase
        .from("destinations")
        .update({
          description: trimmed,
          updated_at: new Date().toISOString(),
        })
        .eq("id", destinationId)
        .select()
        .single();

      if (error || !data) {
        return {
          success: false,
          message: error?.message || "Gagal memperbarui deskripsi destinasi.",
        };
      }

      const mapped = mapDestinationRowToRecord(data as DestinationRow);
      mockDestinationStore.updateDescription(destinationId, trimmed);
      return { success: true, destination: mapped };
    } catch (err: unknown) {
      return {
        success: false,
        message: err instanceof Error ? err.message : "Kesalahan sistem.",
      };
    }
  },

  async updateLocalGuideFee(
    destinationId: string,
    localGuideFeePerPerson: number,
  ): Promise<{
    success: boolean;
    destination?: DestinationRecord;
    message?: string;
  }> {
    const cleanFee = Math.max(0, Math.round(localGuideFeePerPerson));

    if (!isSupabaseMode()) {
      const updated = mockDestinationStore.updateLocalGuideFee(
        destinationId,
        cleanFee,
      );
      if (!updated) {
        return { success: false, message: "Destinasi tidak ditemukan." };
      }
      return { success: true, destination: updated };
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      const updated = mockDestinationStore.updateLocalGuideFee(
        destinationId,
        cleanFee,
      );
      return { success: Boolean(updated), destination: updated };
    }

    try {
      const { data, error } = await supabase
        .from("destinations")
        .update({
          local_guide_fee_per_person: cleanFee,
          updated_at: new Date().toISOString(),
        })
        .eq("id", destinationId)
        .select()
        .single();

      if (error || !data) {
        return {
          success: false,
          message: error?.message || "Gagal memperbarui tarif pemandu lokal.",
        };
      }

      const mapped = mapDestinationRowToRecord(data as DestinationRow);
      mockDestinationStore.updateLocalGuideFee(destinationId, cleanFee);
      return { success: true, destination: mapped };
    } catch (err: unknown) {
      return {
        success: false,
        message: err instanceof Error ? err.message : "Kesalahan sistem.",
      };
    }
  },

  async updateMediaGallery(
    destinationId: string,
    mediaGallery: DestinationMediaItem[],
  ): Promise<{
    success: boolean;
    destination?: DestinationRecord;
    message?: string;
  }> {
    if (!isSupabaseMode()) {
      const updated = mockDestinationStore.updateMediaGallery(
        destinationId,
        mediaGallery,
      );
      if (!updated) {
        return { success: false, message: "Destinasi tidak ditemukan." };
      }
      return { success: true, destination: updated };
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      const updated = mockDestinationStore.updateMediaGallery(
        destinationId,
        mediaGallery,
      );
      return { success: Boolean(updated), destination: updated };
    }

    try {
      const { data, error } = await supabase
        .from("destinations")
        .update({
          media_gallery: mediaGallery,
          updated_at: new Date().toISOString(),
        })
        .eq("id", destinationId)
        .select()
        .single();

      if (error || !data) {
        return {
          success: false,
          message: error?.message || "Gagal memperbarui galeri destinasi.",
        };
      }

      const mapped = mapDestinationRowToRecord(data as DestinationRow);
      mockDestinationStore.updateMediaGallery(destinationId, mediaGallery);
      return { success: true, destination: mapped };
    } catch (err: unknown) {
      return {
        success: false,
        message: err instanceof Error ? err.message : "Kesalahan sistem.",
      };
    }
  },
};
