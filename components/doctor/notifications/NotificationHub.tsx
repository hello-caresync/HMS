'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

import { ClinicalPageSkeleton } from '@/components/doctor/ClinicalSkeleton';
import { ClinicalPageHeader } from '@/components/doctor/doctor-ui';
import {
  useAcknowledgeNotification,
  useNotificationsFeed,
  type NotificationDto,
} from '@/lib/doctor/hooks/useClinicalQueries';
import { clinicalClasses } from '@/lib/doctor/theme';

type Tab = 'ALL' | 'EMERGENCY' | 'CRITICAL_LAB' | 'OT' | 'PATIENT_MSG';

const TABS: { id: Tab; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'EMERGENCY', label: 'Emergency' },
  { id: 'CRITICAL_LAB', label: 'Critical labs' },
  { id: 'OT', label: 'OT changes' },
  { id: 'PATIENT_MSG', label: 'Patient messages' },
];

export default function NotificationHub() {
  const [tab, setTab] = useState<Tab>('ALL');
  const { data, isLoading, isError, error } = useNotificationsFeed();
  const acknowledge = useAcknowledgeNotification();

  const items = data?.notifications ?? [];
  const filtered = useMemo(
    () => items.filter((n) => tab === 'ALL' || n.category === tab),
    [items, tab],
  );

  if (isLoading) return <ClinicalPageSkeleton rows={4} />;
  if (isError) return <p className="text-sm text-[#EF4444]">{(error as Error).message}</p>;

  return (
    <div className={clinicalClasses.pageBg}>
      <ClinicalPageHeader title="Notifications" subtitle="Live feed · Supabase Realtime invalidates on INSERT" />

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              tab === t.id ? 'bg-brand-text text-white' : 'border border-brand-light bg-brand-surface'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <ul className="space-y-3">
        {filtered.map((n) => (
          <NotificationCard
            key={n.id}
            item={n}
            onAck={() =>
              acknowledge.mutate(n.id, {
                onSuccess: () => toast.success('Alert acknowledged'),
                onError: (e) => toast.error(e.message),
              })
            }
          />
        ))}
      </ul>
    </div>
  );
}

function NotificationCard({ item, onAck }: { item: NotificationDto; onAck: () => void }) {
  const border =
    item.category === 'EMERGENCY'
      ? 'border-l-[#EF4444]'
      : item.category === 'CRITICAL_LAB'
        ? 'border-l-[#F59E0B]'
        : 'border-l-brand';

  return (
    <li className={`${clinicalClasses.card} border-l-4 p-4 ${border} ${item.acknowledged ? 'opacity-60' : ''}`}>
      <p className="text-xs text-[#64748B]">{new Date(item.at).toLocaleString('en-IN')}</p>
      <p className="font-bold text-brand-text">{item.title}</p>
      <p className="text-sm text-[#64748B]">{item.body}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {!item.acknowledged && (
          <button type="button" className={clinicalClasses.btnPrimary} onClick={onAck}>
            Acknowledge alert
          </button>
        )}
        {item.patientId && (
          <Link href={`/doctor/emr?patient=${item.patientId}`} className={clinicalClasses.btnSecondary}>
            View patient EMR
          </Link>
        )}
        {item.category === 'CRITICAL_LAB' && (
          <Link href="/doctor/labs" className={clinicalClasses.btnSecondary}>
            Review critical lab
          </Link>
        )}
      </div>
    </li>
  );
}
