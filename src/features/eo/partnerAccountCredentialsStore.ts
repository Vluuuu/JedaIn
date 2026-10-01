export interface PartnerAccountCredentials {
  partnerId: string;
  email: string;
  password: string;
}

// Issued passwords exist only in memory; application persistence never stores them.
let current: PartnerAccountCredentials | undefined;
const listeners = new Set<() => void>();
export const partnerAccountCredentialsStore = {
  get: () => current,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  set(credentials?: PartnerAccountCredentials) {
    current = credentials;
    listeners.forEach((listener) => listener());
  },
};

export function generateInternalPassword(): string {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  return (
    "Jd!8" +
    Array.from(
      crypto.getRandomValues(new Uint8Array(24)),
      (value) => alphabet[value & 63],
    ).join("")
  );
}

export function platformAccountEmail(
  role: "EO" | "DESTINATION",
  id: string,
): string {
  return `${role === "EO" ? "to" : "destinasi"}-${id
    .replace(/[^a-z0-9-]/gi, "")
    .slice(-36)
    .toLowerCase()}@jedain.biz.id`;
}
