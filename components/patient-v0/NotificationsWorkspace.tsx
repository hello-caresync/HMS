'use client';

import { Bell, CheckCheck } from 'lucide-react';

import { v0Ui } from '@/components/patient-v0/ui';
import { formatDateLabel, usePatientNotifications } from '@/lib/ecosystem/hooks';
import { useEcosystemStore } from '@/lib/ecosystem/store';
import { usePatientAuth } from '@/lib/patient/auth/PatientAuthProvider';

export function NotificationsWorkspace() {
  const { session } = usePatientAuth();
  const patientId = session?.patientId ?? null;
  const notifications = usePatientNotifications(patientId);
  const markRead = useEcosystemStore((s) => s.markNotificationRead);
  const markAllRead = useEcosystemStore((s) => s.markAllNotificationsRead);

  const unread = notifications.filter((n) => !n.read);

  return (
    <div className={v0Ui.page}>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={v0Ui.pageTitle}>Notifications</h1>
          <p className={v0Ui.pageSubtitle}>{unread.length} unread · updates from your care team</p>
        </div>
        {unread.length > 0 && patientId && (
          <button type="button" onClick={() => markAllRead(patientId)} className={v0Ui.btnSecondary}>
            <CheckCheck className="h-4 w-4" /> Mark all read
          </button>
        )}
      </header>

      {notifications.length === 0 ? (
        <div className={v0Ui.empty}>
          <Bell className="mx-auto h-8 w-8 text-patient-lavender" />
          <p className="mt-2 text-sm text-patient-lavender">No notifications yet</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`${v0Ui.card} ${!n.read ? 'border-patient-primary/30 bg-patient-card' : ''}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-black text-patient-plum">{n.title}</p>
                  <p className="mt-1 text-sm text-patient-charcoal">{n.body}</p>
                  <p className="mt-2 text-xs font-bold text-patient-lavender">
                    {formatDateLabel(n.createdAt)} · {n.category}
                  </p>
                </div>
                {!n.read && (
                  <button type="button" onClick={() => markRead(n.id)} className="text-xs font-bold text-patient-primary hover:underline">
                    Mark read
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
