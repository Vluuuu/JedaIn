import type { ReactNode } from "react";
import { Link, NavLink, Outlet } from "react-router";
import JedaInLogo from "../../JedaIn_logo_vector.svg";
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
        <div className="traveler-app-header__inner">
          <Link
            className="traveler-app-brand"
            to="/home"
            aria-label="JedaIn, Home"
          >
            <img
              src={JedaInLogo}
              alt=""
              aria-hidden="true"
              className="traveler-app-logo"
              width="1407"
              height="768"
              loading="eager"
            />
          </Link>

          <button
            type="button"
            className="traveler-app-header__notification-btn"
            aria-label={
              hasUnreadNotification
                ? "Notifikasi, ada notifikasi baru"
                : "Notifikasi"
            }
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="traveler-app-header__bell-icon"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {hasUnreadNotification && (
              <span
                className="traveler-app-header__notification-dot"
                aria-hidden="true"
              />
            )}
          </button>
        </div>
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
