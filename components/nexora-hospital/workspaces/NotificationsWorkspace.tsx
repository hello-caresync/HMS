'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { EntityEmptyState } from '@/components/nexora-hospital/ui/EntityEmptyState';
import { Badge, ui } from '@/components/nexora-hospital/ui/primitives';
import { useHospitalStore } from '@/lib/nexora-hospital/store';

export function NotificationsWorkspace() {
  const notifications = useHospitalStore((s) => s.notifications);
  const markRead = useHospitalStore((s) => s.markNotificationRead);
  const markAll = useHospitalStore((s) => s.markAllNotificationsRead);
  const [severity, setSeverity] = useState('all');
  const [category, setCategory] = useState('all');

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (severity !== 'all' && n.severity !== severity) return false;
      if (category !== 'all' && n.category !== category) return false;
      return true;
    });
  }, [notifications, severity, category]);

  const categories = ['all', ...new Set(notifications.map((n) => n.category))];

  return (
    <div className={ui.pageInner}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={ui.pageTitle}>Notifications</h1>
          <p className={ui.pageSubtitle}>Live audit feed · appointments · OPD · billing · inventory · vendors</p>
        </div>
        <button type="button" className={ui.btnSecondary} onClick={() => { markAll(); toast.success('All marked read'); }}>
          Clear All
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {['all', 'info', 'warning', 'critical'].map((s) => (
          <button key={s} type="button" className={severity === s ? ui.btnPrimary : ui.btnSecondary} onClick={() => setSeverity(s)}>
            {s === 'all' ? 'All severity' : s}
          </button>
        ))}
        {categories.map((c) => (
          <button key={c} type="button" className={category === c ? ui.btnPrimary : ui.btnSecondary} onClick={() => setCategory(c)}>
            {c}
          </button>
        ))}
      </div>

      <ul className="space-y-3">
        {filtered.length === 0 ? (
          <li><EntityEmptyState preset="notifications" /></li>
        ) : (
        filtered.map((n) => (
          <li
            key={n.id}
            className={`${ui.card} flex flex-wrap items-start justify-between gap-3 ${n.readStatus ? 'opacity-70' : ''}`}
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-base font-bold text-slate-900">{n.title}</p>
                <Badge status={n.severity} />
                <span className="text-sm font-bold uppercase text-slate-500">{n.category}</span>
              </div>
              <p className="mt-1 text-base font-medium text-slate-800">{n.message}</p>
              <p className="mt-1 text-sm text-slate-600">{new Date(n.createdAt).toLocaleString()}</p>
            </div>
            {!n.readStatus && (
              <button type="button" className={ui.btnSecondary} onClick={() => { markRead(n.id); toast.success('Marked read'); }}>
                Mark Read
              </button>
            )}
          </li>
        ))
        )}
      </ul>
    </div>
  );
}
