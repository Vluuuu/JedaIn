import { createElement, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import type { OnboardingStatus } from "../auth/types";
import { getOnboardingGuardRedirect } from "./guard";
import { sessionStore } from "./sessionStore";

export interface OnboardingRouteGuardProps {
  children: ReactNode;
  /**
   * Optional override for test environments or isolated fixtures.
   * If omitted, reads from the shared sessionStore.
   */
  status?: OnboardingStatus;
}

export function OnboardingRouteGuard({
  children,
  status,
}: OnboardingRouteGuardProps) {
  const location = useLocation();
  const activeStatus = status ?? sessionStore.getStatus();
  const redirectPath = getOnboardingGuardRedirect({
    status: activeStatus,
    currentPath: location.pathname,
  });

  if (redirectPath && redirectPath !== location.pathname) {
    return createElement(Navigate, { to: redirectPath, replace: true });
  }

  return children;
}
