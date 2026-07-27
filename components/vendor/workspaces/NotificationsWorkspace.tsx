'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { VendorModuleHeader, VendorStatusPill } from '@/components/vendor/ui/VendorModuleHeader';
import { useVendorFeedback } from '@/components/vendor/ui/useVendorFeedback';
import { vendorClasses } from '@/lib/vendor/theme';
import { MOCK_NOTIFICATIONS } from '@/lib/vendor/mock/data';
import type { VendorNotification } from '@/lib/vendor/types/domain';
import { VENDOR_PORTAL_ROUTES } from '@/lib/vendor/navigation';
import { useVendorAppStore } from '@/lib/vendor/store/vendor-app-store';

function resolveActionHref(n: VendorNotification): string | undefined {
  if (!n.actionable) return undefined;
  if (n.title.toLowerCase().includes('po') || n.body.includes('NX-PO')) {
    return VENDOR_PORTAL_ROUTES.purchaseOrders;
  }
  if (n.title.toLowerCase().includes('license')) {
    return VENDOR_PORTAL_ROUTES.organization;
  }
  return n.href;
}

function NotificationsWorkspace() {
  const router = useRouter();
  const { showSuccess } = useVendorFeedback();
  const setNotificationUnreadCount = useVendorAppStore((s) => s.setNotificationUnreadCount);
  const [items, setItems] = useState<VendorNotification[]>(() => MOCK_NOTIFICATIONS.map((n) => ({ ...n })));

  useEffect(() => {
    const unread = items.filter((n) => !n.read).length;
    setNotificationUnreadCount(unread);
  }, [items, setNotificationUnreadCount]);

  const markAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setNotificationUnreadCount(0);
    showSuccess('All notifications marked as read.');
  };

  const takeAction = (n: VendorNotification) => {
    const href = resolveActionHref(n);
    if (!href) return;
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    router.push(href);
  };

  return (
    <div className="space-y-6">
      <VendorModuleHeader
        title="Notifications"
        description="Actionable alerts for PO, delivery, payment, compliance, and SLA events."
        actions={
          <button type="button" onClick={markAllRead} className={vendorClasses.btnGhost}>
            Mark all as read
          </button>
        }
      />

      <ul className="space-y-2">
        {items.map((n) => (
          <li key={n.id} className={`${vendorClasses.card} px-4 py-3`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-vendor-charcoal">{n.title}</p>
                <p className="text-xs text-vendor-muted">{n.body}</p>
                <p className="mt-1 text-[10px] text-vendor-muted">{n.createdAt}</p>
              </div>
              {!n.read ? <VendorStatusPill label="Unread" tone="warning" /> : null}
            </div>
            {n.actionable ? (
              <button
                type="button"
                onClick={() => takeAction(n)}
                className="mt-2 text-xs font-bold text-vendor-secondary hover:underline"
              >
                Take action →
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default NotificationsWorkspace;
export { NotificationsWorkspace };
