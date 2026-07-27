'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Scissors } from 'lucide-react';

import { OsBadge, OsBtn, OsPage, OsWidget } from '@/components/doctor-os/ui/OsPrimitives';
import { useOsColors } from '@/lib/doctor-os/store';

const SURGERIES = [
  { id: '1', patient: 'R. Kumar', procedure: 'Laparoscopic Cholecystectomy', ot: 'OT-03', status: 'In progress', progress: 45 },
  { id: '2', patient: 'M. Shah', procedure: 'Total Knee Replacement', ot: 'OT-01', status: 'Pre-op', progress: 10 },
  { id: '3', patient: 'S. Ali', procedure: 'Appendectomy', ot: 'OT-02', status: 'Scheduled', progress: 0 },
];

export default function DoctorOsSurgeryManagement() {
  const c = useOsColors();

  return (
    <OsPage>
      <div className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#A39E75]">Surgical suite</p>
        <h1 className="text-[24px] font-bold text-[#2B2A22]">Surgery Management</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {SURGERIES.map((s) => (
          <motion.div
            key={s.id}
            className="rounded-2xl border border-[#E6E3C5] bg-white p-4 shadow-sm"
            whileHover={{ y: -2 }}
          >
            <div className="flex items-center gap-2">
              <Scissors className="h-4 w-4 text-[#A39E75]" />
              <OsBadge tone={s.progress > 0 ? 'info' : 'default'}>{s.status}</OsBadge>
            </div>
            <p className="mt-2 font-bold text-[#2B2A22]">{s.procedure}</p>
            <p className="text-[12px] text-[#5A584A]">{s.patient} · {s.ot}</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#E6E3C5]/50">
              <div className="h-full rounded-full bg-[#A39E75]" style={{ width: `${s.progress}%` }} />
            </div>
            <OsBtn size="sm" variant="secondary" className="mt-3" href="/doctor/clinical">Open OT notes</OsBtn>
          </motion.div>
        ))}
      </div>

      <OsWidget title="Schedule surgery" span={2}>
        <OsBtn href="/doctor/schedule">View OT calendar</OsBtn>
      </OsWidget>
    </OsPage>
  );
}
