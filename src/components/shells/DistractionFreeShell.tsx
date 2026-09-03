import { Link, Outlet } from "react-router";
import JedaInLogo from "../../JedaIn_logo_vector.svg";
import "./shells.css";

export interface DistractionFreeShellProps {
  hideHeader?: boolean;
}

export function DistractionFreeShell({
  hideHeader = false,
}: DistractionFreeShellProps) {
  return (
    <div
      className={`distraction-free-shell ${hideHeader ? "distraction-free-shell--no-header" : ""}`.trim()}
      data-navigation="hidden"
    >
      {!hideHeader && (
        <header>
          <Link
            className="traveler-app-brand"
            to="/"
            aria-label="JedaIn, halaman utama"
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
        </header>
      )}
      <main
        className={
          hideHeader ? "distraction-free-shell__main--full" : undefined
        }
      >
        <Outlet />
      </main>
    </div>
  );
}
