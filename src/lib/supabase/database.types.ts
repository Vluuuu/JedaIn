import type { DepartureOption } from "../../features/departure/departureOptions";
import type {
  DestinationMediaItem,
  DestinationRecord,
  DestinationVerificationLevel,
  EoGuideStatus,
  EoItineraryItem,
  EoPackagePricing,
  EoPackageRecord,
  EoPackageStatus,
  EoSessionRecord,
  EoSessionStatus,
  EoValidationResult,
  PackageGuideSource,
} from "../../features/eo/types";
import type { PartnerApplicationRow } from "../../features/eo/partnerRegistrationTypes";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface PartnerProfileRow {
  id: string;
  auth_user_id: string | null;
  role: "EO" | "DESTINATION" | "ADMIN";
  display_name: string;
  business_name: string;
  email: string | null;
  guide_status: EoGuideStatus | null;
  organizer_review_ref: string | null;
  destination_identity_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DestinationRow {
  id: string;
  name: string;
  location_label: string;
  province: string;
  city: string;
  verification_level: DestinationVerificationLevel;
  guide_ready: boolean;
  base_cost_per_person: number;
  local_guide_fee_per_person: number | null;
  description: string;
  highlights: string[] | null;
  capacity_per_session: number;
  image_url: string | null;
  media_gallery: DestinationMediaItem[] | null;
  status: "ACTIVE" | "INACTIVE";
  available_activities: string[] | null;
  facilities: string[] | null;
  operational_notes: string[] | null;
  local_guide_summary: string | null;
  base_cost_includes: string[] | null;
  base_cost_excludes: string[] | null;
  created_at?: string;
  updated_at?: string;
}

export interface PackageRow {
  id: string;
  eo_id: string;
  eo_display_name: string;
  title: string;
  short_summary: string;
  value_proposition: string;
  destination_id: string;
  image_url: string | null;
  image_urls: string[] | null;
  insight_id: string | null;
  duration_label: string;
  suitable_group_types: string[] | null;
  highlights: string[] | null;
  itinerary: EoItineraryItem[] | null;
  included_items: string[] | null;
  excluded_items: string[] | null;
  safety_notes: string[] | null;
  departure_options?: DepartureOption[] | null;
  meeting_point_label: string | null;
  departure_time_label: string | null;
  outbound_transport: string | null;
  return_transport: string | null;
  access_notes: string[] | null;
  destination_base_cost: number;
  local_guide_fee: number;
  eo_margin: number;
  customer_price: number;
  guide_status: EoGuideStatus;
  guide_source: PackageGuideSource;
  status: EoPackageStatus;
  validation_result: EoValidationResult | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SessionRow {
  id: string;
  package_id: string;
  eo_id: string;
  start_at: string;
  end_at: string;
  capacity: number;
  remaining_slots: number;
  price_per_person: number;
  status: EoSessionStatus;
  operational_note: string | null;
  operational_note_updated_at: string | null;
  created_at?: string;
  updated_at?: string;
}

export type Database = {
  public: {
    Tables: {
      partner_applications: {
        Row: PartnerApplicationRow;
        Insert: Partial<PartnerApplicationRow>;
        Update: Partial<PartnerApplicationRow>;
        Relationships: [];
      };
      partner_profiles: {
        Row: PartnerProfileRow;
        Insert: Partial<PartnerProfileRow> & { id: string };
        Update: Partial<PartnerProfileRow>;
        Relationships: [];
      };
      destinations: {
        Row: DestinationRow;
        Insert: Partial<DestinationRow> & { id: string };
        Update: Partial<DestinationRow>;
        Relationships: [];
      };
      packages: {
        Row: PackageRow;
        Insert: Partial<PackageRow> & { id: string };
        Update: Partial<PackageRow>;
        Relationships: [];
      };
      sessions: {
        Row: SessionRow;
        Insert: Partial<SessionRow> & { id: string };
        Update: Partial<SessionRow>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      register_partner_application: {
        Args: { p_role: "EO" | "DESTINATION"; p_payload: Json };
        Returns: PartnerApplicationRow;
      };
      approve_partner_application_demo: {
        Args: Record<string, never>;
        Returns: PartnerApplicationRow;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type {
  DestinationRecord,
  EoPackageRecord,
  EoPackagePricing,
  EoSessionRecord,
};
