'use client';

import { Clock, DoorOpen, PhoneCall, Radio } from 'lucide-react';

import { useAppointments } from '../context/AppointmentProvider';
import { QUEUE_STATUS_STYLES } from '../types';

export default function ActiveQueueTable() {
  const { selectedDoctorId, getDoctorQueue, callNextPatient, doctors, departments } =
    useAppointments();

  const queue = getDoctorQueue(selectedDoctorId);
  const doctor = doctors.find((d) => d.id === selectedDoctorId);
  const dept = departments.find((d) => d.id === doctor?.departmentId);
  const waiting = queue.filter((q) => q.status === 'Waiting' || q.status === 'Delayed');

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white shadow-xs">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-slate-200 px-4 py-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Radio className="h-4 w-4 animate-pulse text-emerald-500" />
            Active Queue Status
          </h2>
          <p className="text-[11px] text-slate-800">
            {doctor?.name} · {dept?.name} · {queue.length} in queue
          </p>
        </div>
        <button
          type="button"
          onClick={() => callNextPatient(selectedDoctorId)}
          disabled={waiting.length === 0}
          className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-violet-700 disabled:opacity-40"
        >
          <PhoneCall className="h-3.5 w-3.5" />
          Call Next
        </button>
      </header>

      <div className="custom-scrollbar flex-1 overflow-auto">
        <table className="w-full min-w-[520px] text-left">
          <thead className="sticky top-0 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-950">
            <tr>
              <th className="px-4 py-2.5">Token</th>
              <th className="px-4 py-2.5">Patient</th>
              <th className="px-4 py-2.5">Room / Cabin</th>
              <th className="px-4 py-2.5">Wait</th>
              <th className="px-4 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {queue.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-xs text-slate-950">
                  No patients in active queue
                </td>
              </tr>
            ) : (
              queue.map((entry) => {
                const statusStyle = QUEUE_STATUS_STYLES[entry.status];
                const isActive = entry.status === 'In-Consultation';

                return (
                  <tr
                    key={entry.id}
                    className={`transition-colors ${isActive ? 'bg-violet-50/60' : 'hover:bg-slate-50/50'}`}
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-lg px-2.5 py-1.5 font-mono text-sm font-bold ${
                          isActive
                            ? 'bg-violet-600 text-white'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {entry.tokenNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900">{entry.patientName}</p>
                      <p className="font-mono text-[10px] text-slate-800">{entry.uhid}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-900">
                        <DoorOpen className="h-3.5 w-3.5 text-slate-800" />
                        {entry.assignedRoom}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 font-mono text-sm font-semibold tabular-nums text-slate-900">
                        <Clock className="h-3.5 w-3.5 text-slate-800" />
                        {entry.waitDurationMinutes}m
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ${statusStyle.bg} ${statusStyle.text} ${statusStyle.ring}`}
                      >
                        {entry.status === 'In-Consultation' ? 'In Consultation' : entry.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
