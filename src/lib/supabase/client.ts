import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./config";

let cachedClient: SupabaseClient | null = null;
let lastKey = "";
let lastUrl = "";

export function getSupabaseClient(): SupabaseClient | null {
  const { url, publishableKey, isConfigured } = getSupabaseConfig();

  if (!isConfigured) {
    return null;
  }

  if (cachedClient && lastKey === publishableKey && lastUrl === url) {
    return cachedClient;
  }

  cachedClient = createClient(url, publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });

  lastUrl = url;
  lastKey = publishableKey;

  return cachedClient;
}

export function requireSupabaseClient(): SupabaseClient {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error(
      "Supabase client tidak dapat diinisialisasi. Pastikan VITE_SUPABASE_URL dan VITE_SUPABASE_PUBLISHABLE_KEY terpasang.",
    );
  }
  return client;
}
