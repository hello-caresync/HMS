'use client';

import { useState } from 'react';
import {
  Activity,
  Brain,
  FlaskConical,
  LineChart,
  Pill,
  ScanLine,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart as ReLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { ExecutiveOperationsData } from '../../types/executiveOperations';
import {
  CHART_COLORS,
  DataTable,
  ExecutivePanel,
  MetricValue,
  SplitMetricRow,
} from './executiveUi';

type OperationsMainColumnProps = {
  data: Pick<
    ExecutiveOperationsData,
    'opdQueue' | 'laboratory' | 'radiology' | 'pharmacy' | 'trends' | 'aiInsights'
  >;
};

type DeptTab = 'laboratory' | 'radiology' | 'pharmacy';

export default function OperationsMainColumn({ data }: OperationsMainColumnProps) {
  const [deptTab, setDeptTab] = useState<DeptTab>('laboratory');

  const patientTrendData = data.trends.patientsOpd.map((pt, i) => ({
    label: pt.label,
    opd: pt.value,
    ipd: data.trends.patientsIpd[i]?.value ?? 0,
  }));

  const combinedTrendData = data.trends.revenue.map((pt, i) => ({
    label: pt.label,
    revenue: Math.round(pt.value / 100000),
    occupancy: data.trends.bedOccupancy[i]?.value ?? 0,
  }));

  return (
    <div className="space-y-2">
      <ExecutivePanel
        title="Real-Time Operations Control"
        subtitle="OPD queue · consultation flow · wait times"
        icon={Activity}
        dense
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricValue value={data.opdQueue.queueLength} label="OPD Queue" accent />
          <MetricValue value={data.opdQueue.inConsultation} label="In Consultation" />
          <MetricValue value={data.opdQueue.waiting} label="Waiting Patients" />
          <MetricValue
            value={`${data.opdQueue.avgWaitMinutes}m`}
            label="Avg Wait Time"
            sub={`Peak ${data.opdQueue.peakHour} · ${data.opdQueue.roomsActive} rooms`}
          />
        </div>
      </ExecutivePanel>

      <ExecutivePanel
        title="Core Department Metrics"
        subtitle="Laboratory · radiology · pharmacy operational views"
        icon={FlaskConical}
        dense
        headerRight={
          <div className="flex gap-0.5 rounded-md border border-slate-200 bg-slate-50 p-0.5">
            {(
              [
                ['laboratory', FlaskConical, 'Lab'],
                ['radiology', ScanLine, 'Rad'],
                ['pharmacy', Pill, 'Rx'],
              ] as const
            ).map(([id, Icon, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setDeptTab(id)}
                aria-selected={deptTab === id}
                className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide transition-colors ${
                  deptTab === id
                    ? 'bg-[#0F172A] text-white'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="h-2.5 w-2.5" />
                {label}
              </button>
            ))}
          </div>
        }
      >
        {deptTab === 'laboratory' && (
          <>
            <SplitMetricRow
              items={[
                { label: 'Pending', value: data.laboratory.pendingSamples, highlight: true },
                { label: 'Critical', value: data.laboratory.criticalResults },
                { label: 'TAT Breach', value: data.laboratory.tatBreaches },
              ]}
            />
            <div className="mt-2">
              <DataTable
                headers={['Test', 'Patient', 'Priority', 'Status']}
                rows={data.laboratory.rows.map((r) => [
                  r.test,
                  r.patient,
                  <span
                    key={`${r.id}-p`}
                    className={
                      r.priority === 'STAT' ? 'font-bold text-red-600' : 'text-slate-600'
                    }
                  >
                    {r.priority}
                  </span>,
                  r.status,
                ])}
              />
            </div>
          </>
        )}
        {deptTab === 'radiology' && (
          <>
            <SplitMetricRow
              items={[
                { label: 'MRI Q', value: data.radiology.mriQueue },
                { label: 'CT Q', value: data.radiology.ctQueue, highlight: true },
                { label: 'X-Ray Q', value: data.radiology.xrayQueue },
              ]}
            />
            <p className="mb-1 mt-2 text-[9px] font-semibold text-amber-700">
              {data.radiology.urgentReads} urgent reads pending radiologist sign-off
            </p>
            <DataTable
              headers={['Modality', 'Patient', 'Ordered', 'Status']}
              rows={data.radiology.rows.map((r) => [
                r.modality,
                r.patient,
                r.orderedAt,
                r.status,
              ])}
            />
          </>
        )}
        {deptTab === 'pharmacy' && (
          <>
            <SplitMetricRow
              items={[
                { label: 'Pending Rx', value: data.pharmacy.pendingPrescriptions, highlight: true },
                { label: 'Low Stock', value: data.pharmacy.lowStockItems },
                { label: 'CD Audit', value: data.pharmacy.controlledDrugAudits },
              ]}
            />
            <div className="mt-2">
              <DataTable
                headers={['Drug', 'Patient', 'Qty', 'Status']}
                rows={data.pharmacy.rows.map((r) => [
                  r.drug,
                  r.patient,
                  r.qty,
                  r.status,
                ])}
              />
            </div>
          </>
        )}
      </ExecutivePanel>

      <ExecutivePanel
        title="Performance Analytics & Trends"
        subtitle="Revenue · patient volume · bed occupancy — 7-day rolling"
        icon={LineChart}
        dense
      >
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="h-[140px]">
            <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Revenue (₹ Lakhs)
            </p>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={combinedTrendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ fontSize: 10, borderRadius: 6, border: '1px solid #E2E8F0' }}
                  formatter={(v: number) => [`₹${v}L`, 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={CHART_COLORS.navy}
                  fill={CHART_COLORS.navyMid}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="h-[140px]">
            <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Patient Volume (OPD / IPD)
            </p>
            <ResponsiveContainer width="100%" height="100%">
              <ReLineChart data={patientTrendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 10, borderRadius: 6, border: '1px solid #E2E8F0' }} />
                <Legend wrapperStyle={{ fontSize: 9 }} />
                <Line type="monotone" dataKey="opd" stroke={CHART_COLORS.navy} strokeWidth={2} dot={false} name="OPD" />
                <Line
                  type="monotone"
                  dataKey="ipd"
                  stroke={CHART_COLORS.cobalt}
                  strokeWidth={2}
                  dot={false}
                  name="IPD"
                />
              </ReLineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="mt-2 h-[100px]">
          <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Bed Occupancy Trend (%)
          </p>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.trends.bedOccupancy} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <YAxis domain={[60, 100]} tick={{ fontSize: 9, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ fontSize: 10, borderRadius: 6, border: '1px solid #E2E8F0' }}
                formatter={(v: number) => [`${v}%`, 'Occupancy']}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={CHART_COLORS.cobalt}
                fill={CHART_COLORS.cobaltMuted}
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ExecutivePanel>

      <ExecutivePanel
        title="Advanced AI Insights"
        subtitle="Predictive warnings · stock-outs · operational recommendations"
        icon={Brain}
        dense
      >
        <ul className="space-y-1.5">
          {data.aiInsights.map((insight) => (
            <li
              key={insight.id}
              className="rounded-md border border-slate-100 bg-gradient-to-r from-slate-50 to-white px-2.5 py-2"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-[10px] font-bold text-[#0F172A]">{insight.title}</p>
                <span className="shrink-0 rounded bg-[#0F172A] px-1.5 py-px text-[8px] font-bold text-white">
                  {insight.confidence}%
                </span>
              </div>
              <p className="mt-0.5 text-[10px] leading-snug text-slate-600">{insight.detail}</p>
              <p className="mt-1 text-[9px] font-medium text-[#2563EB]">Horizon · {insight.horizon}</p>
            </li>
          ))}
        </ul>
      </ExecutivePanel>
    </div>
  );
}
