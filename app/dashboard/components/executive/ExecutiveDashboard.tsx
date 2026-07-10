'use client';

import { Clock, Radio } from 'lucide-react';
import { useState } from 'react';

import { DASHBOARD_METRICS } from '../../lib/mockData';
import { DEFAULT_WIDGET_CONFIG } from '../../lib/widgetConfig';
import type { DashboardMetrics } from '../../types';
import AiInsightsPanel from './AiInsightsPanel';
import CommercialAnalyticsPanel from './CommercialAnalyticsPanel';
import ConfigurableWidgetGrid from './ConfigurableWidgetGrid';
import OperationalStrip from './OperationalStrip';
import WidgetConfigToggle, { useWidgetConfig } from './WidgetConfigToggle';

type ExecutiveDashboardProps = {
  metrics?: DashboardMetrics;
};

export default function ExecutiveDashboard({ metrics = DASHBOARD_METRICS }: ExecutiveDashboardProps) {
  const [configOpen, setConfigOpen] = useState(false);

  const { widgets, toggleVisibility, moveUp, moveDown, reset } =
    useWidgetConfig(DEFAULT_WIDGET_CONFIG);

  const nowLabel = new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date());

  return (
    <div className="nexora-executive-dashboard space-y-5 2xl:space-y-6">
      {/* Command header */}
      <header className="flex flex-col gap-4 border-b-2 border-slate-200/80 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200/60">
              <Radio className="h-3 w-3 animate-pulse" />
              Live Operations
            </span>
            <span className="text-[10px] font-medium text-slate-800">Module 1 · Executive Dashboard</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 2xl:text-3xl">
            Nexora Central Hospital
          </h1>
          <p className="mt-0.5 text-sm text-slate-800">
            Enterprise command center · clinical, commercial & governance cockpit
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <p className="flex items-center gap-1.5 text-xs text-slate-800">
            <Clock className="h-3.5 w-3.5" />
            {nowLabel}
          </p>
          <WidgetConfigToggle
            widgets={widgets}
            configOpen={configOpen}
            onToggleConfig={() => setConfigOpen((o) => !o)}
            onToggleVisibility={toggleVisibility}
            onMoveUp={moveUp}
            onMoveDown={moveDown}
            onReset={reset}
          />
        </div>
      </header>

      {/* 1. Operational Strip */}
      <OperationalStrip metrics={metrics.executive.operational} />

      {/* 2 + 3. Commercial analytics + AI governance — ultra-wide split */}
      <div className="grid grid-cols-1 gap-5 2xl:grid-cols-12 2xl:gap-6">
        <div className="2xl:col-span-8">
          <CommercialAnalyticsPanel metrics={metrics.executive.commercial} />
        </div>
        <div className="2xl:col-span-4">
          <AiInsightsPanel metrics={metrics.executive.governance} />
        </div>
      </div>

      {/* Configurable operational widgets */}
      <section aria-label="Configurable operational widgets">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-slate-900">
              Operational Metrics
            </h2>
            <p className="text-xs text-slate-800">
              Customizable widget grid · toggle visibility above
            </p>
          </div>
        </div>
        <ConfigurableWidgetGrid widgets={widgets} metrics={metrics} />
      </section>
    </div>
  );
}
