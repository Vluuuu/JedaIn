import { QUIZ_DURATION_OPTIONS } from "../quiz/config";
import type { PackageDetailViewModel } from "../packageDetail/types";
import type { DurationPreference } from "../quiz/types";
import type {
  DestinationRecord,
  EoGuideStatus,
  EoItineraryItem,
} from "./types";

interface TravelerDraftInput {
  destination?: DestinationRecord;
  organizerId: string;
  organizerName: string;
  guideStatus: EoGuideStatus;
  title: string;
  summary: string;
  durationLabel: string;
  imageUrl?: string;
  imageUrls: string[];
  itinerary: EoItineraryItem[];
  customerPrice: number;
  safetyNotes: string;
  includedItems: string;
  excludedItems: string;
  accessNotes: string;
  meetingPointLabel: string;
  departureTimeLabel: string;
  outboundTransport: string;
  returnTransport: string;
}

const lines = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

export function buildTravelerDraftPreview(
  input: TravelerDraftInput,
): PackageDetailViewModel {
  const durationType: DurationPreference =
    QUIZ_DURATION_OPTIONS.find((option) => option.label === input.durationLabel)
      ?.value ?? "FULL_DAY";
  const media = [
    ...new Set(
      [input.imageUrl, ...input.imageUrls].filter((url): url is string =>
        Boolean(url),
      ),
    ),
  ];

  return {
    state: "READY",
    hasOpenSession: false,
    package: {
      id: "traveler-draft-preview",
      title: input.title.trim() || "Draf Tanpa Judul",
      shortSummary: input.summary.trim() || "Belum ada ringkasan pengalaman.",
      destinationName: input.destination?.name ?? "Destinasi belum dipilih",
      locationLabel: input.destination?.locationLabel ?? "",
      visualAsset: media[0] ?? "",
      visualAssets: media,
      status: "DRAFT",
      verificationLevel: input.destination?.verificationLevel ?? "BASIC",
      pricePerPerson: input.destination ? input.customerPrice : 0,
      durationType,
      departureAreas: [],
      experienceIntents: [],
      activityTags: [],
      suitableGroupTypes: [],
      suitableGroupSizeBands: [],
      rating: null,
      ratingProvenance: null,
    },
    detail: {
      packageId: "traveler-draft-preview",
      valueProposition:
        input.summary.trim() || "Belum ada ringkasan pengalaman.",
      highlights: [],
      itinerary: input.itinerary.map((item) => ({ ...item })),
      includedItems: lines(input.includedItems),
      excludedItems: lines(input.excludedItems),
      safetyNotes: lines(input.safetyNotes),
      meetingPointLabel: input.meetingPointLabel.trim() || undefined,
      departureTimeLabel: input.departureTimeLabel.trim() || undefined,
      outboundTransport: input.outboundTransport.trim() || undefined,
      returnTransport: input.returnTransport.trim() || undefined,
      accessNotes: lines(input.accessNotes),
      cancellationPolicySummary: "",
      organizer: {
        id: input.organizerId,
        displayName: input.organizerName,
        guideStatus: input.guideStatus,
      },
      destinationDetail: {
        overviewDescription: input.destination?.description ?? "",
      },
      upcomingSessionPreviews: [],
    },
  };
}
