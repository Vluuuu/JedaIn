import type { ReactNode } from "react";
import { Link, NavLink, Outlet } from "react-router";
import JedaInLogo from "../../JedaIn_logo_vector.svg";
import { ExploreIcon, HomeIcon, ProfileIcon, TripsIcon } from "./icons";
import "./shells.css";

export interface TravelerAppShellProps {
  children?: ReactNode;
  activeNav?: TravelerNav;
  showBottomNav?: boolean;
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
