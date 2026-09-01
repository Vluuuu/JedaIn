import { createElement, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { mockDestinationVerificationStore } from "../admin/mockDestinationVerificationStore";
import { mockDestinationStore } from "../eo/mockDestinationStore";
import { partnerSessionStore } from "../eo/partnerSessionStore";

export interface DestinationRouteGuardProps {
  children: ReactNode;
}

export function DestinationRouteGuard({
  children,
}: DestinationRouteGuardProps) {
  const location = useLocation();
  const partner = partnerSessionStore.get();

  // Operational destination routes /partner/destination/*
  if (!partner || partner.role !== "DESTINATION") {
    return createElement(Navigate, {
      to: "/partner/login",
      state: { from: location.pathname },
      replace: true,
    });
  }

  // Authoritative check from mockDestinationVerificationStore
  const app = mockDestinationVerificationStore.getByPartnerId(partner.id);
  if (!app || app.status !== "APPROVED") {
    return createElement(Navigate, {
      to: "/partner/application",
      replace: true,
    });
  }

  // Canonical destination check
  const canonical = mockDestinationStore.getById(app.destinationIdentityId);
  if (!canonical || canonical.status !== "ACTIVE") {
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
