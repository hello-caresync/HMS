'use client';

import { AlertTriangle, ArrowRightLeft, Boxes, Cpu } from 'lucide-react';

import { formatCurrency } from '../../master-data/lib/seedData';
import { useInventory } from '../context/InventoryProvider';

export default function InventoryMetricsGrid() {
  const { metrics } = useInventory();

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        label="Total SKU Count"
        value={String(metrics.totalSkuCount)}
        sub="Active inventory lines"
        icon={Boxes}
        accent="text-slate-900 bg-slate-100"
      />
      <MetricCard
        label="Expiring Stock"
        value={String(metrics.expiringNext30Days)}
        sub="Next 30 days"
        icon={AlertTriangle}
        accent="text-amber-700 bg-amber-100"
        warn
      />
      <MetricCard
        label="Capital Equipment Value"
        value={formatCurrency(metrics.capitalEquipmentValue)}
        sub="Total asset valuation"
        icon={Cpu}
        accent="text-indigo-700 bg-indigo-100"
      />
      <MetricCard
        label="Pending Transfers"
        value={String(metrics.pendingTransfers)}
        sub="Internal requisitions"
        icon={ArrowRightLeft}
        accent="text-violet-700 bg-violet-100"
      />
    </div>
  );
}

function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
  warn,
}: {
  label: string;
  value: string;
  sub: string;
  icon: typeof Boxes;
  accent: string;
  warn?: boolean;
}) {
  const [textColor, bgColor] = accent.split(' ');
  return (
    <div
      className={`rounded-lg border bg-white p-3 shadow-sm ${warn ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800">{label}</p>
          <p className={`mt-1 font-mono text-lg font-bold tabular-nums ${textColor}`}>{value}</p>
          <p className="text-[10px] text-slate-800">{sub}</p>
        </div>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${bgColor}`}>
          <Icon className={`h-4 w-4 ${textColor}`} />
        </span>
      </div>
    </div>
  );
}
