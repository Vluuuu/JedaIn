export type DataMode = "mock" | "supabase";

let dataModeOverride: DataMode | null = null;
let configOverride: { url?: string; publishableKey?: string } | null = null;

export const DEFAULT_SUPABASE_URL = "https://yykgpvgwougibnhhxttw.supabase.co";

export function setDataModeOverride(mode: DataMode | null): void {
  dataModeOverride = mode;
}

export function setSupabaseConfigOverride(
  override: { url?: string; publishableKey?: string } | null,
): void {
  configOverride = override;
}

export function getDataMode(): DataMode {
  if (dataModeOverride) {
    return dataModeOverride;
  }
  const rawMode = (
    import.meta.env.VITE_DATA_MODE as string | undefined
  )?.toLowerCase();
  if (rawMode === "supabase") {
    return "supabase";
  }
  return "mock";
}

export function getSupabaseConfig(): {
  url: string;
  publishableKey: string;
  isConfigured: boolean;
} {
  const url =
    configOverride?.url ||
    (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ||
    DEFAULT_SUPABASE_URL;

  const publishableKey =
    configOverride?.publishableKey ||
    (
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined
    )?.trim() ||
    (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ||
    "";

  const isConfigured = Boolean(url && publishableKey);

  return {
    url,
    publishableKey,
    isConfigured,
  };
}

export function isSupabaseMode(): boolean {
  return getDataMode() === "supabase" && getSupabaseConfig().isConfigured;
}

export function getSupabaseModeStatus(): {
  mode: DataMode;
  isConfigured: boolean;
  activeBackend: "supabase" | "mock";
  warning?: string;
} {
  const mode = getDataMode();
  const { isConfigured } = getSupabaseConfig();

  if (mode === "supabase" && !isConfigured) {
    return {
      mode: "supabase",
      isConfigured: false,
      activeBackend: "mock",
      warning:
        "VITE_DATA_MODE diset ke 'supabase' tetapi VITE_SUPABASE_PUBLISHABLE_KEY belum dikonfigurasi. Menggunakan mock store sebagai fallback.",
    };
  }

  return {
    mode,
    isConfigured,
    activeBackend: mode === "supabase" && isConfigured ? "supabase" : "mock",
  };
}
