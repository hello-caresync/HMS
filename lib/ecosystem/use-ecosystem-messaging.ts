'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { createClient } from '@/lib/supabase/client';

import {
  loadHospitalSentNotifications,
  loadNotificationsForApp,
  markAllNotificationsRead,
  markNotificationRead,
  normalizeNotificationRow,
  subscribeEcosystemMessaging,
  type EcosystemApp,
  type SystemNotificationRow,
} from './messaging-service';

type UseEcosystemMessagingOptions = {
  app: EcosystemApp;
  recipientId?: string;
  toastOnInsert?: boolean;
};

export function useEcosystemMessaging(options: UseEcosystemMessagingOptions) {
  const { app, recipientId, toastOnInsert = app !== 'hospital' } = options;
  const [notifications, setNotifications] = useState<SystemNotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    if (app === 'hospital') {
      setNotifications(await loadHospitalSentNotifications(supabase));
      return;
    }
    setNotifications(await loadNotificationsForApp(supabase, app, recipientId));
  }, [app, recipientId]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      await refresh();
      if (alive) setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [refresh]);

  useEffect(() => {
    const unsubscribe = subscribeEcosystemMessaging({
      app,
      recipientId,
      onConnectionChange: setConnected,
      onNotification: (row) => {
        setNotifications((current) => {
          if (current.some((item) => item.id === row.id)) return current;
          return [row, ...current];
        });
        if (toastOnInsert && app !== 'hospital') {
          toast.info(row.title, { description: row.message });
        }
      },
    });
    return unsubscribe;
  }, [app, recipientId, toastOnInsert]);

  const unreadCount = useMemo(
    () => notifications.filter((row) => !row.is_read).length,
    [notifications],
  );

  const markRead = useCallback(
    async (notificationId: string) => {
      setNotifications((current) =>
        current.map((row) => (row.id === notificationId ? { ...row, is_read: true } : row)),
      );
      await markNotificationRead(createClient(), notificationId);
    },
    [],
  );

  const markAllRead = useCallback(async () => {
    setNotifications((current) => current.map((row) => ({ ...row, is_read: true })));
    if (app === 'hospital') {
      const supabase = createClient();
      const ids = notifications.filter((row) => !row.is_read).map((row) => row.id);
      if (ids.length) await supabase.from('system_notifications').update({ is_read: true }).in('id', ids);
      return;
    }
    await markAllNotificationsRead(createClient(), app, recipientId);
  }, [app, notifications, recipientId]);

  return {
    notifications,
    unreadCount,
    loading,
    connected,
    refresh,
    markRead,
    markAllRead,
    normalizeNotificationRow,
  };
}
