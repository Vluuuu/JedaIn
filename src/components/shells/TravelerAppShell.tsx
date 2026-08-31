import type { ReactNode } from "react";
import { Link, NavLink, Outlet } from "react-router";
import { ExploreIcon, HomeIcon, ProfileIcon, TripsIcon } from "./icons";
import "./shells.css";

export interface TravelerAppShellProps {
  children?: ReactNode;
  activeNav?: TravelerNav;
  showBottomNav?: boolean;
  hasUnreadNotification?: boolean;
}

type TravelerNav = "home" | "explore" | "trips" | "profile";

const travelerNavigation = [
  { key: "home", to: "/home", label: "Home", icon: HomeIcon },
  { key: "explore", to: "/explore", label: "Explore", icon: ExploreIcon },
  { key: "trips", to: "/trips", label: "My Trips", icon: TripsIcon },
  { key: "profile", to: "/profile", label: "Profile", icon: ProfileIcon },
] as const;

export function TravelerAppShell({
  children,
  activeNav,
  showBottomNav = true,
  hasUnreadNotification = false,
}: TravelerAppShellProps) {
  return (
    <div
      className="traveler-app-shell"
      data-navigation={showBottomNav ? "visible" : "hidden"}
    >
      <header className="traveler-app-header">
        <Link className="brand-mark" to="/home" aria-label="JedaIn, Home">
          JedaIn<span aria-hidden="true">.</span>
        </Link>
        <span className="traveler-app-header__status">
          <span
            className="traveler-app-header__notification"
            data-unread={hasUnreadNotification || undefined}
            aria-hidden="true"
          />
          {hasUnreadNotification
            ? "Ada notifikasi baru"
            : "Tidak ada notifikasi baru"}
        </span>
      </header>
      <main className="traveler-app-content">{children ?? <Outlet />}</main>
      {showBottomNav && (
        <nav
          className="traveler-bottom-nav"
          aria-label="Navigasi traveler utama"
        >
          {travelerNavigation.map(({ key, to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => {
                const active = activeNav ? activeNav === key : isActive;
                return `traveler-bottom-nav__item${active ? " traveler-bottom-nav__item--active" : ""}`;
              }}
            >
              <Icon />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      )}
      <div className="toast-region" role="status" aria-live="polite" />
    </div>
  );
}
