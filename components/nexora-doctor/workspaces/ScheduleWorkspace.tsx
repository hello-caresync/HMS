'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, CheckCircle2, Loader2, Play, RefreshCw, X } from 'lucide-react';
import { toast } from 'sonner';

import { ui, statusColors } from '@/components/nexora-doctor/ui/primitives';
import { EmptyState, FilterTabs, SearchBar, SectionHeader } from '@/components/nexora-doctor/ui/shared';
import { doctorUi } from '@/lib/nexora-doctor/design-tokens';
import { formatTime, useTodayAppointments } from '@/lib/nexora-doctor/hooks';
import { useDoctorClinicalStore } from '@/lib/nexora-doctor/store';
import type { Appointment } from '@/lib/nexora-doctor/types';
import {
  acceptDoctorAppointment,
  startDoctorConsultation,
} from '@/lib/nexora-doctor/workflow-actions';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'scheduled', label: 'Requested' },
  { id: 'waiting', label: 'Confirmed' },
  { id: 'in-progress', label: 'In Consultation' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

export function ScheduleWorkspace() {
  const router = useRouter();
  const appointments = useTodayAppointments();
  const cancelAppointment = useDoctorClinicalStore((s) => s.cancelAppointment);
  const rescheduleAppointment = useDoctorClinicalStore((s) => s.rescheduleAppointment);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [newTime, setNewTime] = useState('14:00');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<'accept' | 'start' | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return appointments.filter((a) => {
      const matchSearch =
        !q || a.patientName.toLowerCase().includes(q) || a.mrn.toLowerCase().includes(q);
      const matchFilter = filter === 'all' || a.status === filter;
      return matchSearch && matchFilter;
    });
  }, [appointments, search, filter]);

  const handleAccept = async (id: string) => {
    setBusyId(id);
    setBusyAction('accept');
    const result = await acceptDoctorAppointment(id);
    setBusyId(null);
    setBusyAction(null);
    if (result.ok) toast.success('Confirmed · patient notified via Supabase');
    else toast.error(result.error);
  };

  const handleStart = async (id: string) => {
    setBusyId(id);
    setBusyAction('start');
    const result = await startDoctorConsultation(id);
    setBusyId(null);
    setBusyAction(null);
    if (result.ok) {
      toast.success('Consultation started · status synced');
      router.push('/doctor/consultation');
    } else {
      toast.error(result.error);
    }
  };

  const handleReschedule = () => {
    if (!rescheduleId) return;
    const [h, m] = newTime.split(':').map(Number);
    const start = new Date();
    start.setHours(h, m, 0, 0);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + 30);
    rescheduleAppointment(rescheduleId, start.toISOString(), end.toISOString());
    toast.success('Appointment rescheduled · patient notified');
    setRescheduleId(null);
  };

  return (
    <div className={ui.page}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={ui.pageTitle}>Schedule</h1>
          <p className={ui.pageSubtitle}>Manage today&apos;s appointments</p>
        </div>
        <SearchBar value={search} onChange={setSearch} placeholder="Search patient or UHID…" />
      </div>

      <div className="mb-6">
        <FilterTabs options={FILTERS} value={filter} onChange={setFilter} />
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
                    <th className={ui.th}>Reason</th>
                    <th className={ui.th}>Status</th>
                    <th className={ui.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => (
                    <AppointmentRow
                      key={a.id}
                      appointment={a}
                      busy={busyId === a.id ? busyAction : null}
                      onAccept={() => void handleAccept(a.id)}
                      onStart={() => void handleStart(a.id)}
                      onReschedule={() => setRescheduleId(a.id)}
                      onCancel={() => {
                        cancelAppointment(a.id);
                        toast.success('Cancelled · patient notified');
                      }}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className={ui.card}>
          <SectionHeader title="Today's Timeline" />
          <div className={`space-y-3 ${ui.scrollList}`}>
            {appointments.map((a) => (
              <div key={a.id} className={doctorUi.appointmentBlock}>
                <div className="flex gap-3">
                  <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-[#7A9A8B]" />
                  <div>
                    <p className="text-sm font-medium">{formatTime(a.time)}</p>
                    <p className="text-xs text-[#2C3531]/70">{a.patientName}</p>
                    <span className={`${ui.badge} ${statusColors[a.status]} mt-1`}>{a.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {rescheduleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2C3531]/30 p-4">
          <div className={`${ui.card} w-full max-w-sm shadow-lg`}>
            <h3 className="font-semibold text-[#2C3531]">Reschedule Appointment</h3>
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className={`${ui.input} mt-4`}
            />
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={handleReschedule} className={ui.btnPrimary}>
                Confirm
              </button>
              <button type="button" onClick={() => setRescheduleId(null)} className={ui.btnSecondary}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AppointmentRow({
  appointment: a,
  busy,
  onAccept,
  onStart,
  onReschedule,
  onCancel,
}: {
  appointment: Appointment;
  busy: 'accept' | 'start' | null;
  onAccept: () => void;
  onStart: () => void;
  onReschedule: () => void;
  onCancel: () => void;
}) {
  return (
    <tr className={ui.trHover}>
      <td className={ui.td}>{formatTime(a.time)}</td>
      <td className={ui.td}>
        <p className="font-medium">{a.patientName}</p>
        <p className="text-xs text-[#2C3531]/60">{a.mrn}</p>
      </td>
      <td className={ui.td}>{a.chiefComplaint}</td>
      <td className={ui.td}>
        <span className={`${ui.badge} ${statusColors[a.status]}`}>{a.status}</span>
      </td>
      <td className={ui.td}>
        <div className="flex flex-wrap gap-1">
          {a.status === 'scheduled' && (
            <button
              type="button"
              onClick={onAccept}
              disabled={busy === 'accept'}
              className="rounded-lg p-1.5 text-[#4A856A] hover:bg-[#EEF5F1] disabled:opacity-50"
              title="Accept"
            >
              {busy === 'accept' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
            </button>
          )}
          {(a.status === 'waiting' || a.status === 'scheduled') && (
            <button
              type="button"
              onClick={onStart}
              disabled={busy === 'start'}
              className="rounded-lg p-1.5 text-[#7A9A8B] hover:bg-[#EEF5F1] disabled:opacity-50"
              title="Start consultation"
            >
              {busy === 'start' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </button>
          )}
          <button
            type="button"
            onClick={onReschedule}
            className="rounded-lg p-1.5 text-[#2C3531]/70 hover:bg-[#F4F6F0]"
            title="Reschedule"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          {a.status !== 'cancelled' && a.status !== 'completed' && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg p-1.5 text-[#D96B52] hover:bg-[#FDF0ED]"
              title="Cancel"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
