export const partnerEoNavigation = [
  { to: "/partner/eo", label: "Overview" },
  { to: "/partner/eo/insights", label: "Insights" },
  { to: "/partner/eo/packages", label: "Packages" },
  { to: "/partner/eo/sessions", label: "Sessions" },
  { to: "/partner/eo/bookings", label: "Bookings" },
  { to: "/partner/eo/destinations", label: "Destinations" },
  { to: "/partner/eo/reviews", label: "Reviews" },
  { to: "/partner/eo/profile", label: "Profile" },
] as const;

export const partnerDestinationNavigation = [
  { to: "/partner/destination", label: "Overview" },
] as const;

// Backward-compatible alias for existing generic partner navigation imports
export const partnerNavigation = partnerEoNavigation;

export const adminNavigation = [
  { to: "/admin", label: "Overview" },
  { to: "/admin/eo-approvals", label: "EO Approvals" },
  { to: "/admin/destination-verifications", label: "Destination Verification" },
  { to: "/admin/package-approvals", label: "Package Approvals" },
  { to: "/admin/bookings", label: "Bookings / Payments" },
  { to: "/admin/complaints", label: "Complaints" },
  { to: "/admin/trust", label: "Trust & Status" },
  { to: "/admin/audit", label: "Audit / Activity" },
] as const;
