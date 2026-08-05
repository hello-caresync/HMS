'use client';

import { useRouter } from 'next/navigation';
import { Bell, Calendar, UserCheck, XCircle } from 'lucide-react';

import { ui } from '@/components/nexora-doctor/ui/primitives';
import { EmptyState, SectionHeader } from '@/components/nexora-doctor/ui/shared';
import { formatRelative } from '@/lib/nexora-doctor/hooks';
import { useDoctorClinicalStore } from '@/lib/nexora-doctor/store';
import type { Notification } from '@/lib/nexora-doctor/types';

const categoryIcon: Record<string, typeof Bell> = {
  appointment: Calendar,
  patient: UserCheck,
  emergency: XCircle,
  system: Bell,
};

export function NotificationsWorkspace() {
  const router = useRouter();
  const notifications = useDoctorClinicalStore((s) => s.notifications);
  const markRead = useDoctorClinicalStore((s) => s.markNotificationRead);
  const markAllRead = useDoctorClinicalStore((s) => s.markAllNotificationsRead);

  const unread = notifications.filter((n) => !n.read);

  const handleClick = (n: Notification) => {
    markRead(n.id);
    if (n.targetHref) router.push(n.targetHref);
    else if (n.appointmentId) router.push('/doctor/schedule');
    else if (n.patientId) router.push(`/doctor/patients/${n.patientId}`);
    else router.push('/doctor/schedule');
  };

  return (
    <div className={ui.page}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={ui.pageTitle}>Notifications</h1>
          <p className={ui.pageSubtitle}>
            {unread.length} unread · real-time patient & schedule alerts
          </p>
        </div>
        {unread.length > 0 && (
          <button type="button" onClick={markAllRead} className={ui.btnSecondary}>
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={<Bell className="h-10 w-10" />} title="No notifications" />
      ) : (
        <ul className="space-y-3">
          {notifications.map((n) => {
            const Icon = categoryIcon[n.category] ?? Bell;
            return (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => handleClick(n)}
                  className={`${ui.card} w-full text-left transition hover:border-[#7A9A8B]/40 ${
                    !n.read ? 'border-l-4 border-l-[#7A9A8B] bg-[#EEF5F1]/40' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#7A9A8B]" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[#2C3531]">{n.title}</p>
                      <p className="mt-1 text-sm text-[#2C3531]/70">{n.body}</p>
                      <p className="mt-2 text-xs text-[#2C3531]/50">{formatRelative(n.at)}</p>
                    </div>
                    {!n.read && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-[#7A9A8B]" aria-hidden />
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
