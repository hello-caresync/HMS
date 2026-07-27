'use client';

import { useState } from 'react';
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { OsCounter, OsPage, OsSegment, OsWidget } from '@/components/doctor-os/ui/OsPrimitives';
import { useAnalytics } from '@/lib/doctor/hooks/useClinicalQueries';
import { useCareCenterInsights } from '@/lib/doctor/hooks/useCareCenter';
import { useOsColors } from '@/lib/doctor-os/store';
import { MOCK_ANALYTICS } from '@/lib/mock-data';

export default function DoctorOsInsights() {
  const c = useOsColors();
  const [period, setPeriod] = useState('weekly');
  const { data: analyticsData } = useAnalytics();
  const { data: insightsData } = useCareCenterInsights();
  const analytics = analyticsData?.analytics ?? MOCK_ANALYTICS;
  const insights = insightsData?.insights;

  return (
    <OsPage>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: c.accent }}>Analytics</p>
          <h1 className="text-[24px] font-bold">Insights</h1>
        </div>
        <OsSegment
          value={period}
          onChange={setPeriod}
          options={[
            { id: 'daily', label: 'Daily' },
            { id: 'weekly', label: 'Weekly' },
            { id: 'monthly', label: 'Monthly' },
            { id: 'yearly', label: 'Yearly' },
          ]}
        />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <OsWidget title="Consultations"><OsCounter value={analytics.kpis.totalConsultations} /></OsWidget>
        <OsWidget title="Avg duration"><OsCounter value={insights?.avgConsultMinutes ?? analytics.kpis.avgConsultMinutes} suffix="m" /></OsWidget>
        <OsWidget title="Follow-up rate"><OsCounter value={insights?.followUpRate ?? analytics.kpis.followUpRetention} suffix="%" /></OsWidget>
        <OsWidget title="Revenue"><OsCounter value={`₹${((insights?.revenueContribution ?? 0) / 1000).toFixed(0)}`} suffix="k" /></OsWidget>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <OsWidget title="Consultation trend" span={2}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.consultationTrend}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke={c.textSecondary} />
                <YAxis tick={{ fontSize: 11 }} stroke={c.textSecondary} />
                <Tooltip />
                <Area type="monotone" dataKey="opd" stackId="1" stroke={c.accent} fill={c.accentSoft} />
                <Area type="monotone" dataKey="ipd" stackId="1" stroke="#5856D6" fill="rgba(88,86,214,0.2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </OsWidget>

        <OsWidget title="Diagnosis breakdown">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.diagnosisBreakdown}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <Bar dataKey="value" fill={c.accent} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </OsWidget>

        <OsWidget title="Prescription analytics">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.rxDistribution} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 10 }} />
                <Bar dataKey="count" fill="#5856D6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </OsWidget>
      </div>
    </OsPage>
  );
}
