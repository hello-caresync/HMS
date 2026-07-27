'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

import { OsBadge, OsBtn, OsEmpty, OsPage, OsWidget } from '@/components/doctor-os/ui/OsPrimitives';
import { useEmergencyCases } from '@/lib/doctor/hooks/useClinicalQueries';
import { useOsColors } from '@/lib/doctor-os/store';
import { Siren } from 'lucide-react';

export default function DoctorOsEmergencyCases() {
  const c = useOsColors();
  const { data, isLoading } = useEmergencyCases();
  const cases = data?.cases ?? [];

  return (
    <OsPage>
      <div className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#A39E75]">Triage feed</p>
        <h1 className="text-[24px] font-bold text-[#2B2A22]">Emergency Cases</h1>
        <p className="mt-1 text-[13px] text-[#5A584A]">ESI-ranked activations · real-time ER sync</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-[#E6E3C5]/40" />)}</div>
      ) : cases.length === 0 ? (
        <OsEmpty title="No active emergencies" description="ER cases appear here when triaged." icon={Siren} />
      ) : (
        <div className="space-y-3">
          {cases.map((e) => (
            <motion.div
              key={e.id}
              layout
              className="rounded-2xl border border-[#EF4444]/30 bg-red-50/50 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <OsBadge tone="critical">ESI {e.esiLevel}</OsBadge>
                  <p className="mt-2 text-[18px] font-bold text-[#2B2A22]">{e.patientName}</p>
                  <p className="text-[13px] text-[#5A584A]">{e.presentation}</p>
                  <p className="text-[12px] text-[#5A584A]">Bay {e.bay}</p>
                </div>
                <div className="flex gap-2">
                  <OsBtn href={`/doctor/clinical?patient=${e.patientId ?? ''}`}>Assume care</OsBtn>
                  <OsBtn variant="secondary" onClick={() => toast.success('Nursing & trauma team notified')}>Alert team</OsBtn>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <OsWidget title="Quick links" span={2}>
        <div className="flex gap-2">
          <OsBtn href="/doctor/opd-consultation">OPD overflow</OsBtn>
          <OsBtn href="/doctor/ipd-management" variant="secondary">Request ICU bed</OsBtn>
        </div>
      </OsWidget>
    </OsPage>
  );
}
