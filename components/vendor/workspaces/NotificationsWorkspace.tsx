'use client';

import { useEffect } from 'react';

import { VendorModuleHeader, VendorStatusPill } from '@/components/vendor/ui/VendorModuleHeader';
import { useVendorFeedback } from '@/components/vendor/ui/useVendorFeedback';
import { vendorClasses } from '@/lib/vendor/theme';
import { VENDOR_ID } from '@/lib/vendor/v0/portal-service';
import { useVendorAppStore } from '@/lib/vendor/store/vendor-app-store';
import { useEcosystemMessaging } from '@/lib/ecosystem/use-ecosystem-messaging';

function NotificationsWorkspace() {
  const { showSuccess } = useVendorFeedback();
  const setNotificationUnreadCount = useVendorAppStore((s) => s.setNotificationUnreadCount);
  const setRealtimeConnected = useVendorAppStore((s) => s.setRealtimeConnected);
  const { notifications, unreadCount, loading, connected, markRead, markAllRead } = useEcosystemMessaging({
    app: 'vendor',
    recipientId: VENDOR_ID,
    toastOnInsert: true,
  });

  useEffect(() => {
    setNotificationUnreadCount(unreadCount);
  }, [unreadCount, setNotificationUnreadCount]);

  useEffect(() => {
    setRealtimeConnected(connected);
  }, [connected, setRealtimeConnected]);

  return (
    <div className="space-y-6">
      <VendorModuleHeader
        title="Ecosystem Notifications"
        description="Live procurement alerts, PO notices, and hospital broadcasts via Supabase Realtime."
        actions={
          <button type="button" onClick={() => void markAllRead()} className={vendorClasses.btnGhost}>
            Mark all as read
          </button>
        }
      />

      {loading ? (
        <p className="text-sm text-vendor-muted">Syncing notifications from Regal Hospital…</p>
      ) : notifications.length === 0 ? (
        <p className="text-sm text-vendor-muted">
          No alerts yet. Hospital procurement broadcasts will appear here instantly.
        </p>
      ) : (
        <ul className="space-y-2">
          {notifications.map((item) => (
            <li key={item.id} className={`${vendorClasses.card} px-4 py-3`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-vendor-charcoal">{item.title}</p>
                  <p className="text-xs text-vendor-muted">{item.message}</p>
                  <p className="mt-1 text-[10px] text-vendor-muted">
                    {item.created_at ? new Date(item.created_at).toLocaleString('en-IN') : 'Just now'}
                  </p>
                </div>
                {!item.is_read ? <VendorStatusPill label="Unread" tone="warning" /> : null}
              </div>
              {!item.is_read ? (
                <button
                  type="button"
                  onClick={() => void markRead(item.id)}
                  className="mt-2 text-xs font-bold text-vendor-secondary hover:underline"
                >
                  Mark read →
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default NotificationsWorkspace;
export { NotificationsWorkspace };
