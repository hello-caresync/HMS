'use client';

import { useMemo, useState } from 'react';
import { Calendar, Check, Filter, X } from 'lucide-react';

import type { BookingVariant, CalendarView } from '../appointmentsNav.types';
import {
  MOCK_CALENDAR_SLOTS,
  MOCK_DOCTORS,
  MOCK_ONLINE_REQUESTS,
} from '../lib/appointmentsMockData';
import { AptPanel, inputClass, StatusPill } from '../components/appointmentsUi';

export default function SchedulingCalendarTab() {
  const [bookingVariant, setBookingVariant] = useState<BookingVariant>('walk-in');
  const [calendarView, setCalendarView] = useState<CalendarView>('daily');
  const [filterDoctor, setFilterDoctor] = useState<string>('all');
  const [filterDept, setFilterDept] = useState<string>('all');
  const [filterRoom, setFilterRoom] = useState<string>('all');
  const [showAvailability, setShowAvailability] = useState(true);
  const [requests, setRequests] = useState(MOCK_ONLINE_REQUESTS);

  const departments = useMemo(() => [...new Set(MOCK_DOCTORS.map((d) => d.department))], []);
  const rooms = useMemo(() => [...new Set(MOCK_DOCTORS.map((d) => d.room))], []);

  const filteredSlots = useMemo(() => {
    let slots = MOCK_CALENDAR_SLOTS;
    if (filterDoctor !== 'all') slots = slots.filter((s) => s.doctorName === filterDoctor);
    if (filterDept !== 'all') slots = slots.filter((s) => s.department === filterDept);
    if (filterRoom !== 'all') slots = slots.filter((s) => s.room === filterRoom);
    if (!showAvailability) slots = slots.filter((s) => s.slotType !== 'available');
    return slots;
  }, [filterDoctor, filterDept, filterRoom, showAvailability]);

  const handleRequestAction = (id: string, action: 'Approved' | 'Rejected') => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: action } : r)));
  };

  const slotColor = (type: string) => {
    switch (type) {
      case 'consultation': return 'border-l-[#2563EB] bg-blue-50/50';
      case 'break': return 'border-l-amber-400 bg-amber-50/50';
      case 'leave': return 'border-l-red-400 bg-red-50/50';
      default: return 'border-l-emerald-400 bg-emerald-50/30';
    }
  };

  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-10">
      <div className="space-y-3 xl:col-span-3">
        <AptPanel title="Booking Engine" icon={Calendar} subtitle="Walk-in · follow-up · referral · emergency · teleconsult">
          <div className="mb-2 flex flex-wrap gap-1">
            {(
              [
                ['walk-in', 'Walk-in'],
                ['follow-up', 'Follow-up'],
                ['referral', 'Referral'],
                ['emergency', 'Emergency'],
                ['teleconsult', 'Teleconsult'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setBookingVariant(id)}
                className={`rounded px-2 py-0.5 text-[9px] font-bold uppercase ${
                  bookingVariant === id ? 'bg-[#0F172A] text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <input className={inputClass} placeholder="Patient name" />
            <input className={inputClass} placeholder="UHID" />
            <select className={inputClass}>
              {MOCK_DOCTORS.map((d) => (
                <option key={d.id}>{d.name} — {d.department}</option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" className={inputClass} defaultValue="2026-07-18" />
              <input type="time" className={inputClass} defaultValue="11:00" />
            </div>
            <button type="button" className="w-full rounded-md bg-[#2563EB] py-1.5 text-[10px] font-bold text-white">
              Reserve Slot — {bookingVariant}
            </button>
          </div>
        </AptPanel>

        <AptPanel title="Online Requests Approval" subtitle="Confirmation / rejection queue">
          <ul className="space-y-1.5">
            {requests.map((req) => (
              <li key={req.id} className="rounded-md border border-[#E2E8F0] p-2">
                <div className="flex items-start justify-between gap-1">
                  <div>
                    <p className="text-[10px] font-semibold text-[#0F172A]">{req.patientName}</p>
                    <p className="text-[9px] text-slate-500">{req.doctorName} · {req.requestedSlot}</p>
                  </div>
                  <StatusPill status={req.status} />
                </div>
                {req.status === 'Pending' && (
                  <div className="mt-1.5 flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleRequestAction(req.id, 'Approved')}
                      className="inline-flex flex-1 items-center justify-center gap-1 rounded bg-emerald-600 py-0.5 text-[9px] font-bold text-white"
                    >
                      <Check className="h-3 w-3" /> Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRequestAction(req.id, 'Rejected')}
                      className="inline-flex flex-1 items-center justify-center gap-1 rounded bg-red-600 py-0.5 text-[9px] font-bold text-white"
                    >
                      <X className="h-3 w-3" /> Reject
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </AptPanel>
      </div>

      <div className="xl:col-span-7">
        <AptPanel
          title="Master Calendar"
          icon={Calendar}
          subtitle="Daily · weekly · monthly · doctor · department · room filters"
          headerRight={
            <div className="flex gap-0.5 rounded border border-[#E2E8F0] p-0.5">
              {(['daily', 'weekly', 'monthly'] as CalendarView[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setCalendarView(v)}
                  className={`rounded px-2 py-0.5 text-[9px] font-bold uppercase ${
                    calendarView === v ? 'bg-[#0F172A] text-white' : 'text-slate-600'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          }
        >
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select value={filterDoctor} onChange={(e) => setFilterDoctor(e.target.value)} className="rounded border border-[#E2E8F0] px-2 py-1 text-[10px]">
              <option value="all">All Doctors</option>
              {MOCK_DOCTORS.map((d) => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>
            <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="rounded border border-[#E2E8F0] px-2 py-1 text-[10px]">
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <select value={filterRoom} onChange={(e) => setFilterRoom(e.target.value)} className="rounded border border-[#E2E8F0] px-2 py-1 text-[10px]">
              <option value="all">All Rooms</option>
              {rooms.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <label className="flex items-center gap-1 text-[10px] text-slate-600">
              <input type="checkbox" checked={showAvailability} onChange={(e) => setShowAvailability(e.target.checked)} className="rounded" />
              Show availability
            </label>
          </div>

          {calendarView === 'daily' && (
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-[#0F172A]">Thursday, 17 Jul 2026</p>
              {filteredSlots.map((slot) => (
                <div
                  key={slot.id}
                  className={`flex items-center gap-3 rounded-md border border-[#E2E8F0] border-l-4 px-2.5 py-1.5 ${slotColor(slot.slotType)}`}
                >
                  <span className="w-12 shrink-0 font-mono text-[10px] font-bold text-[#0F172A]">{slot.time}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold text-[#0F172A]">
                      {slot.patientName ?? slot.slotType.charAt(0).toUpperCase() + slot.slotType.slice(1)}
                    </p>
                    <p className="text-[9px] text-slate-500">{slot.doctorName} · {slot.room} · {slot.durationMin} min</p>
                  </div>
                  <span className="shrink-0 rounded bg-white px-1.5 py-px text-[8px] font-bold uppercase text-slate-500">
                    {slot.slotType}
                  </span>
                </div>
              ))}
            </div>
          )}

          {calendarView === 'weekly' && (
            <div className="grid grid-cols-7 gap-1">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                <div key={day} className={`rounded border p-1.5 ${day === 'Thu' ? 'border-[#2563EB] bg-blue-50/30' : 'border-[#E2E8F0]'}`}>
                  <p className="text-[9px] font-bold text-[#0F172A]">{day}</p>
                  <p className="mt-1 text-lg font-bold text-[#2563EB]">{i === 3 ? 24 : 12 + i * 2}</p>
                  <p className="text-[8px] text-slate-400">appointments</p>
                </div>
              ))}
            </div>
          )}

          {calendarView === 'monthly' && (
            <div className="grid grid-cols-7 gap-0.5">
              {Array.from({ length: 35 }).map((_, i) => {
                const day = i - 2;
                const isCurrent = day === 17;
                return (
                  <div
                    key={i}
                    className={`min-h-[48px] rounded border p-1 ${day < 1 || day > 31 ? 'border-transparent' : isCurrent ? 'border-[#2563EB] bg-blue-50/40' : 'border-[#E2E8F0]'}`}
                  >
                    {day >= 1 && day <= 31 && (
                      <>
                        <p className="text-[9px] font-bold text-[#0F172A]">{day}</p>
                        {day % 3 === 0 && <p className="text-[8px] text-[#2563EB]">{8 + (day % 5)} apt</p>}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-3 border-t border-slate-100 pt-2 text-[9px] text-slate-500">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-[#2563EB]" /> Consultation</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-amber-400" /> Break</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-red-400" /> Leave</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-emerald-400" /> Available</span>
          </div>
        </AptPanel>
      </div>
    </div>
  );
}
