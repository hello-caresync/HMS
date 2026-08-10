'use client';

import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { EntityEmptyState } from '@/components/nexora-hospital/ui/EntityEmptyState';
import { Badge, ui } from '@/components/nexora-hospital/ui/primitives';
import { formatDoctorOptionLabel, useHospitalDoctors } from '@/hooks/useHospitalDoctors';
import {
  bookHospitalAppointment,
  createOpdFromAppointment,
  updateAppointmentStatus,
} from '@/lib/nexora-hospital/services/hospital-db';
import { useHospitalStore } from '@/lib/nexora-hospital/store';

const STATUS_FILTERS = ['all', 'Pending', 'Confirmed', 'Cancelled', 'Completed', 'Today'];

export function AppointmentsWorkspace() {
  const appointments = useHospitalStore((s) => s.appointments);
  const patients = useHospitalStore((s) => s.patients);
  const { doctors, loading: doctorsLoading } = useHospitalDoctors();
  const [view, setView] = useState<'list' | 'calendar' | 'book'>('list');
  const [filter, setFilter] = useState('all');
  const [busy, setBusy] = useState<string | null>(null);
  const [bookForm, setBookForm] = useState({
    patientId: '',
    doctorId: '',
    timeSlot: '15:00',
    reason: 'Walk-in booking',
  });

  const today = new Date().toISOString().slice(0, 10);

  const filtered = useMemo(() => {
    return appointments.filter((a) => {
      if (filter === 'Today') return a.appointmentDate === today;
      if (filter === 'all') return true;
      return a.status === filter;
    });
  }, [appointments, filter, today]);

  const run = async (id: string, action: () => Promise<void>, msg: string) => {
    setBusy(id);
    await action();
    setBusy(null);
    toast.success(msg);
  };

  return (
    <div className={ui.pageInner}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={ui.pageTitle}>Appointments</h1>
          <p className={ui.pageSubtitle}>Calendar & scheduling · synced with Patient & Doctor apps</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className={view === 'list' ? ui.btnPrimary : ui.btnSecondary} onClick={() => setView('list')}>List</button>
          <button type="button" className={view === 'calendar' ? ui.btnPrimary : ui.btnSecondary} onClick={() => setView('calendar')}>Calendar</button>
          <button type="button" className={view === 'book' ? ui.btnPrimary : ui.btnSecondary} onClick={() => setView('book')}>Book</button>
        </div>
      </div>

      {doctorsLoading && (
        <div className="mb-4 flex items-center gap-2 text-base font-medium text-slate-800">
          <Loader2 className="h-4 w-4 animate-spin text-teal-700" />
          Loading doctors from hospital_members…
        </div>
      )}

      {!doctorsLoading && doctors.length > 0 && (
        <p className="mb-4 text-sm font-bold uppercase tracking-wider text-teal-800">
          {doctors.length} Regal consultants loaded from Supabase
        </p>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button key={f} type="button" className={filter === f ? ui.btnPrimary : ui.btnSecondary} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>

      {view === 'book' ? (
        <div className={`${ui.card} max-w-xl space-y-4`}>
          <h2 className="text-2xl font-bold text-slate-900">Book Appointment</h2>
          <label className="block space-y-1.5">
            <span className="text-base font-medium text-slate-800">Patient</span>
            <select
              className={ui.select}
              value={bookForm.patientId}
              onChange={(e) => setBookForm((f) => ({ ...f, patientId: e.target.value }))}
            >
              <option value="">Select patient</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.fullName}</option>
              ))}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-base font-medium text-slate-800">Consulting Doctor</span>
            <select
              className={ui.select}
              value={bookForm.doctorId}
              onChange={(e) => setBookForm((f) => ({ ...f, doctorId: e.target.value }))}
            >
              <option value="">Select doctor</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>{formatDoctorOptionLabel(d)}</option>
              ))}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-base font-medium text-slate-800">Time Slot</span>
            <input
              className={ui.input}
              value={bookForm.timeSlot}
              onChange={(e) => setBookForm((f) => ({ ...f, timeSlot: e.target.value }))}
            />
          </label>
          <button
            type="button"
            className={ui.btnPrimary}
            disabled={!bookForm.patientId || !bookForm.doctorId}
            onClick={() => {
              const p = patients.find((x) => x.id === bookForm.patientId);
              const d = doctors.find((x) => x.id === bookForm.doctorId);
              if (!p || !d) return;
              void (async () => {
                await bookHospitalAppointment({
                  patientId: p.id,
                  patientName: p.fullName,
                  doctorId: d.id,
                  doctorName: d.fullName,
                  appointmentDate: today,
                  timeSlot: bookForm.timeSlot,
                  department: d.department,
                  token: `C-${String(Date.now()).slice(-3)}`,
                  reason: bookForm.reason,
                });
                toast.success('Appointment booked');
                setView('list');
              })();
            }}
          >
            Confirm Booking
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <EntityEmptyState preset="appointments" />
      ) : view === 'calendar' ? (
        <div className={`${ui.card} grid grid-cols-7 gap-2`}>
          {filtered.map((a) => (
            <div key={a.id} className="rounded-xl border border-slate-200 p-3">
              <p className="text-sm font-bold text-slate-600">{a.appointmentDate}</p>
              <p className="text-base font-bold">{a.timeSlot}</p>
              <p className="text-sm">{a.patientName}</p>
              <Badge status={a.status} />
            </div>
          ))}
        </div>
      ) : (
        <div className={`${ui.card} overflow-x-auto`}>
          <table className={ui.table}>
            <thead>
              <tr>
                <th className={ui.th}>Date / Time</th>
                <th className={ui.th}>Patient</th>
                <th className={ui.th}>Doctor</th>
                <th className={ui.th}>Department</th>
                <th className={ui.th}>Status</th>
                <th className={ui.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id}>
                  <td className={ui.td}>{a.appointmentDate} · {a.timeSlot}</td>
                  <td className={ui.td}>{a.patientName}</td>
                  <td className={ui.td}>{a.doctorName}</td>
                  <td className={ui.td}>{a.department}</td>
                  <td className={ui.td}><Badge status={a.status} /></td>
                  <td className={ui.td}>
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        disabled={busy === a.id}
                        className={ui.link}
                        onClick={() => void run(a.id, () => updateAppointmentStatus(a.id, 'Confirmed'), 'Confirmed')}
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        className={ui.link}
                        onClick={() => void run(a.id, () => createOpdFromAppointment(a.id).then(() => undefined), 'Checked in to OPD')}
                      >
                        Check-In
                      </button>
                      <button
                        type="button"
                        className={ui.link}
                        onClick={() => void run(a.id, () => updateAppointmentStatus(a.id, 'Cancelled'), 'Cancelled')}
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
