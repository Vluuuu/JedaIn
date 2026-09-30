import { useEffect } from "react";
import { getSupabaseClient } from "./client";
import { isSupabaseMode } from "./config";

export type RealtimeTable = "destinations" | "packages" | "sessions";

/**
 * Targeted Supabase Realtime subscriptions.
 * Subscribes to table postgres_changes and returns an unsubscribe function.
 */
export function subscribeToTableChanges(
  table: RealtimeTable,
  onChange: (payload: unknown) => void,
  filter?: string,
): () => void {
  if (!isSupabaseMode()) {
    return () => {};
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return () => {};
  }

  const channelName = `realtime_${table}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const channel = supabase.channel(channelName);

  channel
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table,
        filter,
      },
      (payload) => {
        onChange(payload);
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Convenient React hook for component-level Realtime subscriptions with
 * automatic cleanup on unmount.
 */
export function useRealtimeSubscription(
  table: RealtimeTable,
  onEvent: () => void,
  enabled: boolean = true,
): void {
  useEffect(() => {
    if (!enabled || !isSupabaseMode()) return;

    const unsubscribe = subscribeToTableChanges(table, () => {
      onEvent();
    });

    return () => {
      unsubscribe();
    };
  }, [table, onEvent, enabled]);
}
