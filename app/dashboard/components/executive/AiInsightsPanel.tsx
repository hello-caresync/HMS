'use client';

import { Brain, Sparkles, Star, Users } from 'lucide-react';

import type { ExecutiveGovernanceMetrics } from '../../types';

type AiInsightsPanelProps = {
  metrics: ExecutiveGovernanceMetrics;
};

const INSIGHT_GRADIENTS = [
  'from-violet-100/80 via-purple-50/60 to-fuchsia-100/50',
  'from-sky-100/80 via-blue-50/60 to-cyan-100/50',
  'from-emerald-100/80 via-teal-50/60 to-green-100/50',
  'from-rose-100/80 via-pink-50/60 to-orange-100/50',
] as const;

const TYPE_LABELS = {
  predictive: 'Predictive',
  operational: 'Operational',
  financial: 'Financial',
} as const;

function RadialMeter({
  label,
  value,
  max,
  suffix,
  colorClass,
  icon: Icon,
}: {
  label: string;
  value: number;
  max: number;
  suffix?: string;
  colorClass: string;
  icon: typeof Users;
}) {
  const pct = Math.min(100, (value / max) * 100);
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center rounded-xl border border-slate-200/80 bg-white/70 px-4 py-4 backdrop-blur-sm">
      <div className="relative h-[88px] w-[88px]">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 88 88">
          <circle cx="44" cy="44" r="36" fill="none" stroke="#e2e8f0" strokeWidth="8" />
          <circle
            cx="44"
            cy="44"
            r="36"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={colorClass}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon className={`mb-0.5 h-3.5 w-3.5 ${colorClass}`} strokeWidth={2} />
          <span className="text-lg font-bold tabular-nums text-slate-900">
            {value}
            {suffix}
          </span>
        </div>
      </div>
      <p className="mt-2 text-center text-[11px] font-semibold text-slate-800">{label}</p>
    </div>
  );
}

export default function AiInsightsPanel({ metrics }: AiInsightsPanelProps) {
  const satisfactionPct = (metrics.patientSatisfaction / 5) * 100;

  return (
    <section aria-label="Governance and AI insights" className="space-y-4">
      <div>
        <h2 className="text-base font-semibold tracking-tight text-slate-900">
          Governance & AI Insights
        </h2>
        <p className="text-xs text-slate-800">Predictive intelligence · workforce · satisfaction</p>
      </div>

      {/* AI Insights Card */}
      <article className="overflow-hidden rounded-2xl border border-violet-200/60 bg-gradient-to-br from-violet-50/90 via-white to-sky-50/80 p-5 shadow-xs">
        <header className="mb-4 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 shadow-sm">
            <Brain className="h-4 w-4 text-white" strokeWidth={2} />
          </span>
          <div>
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
              AI Insights & Predictions
              <Sparkles className="h-3.5 w-3.5 text-violet-500" />
            </h3>
            <p className="text-[11px] text-slate-800">Nexora Intelligence Engine · mock predictions</p>
          </div>
        </header>

        <ul className="space-y-2.5">
          {metrics.aiInsights.map((insight, i) => (
            <li
              key={insight.id}
              className={`rounded-xl border border-white/80 bg-gradient-to-r ${INSIGHT_GRADIENTS[i % INSIGHT_GRADIENTS.length]} px-4 py-3 ring-1 ring-slate-200/50`}
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="rounded-full bg-white/80 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-700 ring-1 ring-violet-200/60">
                  {TYPE_LABELS[insight.type]}
                </span>
                <span className="text-[10px] font-mono text-slate-800">{insight.confidence}% conf.</span>
              </div>
              <p className="text-sm leading-relaxed text-slate-900">{insight.message}</p>
            </li>
          ))}
        </ul>
      </article>

      {/* Summary Meters */}
      <div className="grid grid-cols-2 gap-3">
        <RadialMeter
          label="Staff Attendance"
          value={metrics.staffAttendancePercent}
          max={100}
          suffix="%"
          colorClass="text-emerald-500"
          icon={Users}
        />
        <div className="flex flex-col items-center rounded-xl border border-slate-200/80 bg-white/70 px-4 py-4 backdrop-blur-sm">
          <div className="relative h-[88px] w-[88px]">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 88 88">
              <circle cx="44" cy="44" r="36" fill="none" stroke="#e2e8f0" strokeWidth="8" />
              <circle
                cx="44"
                cy="44"
                r="36"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 36}
                strokeDashoffset={2 * Math.PI * 36 * (1 - satisfactionPct / 100)}
                className="text-amber-500"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Star className="mb-0.5 h-3.5 w-3.5 fill-amber-400 text-amber-500" strokeWidth={2} />
              <span className="text-lg font-bold tabular-nums text-slate-900">
                {metrics.patientSatisfaction}
                <span className="text-xs font-normal text-slate-800">/5</span>
              </span>
            </div>
          </div>
          <p className="mt-2 text-center text-[11px] font-semibold text-slate-800">
            Patient Satisfaction
          </p>
        </div>
      </div>
    </section>
  );
}
