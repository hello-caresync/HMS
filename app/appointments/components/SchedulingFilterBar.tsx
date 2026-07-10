'use client';

import { Building2, Calendar, ChevronLeft, ChevronRight, Stethoscope } from 'lucide-react';

import { useAppointments } from '../context/AppointmentProvider';
import { formatFullDateLabel } from '../lib/calendarUtils';

export default function SchedulingFilterBar() {
  const {
    departments,
    doctors,
    selectedDepartmentId,
    setSelectedDepartmentId,
    selectedDoctorId,
    setSelectedDoctorId,
    selectedDate,
    setSelectedDate,
    getDepartmentDoctors,
  } = useAppointments();

  const deptDoctors = getDepartmentDoctors(selectedDepartmentId);

  const shiftDate = (days: number) => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xs">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
          {/* Department */}
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-800">
              <Building2 className="h-3 w-3" />
              Department
            </label>
            <select
              value={selectedDepartmentId}
              onChange={(e) => setSelectedDepartmentId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm font-medium text-slate-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Doctor */}
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-800">
              <Stethoscope className="h-3 w-3" />
              Doctor
            </label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm font-medium text-slate-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {deptDoctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-800">
              <Calendar className="h-3 w-3" />
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm font-medium text-slate-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-slate-200 pt-3 lg:border-t-0 lg:pt-0">
          <button
            type="button"
            onClick={() => shiftDate(-1)}
            className="rounded-lg border border-slate-200 p-2 text-slate-800 hover:bg-slate-50"
            aria-label="Previous day"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="min-w-[140px] text-center text-sm font-semibold text-slate-800">
            {formatFullDateLabel(selectedDate)}
          </p>
          <button
            type="button"
            onClick={() => shiftDate(1)}
            className="rounded-lg border border-slate-200 p-2 text-slate-800 hover:bg-slate-50"
            aria-label="Next day"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
