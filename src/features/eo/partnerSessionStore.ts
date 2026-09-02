import type { PartnerUser } from "./types";

export const DEMO_EO_USER: PartnerUser = {
  id: "eo_jeda_alam",
  email: "partner@jedaalam.id",
  name: "Budi Santoso",
  role: "EO",
  businessName: "Jeda Alam Nusantara",
  guideStatus: "CERTIFIED_GUIDE",
  organizerReviewRef: "org_lereng_batu",
};

export const DEMO_CONCEPT_EO_USER: PartnerUser = {
  id: "eo_kreatif_desa",
  email: "partner@kreatifdesa.id",
  name: "Dewi Lestari",
  role: "EO",
  businessName: "Ruang Kreatif Wellness",
  guideStatus: "CONCEPT_ONLY",
  organizerReviewRef: "org_kreatif_desa",
};

export const DEMO_DESTINATION_USER: PartnerUser = {
  id: "dest_partner_lereng_hijau",
  email: "destinasi@lerenghijau.id",
  name: "Hadi Purnomo",
  role: "DESTINATION",
  businessName: "Pengelola Lereng Hijau Batu",
  destinationIdentityId: "dest_lereng_hijau",
};

let currentPartner: PartnerUser | null = DEMO_EO_USER;

export const partnerSessionStore = {
  get(): PartnerUser | null {
    return currentPartner ? { ...currentPartner } : null;
  },

  setPartner(user: PartnerUser | null): void {
    currentPartner = user ? { ...user } : null;
  },

  loginAsDemoApproved(
    guideStatus: "CERTIFIED_GUIDE" | "CONCEPT_ONLY" = "CERTIFIED_GUIDE",
  ): PartnerUser {
    currentPartner =
      guideStatus === "CERTIFIED_GUIDE"
        ? { ...DEMO_EO_USER }
        : { ...DEMO_CONCEPT_EO_USER };
    return { ...currentPartner };
  },

  loginAsDemoDestination(): PartnerUser {
    currentPartner = { ...DEMO_DESTINATION_USER };
    return { ...currentPartner };
  },

  logout(): void {
    currentPartner = null;
  },

  reset(): void {
    currentPartner = { ...DEMO_EO_USER };
  },
};
