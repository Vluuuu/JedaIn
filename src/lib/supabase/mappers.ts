import type {
  DestinationRecord,
  EoPackageRecord,
  EoSessionRecord,
} from "../../features/eo/types";
import type { DestinationRow, PackageRow, SessionRow } from "./database.types";

/**
 * Destination Mappers
 */
export function mapDestinationRowToRecord(
  row: DestinationRow,
): DestinationRecord {
  return {
    destinationId: row.id,
    name: row.name,
    locationLabel: row.location_label,
    province: row.province,
    city: row.city,
    verificationLevel: row.verification_level,
    guideReady: Boolean(row.guide_ready),
    baseCostPerPerson: Number(row.base_cost_per_person),
    localGuideFeePerPerson:
      row.local_guide_fee_per_person !== null &&
      row.local_guide_fee_per_person !== undefined
        ? Number(row.local_guide_fee_per_person)
        : undefined,
    description: row.description || "",
    highlights: Array.isArray(row.highlights) ? row.highlights : [],
    capacityPerSession: Number(row.capacity_per_session),
    imageUrl: row.image_url ?? undefined,
    mediaGallery: Array.isArray(row.media_gallery)
      ? row.media_gallery
      : undefined,
    status: row.status,
    availableActivities: Array.isArray(row.available_activities)
      ? row.available_activities
      : undefined,
    facilities: Array.isArray(row.facilities) ? row.facilities : undefined,
    operationalNotes: Array.isArray(row.operational_notes)
      ? row.operational_notes
      : undefined,
    localGuideSummary: row.local_guide_summary ?? undefined,
    baseCostIncludes: Array.isArray(row.base_cost_includes)
      ? row.base_cost_includes
      : undefined,
    baseCostExcludes: Array.isArray(row.base_cost_excludes)
      ? row.base_cost_excludes
      : undefined,
  };
}

export function mapDestinationRecordToRow(
  record: Partial<DestinationRecord>,
): Partial<DestinationRow> {
  const row: Partial<DestinationRow> = {};

  if (record.destinationId !== undefined) row.id = record.destinationId;
  if (record.name !== undefined) row.name = record.name;
  if (record.locationLabel !== undefined)
    row.location_label = record.locationLabel;
  if (record.province !== undefined) row.province = record.province;
  if (record.city !== undefined) row.city = record.city;
  if (record.verificationLevel !== undefined)
    row.verification_level = record.verificationLevel;
  if (record.guideReady !== undefined) row.guide_ready = record.guideReady;
  if (record.baseCostPerPerson !== undefined)
    row.base_cost_per_person = record.baseCostPerPerson;
  if (record.localGuideFeePerPerson !== undefined)
    row.local_guide_fee_per_person = record.localGuideFeePerPerson ?? null;
  if (record.description !== undefined) row.description = record.description;
  if (record.highlights !== undefined) row.highlights = record.highlights;
  if (record.capacityPerSession !== undefined)
    row.capacity_per_session = record.capacityPerSession;
  if (record.imageUrl !== undefined) row.image_url = record.imageUrl ?? null;
  if (record.mediaGallery !== undefined)
    row.media_gallery = record.mediaGallery ?? null;
  if (record.status !== undefined) row.status = record.status;
  if (record.availableActivities !== undefined)
    row.available_activities = record.availableActivities ?? null;
  if (record.facilities !== undefined)
    row.facilities = record.facilities ?? null;
  if (record.operationalNotes !== undefined)
    row.operational_notes = record.operationalNotes ?? null;
  if (record.localGuideSummary !== undefined)
    row.local_guide_summary = record.localGuideSummary ?? null;
  if (record.baseCostIncludes !== undefined)
    row.base_cost_includes = record.baseCostIncludes ?? null;
  if (record.baseCostExcludes !== undefined)
    row.base_cost_excludes = record.baseCostExcludes ?? null;

  return row;
}

/**
 * Package Mappers
 */
