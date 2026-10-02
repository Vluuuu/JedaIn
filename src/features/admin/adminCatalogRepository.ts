import {
  getSupabaseClient,
  isSupabaseMode,
  requireAuthenticatedUser,
  mapDestinationRecordToRow,
  mapDestinationRowToRecord,
} from "../../lib/supabase";
import type { DestinationRow } from "../../lib/supabase";
import { mockApplicationStore } from "../eo/mockApplicationStore";
import { mockDestinationStore } from "../eo/mockDestinationStore";
import { mockEoPackageStore } from "../eo/mockEoPackageStore";
import type { DestinationRecord } from "../eo/types";
import { adminSessionStore } from "./adminSessionStore";

export interface VerifiedDestinationInput {
  name: string;
  province: string;
  city: string;
  description: string;
  capacityPerSession: number;
  baseCostPerPerson: number;
  localGuideFeePerPerson: number;
  localGuideSummary: string;
  verified: boolean;
  imageUrl?: string;
  availableActivities: string[];
  facilities: string[];
  baseCostIncludes: string[];
  baseCostExcludes: string[];
}
export interface AdminCatalog {
  organizers: {
    id: string;
    name: string;
    livePackages: number;
    activeSessions: number;
  }[];
  destinations: DestinationRecord[];
}

async function requireAdmin() {
  if (!isSupabaseMode()) {
    if (adminSessionStore.get()?.role !== "ADMIN")
      throw new Error("Hanya Admin yang dapat mengelola katalog.");
    return;
  }
  const actor = await requireAuthenticatedUser("ADMIN");
  if (!actor.success || actor.partnerUser?.role !== "ADMIN")
    throw new Error(actor.error ?? "Akses Admin diperlukan.");
}

export function validateVerifiedDestination(
  input: VerifiedDestinationInput,
): string | null {
  if (
    ![
      input.name,
      input.province,
      input.city,
      input.description,
      input.localGuideSummary,
    ].every((value) => value.trim())
  )
    return "Lengkapi nama, lokasi, deskripsi, dan informasi pemandu destinasi.";
  if (!input.verified)
    return "Konfirmasi verifikasi destinasi dan kesiapan pemandu sebelum menyimpan.";
  if (
    !Number.isSafeInteger(input.capacityPerSession) ||
    input.capacityPerSession < 1 ||
    input.capacityPerSession > 2147483647
  )
    return "Kapasitas harus berupa bilangan bulat minimal 1.";
  if (
    ![input.baseCostPerPerson, input.localGuideFeePerPerson].every(
      (value) =>
        Number.isSafeInteger(value) && value >= 0 && value <= 2147483647,
    )
  )
    return "Biaya harus berupa Rupiah utuh, tidak negatif, dan dalam batas penyimpanan.";
  if (input.imageUrl?.trim()) {
    try {
      if (new URL(input.imageUrl.trim()).protocol !== "https:")
        return "Gunakan URL foto HTTPS.";
    } catch {
      return "URL foto tidak valid.";
    }
  }
  return null;
}

