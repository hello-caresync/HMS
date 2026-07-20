'use client';

import type { AnalyticsTreeNodeId } from '../reportsNav.types';
import {
  ALOS_TREND,
  DEMOGRAPHIC_DISTRIBUTION,
  DOCTOR_PERFORMANCE,
  INFECTION_CONTROL,
  LAB_TAT_DATA,
  MORTALITY_TREND,
  PEAK_HOUR_LOAD,
  PHARMACY_TURNOVER,
  RADIOLOGY_UTILIZATION,
  READMISSION_RATES,
  VISIT_VOLUME_TREND,
  WAITING_TIME_HEATMAP,
  getNodeTitle,
} from '../lib/reportsMockData';
import { CHART_COLORS, HbiPanel, SecurePatientPlaceholder } from '../components/reportsUi';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type AnalyticsVisualizationCanvasProps = {
  nodeId: AnalyticsTreeNodeId;
};

export function AnalyticsVisualizationCanvas({ nodeId }: AnalyticsVisualizationCanvasProps) {
  const title = getNodeTitle(nodeId);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#0F172A]">{title}</h3>
        <SecurePatientPlaceholder hipaa />
      </div>

      {nodeId === 'patient-demographics' && (
        <>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DEMOGRAPHIC_DISTRIBUTION}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="band" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={{ fontSize: 10 }} />
                <Legend wrapperStyle={{ fontSize: 9 }} />
                <Bar dataKey="male" fill={CHART_COLORS.cobalt} name="Male" radius={[2, 2, 0, 0]} />
                <Bar dataKey="female" fill={CHART_COLORS.teal} name="Female" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[9px] text-slate-500">Aggregate demographic bands — no individual patient identifiers rendered</p>
        </>
      )}

      {nodeId === 'patient-visits' && (
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={VISIT_VOLUME_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} />
              <Tooltip contentStyle={{ fontSize: 10 }} />
              <Legend wrapperStyle={{ fontSize: 9 }} />
              <Line type="monotone" dataKey="opd" stroke={CHART_COLORS.cobalt} strokeWidth={2} dot={false} name="OPD" />
              <Line type="monotone" dataKey="ipd" stroke={CHART_COLORS.teal} strokeWidth={2} dot={false} name="IPD" />
              <Line type="monotone" dataKey="er" stroke={CHART_COLORS.red} strokeWidth={2} dot={false} name="ER" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {nodeId === 'opd-doctor-performance' && (
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F8FAFC]">
              {['Doctor', 'Department', 'Consultations', 'Avg Wait (min)', 'Satisfaction'].map((h) => (
                <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DOCTOR_PERFORMANCE.map((d) => (
              <tr key={d.doctor} className={`border-b border-slate-50 ${d.avgWaitMin > 30 ? 'bg-amber-50/30' : ''}`}>
                <td className="px-1.5 py-1 text-[9px] font-semibold">{d.doctor}</td>
                <td className="px-1.5 py-1 text-[8px]">{d.department}</td>
                <td className="px-1.5 py-1 text-[9px] tabular-nums">{d.consultations}</td>
                <td className={`px-1.5 py-1 text-[9px] font-bold tabular-nums ${d.avgWaitMin > 30 ? 'text-red-600' : 'text-emerald-600'}`}>{d.avgWaitMin}</td>
                <td className="px-1.5 py-1 text-[9px] tabular-nums">{d.satisfaction}/5</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {nodeId === 'opd-peak-hours' && (
        <>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={PEAK_HOUR_LOAD}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="hour" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={{ fontSize: 10 }} />
                <Bar dataKey="opd" fill={CHART_COLORS.cobalt} name="OPD Load" radius={[2, 2, 0, 0]} />
                <Bar dataKey="er" fill={CHART_COLORS.red} name="ER Load" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <HbiPanel title="Waiting Time Heat Map" subtitle="Peak hour wait minutes by day">
            <div className="grid grid-cols-3 gap-1">
              {WAITING_TIME_HEATMAP.map((cell, i) => (
                <div
                  key={i}
                  className="rounded px-2 py-1 text-center text-[8px] font-bold"
                  style={{
                    backgroundColor: cell.waitMin > 45 ? '#FEE2E2' : cell.waitMin > 35 ? '#FEF3C7' : '#D1FAE5',
                    color: cell.waitMin > 45 ? '#B91C1C' : cell.waitMin > 35 ? '#B45309' : '#047857',
                  }}
                >
                  {cell.day} {cell.hour}:00 · {cell.waitMin}m
                </div>
              ))}
            </div>
          </HbiPanel>
        </>
      )}

      {nodeId === 'ipd-alos' && (
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={ALOS_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="week" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} domain={[3, 7]} />
              <Tooltip contentStyle={{ fontSize: 10 }} />
              <Legend wrapperStyle={{ fontSize: 9 }} />
              <Line type="monotone" dataKey="medical" stroke={CHART_COLORS.cobalt} name="Medical" strokeWidth={2} />
              <Line type="monotone" dataKey="surgical" stroke={CHART_COLORS.teal} name="Surgical" strokeWidth={2} />
              <Line type="monotone" dataKey="icu" stroke={CHART_COLORS.steel} name="ICU" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {nodeId === 'quality-mortality' && (
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={MORTALITY_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="quarter" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} domain={[0, 3]} />
              <Tooltip contentStyle={{ fontSize: 10 }} />
              <Line type="monotone" dataKey="observed" stroke={CHART_COLORS.teal} name="Observed %" strokeWidth={2} />
              <Line type="monotone" dataKey="expected" stroke={CHART_COLORS.steel} strokeDasharray="4 4" name="Expected %" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {nodeId === 'quality-readmission' && (
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F8FAFC]">
              {['Department', 'Rate %', 'Benchmark %', 'Status'].map((h) => (
                <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {READMISSION_RATES.map((r) => (
              <tr key={r.dept} className={`border-b border-slate-50 ${r.rate > r.benchmark ? 'bg-red-50/30' : ''}`}>
                <td className="px-1.5 py-1 text-[9px] font-semibold">{r.dept}</td>
                <td className={`px-1.5 py-1 text-[9px] font-bold tabular-nums ${r.rate > r.benchmark ? 'text-red-600' : 'text-emerald-600'}`}>{r.rate}</td>
                <td className="px-1.5 py-1 text-[9px] tabular-nums">{r.benchmark}</td>
                <td className="px-1.5 py-1 text-[8px]">{r.rate <= r.benchmark ? 'Below benchmark' : 'Above benchmark'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {nodeId === 'quality-infection' && (
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={INFECTION_CONTROL}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} />
              <Tooltip contentStyle={{ fontSize: 10 }} />
              <Legend wrapperStyle={{ fontSize: 9 }} />
              <Line type="monotone" dataKey="hai" stroke={CHART_COLORS.red} name="HAI %" strokeWidth={2} />
              <Line type="monotone" dataKey="clabsi" stroke={CHART_COLORS.cobalt} name="CLABSI" strokeWidth={2} />
              <Line type="monotone" dataKey="cauti" stroke={CHART_COLORS.teal} name="CAUTI" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {nodeId === 'ancillary-lab-tat' && (
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F8FAFC]">
              {['Test', 'Avg TAT (hrs)', 'Target', 'Breaches', 'Status'].map((h) => (
                <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LAB_TAT_DATA.map((l) => (
              <tr key={l.test} className="border-b border-slate-50 hover:bg-slate-50/80">
                <td className="px-1.5 py-1 text-[9px] font-semibold">{l.test}</td>
                <td className="px-1.5 py-1 text-[9px] tabular-nums">{l.avgHrs}</td>
                <td className="px-1.5 py-1 text-[9px] tabular-nums">{l.targetHrs}</td>
                <td className={`px-1.5 py-1 text-[9px] font-bold tabular-nums ${l.breach > 10 ? 'text-red-600' : 'text-emerald-600'}`}>{l.breach}</td>
                <td className="px-1.5 py-1 text-[8px]">{l.avgHrs <= l.targetHrs ? 'Within SLA' : 'SLA breach'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {nodeId === 'ancillary-radiology' && (
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={RADIOLOGY_UTILIZATION} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9 }} />
              <YAxis type="category" dataKey="modality" tick={{ fontSize: 9 }} width={60} />
              <Tooltip contentStyle={{ fontSize: 10 }} />
              <Bar dataKey="pct" name="Utilization %" radius={[0, 2, 2, 0]}>
                {RADIOLOGY_UTILIZATION.map((entry) => (
                  <Cell key={entry.modality} fill={entry.pct >= 90 ? CHART_COLORS.emerald : entry.pct < 70 ? CHART_COLORS.amber : CHART_COLORS.cobalt} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {nodeId === 'ancillary-pharmacy' && (
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F8FAFC]">
              {['Category', 'Turnover Days', 'Target Days', 'Variance'].map((h) => (
                <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PHARMACY_TURNOVER.map((p) => (
              <tr key={p.category} className={`border-b border-slate-50 ${p.turnoverDays > p.target ? 'bg-amber-50/30' : ''}`}>
                <td className="px-1.5 py-1 text-[9px] font-semibold">{p.category}</td>
                <td className="px-1.5 py-1 text-[9px] tabular-nums">{p.turnoverDays}</td>
                <td className="px-1.5 py-1 text-[9px] tabular-nums">{p.target}</td>
                <td className={`px-1.5 py-1 text-[8px] font-bold ${p.turnoverDays > p.target ? 'text-amber-700' : 'text-emerald-600'}`}>
                  {p.turnoverDays > p.target ? 'Slow turnover' : 'Optimal'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
