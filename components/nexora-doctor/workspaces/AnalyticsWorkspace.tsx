'use client';

import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { ui } from '@/components/nexora-doctor/ui/primitives';
import { FilterTabs, StatCard } from '@/components/nexora-doctor/ui/shared';
import { useDoctorClinicalStore } from '@/lib/nexora-doctor/store';
import type { AnalyticsPeriod } from '@/lib/nexora-doctor/types';

const PERIODS = [
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly', label: 'Yearly' },
];

export function AnalyticsWorkspace() {
  const getAnalytics = useDoctorClinicalStore((s) => s.getAnalytics);
  const [period, setPeriod] = useState<AnalyticsPeriod>('weekly');
  const data = getAnalytics(period);

  return (
    <div className={ui.page}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={ui.pageTitle}>Analytics</h1>
          <p className={ui.pageSubtitle}>Your clinical performance</p>
        </div>
        <FilterTabs options={PERIODS} value={period} onChange={(id) => setPeriod(id as AnalyticsPeriod)} />
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Patients Seen" value={data.patientsSeen} accent="teal" />
        <StatCard label="Appointments" value={data.appointments} accent="slate" />
        <StatCard label="Avg Consult Time" value={`${data.avgConsultMinutes} min`} accent="slate" />
        <StatCard label="Follow-up Rate" value={`${data.followUpRate}%`} accent="teal" />
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Prescriptions" value={data.prescriptionCount} />
        <StatCard label="Lab Orders" value={data.labOrders} />
        <StatCard label="Radiology Orders" value={data.radiologyOrders} />
        <StatCard label="Patient Satisfaction" value={`${data.satisfaction}/5`} accent="teal" />
      </div>

      <section className={ui.card}>
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Consultations Trend</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#94A3B8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94A3B8" />
              <Tooltip />
              <Bar dataKey="consultations" fill="#0F766E" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
