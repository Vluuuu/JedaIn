/**
 * Shared clock for prototype time-sensitive operations.
 * In browser runtime: defaults to actual current time (new Date()).
 * In test environment: defaults to prototype baseline (2026-09-01T00:00:00+07:00) so deterministic fixture tests remain stable.
 * Can be overridden via setNow() or injected via adapter constructor options.
 */
type ClockFn = () => Date;

const DEFAULT_TEST_BASELINE = new Date("2026-09-01T00:00:00+07:00");

function getDefaultClock(): Date {
  if (typeof import.meta !== "undefined" && import.meta.env?.MODE === "test") {
    return DEFAULT_TEST_BASELINE;
  }
  return new Date();
}

let clockOverride: ClockFn | null = null;

export const prototypeClock = {
  now(): Date {
    return clockOverride ? clockOverride() : getDefaultClock();
  },
  nowMs(): number {
    return this.now().getTime();
  },
  setNow(fn: ClockFn): void {
    clockOverride = fn;
  },
  reset(): void {
    clockOverride = null;
  },
};
