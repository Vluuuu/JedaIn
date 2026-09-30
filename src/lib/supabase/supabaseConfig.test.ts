import { afterEach, describe, expect, it } from "vitest";
import {
  DEFAULT_SUPABASE_URL,
  getDataMode,
  getSupabaseConfig,
  getSupabaseModeStatus,
  isSupabaseMode,
  setDataModeOverride,
} from "./config";

describe("Supabase Config & Mode Selector", () => {
  afterEach(() => {
    setDataModeOverride(null);
  });

  it("defaults to 'mock' mode when no override or env set", () => {
    setDataModeOverride(null);
    expect(getDataMode()).toBe("mock");
  });

  it("allows setting programmatic mode override to 'supabase' and resetting back to 'mock'", () => {
    setDataModeOverride("supabase");
    expect(getDataMode()).toBe("supabase");

    setDataModeOverride("mock");
    expect(getDataMode()).toBe("mock");

    setDataModeOverride(null);
    expect(getDataMode()).toBe("mock");
  });

  it("resolves default Supabase URL if VITE_SUPABASE_URL is not set", () => {
    const config = getSupabaseConfig();
    expect(config.url).toBe(DEFAULT_SUPABASE_URL);
  });

  it("reports activeBackend as 'mock' when publishable key is missing even if mode is 'supabase'", () => {
    setDataModeOverride("supabase");
    const status = getSupabaseModeStatus();

    // If key is not configured, fallback warning is shown and activeBackend is mock
    if (!status.isConfigured) {
      expect(status.activeBackend).toBe("mock");
      expect(status.warning).toBeDefined();
      expect(isSupabaseMode()).toBe(false);
    }
  });
});
