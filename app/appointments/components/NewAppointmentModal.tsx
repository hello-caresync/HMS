'use client';

import { useState } from 'react';
import { Calendar, Clock, User, X } from 'lucide-react';

import { useAppointments } from '../context/AppointmentProvider';
import { APPOINTMENT_TODAY } from '../lib/seedAppointments';
import type { AppointmentType, BookingChannel } from '../types';

type NewAppointmentModalProps = {
  open: boolean;
  onClose: () => void;
};

const TIME_SLOTS = [
  '08:00', '08:15', '08:30', '08:45', '09:00', '09:15', '09:30', '09:45',
  '10:00', '10:15', '10:30', '10:45', '11:00', '11:15', '11:30',
  '14:00', '14:15', '14:30', '14:45', '15:00', '15:15', '15:30',
  '16:00', '16:15', '16:30', '17:00',
];

export default function NewAppointmentModal({ open, onClose }: NewAppointmentModalProps) {
  const { doctors, selectedDoctorId, bookAppointment } = useAppointments();
  const [channel, setChannel] = useState<BookingChannel>('Online');
  const [doctorId, setDoctorId] = useState(selectedDoctorId);
  const [patientName, setPatientName] = useState('');
  const [uhid, setUhid] = useState('');
  const [phone, setPhone] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [appointmentType, setAppointmentType] = useState<AppointmentType>('Online');
  const [checkInNow, setCheckInNow] = useState(false);

  if (!open) return null;

  const reset = () => {
    setPatientName('');
    setUhid('');
    setPhone('');
    setStartTime('10:00');
    setCheckInNow(false);
    setChannel('Online');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !uhid.trim() || !phone.trim()) return;
    bookAppointment({
      doctorId,
      patientName: patientName.trim(),
      uhid: uhid.trim(),
      phone: phone.trim(),
      date: APPOINTMENT_TODAY,
      startTime,
      bookingChannel: channel,
      appointmentType: channel === 'Walk-in' ? 'Walk-In' : appointmentType,
      checkInNow: channel === 'Walk-in' || checkInNow,
    });
    handleClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm" onClick={handleClose} aria-hidden />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">New Appointment</h2>
          <button type="button" onClick={handleClose} className="rounded-lg p-1 text-slate-800 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Online / Walk-in toggle */}
        <div className="mb-4 flex rounded-lg bg-slate-100 p-0.5">
          {(['Online', 'Walk-in'] as BookingChannel[]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setChannel(c);
                if (c === 'Walk-in') setCheckInNow(true);
              }}
              className={`flex-1 rounded-md py-2 text-xs font-semibold transition ${
                channel === c ? 'bg-white text-primary shadow-xs' : 'text-slate-800'
              }`}
            >
              {c === 'Online' ? 'Online Booking' : 'Walk-in'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-800">Doctor</label>
            <select
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} · {d.specialization}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase text-slate-800">
                <User className="h-3 w-3" /> Patient Name
              </label>
              <input
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-800">UHID</label>
              <input
                value={uhid}
                onChange={(e) => setUhid(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 font-mono text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="NEX-2026-XXXX"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-800">Phone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase text-slate-800">
                <Clock className="h-3 w-3" /> Time Slot
              </label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {TIME_SLOTS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase text-slate-800">
                <Calendar className="h-3 w-3" /> Date
              </label>
              <input
                type="date"
                defaultValue={APPOINTMENT_TODAY}
                disabled
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm text-slate-800"
              />
            </div>
          </div>

          {channel === 'Online' && (
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-800">
                Appointment Type
              </label>
              <div className="flex gap-2">
                {(['Online', 'Follow-up'] as AppointmentType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAppointmentType(type)}
                    className={`flex-1 rounded-lg border py-1.5 text-[11px] font-semibold ${
                      appointmentType === type
                        ? 'border-primary bg-primary-muted text-primary'
                        : 'border-slate-200 text-slate-800'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}

          {channel === 'Online' && (
            <label className="flex items-center gap-2 text-xs text-slate-800">
              <input
                type="checkbox"
                checked={checkInNow}
                onChange={(e) => setCheckInNow(e.target.checked)}
                className="rounded border-slate-300 text-primary focus:ring-primary/30"
              />
              Check in immediately & assign token
            </label>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-primary py-2.5 text-xs font-bold uppercase tracking-wide text-white hover:bg-primary-hover"
          >
            {channel === 'Walk-in' ? 'Register Walk-in & Issue Token' : 'Book Appointment'}
          </button>
        </form>
      </div>
    </>
  );
}
