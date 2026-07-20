'use client';

import { useState } from 'react';

import type { BookingVariant } from '../appointmentsNav.types';
import { MOCK_DOCTORS } from '../lib/appointmentsMockData';
import { inputClass, ModalOverlay } from './appointmentsUi';

type BookAppointmentModalProps = {
  onClose: () => void;
  onBooked?: () => void;
};

export function BookAppointmentModal({ onClose, onBooked }: BookAppointmentModalProps) {
  const [variant, setVariant] = useState<BookingVariant>('walk-in');
  const [form, setForm] = useState({
    patientName: '',
    uhid: '',
    doctorId: 'd1',
    date: '2026-07-18',
    time: '10:30',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onBooked?.();
    onClose();
  };

  const variants: { id: BookingVariant; label: string }[] = [
    { id: 'walk-in', label: 'Walk-in' },
    { id: 'follow-up', label: 'Follow-up' },
    { id: 'referral', label: 'Referral' },
    { id: 'emergency', label: 'Emergency' },
    { id: 'teleconsult', label: 'Teleconsult' },
  ];

  return (
    <ModalOverlay title="Book Appointment" onClose={onClose} wide>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-wrap gap-1 rounded-md border border-[#E2E8F0] bg-slate-50 p-0.5">
          {variants.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setVariant(v.id)}
              className={`rounded px-2 py-1 text-[10px] font-bold uppercase ${
                variant === v.id ? 'bg-[#0F172A] text-white' : 'text-slate-600 hover:bg-white'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">Patient Name *</label>
            <input required className={inputClass} value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">UHID</label>
            <input className={inputClass} placeholder="NX-2026-XXXXXX" value={form.uhid} onChange={(e) => setForm({ ...form, uhid: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">Doctor & Department *</label>
            <select className={inputClass} value={form.doctorId} onChange={(e) => setForm({ ...form, doctorId: e.target.value })}>
              {MOCK_DOCTORS.map((d) => (
                <option key={d.id} value={d.id}>{d.name} — {d.department} ({d.room})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">Date *</label>
            <input type="date" required className={inputClass} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">Time *</label>
            <input type="time" required className={inputClass} value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">Clinical Notes</label>
            <textarea className={`${inputClass} min-h-[52px]`} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
        {variant === 'teleconsult' && (
          <p className="rounded-md border border-blue-200 bg-blue-50 px-2 py-1.5 text-[10px] text-blue-800">
            Teleconsult link will be sent via SMS/WhatsApp upon confirmation.
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-[#E2E8F0] px-3 py-1.5 text-[10px] font-semibold text-slate-600">
            Cancel
          </button>
          <button type="submit" className="rounded-md bg-[#2563EB] px-4 py-1.5 text-[10px] font-bold text-white">
            Confirm Booking
          </button>
        </div>
      </form>
    </ModalOverlay>
  );
}

export function CheckInModal({ onClose }: { onClose: () => void }) {
  const [uhid, setUhid] = useState('');
  const [token, setToken] = useState<string | null>(null);

  const handleCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    const dept = ['C', 'P', 'G', 'E'][Math.floor(Math.random() * 4)];
    setToken(`OPD-${dept}-${String(Math.floor(10 + Math.random() * 89)).padStart(2, '0')}`);
  };

  return (
    <ModalOverlay title="Check-in Patient" onClose={onClose}>
      {token ? (
        <div className="space-y-3 text-center">
          <p className="text-[11px] text-emerald-700 font-semibold">Check-in successful · Token generated</p>
          <p className="font-mono text-2xl font-bold text-[#2563EB]">{token}</p>
          <p className="text-[10px] text-slate-500">Print token at reception desk · Queue updated</p>
          <button type="button" onClick={onClose} className="w-full rounded-md bg-[#2563EB] py-2 text-[11px] font-bold text-white">
            Done
          </button>
        </div>
      ) : (
        <form onSubmit={handleCheckIn} className="space-y-3">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">UHID or Appointment ID *</label>
            <input required className={inputClass} value={uhid} onChange={(e) => setUhid(e.target.value)} placeholder="NX-2026-000412 or APT-9821" />
          </div>
          <button type="submit" className="w-full rounded-md bg-[#2563EB] py-2 text-[11px] font-bold text-white">
            Check-in & Generate Token
          </button>
        </form>
      )}
    </ModalOverlay>
  );
}

export function DoctorScheduleModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Doctor Schedule — Today" onClose={onClose} wide>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-100">
            {['Doctor', 'Department', 'Room', 'Hours', 'Open Slots'].map((h) => (
              <th key={h} className="pb-1.5 pr-2 text-[9px] font-bold uppercase text-slate-400">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {MOCK_DOCTORS.map((d) => (
            <tr key={d.id} className="border-b border-slate-50">
              <td className="py-1.5 pr-2 text-[10px] font-semibold text-[#0F172A]">{d.name}</td>
              <td className="py-1.5 pr-2 text-[10px] text-slate-600">{d.department}</td>
              <td className="py-1.5 pr-2 text-[10px] text-slate-600">{d.room}</td>
              <td className="py-1.5 pr-2 font-mono text-[9px] text-slate-500">{d.hours}</td>
              <td className="py-1.5 text-[10px] font-bold text-[#2563EB]">{d.slotsAvailable}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </ModalOverlay>
  );
}

export function PrintSlipModal({ onClose, patientName, token }: { onClose: () => void; patientName: string; token: string }) {
  return (
    <ModalOverlay title="Appointment Slip Preview" onClose={onClose}>
      <div className="rounded-lg border-2 border-[#0F172A] p-4 text-center">
        <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Nexora HMS — OPD Appointment</p>
        <p className="mt-2 text-sm font-bold text-[#0F172A]">{patientName}</p>
        <p className="font-mono text-lg font-bold text-[#2563EB]">{token}</p>
        <p className="mt-2 text-[10px] text-slate-500">Present at reception 15 min before slot</p>
      </div>
      <button type="button" className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[11px] font-bold text-white">
        Send to Printer
      </button>
    </ModalOverlay>
  );
}
