import { createElement, useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { adminSessionStore } from "./adminSessionStore";
import { isSupabaseMode, requireAuthenticatedUser } from "../../lib/supabase";

export interface AdminRouteGuardProps {
  children: ReactNode;
}

export function AdminRouteGuard({ children }: AdminRouteGuardProps) {
  const location = useLocation();
  if (isSupabaseMode())
    return createElement(AuthenticatedAdminGuard, { children });
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

function AuthenticatedAdminGuard({ children }: AdminRouteGuardProps) {
  const [status, setStatus] = useState("loading");
  const location = useLocation();
  useEffect(() => {
    let active = true;
    void requireAuthenticatedUser("ADMIN")
      .then((result) => {
        if (!active) return;
        const user = result.partnerUser;
        if (result.success && user?.role === "ADMIN") {
          adminSessionStore.setAdmin({
            adminId: user.id,
            name: user.name,
            email: user.email,
            role: "ADMIN",
          });
          setStatus("ready");
        } else {
          adminSessionStore.logout();
          setStatus("denied");
        }
      })
      .catch(() => {
        if (active) {
          adminSessionStore.logout();
          setStatus("denied");
        }
      });
    return () => {
      active = false;
    };
  }, []);
  if (status === "loading")
    return createElement("p", { role: "status" }, "Memeriksa akses Admin…");
  if (status === "denied")
    return createElement(Navigate, {
      to: "/admin/login",
      replace: true,
      state: { from: location.pathname },
    });
  return createElement("div", { className: "admin-guard-wrapper" }, children);
}
