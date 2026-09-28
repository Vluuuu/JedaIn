import { describe, expect, it } from "vitest";
import type {
  DestinationRecord,
  EoPackageRecord,
  EoSessionRecord,
} from "../../features/eo/types";
import type { DestinationRow, PackageRow, SessionRow } from "./database.types";
import {
  mapDestinationRecordToRow,
  mapDestinationRowToRecord,
  mapPackageRecordToRow,
  mapPackageRowToRecord,
  mapSessionRecordToRow,
  mapSessionRowToRecord,
} from "./mappers";

describe("Supabase Mappers - Row to Domain & Domain to Row", () => {
  describe("Destination mapping", () => {
    it("maps DestinationRow to DestinationRecord with complete fields", () => {
      const row: DestinationRow = {
        id: "dest_test_1",
        name: "Lembah Asri",
        location_label: "Batu, Jawa Timur",
        province: "Jawa Timur",
        city: "Batu",
        verification_level: "PLUS",
        guide_ready: true,
        base_cost_per_person: 150000,
        local_guide_fee_per_person: 25000,
        description: "Lembah hijau nan sejuk",
        highlights: ["Pemandangan alam", "Udara sejuk"],
        capacity_per_session: 25,
        image_url: "https://example.com/dest.jpg",
        media_gallery: [
          {
            mediaId: "med_1",
            url: "https://example.com/1.jpg",
            label: "Foto 1",
            provenance: "DESTINATION_SOURCE",
          },
        ],
        status: "ACTIVE",
        available_activities: ["Trekking"],
        facilities: ["Toilet", "Musholla"],
        operational_notes: ["Bawa payung"],
        local_guide_summary: "Pemandu lokal ramah",
        base_cost_includes: ["Tiket masuk"],
        base_cost_excludes: ["Makan siang"],
      };

      const record = mapDestinationRowToRecord(row);

      expect(record.destinationId).toBe("dest_test_1");
      expect(record.name).toBe("Lembah Asri");
      expect(record.locationLabel).toBe("Batu, Jawa Timur");
      expect(record.verificationLevel).toBe("PLUS");
      expect(record.guideReady).toBe(true);
      expect(record.baseCostPerPerson).toBe(150000);
      expect(record.localGuideFeePerPerson).toBe(25000);
      expect(record.highlights).toEqual(["Pemandangan alam", "Udara sejuk"]);
      expect(record.mediaGallery).toHaveLength(1);
      expect(record.status).toBe("ACTIVE");
    });

    it("handles null / optional fields gracefully when mapping to DestinationRecord", () => {
      const row: DestinationRow = {
        id: "dest_min",
        name: "Desa Hening",
        location_label: "Malang",
        province: "Jawa Timur",
        city: "Malang",
        verification_level: "BASIC",
        guide_ready: false,
        base_cost_per_person: 90000,
        local_guide_fee_per_person: null,
        description: "",
        highlights: null,
        capacity_per_session: 10,
        image_url: null,
        media_gallery: null,
        status: "ACTIVE",
        available_activities: null,
        facilities: null,
        operational_notes: null,
        local_guide_summary: null,
        base_cost_includes: null,
        base_cost_excludes: null,
      };

      const record = mapDestinationRowToRecord(row);
      expect(record.localGuideFeePerPerson).toBeUndefined();
      expect(record.imageUrl).toBeUndefined();
      expect(record.mediaGallery).toBeUndefined();
      expect(record.highlights).toEqual([]);
      expect(record.description).toBe("");
    });

    it("maps DestinationRecord back to Partial<DestinationRow>", () => {
      const record: Partial<DestinationRecord> = {
        destinationId: "dest_update",
        name: "Nama Baru",
        description: "Deskripsi baru yang diperbarui",
        localGuideFeePerPerson: 35000,
      };

      const row = mapDestinationRecordToRow(record);
      expect(row.id).toBe("dest_update");
      expect(row.name).toBe("Nama Baru");
      expect(row.description).toBe("Deskripsi baru yang diperbarui");
      expect(row.local_guide_fee_per_person).toBe(35000);
    });
  });

  describe("Package mapping", () => {
    it("maps PackageRow to EoPackageRecord with nested pricing & itinerary", () => {
      const row: PackageRow = {
        id: "pkg_test_1",
        eo_id: "eo_test",
        eo_display_name: "Test EO",
        title: "Paket Relaksasi Pagi",
        short_summary: "Sesi hening pagi hari",
        value_proposition: "Jeda sehat menyegarkan",
        destination_id: "dest_test_1",
        image_url: "https://example.com/cover.jpg",
        image_urls: ["https://example.com/cover.jpg"],
        insight_id: "ins_1",
        duration_label: "Setengah hari",
        suitable_group_types: ["SOLO", "FRIENDS"],
        highlights: ["Highlight 1"],
        itinerary: [
          {
            order: 1,
            title: "Sesi 1",
            description: "Deskripsi 1",
            durationLabel: "1 jam",
          },
        ],
        included_items: ["Tiket", "Pemandu"],
        excluded_items: ["Transport pribadi"],
        safety_notes: ["Pakai sepatu kets"],
        meeting_point_label: "Stasiun Malang",
        departure_time_label: "08:00 WIB",
        outbound_transport: "Shuttle",
        return_transport: "Shuttle",
        access_notes: ["Jalur datar"],
        destination_base_cost: 100000,
        local_guide_fee: 25000,
        eo_margin: 150000,
        customer_price: 275000,
        guide_status: "CERTIFIED_GUIDE",
        guide_source: "DESTINATION",
        status: "LIVE",
        validation_result: { valid: true, errors: [] },
        submitted_at: "2026-09-01T08:00:00Z",
        reviewed_at: "2026-09-02T10:00:00Z",
        rejection_reason: null,
        created_at: "2026-09-01T07:00:00Z",
        updated_at: "2026-09-02T10:00:00Z",
      };

      const record = mapPackageRowToRecord(row);

      expect(record.packageId).toBe("pkg_test_1");
      expect(record.pricing.destinationBaseCost).toBe(100000);
      expect(record.pricing.localGuideFee).toBe(25000);
      expect(record.pricing.eoMargin).toBe(150000);
      expect(record.pricing.customerPrice).toBe(275000);
      expect(record.itinerary).toHaveLength(1);
      expect(record.itinerary[0].title).toBe("Sesi 1");
      expect(record.status).toBe("LIVE");
    });

    it("maps EoPackageRecord back to Partial<PackageRow>", () => {
      const record: Partial<EoPackageRecord> = {
        packageId: "pkg_draft_1",
        eoId: "eo_test",
        title: "Paket Draf Baru",
        pricing: {
          destinationBaseCost: 120000,
          localGuideFee: 30000,
          eoMargin: 100000,
          customerPrice: 250000,
        },
        status: "DRAFT",
      };

      const row = mapPackageRecordToRow(record);

      expect(row.id).toBe("pkg_draft_1");
      expect(row.eo_id).toBe("eo_test");
      expect(row.title).toBe("Paket Draf Baru");
      expect(row.destination_base_cost).toBe(120000);
      expect(row.local_guide_fee).toBe(30000);
      expect(row.eo_margin).toBe(100000);
      expect(row.customer_price).toBe(250000);
      expect(row.status).toBe("DRAFT");
    });
  });

  describe("Session mapping", () => {
    it("maps SessionRow to EoSessionRecord", () => {
      const row: SessionRow = {
        id: "ses_1",
        package_id: "pkg_1",
        eo_id: "eo_1",
        start_at: "2026-10-15T08:00:00Z",
        end_at: "2026-10-15T14:00:00Z",
        capacity: 10,
        remaining_slots: 8,
        price_per_person: 275000,
        status: "OPEN",
        operational_note: "Kumpul di pintu barat",
        operational_note_updated_at: "2026-10-10T09:00:00Z",
        created_at: "2026-09-20T08:00:00Z",
      };

      const record = mapSessionRowToRecord(row);

      expect(record.sessionId).toBe("ses_1");
      expect(record.packageId).toBe("pkg_1");
      expect(record.capacity).toBe(10);
      expect(record.remainingSlots).toBe(8);
      expect(record.operationalNote).toBe("Kumpul di pintu barat");
      expect(record.status).toBe("OPEN");
    });

    it("maps EoSessionRecord back to Partial<SessionRow>", () => {
      const record: Partial<EoSessionRecord> = {
        sessionId: "ses_new",
        packageId: "pkg_1",
        capacity: 12,
        status: "CLOSED",
      };

      const row = mapSessionRecordToRow(record);
      expect(row.id).toBe("ses_new");
      expect(row.package_id).toBe("pkg_1");
      expect(row.capacity).toBe(12);
      expect(row.status).toBe("CLOSED");
    });
  });
});
