'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { createClient } from '@/lib/supabase/client';
import {
  loadChannelMessages,
  markChannelThreadRead,
  subscribeChannelMessages,
  type ChannelMessageFilter,
  type ChannelMessageRow,
  type ChannelSenderRole,
  type ChannelType,
} from '@/lib/ecosystem/channel-messaging-service';

type UseChannelMessagingOptions = {
  filter: ChannelMessageFilter;
  viewerRole: ChannelSenderRole;
  autoMarkRead?: boolean;
};

export function useChannelMessaging({ filter, viewerRole, autoMarkRead = true }: UseChannelMessagingOptions) {
  const [messages, setMessages] = useState<ChannelMessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const filterKey = JSON.stringify(filter);
  const markedRef = useRef(false);

  const reload = useCallback(async () => {
    try {
      const supabase = createClient();
      const result = await loadChannelMessages(supabase, filter);
      setMessages(result.rows);
      setError(result.error ?? null);

      if (autoMarkRead && result.rows.some((row) => !row.is_read)) {
        await markChannelThreadRead(supabase, filter, viewerRole);
      }
    } catch (err) {
      setMessages([]);
      setError(err instanceof Error ? err.message : 'Could not load messages.');
    }
  }, [filterKey, viewerRole, autoMarkRead]);

  useEffect(() => {
    markedRef.current = false;
    setLoading(true);
    void (async () => {
      await reload();
      setLoading(false);
    })();
  }, [reload]);

  useEffect(() => {
    return subscribeChannelMessages({
      channel_type: filter.channel_type as ChannelType,
      onInsert: (row) => {
        setMessages((current) => {
          if (current.some((item) => item.id === row.id)) return current;
          return [...current, row];
        });
        if (autoMarkRead) {
          void markChannelThreadRead(createClient(), filter, viewerRole);
        }
      },
      onUpdate: (row) => {
        setMessages((current) => current.map((item) => (item.id === row.id ? row : item)));
      },
      onConnectionChange: setConnected,
    });
  }, [filter.channel_type, filterKey, viewerRole, autoMarkRead]);

  const upsertMessage = useCallback((row: ChannelMessageRow) => {
    setMessages((current) => {
      const exists = current.some((item) => item.id === row.id);
      if (exists) return current.map((item) => (item.id === row.id ? row : item));
      return [...current, row];
    });
  }, []);

  return {
    messages,
    loading,
    error,
    connected,
    reload,
    upsertMessage,
    setError,
  };
}
