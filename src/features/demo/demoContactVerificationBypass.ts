// ponytail: prototype memory only; a real checkout API must enforce verification itself.
const bypasses = new Map<string, { skippedAt: number }>();
const key = (travelerId: string, sessionId: string) =>
  JSON.stringify([travelerId, sessionId]);

export const demoContactVerificationBypass = {
  register(travelerId: string, sessionId: string): void {
    if (!travelerId || !sessionId) return;
    bypasses.set(key(travelerId, sessionId), { skippedAt: Date.now() });
  },
  has(travelerId: string, sessionId: string): boolean {
    return bypasses.has(key(travelerId, sessionId));
  },
  clear(travelerId: string, sessionId: string): void {
    bypasses.delete(key(travelerId, sessionId));
  },
  reset(): void {
    bypasses.clear();
  },
};
