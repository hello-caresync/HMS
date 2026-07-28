'use client';

import { useMemo, useState } from 'react';
import { Calendar, Play, RefreshCw, Video, X } from 'lucide-react';
import { toast } from 'sonner';

import { ui, statusColors } from '@/components/nexora-doctor/ui/primitives';
import { EmptyState, FilterTabs, SearchBar, SectionHeader } from '@/components/nexora-doctor/ui/shared';
import { formatTime, useTodayAppointments } from '@/lib/nexora-doctor/hooks';
import { useDoctorClinicalStore } from '@/lib/nexora-doctor/store';
import type { Appointment } from '@/lib/nexora-doctor/types';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'waiting', label: 'Waiting' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

export function ScheduleWorkspace() {
  const appointments = useTodayAppointments();
  const startConsultation = useDoctorClinicalStore((s) => s.startConsultation);
  const rescheduleAppointment = useDoctorClinicalStore((s) => s.rescheduleAppointment);
  const cancelAppointment = useDoctorClinicalStore((s) => s.cancelAppointment);
  const updateAppointmentStatus = useDoctorClinicalStore((s) => s.updateAppointmentStatus);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [newTime, setNewTime] = useState('14:00');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return appointments.filter((a) => {
      const matchSearch = !q || a.patientName.toLowerCase().includes(q) || a.mrn.toLowerCase().includes(q);
      const matchFilter = filter === 'all' || a.status === filter;
      return matchSearch && matchFilter;
    });
  }, [appointments, search, filter]);

  const waiting = appointments.filter((a) => a.status === 'waiting');
  const completed = appointments.filter((a) => a.status === 'completed');
  const cancelled = appointments.filter((a) => a.status === 'cancelled');

  const handleStart = (id: string) => {
    startConsultation(id);
    toast.success('Consultation started');
    window.location.href = '/doctor/consultations';
  };

  const handleReschedule = () => {
    if (!rescheduleId) return;
    const [h, m] = newTime.split(':').map(Number);
    const start = new Date();
    start.setHours(h, m, 0, 0);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + 30);
    rescheduleAppointment(rescheduleId, start.toISOString(), end.toISOString());
    toast.success('Appointment rescheduled');
    setRescheduleId(null);
  };

  return (
    <div className={ui.page}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={ui.pageTitle}>Schedule</h1>
          <p className={ui.pageSubtitle}>Manage today&apos;s appointments</p>
        </div>
        <SearchBar value={search} onChange={setSearch} placeholder="Search patient or MRN…" />
      </div>

      <div className="mb-6">
        <FilterTabs options={FILTERS} value={filter} onChange={setFilter} />
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className={ui.card}>
          <SectionHeader title="Waiting Patients" />
          <p className="text-3xl font-semibold text-amber-700">{waiting.length}</p>
        </div>
        <div className={ui.card}>
          <SectionHeader title="Completed" />
          <p className="text-3xl font-semibold text-emerald-700">{completed.length}</p>
        </div>
        <div className={ui.card}>
          <SectionHeader title="Cancelled" />
          <p className="text-3xl font-semibold text-red-600">{cancelled.length}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className={`${ui.card} lg:col-span-2`}>
          <SectionHeader title="Appointment List" />
          {filtered.length === 0 ? (
            <EmptyState title="No appointments" description="Try adjusting your search or filters." />
          ) : (
            <div className="overflow-x-auto">
              <table className={ui.table}>
                <thead>
                  <tr>
                    <th className={ui.th}>Time</th>
                    <th className={ui.th}>Patient</th>
                    <th className={ui.th}>Type</th>
                    <th className={ui.th}>Status</th>
                    <th className={ui.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => (
                    <AppointmentRow
                      key={a.id}
                      appointment={a}
                      onStart={() => handleStart(a.id)}
                      onReschedule={() => setRescheduleId(a.id)}
                      onCancel={() => { cancelAppointment(a.id); toast.success('Cancelled'); }}
                      onTele={() => { updateAppointmentStatus(a.id, 'in-progress'); toast.success('Teleconsultation started'); }}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className={ui.card}>
          <SectionHeader title="Today's Timeline" />
          <div className="space-y-3">
            {appointments.map((a) => (
              <div key={a.id} className="flex gap-3 border-l-2 border-teal-200 pl-3">
                <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{formatTime(a.time)}</p>
                  <p className="text-xs text-slate-600">{a.patientName}</p>
                  <span className={`${ui.badge} ${statusColors[a.status]} mt-1`}>{a.status}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {rescheduleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="font-semibold text-slate-900">Reschedule Appointment</h3>
            <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className={`${ui.input} mt-4`} />
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={handleReschedule} className={ui.btnPrimary}>Confirm</button>
              <button type="button" onClick={() => setRescheduleId(null)} className={ui.btnSecondary}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AppointmentRow({
  appointment: a,
  onStart,
  onReschedule,
  onCancel,
  onTele,
}: {
  appointment: Appointment;
  onStart: () => void;
  onReschedule: () => void;
  onCancel: () => void;
  onTele: () => void;
}) {
  return (
    <tr>
      <td className={ui.td}>{formatTime(a.time)}</td>
      <td className={ui.td}>
        <p className="font-medium">{a.patientName}</p>
        <p className="text-xs text-slate-500">{a.mrn}</p>
      </td>
      <td className={ui.td}>{a.type === 'teleconsult' ? 'Tele' : 'In-person'}</td>
      <td className={ui.td}><span className={`${ui.badge} ${statusColors[a.status]}`}>{a.status}</span></td>
      <td className={ui.td}>
        <div className="flex flex-wrap gap-1">
          {(a.status === 'waiting' || a.status === 'scheduled') && (
            <button type="button" onClick={onStart} className="rounded-lg p-1.5 text-teal-700 hover:bg-teal-50" title="Start"><Play className="h-4 w-4" /></button>
          )}
          {a.type === 'teleconsult' && (
            <button type="button" onClick={onTele} className="rounded-lg p-1.5 text-blue-700 hover:bg-blue-50" title="Teleconsult"><Video className="h-4 w-4" /></button>
          )}
          <button type="button" onClick={onReschedule} className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100" title="Reschedule"><RefreshCw className="h-4 w-4" /></button>
          {a.status !== 'cancelled' && a.status !== 'completed' && (
            <button type="button" onClick={onCancel} className="rounded-lg p-1.5 text-red-600 hover:bg-red-50" title="Cancel"><X className="h-4 w-4" /></button>
          )}
        </div>
      </td>
    </tr>
  );
}
