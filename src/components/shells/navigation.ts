export const partnerNavigation = [
  { to: "/partner/eo", label: "Overview" },
  { to: "/partner/eo/insights", label: "Insights" },
  { to: "/partner/eo/packages", label: "Packages" },
  { to: "/partner/eo/bookings", label: "Bookings" },
  { to: "/partner/eo/destinations", label: "Destinations" },
  { to: "/partner/eo/reviews", label: "Reviews" },
  { to: "/partner/eo/profile", label: "Profile" },
] as const;

export const adminNavigation = [
  { to: "/admin", label: "Overview" },
  { to: "/admin/eo-approvals", label: "EO approvals" },
  { to: "/admin/destination-verifications", label: "Destinations" },
  { to: "/admin/package-approvals", label: "Packages" },
  { to: "/admin/bookings", label: "Bookings" },
  { to: "/admin/complaints", label: "Complaints" },
  { to: "/admin/trust", label: "Trust" },
  { to: "/admin/audit", label: "Audit" },
] as const;
