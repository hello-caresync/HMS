'use client';

import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { EntityEmptyState } from '@/components/nexora-hospital/ui/EntityEmptyState';
import { ui } from '@/components/nexora-hospital/ui/primitives';
import { useHospitalDoctors } from '@/hooks/useHospitalDoctors';
import { checkInOpdPatient, updateOpdStatus } from '@/lib/nexora-hospital/services/hospital-db';
import { useHospitalStore } from '@/lib/nexora-hospital/store';
import type { OpdVisit } from '@/lib/nexora-hospital/types';

const COLUMNS: { status: OpdVisit['status']; label: string }[] = [
  { status: 'Waiting', label: 'Waiting' },
  { status: 'Checked-In', label: 'Checked-In' },
  { status: 'In Consultation', label: 'In Consultation' },
  { status: 'Completed', label: 'Completed' },
];

function QueueCard({
  visit,
  status,
  onAdvance,
}: {
  visit: OpdVisit;
  status: OpdVisit['status'];
  onAdvance: (visit: OpdVisit, next: OpdVisit['status'], msg: string) => void;
}) {
  return (
    <li className="rounded-xl border border-[#B2EBF2] bg-white p-4 shadow-sm">
      <p className="text-base font-bold text-[#0A2E36]">{visit.patientName}</p>
      <p className="mt-1 text-sm text-[#005F6B]">
        {visit.doctorName} · {visit.department}
      </p>
      <p className="mt-1 text-sm font-semibold text-[#007B8A]">Token {visit.queueNumber}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {status === 'Waiting' && (
          <button
            type="button"
            className={ui.btnAction}
            onClick={() => void checkInOpdPatient(visit.id).then(() => toast.success(`${visit.patientName} checked in`))}
          >
            Check-In
          </button>
        )}
        {status === 'Checked-In' && (
          <button
            type="button"
            className={ui.btnAction}
            onClick={() => void onAdvance(visit, 'In Consultation', 'Sent to doctor')}
          >
            Send to Doctor
          </button>
        )}
        {status === 'In Consultation' && (
          <button
            type="button"
            className={ui.btnAction}
            onClick={() => void onAdvance(visit, 'Completed', 'Consultation complete')}
          >
            Mark Complete
          </button>
        )}
      </div>
    </li>
  );
}

export function OpdQueueWorkspace() {
  const opdVisits = useHospitalStore((s) => s.opdVisits);
  const { doctors, loading: doctorsLoading } = useHospitalDoctors();
  const [doctorFilter, setDoctorFilter] = useState('all');

  const filteredVisits = useMemo(() => {
    if (doctorFilter === 'all') return opdVisits;
    const doc = doctors.find((d) => d.id === doctorFilter);
    if (!doc) return opdVisits;
    return opdVisits.filter(
      (v) => v.doctorId === doc.id || v.doctorName.includes(doc.fullName.replace(/^Dr\.\s*/i, '')),
    );
  }, [opdVisits, doctorFilter, doctors]);

  const allEmpty = filteredVisits.length === 0;

  const byStatus = (status: OpdVisit['status']) => filteredVisits.filter((v) => v.status === status);

  const advance = async (visit: OpdVisit, next: OpdVisit['status'], msg: string) => {
    await updateOpdStatus(visit.id, next);
    toast.success(msg);
  };

  return (
    <div className={ui.pageInner}>
      <div className="mb-6 space-y-3">
        <h1 className={ui.pageTitle}>OPD Queue</h1>
        <p className={ui.pageSubtitle}>Live kanban · synced with Doctor & Patient apps</p>
        {doctorsLoading ? (
          <p className="flex items-center gap-2 text-base font-medium text-slate-800">
            <Loader2 className="h-4 w-4 animate-spin text-teal-700" />
            Loading consultant roster…
          </p>
        ) : (
          <label className="block max-w-md space-y-1.5">
            <span className="text-base font-medium text-slate-800">Filter by Doctor</span>
            <select
              className={ui.select}
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
            >
              <option value="all">All doctors ({doctors.length})</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.fullName} — {d.department}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {allEmpty ? (
        <EntityEmptyState preset="opdQueue" />
      ) : (
      <div className="grid gap-4 xl:grid-cols-4">
        {COLUMNS.map(({ status, label }) => (
          <section key={status} className="rounded-2xl border border-[#B2EBF2] bg-[#FAFDFF] p-4">
            <h2 className="mb-4 text-lg font-bold text-[#0A2E36]">{label}</h2>
            <ul className="space-y-3">
              {byStatus(status).length === 0 ? (
                <li className="rounded-xl border border-dashed border-[#B2EBF2] bg-white p-4 text-sm text-[#005F6B]">
                  No patients
                </li>
              ) : (
                byStatus(status).map((v) => (
                  <QueueCard key={v.id} visit={v} status={status} onAdvance={advance} />
                ))
              )}
            </ul>
          </section>
        ))}
      </div>
      )}
    </div>
  );
}