export function mapPackageRowToRecord(row: PackageRow): EoPackageRecord {
  return {
    packageId: row.id,
    eoId: row.eo_id,
    eoDisplayName: row.eo_display_name,
    title: row.title,
    shortSummary: row.short_summary,
    valueProposition: row.value_proposition,
    destinationId: row.destination_id,
    imageUrl: row.image_url ?? undefined,
    imageUrls: Array.isArray(row.image_urls) ? row.image_urls : undefined,
    insightId: row.insight_id ?? undefined,
    durationLabel: row.duration_label,
    suitableGroupTypes: Array.isArray(row.suitable_group_types)
      ? row.suitable_group_types
      : [],
    highlights: Array.isArray(row.highlights) ? row.highlights : [],
    itinerary: Array.isArray(row.itinerary) ? row.itinerary : [],
    includedItems: Array.isArray(row.included_items) ? row.included_items : [],
    excludedItems: Array.isArray(row.excluded_items) ? row.excluded_items : [],
    safetyNotes: Array.isArray(row.safety_notes) ? row.safety_notes : [],
    meetingPointLabel: row.meeting_point_label ?? undefined,
    departureTimeLabel: row.departure_time_label ?? undefined,
    outboundTransport: row.outbound_transport ?? undefined,
    returnTransport: row.return_transport ?? undefined,
    accessNotes: Array.isArray(row.access_notes) ? row.access_notes : undefined,
    pricing: {
      destinationBaseCost: Number(row.destination_base_cost),
      localGuideFee: Number(row.local_guide_fee),
      eoMargin: Number(row.eo_margin),
      customerPrice: Number(row.customer_price),
    },
    guideStatus: row.guide_status,
    guideSource: row.guide_source,
    status: row.status,
    validationResult: row.validation_result ?? undefined,
    submittedAt: row.submitted_at ?? undefined,
    reviewedAt: row.reviewed_at ?? undefined,
    rejectionReason: row.rejection_reason ?? undefined,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

export function mapPackageRecordToRow(
  record: Partial<EoPackageRecord>,
): Partial<PackageRow> {
  const row: Partial<PackageRow> = {};

  if (record.packageId !== undefined) row.id = record.packageId;
  if (record.eoId !== undefined) row.eo_id = record.eoId;
  if (record.eoDisplayName !== undefined)
    row.eo_display_name = record.eoDisplayName;
  if (record.title !== undefined) row.title = record.title;
  if (record.shortSummary !== undefined)
    row.short_summary = record.shortSummary;
  if (record.valueProposition !== undefined)
    row.value_proposition = record.valueProposition;
  if (record.destinationId !== undefined)
    row.destination_id = record.destinationId;
  if (record.imageUrl !== undefined) row.image_url = record.imageUrl ?? null;
  if (record.imageUrls !== undefined) row.image_urls = record.imageUrls ?? null;
  if (record.insightId !== undefined) row.insight_id = record.insightId ?? null;
  if (record.durationLabel !== undefined)
    row.duration_label = record.durationLabel;
  if (record.suitableGroupTypes !== undefined)
    row.suitable_group_types = record.suitableGroupTypes;
  if (record.highlights !== undefined) row.highlights = record.highlights;
  if (record.itinerary !== undefined) row.itinerary = record.itinerary;
  if (record.includedItems !== undefined)
    row.included_items = record.includedItems;
  if (record.excludedItems !== undefined)
    row.excluded_items = record.excludedItems;
  if (record.safetyNotes !== undefined) row.safety_notes = record.safetyNotes;
  if (record.meetingPointLabel !== undefined)
    row.meeting_point_label = record.meetingPointLabel ?? null;
  if (record.departureTimeLabel !== undefined)
    row.departure_time_label = record.departureTimeLabel ?? null;
  if (record.outboundTransport !== undefined)
    row.outbound_transport = record.outboundTransport ?? null;
  if (record.returnTransport !== undefined)
    row.return_transport = record.returnTransport ?? null;
  if (record.accessNotes !== undefined)
    row.access_notes = record.accessNotes ?? null;

  if (record.pricing) {
    row.destination_base_cost = record.pricing.destinationBaseCost;
    row.local_guide_fee = record.pricing.localGuideFee;
    row.eo_margin = record.pricing.eoMargin;
    row.customer_price = record.pricing.customerPrice;
  }

  if (record.guideStatus !== undefined) row.guide_status = record.guideStatus;
  if (record.guideSource !== undefined) row.guide_source = record.guideSource;
  if (record.status !== undefined) row.status = record.status;
  if (record.validationResult !== undefined)
    row.validation_result = record.validationResult ?? null;
  if (record.submittedAt !== undefined)
    row.submitted_at = record.submittedAt ?? null;
  if (record.reviewedAt !== undefined)
    row.reviewed_at = record.reviewedAt ?? null;
  if (record.rejectionReason !== undefined)
    row.rejection_reason = record.rejectionReason ?? null;
  if (record.createdAt !== undefined) row.created_at = record.createdAt;
  if (record.updatedAt !== undefined) row.updated_at = record.updatedAt;

  return row;
}

/**
 * Session Mappers
 */
export function mapSessionRowToRecord(row: SessionRow): EoSessionRecord {
  return {
    sessionId: row.id,
    packageId: row.package_id,
    eoId: row.eo_id,
    startAt: row.start_at,
    endAt: row.end_at,
    capacity: Number(row.capacity),
    remainingSlots: Number(row.remaining_slots),
    pricePerPerson: Number(row.price_per_person),
    status: row.status,
    operationalNote: row.operational_note ?? undefined,
    operationalNoteUpdatedAt: row.operational_note_updated_at ?? undefined,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export function mapSessionRecordToRow(
  record: Partial<EoSessionRecord>,
): Partial<SessionRow> {
  const row: Partial<SessionRow> = {};

  if (record.sessionId !== undefined) row.id = record.sessionId;
  if (record.packageId !== undefined) row.package_id = record.packageId;
  if (record.eoId !== undefined) row.eo_id = record.eoId;
  if (record.startAt !== undefined) row.start_at = record.startAt;
  if (record.endAt !== undefined) row.end_at = record.endAt;
  if (record.capacity !== undefined) row.capacity = record.capacity;
  if (record.remainingSlots !== undefined)
    row.remaining_slots = record.remainingSlots;
  if (record.pricePerPerson !== undefined)
    row.price_per_person = record.pricePerPerson;
  if (record.status !== undefined) row.status = record.status;
  if (record.operationalNote !== undefined)
    row.operational_note = record.operationalNote ?? null;
  if (record.operationalNoteUpdatedAt !== undefined)
    row.operational_note_updated_at = record.operationalNoteUpdatedAt ?? null;
  if (record.createdAt !== undefined) row.created_at = record.createdAt;

  return row;
}
