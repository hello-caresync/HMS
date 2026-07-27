'use client';

import { useDoctorShell } from '@/components/doctor/shell/DoctorShellContext';
import { useNotificationsFeed, useAcknowledgeNotification } from '@/lib/doctor/hooks/useClinicalQueries';
import { OsBadge, OsBtn, OsPage, OsWidget } from '@/components/doctor-os/ui/OsPrimitives';

export default function DoctorOsNotificationsPage() {
  const { data } = useNotificationsFeed();
  const ack = useAcknowledgeNotification();
  const items = data?.notifications ?? [];

  return (
    <OsPage>
      <div className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#A39E75]">Alerts</p>
        <h1 className="text-[24px] font-bold text-[#2B2A22]">Notifications</h1>
      </div>
      <div className="space-y-2">
        {items.map((n) => (
          <div
            key={n.id}
            className={`rounded-xl border border-[#E6E3C5] p-4 ${n.acknowledged ? 'bg-[#FAFAF5]' : 'bg-white shadow-sm'}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <OsBadge tone={n.category === 'EMERGENCY' ? 'critical' : 'info'}>{n.category}</OsBadge>
                <p className="mt-1 font-semibold text-[#2B2A22]">{n.title}</p>
                <p className="text-[12px] text-[#5A584A]">{n.body}</p>
              </div>
              {!n.acknowledged && (
                <OsBtn size="sm" variant="secondary" onClick={() => ack.mutate(n.id)}>Ack</OsBtn>
              )}
            </div>
          </div>
        ))}
      </div>
    </OsPage>
  );
}
