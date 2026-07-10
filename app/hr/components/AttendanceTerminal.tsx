'use client';

import { Clock, LogIn, LogOut } from 'lucide-react';

import { useHr } from '../context/HrProvider';
import { ATTENDANCE_FLAG_STYLES } from '../types';

export default function AttendanceTerminal() {
  const {
    employees,
    selectedEmployeeId,
    setSelectedEmployeeId,
    attendanceTerminalEnabled,
    setAttendanceTerminalEnabled,
    attendance,
    clockIn,
    clockOut,
    getTodayShift,
  } = useHr();

  const selected = employees.find((e) => e.id === selectedEmployeeId);
  const record = selectedEmployeeId ? attendance[selectedEmployeeId] : undefined;
  const todayShift = selectedEmployeeId ? getTodayShift(selectedEmployeeId) : 'Unassigned';

  const handleClockIn = () => {
    if (!selectedEmployeeId) return;
    clockIn(selectedEmployeeId);
  };

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-slate-200 bg-[#0a0e14] px-3 py-2">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-teal-400" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
              Attendance Terminal
            </p>
            <p className="text-xs font-bold text-white">Clock-In / Clock-Out Simulation</p>
          </div>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-[10px] font-semibold text-slate-900">
          <span>Enable terminal</span>
          <input
            type="checkbox"
            checked={attendanceTerminalEnabled}
            onChange={(e) => setAttendanceTerminalEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-slate-600 text-teal-500 focus:ring-teal-500"
          />
        </label>
      </div>

      {attendanceTerminalEnabled ? (
        <div className="grid gap-3 p-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase text-slate-800">
              Select Employee
            </label>
            <select
              value={selectedEmployeeId ?? ''}
              onChange={(e) => setSelectedEmployeeId(e.target.value || null)}
              className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} · {e.staffId}
                </option>
              ))}
            </select>
            {selected && (
              <p className="mt-1 text-[10px] text-slate-800">
                Today&apos;s rota: <strong className="text-slate-800">{todayShift}</strong>
              </p>
            )}
          </div>

          <div className="flex flex-col justify-end gap-2">
            <button
              type="button"
              onClick={handleClockIn}
              disabled={!selectedEmployeeId || !!record?.clockIn}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-teal-600 px-3 py-2 text-xs font-bold text-white hover:bg-teal-700 disabled:opacity-40"
            >
              <LogIn className="h-3.5 w-3.5" />
              Clock In
            </button>
            <button
              type="button"
              onClick={() => selectedEmployeeId && clockOut(selectedEmployeeId)}
              disabled={!record?.clockIn || !!record?.clockOut}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 hover:bg-slate-50 disabled:opacity-40"
            >
              <LogOut className="h-3.5 w-3.5" />
              Clock Out
            </button>
          </div>

          {record && (
            <div className="sm:col-span-2 rounded-md border-2 border-slate-200 bg-slate-50 px-3 py-2 text-[11px]">
              <p className="font-mono text-slate-800">
                In: {record.clockIn ? new Date(record.clockIn).toLocaleString('en-IN') : '—'}
              </p>
              <p className="font-mono text-slate-800">
                Out: {record.clockOut ? new Date(record.clockOut).toLocaleString('en-IN') : '—'}
              </p>
              <span
                className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${ATTENDANCE_FLAG_STYLES[record.flag]}`}
              >
                {record.flag}
              </span>
            </div>
          )}
        </div>
      ) : (
        <p className="px-3 py-6 text-center text-xs text-slate-800">
          Enable terminal to simulate biometric clock-in against scheduled shift start
        </p>
      )}
    </div>
  );
}
