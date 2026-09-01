import { createElement, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { adminSessionStore } from "./adminSessionStore";

export interface AdminRouteGuardProps {
  children: ReactNode;
}

export function AdminRouteGuard({ children }: AdminRouteGuardProps) {
  const location = useLocation();
  const admin = adminSessionStore.get();

  if (!admin || admin.role !== "ADMIN") {
    return createElement(Navigate, {
      to: "/admin/login",
      state: { from: location.pathname },
      replace: true,
    });
  }

  return createElement("div", { className: "admin-guard-wrapper" }, children);
}
