'use client';

import { Clock, Radio, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { EXECUTIVE_OPERATIONS_DATA } from '../../lib/executiveOperationsData';
import type { ExecutiveOperationsData } from '../../types/executiveOperations';
import OperationsMainColumn from './OperationsMainColumn';
import OperationsSideColumn from './OperationsSideColumn';
import OverviewMetricsRow from './OverviewMetricsRow';
import UtilityStrip from './UtilityStrip';

export type ExecutiveOpsDashboardProps = {
  data?: ExecutiveOperationsData;
  onNavigate?: (moduleId: string) => void;
};

export default function ExecutiveOpsDashboard({
  data = EXECUTIVE_OPERATIONS_DATA,
  onNavigate,
}: ExecutiveOpsDashboardProps) {
  const [mounted, setMounted] = useState(false);
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setRefreshedAt(new Date());
    setMounted(true);
  }, []);

  const nowLabel = useMemo(() => {
    if (!refreshedAt) return '—';
    return new Intl.DateTimeFormat('en-IN', {
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(refreshedAt);
  }, [refreshedAt]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    window.setTimeout(() => {
      setRefreshedAt(new Date());
      setIsRefreshing(false);
    }, 500);
  }, []);

  return (
    <div className="nexora-executive-ops space-y-2.5">
      <header className="flex flex-col gap-2 border-b border-slate-200/80 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#0F172A] px-3 py-1 text-sm font-semibold uppercase tracking-wider text-white">
              <Radio className="h-3 w-3 animate-pulse text-[#93C5FD]" />
              Real-Time Command Center
            </span>
            <span className="text-sm font-medium text-slate-600">
              Nexora Central Hospital · Executive Operations
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#0F172A] sm:text-4xl">
            Executive Operations Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <p className="flex items-center gap-1 text-sm text-slate-600">
            <Clock className="h-3 w-3" aria-hidden />
            Sync{' '}
            <time dateTime={mounted && refreshedAt ? refreshedAt.toISOString() : undefined}>
              {mounted ? nowLabel : '—'}
            </time>
          </p>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-[#0F172A] transition hover:border-[#2563EB]/30 hover:bg-blue-50/40 disabled:opacity-60"
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </header>

      <UtilityStrip data={data} onQuickAction={onNavigate} />
      <OverviewMetricsRow data={data} />

      <div className="grid grid-cols-1 gap-2 xl:grid-cols-10">
        <div className="xl:col-span-7">
          <OperationsMainColumn data={data} />
        </div>
        <div className="xl:col-span-3">
          <OperationsSideColumn data={data} />
        </div>
      </div>
    </div>
  );
}
