import { useState, type ReactNode } from "react";
import { Link, NavLink, Outlet } from "react-router";
import { Button } from "../ui";
import { CloseIcon, MenuIcon } from "./icons";
import "./shells.css";

export interface TravelerPublicShellProps {
  children?: ReactNode;
}

export function TravelerPublicShell({ children }: TravelerPublicShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="traveler-public-shell">
      <header className="public-header">
        <Link className="brand-mark" to="/" aria-label="JedaIn, halaman utama">
          JedaIn<span aria-hidden="true">.</span>
        </Link>
        <Button
          variant="secondary"
          size="sm"
          className="shell-icon-button public-header__menu"
          aria-label={menuOpen ? "Tutup menu utama" : "Buka menu utama"}
          aria-expanded={menuOpen}
          aria-controls="public-navigation"
          onClick={() => setMenuOpen((current) => !current)}
        >
          {menuOpen ? <CloseIcon /> : <MenuIcon />}
        </Button>
        <nav
          id="public-navigation"
          className="public-navigation"
          data-open={menuOpen || undefined}
          aria-label="Navigasi publik"
        >
          <NavLink to="/explore">Explore</NavLink>
          <a href="/#tentang">Tentang JedaIn</a>
          <NavLink to="/partner">Untuk Partner</NavLink>
          <Link
            className="public-navigation__auth"
            to="/login"
            onClick={() => setMenuOpen(false)}
          >
            Masuk / Daftar
          </Link>
        </nav>
      </header>
      <main className="public-content">{children ?? <Outlet />}</main>
    </div>
  );
}
