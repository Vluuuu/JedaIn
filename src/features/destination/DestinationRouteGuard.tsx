import { createElement, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { mockDestinationVerificationStore } from "../admin/mockDestinationVerificationStore";
import { partnerSessionStore } from "../eo/partnerSessionStore";
import { resolveAuthenticatedDestinationContext } from "./destinationContext";

export interface DestinationRouteGuardProps {
  children: ReactNode;
}

export function DestinationRouteGuard({
  children,
}: DestinationRouteGuardProps) {
  const location = useLocation();
  const partner = partnerSessionStore.get();

  // No session or not a DESTINATION partner -> /partner/login
  if (!partner || partner.role !== "DESTINATION") {
    return createElement(Navigate, {
      to: "/partner/login",
      state: { from: location.pathname },
      replace: true,
    });
  }

  const app = mockDestinationVerificationStore.getByPartnerId(partner.id);

  // Authenticated DESTINATION but application is PENDING_REVIEW or REJECTED -> /partner/application
  if (!app || app.status === "PENDING_REVIEW" || app.status === "REJECTED") {
    return createElement(Navigate, {
      to: "/partner/application",
      replace: true,
    });
  }

  const context = resolveAuthenticatedDestinationContext();
  if (!context) {
    // Approved but canonical missing/inactive -> /partner/application
    return createElement(Navigate, {
      to: "/partner/application",
      replace: true,
    });
  }

  return createElement(
    "div",
    { className: "destination-guard-wrapper" },
    children,
  );
}
