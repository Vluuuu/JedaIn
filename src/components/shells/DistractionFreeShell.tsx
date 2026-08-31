import { Link, Outlet } from "react-router";
import "./shells.css";

export function DistractionFreeShell() {
  return (
    <div className="distraction-free-shell" data-navigation="hidden">
      <header>
        <Link className="brand-mark" to="/" aria-label="JedaIn, halaman utama">
          JedaIn<span aria-hidden="true">.</span>
        </Link>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
