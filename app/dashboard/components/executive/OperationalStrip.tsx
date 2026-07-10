'use client';

import { Activity, BedDouble, Siren, Stethoscope } from 'lucide-react';

import type { ExecutiveOperationalMetrics } from '../../types';

type OperationalStripProps = {
  metrics: ExecutiveOperationalMetrics;
};

export default function OperationalStrip({ metrics }: OperationalStripProps) {
  const hasEmergency = metrics.emergencyCount > 0;

  return (
    <section
      aria-label="Operational command strip"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:gap-4"
    >
      {/* Live OPD / IPD */}
      <article className="nexora-op-strip-card group relative overflow-hidden rounded-xl border border-slate-700/60 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-5 py-4 shadow-lg">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgb(56_189_248/0.12),transparent_55%)]" />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-800">
              Live Census
            </p>
            <p className="mt-2 font-mono text-2xl font-bold tabular-nums tracking-tight text-white 2xl:text-3xl">
              <span className="text-sky-400">{metrics.opdCount}</span>
              <span className="mx-2 text-slate-800 font-normal">OPD</span>
              <span className="text-slate-800">/</span>
              <span className="ml-2 text-violet-400">{metrics.ipdCount}</span>
              <span className="ml-2 text-slate-800 font-normal text-lg 2xl:text-xl">IPD</span>
            </p>
            <p className="mt-1 text-[11px] text-slate-800">Active encounters · real-time</p>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/15 ring-1 ring-sky-400/30">
            <Activity className="h-5 w-5 text-sky-400" strokeWidth={2} />
          </span>
        </div>
      </article>

      {/* Emergency Cases */}
      <article
        className={`nexora-op-strip-card relative overflow-hidden rounded-xl border px-5 py-4 shadow-lg ${
          hasEmergency
            ? 'nexora-emergency-strip border-red-500/50 bg-gradient-to-br from-red-950 via-red-900 to-slate-900'
            : 'border-slate-700/60 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
        }`}
      >
        {hasEmergency && (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgb(239_68_68/0.2),transparent_60%)]" />
        )}
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-800">
              Emergency Cases
            </p>
            <p
              className={`mt-2 font-mono text-3xl font-bold tabular-nums tracking-tight 2xl:text-4xl ${
                hasEmergency ? 'text-red-400 nexora-emergency-count' : 'text-white'
              }`}
            >
              {metrics.emergencyCount}
            </p>
            <p className="mt-1 text-[11px] text-slate-800">
              {hasEmergency ? 'Active triage · ER bays engaged' : 'No active red alerts'}
            </p>
          </div>
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-lg ring-1 ${
              hasEmergency
                ? 'bg-red-500/20 ring-red-400/40 nexora-emergency-pulse'
                : 'bg-slate-700/50 ring-slate-600/40'
            }`}
          >
            <Siren
              className={`h-5 w-5 ${hasEmergency ? 'text-red-400' : 'text-slate-800'}`}
              strokeWidth={2}
            />
          </span>
        </div>
      </article>

      {/* Bed Occupancy */}
      <article className="nexora-op-strip-card relative overflow-hidden rounded-xl border border-slate-700/60 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-5 py-4 shadow-lg">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgb(16_185_129/0.1),transparent_55%)]" />
        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-800">
                Bed Occupancy
              </p>
              <p className="mt-2 font-mono text-3xl font-bold tabular-nums text-emerald-400 2xl:text-4xl">
                {metrics.bedOccupancyPercent}%
              </p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15 ring-1 ring-emerald-400/30">
              <BedDouble className="h-5 w-5 text-emerald-400" strokeWidth={2} />
            </span>
          </div>
          <div className="mt-3">
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-700/80 ring-1 ring-slate-600/50">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700"
                style={{ width: `${metrics.bedOccupancyPercent}%` }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-slate-800">
              {metrics.bedsFilled} / {metrics.bedsTotal} beds filled
            </p>
          </div>
        </div>
      </article>

      {/* Doctor Availability */}
      <article className="nexora-op-strip-card relative overflow-hidden rounded-xl border border-slate-700/60 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-5 py-4 shadow-lg">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgb(234_179_8/0.1),transparent_55%)]" />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-800">
              Doctor Availability
            </p>
            <p className="mt-2 font-mono text-2xl font-bold tabular-nums tracking-tight text-white 2xl:text-3xl">
              <span className="text-amber-400">{metrics.doctorsOnDuty}</span>
              <span className="mx-2 text-slate-800 font-normal text-sm">On-Duty</span>
              <span className="text-slate-800">/</span>
              <span className="ml-2 text-orange-400">{metrics.doctorsOnCall}</span>
              <span className="ml-2 text-slate-800 font-normal text-sm">On-Call</span>
            </p>
            <p className="mt-1 text-[11px] text-slate-800">Clinical roster · all departments</p>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/15 ring-1 ring-amber-400/30">
            <Stethoscope className="h-5 w-5 text-amber-400" strokeWidth={2} />
          </span>
        </div>
      </article>
    </section>
  );
}