export const adminCatalogRepository = {
  async getCatalog(): Promise<AdminCatalog> {
    await requireAdmin();
    if (!isSupabaseMode()) {
      const packages = mockEoPackageStore.getAllPackages();
      const sessions = mockEoPackageStore.getAllSessions();
      return {
        destinations: [...mockDestinationStore.getAll()],
        organizers: mockApplicationStore
          .getAll()
          .filter((app) => app.status === "APPROVED")
          .map((app) => {
            const owned = packages.filter(
              (pkg) => pkg.eoId === app.identityId && pkg.status === "LIVE",
            );
            return {
              id: app.identityId,
              name: app.businessName,
              livePackages: owned.length,
              activeSessions: sessions.filter(
                (session) =>
                  owned.some((pkg) => pkg.packageId === session.packageId) &&
                  ["OPEN", "FULL"].includes(session.status) &&
                  Date.parse(session.endAt) > Date.now(),
              ).length,
            };
          }),
      };
    }
    const client = getSupabaseClient();
    if (!client) throw new Error("Layanan katalog tidak tersedia.");
    const [profiles, packages, sessions, destinations] = await Promise.all([
      client
        .from("partner_profiles")
        .select("id,business_name,display_name")
        .eq("role", "EO")
        .order("business_name"),
      client.from("packages").select("id,eo_id,status").eq("status", "LIVE"),
      client
        .from("sessions")
        .select("package_id,status,end_at")
        .in("status", ["OPEN", "FULL"])
        .gt("end_at", new Date().toISOString()),
      client.from("destinations").select("*").order("name"),
    ]);
    for (const result of [profiles, packages, sessions, destinations])
      if (result.error || !result.data)
        throw new Error(
          result.error?.message ?? "Katalog gagal dimuat. Coba lagi.",
        );
    return {
      destinations: destinations.data!.map((row) =>
        mapDestinationRowToRecord(row as DestinationRow),
      ),
      organizers: profiles.data!.map((profile) => {
        const owned = packages.data!.filter((pkg) => pkg.eo_id === profile.id);
        return {
          id: profile.id,
          name: profile.business_name || profile.display_name,
          livePackages: owned.length,
          activeSessions: sessions.data!.filter((session) =>
            owned.some((pkg) => pkg.id === session.package_id),
          ).length,
        };
      }),
    };
  },

  async createVerifiedDestination(
    input: VerifiedDestinationInput,
  ): Promise<DestinationRecord> {
    await requireAdmin();
    const problem = validateVerifiedDestination(input);
    if (problem) throw new Error(problem);
    const destination: DestinationRecord = {
      destinationId: `dest_${crypto.randomUUID()}`,
      name: input.name.trim(),
      province: input.province.trim(),
      city: input.city.trim(),
      locationLabel: `${input.city.trim()}, ${input.province.trim()}`,
      description: input.description.trim(),
      capacityPerSession: input.capacityPerSession,
      baseCostPerPerson: input.baseCostPerPerson,
      localGuideFeePerPerson: input.localGuideFeePerPerson,
      localGuideSummary: input.localGuideSummary.trim(),
      verificationLevel: "BASIC",
      guideReady: true,
      status: "ACTIVE",
      highlights: [],
      imageUrl: input.imageUrl?.trim() || undefined,
      mediaGallery: input.imageUrl?.trim()
        ? [
            {
              mediaId: crypto.randomUUID(),
              url: input.imageUrl.trim(),
              label: input.name.trim(),
              provenance: "DESTINATION_SOURCE",
              category: "DESTINATION",
            },
          ]
        : [],
      availableActivities: input.availableActivities
        .map((value) => value.trim())
        .filter(Boolean),
      facilities: input.facilities.map((value) => value.trim()).filter(Boolean),
      baseCostIncludes: input.baseCostIncludes
        .map((value) => value.trim())
        .filter(Boolean),
      baseCostExcludes: input.baseCostExcludes
        .map((value) => value.trim())
        .filter(Boolean),
    };
    if (!isSupabaseMode())
      return mockDestinationStore.upsertVerifiedDestination(destination);
    const client = getSupabaseClient();
    if (!client) throw new Error("Layanan penyimpanan tidak tersedia.");
    const { data, error } = await client
      .from("destinations")
      .insert(mapDestinationRecordToRow(destination))
      .select("*")
      .single();
    if (error || !data)
      throw new Error(
        error?.message ?? "Destinasi belum tersimpan. Coba lagi.",
      );
    if (
      data.id !== destination.destinationId ||
      data.status !== "ACTIVE" ||
      !data.guide_ready
    )
      throw new Error("Penyimpanan destinasi belum terverifikasi.");
    return mockDestinationStore.upsertVerifiedDestination(
      mapDestinationRowToRecord(data as DestinationRow),
    );
  },
};
