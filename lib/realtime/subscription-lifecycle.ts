import type {
  RealtimeChannel,
  RealtimePostgresChangesFilter,
  RealtimePostgresChangesPayload,
  SupabaseClient,
} from '@supabase/supabase-js';

type PostgresChangeHandler = (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void;

type SubscribePostgresChannelOptions = {
  supabase: SupabaseClient;
  channelName: string;
  table: string;
  event?: RealtimePostgresChangesFilter<'*'>['event'];
  schema?: string;
  filter?: string;
  onPayload: PostgresChangeHandler;
};

/**
 * Opens a postgres_changes channel and returns an unmount cleanup.
 * Always call the returned function inside `useEffect` cleanup to prevent quota leaks.
 */
export function subscribePostgresChannel({
  supabase,
  channelName,
  table,
  event = '*',
  schema = 'public',
  filter,
  onPayload,
}: SubscribePostgresChannelOptions): () => void {
  const channel: RealtimeChannel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event,
        schema,
        table,
        ...(filter ? { filter } : {}),
      },
      onPayload,
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

/** Explicit teardown helper when a channel reference is stored outside a hook closure. */
export function teardownRealtimeChannel(
  supabase: SupabaseClient,
  channel: RealtimeChannel | null | undefined,
): void {
  if (!channel) return;
  void supabase.removeChannel(channel);
}
