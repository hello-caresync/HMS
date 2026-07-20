'use client';

import { useMemo, useState } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';

import {
  MasterDataTable,
  MasterPanel,
  MasterTabBar,
  MasterViewHeader,
} from './_masterLightUi';

type ReportRange = 'today' | 'week' | 'month' | 'forecast';

const DAILY_SUMMARY = [
  { metric: 'Admissions', value: '24', prior: '21', trend: '+14%' },
  { metric: 'Discharges', value: '18', prior: '16', trend: '+12%' },
  { metric: 'Net Census Change', value: '+6', prior: '+5', trend: '+20%' },
  { metric: 'Occupancy Rate', value: '84.2%', prior: '82.1%', trend: '+2.1pp' },
  { metric: 'Average LoS (ALOS)', value: '3.8 days', prior: '4.1 days', trend: '-7%' },
  { metric: 'ICU Occupancy', value: '92%', prior: '88%', trend: '+4pp' },
];

const FORECAST_ROWS = [
  { period: 'Next 7 days', admissions: '148–162', occupancy: '85–88%', alos: '3.6–4.0d' },
  { period: 'Next 30 days', admissions: '620–680', occupancy: '82–86%', alos: '3.5–4.2d' },
];

export default function AdmissionReportsView() {
  const [range, setRange] = useState<ReportRange>('today');

  const title = useMemo(() => {
    const map: Record<ReportRange, string> = {
      today: "Today's Executive Summary",
      week: 'Weekly Intake / Discharge Volume',
      month: 'Monthly Occupancy & ALOS',
      forecast: 'Trend Forecasting',
    };
    return map[range];
  }, [range]);

  return (
    <div className="space-y-6">
      <MasterViewHeader
        title="Admission Reports"
        subtitle="Executive summaries for intake, discharge, occupancy, ALOS, and forecasting."
        icon={BarChart3}
      />

      <MasterTabBar
        tabs={[
          { id: 'today', label: 'Today' },
          { id: 'week', label: 'This Week' },
          { id: 'month', label: 'This Month' },
          { id: 'forecast', label: 'Forecast' },
        ]}
        active={range}
        onChange={setRange}
      />

      {range !== 'forecast' ? (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {DAILY_SUMMARY.map((row) => (
              <div
                key={row.metric}
                className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {row.metric}
                </p>
                <p className="mt-1 text-lg font-bold text-slate-800">{row.value}</p>
                <p className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold text-blue-600">
                  <TrendingUp className="h-3 w-3" />
                  {row.trend}
                </p>
                <p className="text-[10px] text-slate-400">Prior: {row.prior}</p>
              </div>
            ))}
          </div>

          <MasterPanel title={title} description="Structured KPI grid for leadership review">
            <MasterDataTable
              columns={['Metric', 'Current', 'Prior Period', 'Variance']}
              rows={DAILY_SUMMARY.map((r) => [r.metric, r.value, r.prior, r.trend])}
            />
          </MasterPanel>
        </>
      ) : (
        <MasterPanel title="Trend Forecasting" description="Projected admission and occupancy bands">
          <MasterDataTable
            columns={['Period', 'Admissions (proj.)', 'Occupancy', 'ALOS']}
            rows={FORECAST_ROWS.map((r) => [r.period, r.admissions, r.occupancy, r.alos])}
          />
          <p className="mt-3 text-xs text-slate-500">
            Forecast model uses 90-day rolling averages with seasonal Thursday/Friday surge adjustment.
          </p>
        </MasterPanel>
      )}
    </div>
  );
}
