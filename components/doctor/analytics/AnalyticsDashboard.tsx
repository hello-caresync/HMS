'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { ClinicalPageSkeleton } from '@/components/doctor/ClinicalSkeleton';
import { ClinicalPageHeader } from '@/components/doctor/doctor-ui';
import { useAnalytics } from '@/lib/doctor/hooks/useClinicalQueries';
import { clinicalClasses } from '@/lib/doctor/theme';

const PIE_COLORS = ['#0D9488', '#0F172A', '#10B981', '#F59E0B', '#64748B'];

type AnalyticsPayload = {
  kpis: {
    totalConsultations: number;
    opdRatio: number;
    ipdRatio: number;
    avgConsultMinutes: number;
    followUpRetention: number;
  };
  consultationTrend: { date: string; opd: number; ipd: number }[];
  diagnosisBreakdown: { name: string; value: number }[];
  surgeryOutcomes: { name: string; success: number; complications: number }[];
  rxDistribution: { name: string; count: number }[];
};

export default function AnalyticsDashboard() {
  const { data, isLoading, isError } = useAnalytics();
  const analytics = data?.analytics as AnalyticsPayload | undefined;

  if (isLoading || !analytics) return <ClinicalPageSkeleton rows={4} />;
  if (isError) return <p className="text-sm text-[#EF4444]">Analytics unavailable</p>;

  const { kpis } = analytics;

  return (
    <div className={clinicalClasses.pageBg}>
      <ClinicalPageHeader title="Reports & Analytics" subtitle="Live KPIs from Prisma aggregates" />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total consultations', value: kpis.totalConsultations },
          { label: 'OPD vs IPD', value: `${kpis.opdRatio}% / ${kpis.ipdRatio}%` },
          { label: 'Avg consult time', value: `${kpis.avgConsultMinutes} min` },
          { label: 'Follow-up retention', value: `${kpis.followUpRetention}%` },
        ].map((k) => (
          <div key={k.label} className={`${clinicalClasses.card} p-4`}>
            <p className={clinicalClasses.sectionTitle}>{k.label}</p>
            <p className="mt-1 text-2xl font-bold text-[#0D9488]">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className={`${clinicalClasses.card} p-4`}>
          <h3 className="mb-2 text-sm font-bold">Consultation volume</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.consultationTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="opd" stroke="#0D9488" name="OPD" />
                <Line type="monotone" dataKey="ipd" stroke="#0F172A" name="IPD" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`${clinicalClasses.card} p-4`}>
          <h3 className="mb-2 text-sm font-bold">Diagnosis mix</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={analytics.diagnosisBreakdown} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} label>
                  {analytics.diagnosisBreakdown.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`${clinicalClasses.card} p-4`}>
          <h3 className="mb-2 text-sm font-bold">Surgery outcomes</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.surgeryOutcomes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="success" fill="#0D9488" />
                <Bar dataKey="complications" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`${clinicalClasses.card} p-4`}>
          <h3 className="mb-2 text-sm font-bold">e-Rx distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.rxDistribution} layout="vertical">
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={90} />
                <Tooltip />
                <Bar dataKey="count" fill="#0F172A" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
