import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Link, NavLink, Outlet } from "react-router";
import { partnerSessionStore } from "../../features/eo/partnerSessionStore";
import { Button } from "../ui";
import {
  BookingsIcon,
  CloseIcon,
  DestinationsIcon,
  InsightsIcon,
  MenuIcon,
  OverviewIcon,
  PackagesIcon,
  ProfileIcon,
  ReviewsIcon,
  SessionsIcon,
} from "./icons";
import "./shells.css";

interface WorkspaceNavigationItem {
  to: string;
  label: string;
}

export interface WorkspaceShellProps {
  surface: "partner" | "admin";
  title: string;
  navigation: readonly WorkspaceNavigationItem[];
  children?: ReactNode;
}

function getNavigationIcon(to: string) {
  if (to.endsWith("/insights")) return <InsightsIcon />;
  if (to.endsWith("/packages") || to.includes("/package-approvals"))
    return <PackagesIcon />;
  if (to.endsWith("/sessions") || to.endsWith("/schedule"))
    return <SessionsIcon />;
  if (to.endsWith("/bookings")) return <BookingsIcon />;
  if (
    to.endsWith("/destinations") ||
    to.includes("/destination-verifications") ||
    to.endsWith("/verification")
  )
    return <DestinationsIcon />;
  if (to.endsWith("/reviews")) return <ReviewsIcon />;
  if (to.endsWith("/profile") || to.endsWith("/profile-settings"))
    return <ProfileIcon />;
  return <OverviewIcon />;
}

function formatGuideStatus(guideStatus?: string | null): string {
  if (!guideStatus) return "";
  if (guideStatus === "CERTIFIED_GUIDE") return "Certified Guide";
  if (guideStatus === "CONCEPT_ONLY") return "Concept Only";
  return guideStatus.replace(/_/g, " ");
}

const WORKSPACE_ROOT_PATHS = new Set([
  "/admin",
  "/partner/eo",
  "/partner/destination",
]);

export function WorkspaceShell({
  surface,
  title,
  navigation,
  children,
}: WorkspaceShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerId = useId();
  const partner = surface === "partner" ? partnerSessionStore.get() : null;

  useEffect(() => {
    if (!drawerOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setDrawerOpen(false);
      menuButtonRef.current?.focus();
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [drawerOpen]);

  return (
    <div className={`workspace-shell workspace-shell--${surface}`}>
      <button
        type="button"
        className="workspace-shell__scrim"
        data-open={drawerOpen || undefined}
        aria-label="Tutup navigasi"
        onClick={() => {
          setDrawerOpen(false);
          menuButtonRef.current?.focus();
        }}
      />
      <aside
        id={drawerId}
        className="workspace-sidebar"
        data-open={drawerOpen || undefined}
        aria-label={`Navigasi ${surface}`}
      >
        <div className="workspace-sidebar__brand">
          <Link className="brand-mark" to={`/${surface}`}>
            JedaIn<span aria-hidden="true">.</span>
          </Link>
          <span>
            {surface === "admin"
              ? "Admin"
              : partner?.role === "DESTINATION"
                ? "Destination Partner"
                : "EO Partner"}
          </span>
          <Button
            variant="secondary"
            size="sm"
            className="shell-icon-button workspace-sidebar__close"
            aria-label="Tutup navigasi"
            onClick={() => {
              setDrawerOpen(false);
              menuButtonRef.current?.focus();
            }}
          >
            <CloseIcon />
          </Button>
        </div>
        <nav className="workspace-navigation" aria-label={`Menu ${surface}`}>
          {navigation.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={WORKSPACE_ROOT_PATHS.has(to)}
              onClick={() => setDrawerOpen(false)}
            >
              {getNavigationIcon(to)}
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="workspace-main">
        <header className="workspace-topbar">
          <Button
            ref={menuButtonRef}
            variant="secondary"
            size="sm"
            className="shell-icon-button workspace-topbar__menu"
            aria-label="Buka navigasi"
            aria-expanded={drawerOpen}
            aria-controls={drawerId}
            onClick={() => setDrawerOpen(true)}
          >
            <MenuIcon />
          </Button>
          <div className="workspace-topbar__context">
            <p>
              {surface === "admin"
                ? "Admin Trust & Governance"
                : partner?.role === "DESTINATION"
                  ? "Destination Partner"
                  : "EO Partner"}
            </p>
            <h1>{title}</h1>
          </div>
          <div
            className="workspace-identity"
            aria-label={
              partner
                ? `Identitas ${partner.businessName}`
                : "Identitas belum terhubung"
            }
          >
            <span aria-hidden="true">{partner?.businessName?.[0] ?? "J"}</span>
            <div>
              <strong>
                {partner?.businessName ??
                  (surface === "admin"
                    ? "JedaIn Admin"
                    : "Identity placeholder")}
              </strong>
              <small>
                {partner?.name
                  ? `${partner.name}${partner.guideStatus ? ` · ${formatGuideStatus(partner.guideStatus)}` : ""}`
                  : "Terhubung"}
              </small>
            </div>
          </div>
        </header>
        <main className="workspace-content">{children ?? <Outlet />}</main>
      </div>
    </div>
  );
}
