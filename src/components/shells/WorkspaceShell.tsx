import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Link, NavLink, Outlet } from "react-router";
import { Button } from "../ui";
import { CloseIcon, MenuIcon, OverviewIcon } from "./icons";
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

export function WorkspaceShell({
  surface,
  title,
  navigation,
  children,
}: WorkspaceShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerId = useId();

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
          <span>{surface === "admin" ? "Admin" : "Partner"}</span>
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
              end={to === `/${surface}`}
              onClick={() => setDrawerOpen(false)}
            >
              <OverviewIcon />
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
          <div>
            <p>{surface === "admin" ? "Operations" : "Workspace"}</p>
            <h1>{title}</h1>
          </div>
          <div
            className="workspace-identity"
            aria-label="Identitas belum terhubung"
          >
            <span aria-hidden="true">J</span>
            <div>
              <strong>Identity placeholder</strong>
              <small>Belum terhubung</small>
            </div>
          </div>
        </header>
        <main className="workspace-content">{children ?? <Outlet />}</main>
      </div>
    </div>
  );
}
