'use client';

import { useState } from 'react';
import { Building2, Phone, Ticket, User, UserPlus } from 'lucide-react';

import { useAppointments } from '../context/AppointmentProvider';
import type { AppointmentType } from '../types';

export default function TokenGenerationForm() {
  const {
    departments,
    selectedDepartmentId,
    setSelectedDepartmentId,
    selectedDoctorId,
    setSelectedDoctorId,
    getDepartmentDoctors,
    generateTokenCheckIn,
  } = useAppointments();

  const [patientName, setPatientName] = useState('');
  const [uhid, setUhid] = useState('');
  const [phone, setPhone] = useState('');
  const [appointmentType, setAppointmentType] = useState<AppointmentType>('Walk-In');
  const [lastToken, setLastToken] = useState<string | null>(null);
  const [onWaitingList, setOnWaitingList] = useState(false);

  const deptDoctors = getDepartmentDoctors(selectedDepartmentId);
  const dept = departments.find((d) => d.id === selectedDepartmentId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !uhid.trim()) return;

    const apt = generateTokenCheckIn({
      patientName: patientName.trim(),
      uhid: uhid.trim(),
      phone: phone.trim() || '+91 —',
      departmentId: selectedDepartmentId,
      doctorId: selectedDoctorId,
      appointmentType,
    });

    setLastToken(apt.tokenNumber ?? null);
    setOnWaitingList(Boolean(apt.onWaitingList));
    setPatientName('');
    setUhid('');
    setPhone('');
  };

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white shadow-xs">
      <header className="border-b-2 border-slate-200 px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <Ticket className="h-4 w-4 text-primary" />
          Token Generation
        </h2>
        <p className="text-[11px] text-slate-800">Quick check-in · auto slot assignment</p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <label className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-800">
            <User className="h-3 w-3" />
            Patient Name
          </label>
          <input
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="Full name"
            required
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-800">
              UHID
            </label>
            <input
              value={uhid}
              onChange={(e) => setUhid(e.target.value)}
              placeholder="NEX-2026-XXXX"
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-800">
              <Phone className="h-3 w-3" />
              Phone
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 ..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-800">
            <Building2 className="h-3 w-3" />
            Department
          </label>
          <select
            value={selectedDepartmentId}
            onChange={(e) => setSelectedDepartmentId(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm font-medium focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.tokenPrefix})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-800">
            Assign Doctor
          </label>
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm font-medium focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {deptDoctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-800">
            Appointment Type
          </label>
          <div className="flex gap-2">
            {(['Walk-In', 'Online', 'Follow-up'] as AppointmentType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setAppointmentType(type)}
                className={`flex-1 rounded-lg border py-2 text-[11px] font-semibold transition-colors ${
                  appointmentType === type
                    ? 'border-primary bg-primary-muted text-primary'
                    : 'border-slate-200 text-slate-800 hover:bg-slate-50'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {lastToken && (
          <div
            className={`rounded-xl border px-4 py-3 ${
              onWaitingList
                ? 'border-amber-200 bg-amber-50'
                : 'border-emerald-200 bg-emerald-50'
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
              {onWaitingList ? 'Added to Waiting List' : 'Token Generated'}
            </p>
            <p className="mt-1 font-mono text-2xl font-bold text-slate-900">{lastToken}</p>
            <p className="mt-0.5 text-[11px] text-slate-800">
              {onWaitingList
                ? `Capacity breached for ${dept?.name} — patient queued dynamically`
                : `Proceed to ${dept?.roomLabel}`}
            </p>
          </div>
        )}

        <button
          type="submit"
          className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-primary-hover"
        >
          <UserPlus className="h-4 w-4" />
          Check In & Generate Token
        </button>
      </form>
    </div>
  );
}
