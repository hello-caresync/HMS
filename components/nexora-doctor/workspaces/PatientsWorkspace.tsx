'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Play, ScrollText, Stethoscope } from 'lucide-react';
import { toast } from 'sonner';

import { ui, statusColors } from '@/components/nexora-doctor/ui/primitives';
import { FilterTabs, SearchBar, SectionHeader } from '@/components/nexora-doctor/ui/shared';
import { formatTime, usePatients, useTodayAppointments } from '@/lib/nexora-doctor/hooks';
import { useDoctorClinicalStore } from '@/lib/nexora-doctor/store';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'critical', label: 'Critical' },
  { id: 'follow-up', label: 'Follow-up' },
];

export function PatientsWorkspace() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const patients = usePatients(search, filter);
  const appointments = useTodayAppointments();
  const startConsultation = useDoctorClinicalStore((s) => s.startConsultation);

  const rows = useMemo(
    () =>
      patients.map((p) => {
        const appt = appointments.find((a) => a.patientId === p.id);
        return { patient: p, appt };
      }),
    [patients, appointments],
  );

  const handleStart = (patientId: string) => {
    const appt = appointments.find((a) => a.patientId === patientId);
    if (!appt) {
      toast.info('No active appointment for this patient today');
      return;
    }
    startConsultation(appt.id);
    toast.success('Consultation started');
    router.push('/doctor/consultation');
  };

  return (
    <div className={ui.page}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={ui.pageTitle}>Patients</h1>
          <p className={ui.pageSubtitle}>{patients.length} assigned patients</p>
        </div>
        <SearchBar value={search} onChange={setSearch} placeholder="Search name, UHID…" />
      </div>

      <div className="mb-6">
        <FilterTabs options={FILTERS} value={filter} onChange={setFilter} />
      </div>

      <section className={ui.card}>
        <SectionHeader title="Patient Directory" />
        <div className="overflow-x-auto">
          <table className={ui.table}>
            <thead>
              <tr>
                <th className={ui.th}>Patient</th>
                <th className={ui.th}>UHID</th>
                <th className={ui.th}>Age / Gender</th>
                <th className={ui.th}>Reason</th>
                <th className={ui.th}>Time</th>
                <th className={ui.th}>Status</th>
                <th className={ui.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ patient: p, appt }) => (
                <tr key={p.id} className={ui.trHover}>
                  <td className={ui.td}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7A9A8B] text-xs font-bold text-white">
                        {p.fullName
                          .split(' ')
                          .slice(0, 2)
                          .map((s) => s[0])
                          .join('')}
                      </div>
                      <Link href={`/doctor/patients/${p.id}`} className={ui.link}>
                        {p.fullName}
                      </Link>
                    </div>
                  </td>
                  <td className={ui.td}>{p.mrn}</td>
                  <td className={ui.td}>
                    {p.age}y · {p.gender}
                  </td>
                  <td className={ui.td}>{appt?.chiefComplaint ?? p.diagnosis ?? '—'}</td>
                  <td className={ui.td}>{appt ? formatTime(appt.time) : '—'}</td>
                  <td className={ui.td}>
                    {appt ? (
                      <span className={`${ui.badge} ${statusColors[appt.status]}`}>{appt.status}</span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className={ui.td}>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        title="Start consultation"
                        onClick={() => handleStart(p.id)}
                        className="rounded-lg p-1.5 text-[#7A9A8B] hover:bg-[#EEF5F1]"
                      >
                        <Play className="h-4 w-4" />
                      </button>
                      <Link
                        href={`/doctor/prescriptions?patient=${p.id}`}
                        className="rounded-lg p-1.5 text-[#2C3531]/70 hover:bg-[#F4F6F0]"
                        title="Prescriptions"
                      >
                        <ScrollText className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/doctor/patients/${p.id}`}
                        className="rounded-lg p-1.5 text-[#2C3531]/70 hover:bg-[#F4F6F0]"
                        title="View profile"
                      >
                        <Stethoscope className="h-4 w-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
