'use client';

import { useMemo, useState } from 'react';
import { Clock, Megaphone, Timer, Users } from 'lucide-react';

import { MasterPanel, MasterViewHeader, masterBtnPrimary } from './_masterLightUi';

type TokenStatus = 'Waiting' | 'Serving' | 'Completed';

type QueueToken = {
  token: string;
  patient: string;
  status: TokenStatus;
  waitMin: number;
};

type DeptQueue = {
  department: string;
  tokens: QueueToken[];
  nextSeq: number;
};

const INITIAL_QUEUES: DeptQueue[] = [
  {
    department: 'Cardiology',
    nextSeq: 24,
    tokens: [
      { token: 'CARD-021', patient: 'Rahul S.', status: 'Serving', waitMin: 0 },
      { token: 'CARD-022', patient: 'Anita M.', status: 'Waiting', waitMin: 12 },
      { token: 'CARD-023', patient: 'Vikram P.', status: 'Waiting', waitMin: 18 },
      { token: 'CARD-020', patient: 'Lakshmi N.', status: 'Completed', waitMin: 0 },
    ],
  },
  {
    department: 'Orthopedics',
    nextSeq: 18,
    tokens: [
      { token: 'ORTHO-015', patient: 'Sanjay R.', status: 'Serving', waitMin: 0 },
      { token: 'ORTHO-016', patient: 'Priya K.', status: 'Waiting', waitMin: 8 },
      { token: 'ORTHO-014', patient: 'Arjun D.', status: 'Completed', waitMin: 0 },
    ],
  },
  {
    department: 'General Medicine',
    nextSeq: 42,
    tokens: [
      { token: 'GEN-039', patient: 'Meera I.', status: 'Waiting', waitMin: 22 },
      { token: 'GEN-040', patient: 'Rajesh K.', status: 'Waiting', waitMin: 28 },
      { token: 'GEN-038', patient: 'Sunita V.', status: 'Completed', waitMin: 0 },
    ],
  },
  {
    department: 'Pediatrics',
    nextSeq: 11,
    tokens: [
      { token: 'PED-009', patient: 'Aarav T.', status: 'Serving', waitMin: 0 },
      { token: 'PED-010', patient: 'Diya S.', status: 'Waiting', waitMin: 6 },
    ],
  },
];

function deptPrefix(dept: string): string {
  const map: Record<string, string> = {
    Cardiology: 'CARD',
    Orthopedics: 'ORTHO',
    'General Medicine': 'GEN',
    Pediatrics: 'PED',
  };
  return map[dept] ?? 'OPD';
}

function statusStyles(status: TokenStatus): string {
  return {
    Waiting: 'bg-amber-50 text-amber-700 ring-amber-200',
    Serving: 'bg-blue-50 text-blue-700 ring-blue-200 animate-pulse',
    Completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  }[status];
}

export default function QueueMgmtView() {
  const [queues, setQueues] = useState(INITIAL_QUEUES);
  const [activeDept, setActiveDept] = useState(INITIAL_QUEUES[0].department);
  const [pulseToken, setPulseToken] = useState<string | null>(null);

  const metrics = useMemo(() => {
    const all = queues.flatMap((q) => q.tokens);
    return {
      waiting: all.filter((t) => t.status === 'Waiting').length,
      serving: all.filter((t) => t.status === 'Serving').length,
      completed: all.filter((t) => t.status === 'Completed').length,
      avgWait: Math.round(
        all.filter((t) => t.status === 'Waiting').reduce((s, t) => s + t.waitMin, 0) /
          Math.max(1, all.filter((t) => t.status === 'Waiting').length),
      ),
    };
  }, [queues]);

  const callNextPatient = () => {
    setQueues((prev) =>
      prev.map((q) => {
        if (q.department !== activeDept) return q;
        const servingIdx = q.tokens.findIndex((t) => t.status === 'Serving');
        const waitingIdx = q.tokens.findIndex((t) => t.status === 'Waiting');
        if (waitingIdx === -1) return q;

        const nextTokens = q.tokens.map((t, i) => {
          if (i === servingIdx) return { ...t, status: 'Completed' as TokenStatus, waitMin: 0 };
          if (i === waitingIdx) return { ...t, status: 'Serving' as TokenStatus, waitMin: 0 };
          return t;
        });

        const newToken: QueueToken = {
          token: `${deptPrefix(q.department)}-${String(q.nextSeq).padStart(3, '0')}`,
          patient: 'Walk-in Patient',
          status: 'Waiting',
          waitMin: 0,
        };

        setPulseToken(nextTokens[waitingIdx]?.token ?? null);
        window.setTimeout(() => setPulseToken(null), 2000);

        return {
          ...q,
          nextSeq: q.nextSeq + 1,
          tokens: [...nextTokens, newToken],
        };
      }),
    );
  };

  return (
    <div className="space-y-6">
      <MasterViewHeader
        title="Outpatient Queue Management"
        subtitle="Live triage board by department with token sequences and consultation metrics."
        icon={Users}
        action={
          <button type="button" className={masterBtnPrimary} onClick={callNextPatient}>
            <Megaphone className="h-3.5 w-3.5" />
            Call Next Patient Token
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Waiting', value: metrics.waiting, icon: Timer, color: 'text-amber-600' },
          { label: 'Serving', value: metrics.serving, icon: Megaphone, color: 'text-blue-600' },
          { label: 'Completed', value: metrics.completed, icon: Users, color: 'text-emerald-600' },
          { label: 'Avg Wait (min)', value: metrics.avgWait, icon: Clock, color: 'text-slate-800' },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{kpi.label}</p>
                <Icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
              <p className={`mt-1 text-2xl font-bold tabular-nums ${kpi.color}`}>{kpi.value}</p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        {queues.map((q) => (
          <button
            key={q.department}
            type="button"
            onClick={() => setActiveDept(q.department)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeDept === q.department
                ? 'bg-blue-600 text-white'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {q.department}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {queues.map((q) => (
          <MasterPanel
            key={q.department}
            title={q.department}
            description={`Next token: ${deptPrefix(q.department)}-${String(q.nextSeq).padStart(3, '0')}`}
          >
            <ul className="space-y-2">
              {q.tokens.map((t) => (
                <li
                  key={t.token}
                  className={`flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 ${
                    pulseToken === t.token ? 'ring-2 ring-blue-400 ring-offset-1' : 'bg-white'
                  }`}
                >
                  <div>
                    <p className="font-mono text-xs font-bold text-slate-800">{t.token}</p>
                    <p className="text-[11px] text-slate-500">{t.patient}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ring-1 ${statusStyles(t.status)}`}
                    >
                      {t.status}
                    </span>
                    {t.status === 'Waiting' && (
                      <p className="mt-1 text-[10px] text-slate-400">~{t.waitMin}m</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </MasterPanel>
        ))}
      </div>
    </div>
  );
}
