import type { AdminUser } from "./types";

export const DEMO_ADMIN_USER: AdminUser = {
  adminId: "admin_trust_demo",
  name: "Trust Operations Lead",
  email: "admin@jedain.id",
  role: "ADMIN",
};

let currentAdmin: AdminUser | null = DEMO_ADMIN_USER;

export const adminSessionStore = {
  get(): AdminUser | null {
    return currentAdmin ? { ...currentAdmin } : null;
  },

  setAdmin(admin: AdminUser | null): void {
    currentAdmin = admin ? { ...admin } : null;
  },

  loginAsDemoAdmin(): AdminUser {
    currentAdmin = { ...DEMO_ADMIN_USER };
    return { ...currentAdmin };
  },

  logout(): void {
    currentAdmin = null;
  },

  reset(): void {
    currentAdmin = { ...DEMO_ADMIN_USER };
  },
};
