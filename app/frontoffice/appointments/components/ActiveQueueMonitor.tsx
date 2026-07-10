'use client';

import { useEffect, useState } from 'react';
import { Clock, Monitor, XCircle } from 'lucide-react';

import type { QueueTokenEntry } from '../../../lib/frontoffice';

type ActiveQueueMonitorProps = {
  queue: QueueTokenEntry[];
  onReschedule: (id: string) => void;
  onCancel: (id: string) => void;
};

const STATUS_STYLE: Record<QueueTokenEntry['status'], string> = {
  Waiting: 'bg-sky-50 text-sky-800 ring-sky-200',
  'In Consultation': 'bg-indigo-50 text-indigo-800 ring-indigo-200',
  Rescheduled: 'bg-amber-50 text-amber-800 ring-amber-200',
  Cancelled: 'bg-slate-100 text-slate-800 ring-slate-200 line-through',
};

export default function ActiveQueueMonitor({
  queue,
  onReschedule,
  onCancel,
}: ActiveQueueMonitorProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setTick((t) => t + 1), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const activeQueue = queue.filter((t) => t.status !== 'Cancelled');

  return (
    <div className="rounded-xl border border-slate-300 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b-2 border-slate-200 bg-slate-800 px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <Monitor className="h-4 w-4" />
          <div>
            <h2 className="text-sm font-black">Active Monitor Wall</h2>
            <p className="text-[10px] text-slate-900">Today&apos;s live queue · auto refresh</p>
          </div>
        </div>
        <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-bold">
          {activeQueue.length} active
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-slate-200 bg-slate-100">
              <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-wider text-slate-950">
                Token ID
              </th>
              <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-wider text-slate-950">
                Patient
              </th>
              <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-wider text-slate-950">
                Doctor
              </th>
              <th className="px-4 py-2.5 text-center text-[10px] font-black uppercase tracking-wider text-slate-950">
                Wait (min)
              </th>
              <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-wider text-slate-950">
                Status
              </th>
              <th className="px-4 py-2.5 text-right text-[10px] font-black uppercase tracking-wider text-slate-950">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {queue.map((row, index) => (
              <tr
                key={row.id}
                className={`border-b-2 border-slate-200 ${
                  index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                }`}
              >
                <td className="px-4 py-2.5">
                  <span className="font-mono text-xs font-black text-slate-950">{row.tokenId}</span>
                </td>
                <td className="px-4 py-2.5 font-bold text-slate-950">{row.patientInitials}</td>
                <td className="px-4 py-2.5 text-xs text-slate-950">{row.doctor}</td>
                <td className="px-4 py-2.5 text-center">
                  <span className="inline-flex items-center gap-1 font-mono text-xs font-bold tabular-nums text-slate-800">
                    <Clock className="h-3 w-3 text-slate-800" />
                    {row.waitingMinutes + Math.floor((Date.now() - new Date(row.bookedAt).getTime()) / 60000)}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${STATUS_STYLE[row.status]}`}
                  >
                    {row.status}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      disabled={row.status === 'Cancelled'}
                      onClick={() => onReschedule(row.id)}
                      className="rounded border border-amber-300 bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-800 hover:bg-amber-100 disabled:opacity-40"
                    >
                      Reschedule
                    </button>
                    <button
                      type="button"
                      disabled={row.status === 'Cancelled'}
                      onClick={() => onCancel(row.id)}
                      className="inline-flex items-center gap-0.5 rounded border border-rose-300 bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-800 hover:bg-rose-100 disabled:opacity-40"
                    >
                      <XCircle className="h-3 w-3" />
                      Cancel
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
