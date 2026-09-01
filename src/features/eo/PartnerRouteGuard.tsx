import { createElement, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { mockApplicationStore } from "./mockApplicationStore";
import { partnerSessionStore } from "./partnerSessionStore";

export interface PartnerRouteGuardProps {
  children: ReactNode;
}

export function PartnerRouteGuard({ children }: PartnerRouteGuardProps) {
  const location = useLocation();
  const partner = partnerSessionStore.get();

  // If visiting operational EO workspace (/partner/eo/*), partner must be logged in and authoritative status must be APPROVED
  const isOperationalEo = location.pathname.startsWith("/partner/eo");

  if (isOperationalEo) {
    if (!partner) {
      return createElement(Navigate, {
        to: "/partner/login",
        state: { from: location.pathname },
        replace: true,
      });
    }

    const app = mockApplicationStore.getBySellerId(partner.id);
    const authoritativeStatus = app ? app.status : undefined;

    if (authoritativeStatus !== "APPROVED") {
      return createElement(Navigate, {
        to: "/partner/application",
        replace: true,
      });
    }
  }

  return createElement("div", { className: "partner-guard-wrapper" }, children);
}
