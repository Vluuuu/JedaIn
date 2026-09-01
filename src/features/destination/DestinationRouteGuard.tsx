import { createElement, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { resolveAuthenticatedDestinationContext } from "./destinationContext";

export interface DestinationRouteGuardProps {
  children: ReactNode;
}

export function DestinationRouteGuard({
  children,
}: DestinationRouteGuardProps) {
  const location = useLocation();
  const context = resolveAuthenticatedDestinationContext();

  if (!context) {
    // If not authenticated destination partner, route to login or application
    return createElement(Navigate, {
      to: "/partner/login",
      state: { from: location.pathname },
      replace: true,
    });
  }

  return createElement(
    "div",
    { className: "destination-guard-wrapper" },
    children,
  );
}
