'use client';

import { ArrowUpRight, FlaskConical, IndianRupee, Microscope, Pill, Receipt } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { formatCurrency } from '../../lib/mockData';
import type { ExecutiveCommercialMetrics } from '../../types';
import InventoryScmAlerts from './InventoryScmAlerts';

type CommercialAnalyticsPanelProps = {
  metrics: ExecutiveCommercialMetrics;
};

function CollectionTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { value: number }[];
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold text-slate-900">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

export default function CommercialAnalyticsPanel({ metrics }: CommercialAnalyticsPanelProps) {
  const ancillaryChartData = [
    {
      name: 'Pharmacy',
      sales: metrics.pharmacy.value / 1000,
      samples: 0,
      studies: 0,
    },
    {
      name: 'Laboratory',
      sales: 0,
      samples: metrics.laboratory.value,
      studies: 0,
    },
    {
      name: 'Radiology',
      sales: 0,
      samples: 0,
      studies: metrics.radiology.value,
    },
  ];

  return (
    <section aria-label="Commercial and ancillary analytics" className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-slate-900">
            Commercial & Ancillary Analytics
          </h2>
          <p className="text-xs text-slate-800">Financial health · pharmacy · diagnostics throughput</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Today's Collection */}
        <article className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs lg:col-span-5 xl:col-span-4">
          <header className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-muted ring-1 ring-primary/20">
                <IndianRupee className="h-4 w-4 text-primary" strokeWidth={2} />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Today&apos;s Collection</h3>
                <p className="text-[11px] text-slate-800">Gross receipts · live</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
              <ArrowUpRight className="h-3 w-3" />
              +8.4%
            </span>
          </header>
          <p className="text-3xl font-bold tabular-nums tracking-tight text-slate-900 2xl:text-4xl">
            {formatCurrency(metrics.todaysCollection)}
          </p>
          <div className="mt-4 h-[120px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.collectionTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="collectionGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d97706" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#d97706" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(h) => `${h}:00`}
                />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip content={<CollectionTooltip />} />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#d97706"
                  strokeWidth={2}
                  fill="url(#collectionGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* Pending Bills */}
        <article className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs lg:col-span-3 xl:col-span-2">
          <header className="mb-4 flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 ring-1 ring-amber-100">
              <Receipt className="h-4 w-4 text-amber-600" strokeWidth={2} />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Pending Bills</h3>
              <p className="text-[11px] text-slate-800">Awaiting clearance</p>
            </div>
          </header>
          <p className="text-4xl font-bold tabular-nums text-slate-900">{metrics.pendingBillsCount}</p>
          <p className="mt-1 text-xs text-slate-800">Open invoices</p>
          <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/80 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700/80">
              Cumulative value
            </p>
            <p className="mt-0.5 text-lg font-bold tabular-nums text-amber-900">
              {formatCurrency(metrics.pendingBillsValue)}
            </p>
          </div>
        </article>

        {/* Pharmacy vs Lab/Radiology split */}
        <article className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs lg:col-span-4 xl:col-span-6">
          <header className="mb-3">
            <h3 className="text-sm font-semibold text-slate-800">Ancillary Throughput</h3>
            <p className="text-[11px] text-slate-800">Pharmacy sales vs. lab & radiology processing</p>
          </header>

          <div className="mb-4 grid grid-cols-3 gap-2">
            {[
              { icon: Pill, label: 'Pharmacy', value: formatCurrency(metrics.pharmacy.value), delta: metrics.pharmacy.changePercent, color: 'text-violet-600', bg: 'bg-violet-50 ring-violet-100' },
              { icon: Microscope, label: 'Laboratory', value: `${metrics.laboratory.value} samples`, delta: metrics.laboratory.changePercent, color: 'text-cyan-600', bg: 'bg-cyan-50 ring-cyan-100' },
              { icon: FlaskConical, label: 'Radiology', value: `${metrics.radiology.value} studies`, delta: metrics.radiology.changePercent, color: 'text-indigo-600', bg: 'bg-indigo-50 ring-indigo-100' },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border-2 border-slate-200 bg-slate-50/50 px-3 py-2.5">
                <div className="flex items-center gap-1.5">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-md ring-1 ${item.bg}`}>
                    <item.icon className={`h-3 w-3 ${item.color}`} strokeWidth={2} />
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-800">
                    {item.label}
                  </span>
                </div>
                <p className="mt-1.5 text-sm font-bold tabular-nums text-slate-800">{item.value}</p>
                <p className="text-[10px] font-medium text-emerald-600">+{item.delta}% vs avg</p>
              </div>
            ))}
          </div>

          <div className="h-[100px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ancillaryChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  formatter={(value: number, name: string) => {
                    if (name === 'sales') return [`₹${(value * 1000).toLocaleString('en-IN')}`, 'Pharmacy'];
                    if (name === 'samples') return [value, 'Lab Samples'];
                    return [value, 'Radiology'];
                  }}
                />
                <Bar dataKey="sales" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Bar dataKey="samples" fill="#06b6d4" radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Bar dataKey="studies" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>

      <InventoryScmAlerts alerts={metrics.scmAlerts} />
    </section>
  );
}
