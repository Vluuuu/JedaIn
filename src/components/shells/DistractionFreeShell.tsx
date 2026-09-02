import { Link, Outlet } from "react-router";
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
            className="brand-mark"
            to="/"
            aria-label="JedaIn, halaman utama"
          >
            JedaIn<span aria-hidden="true">.</span>
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
