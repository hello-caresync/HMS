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
import { DoctorModuleShell } from '@/components/doctor/doctor-ui';
import { useAnalytics } from '@/lib/doctor/hooks/useClinicalQueries';
import { sageUi } from '@/lib/doctor/ui-tokens';

const PIE_COLORS = ['#A39E75', '#C7C39E', '#2B2A22', '#E6E3C5', '#5C5A4E'];

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

const EXTENDED_KPIS = [
  { label: 'Patients seen (MTD)', value: '428', sub: '+12% vs last month' },
  { label: 'Revenue generated', value: '₹8.4L', sub: 'Consultations + procedures' },
  { label: 'Patient satisfaction', value: '4.8 / 5', sub: 'Portal ratings' },
  { label: 'Clinical productivity', value: '94%', sub: 'Target: 90%' },
];

export default function AnalyticsDashboard() {
  const { data, isLoading, isError } = useAnalytics();
  const analytics = data?.analytics as AnalyticsPayload | undefined;

  if (isLoading || !analytics) return <ClinicalPageSkeleton rows={4} />;
  if (isError) return <p className="text-sm text-[#EF4444]">Analytics unavailable</p>;

  const { kpis } = analytics;

  return (
    <DoctorModuleShell
      title="Clinical Analytics"
      subtitle="Performance KPIs · diagnosis trends · prescription patterns · revenue insights"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total consultations', value: kpis.totalConsultations },
          { label: 'Avg consult time', value: `${kpis.avgConsultMinutes} min` },
          { label: 'Follow-up rate', value: `${kpis.followUpRetention}%` },
          { label: 'OPD / IPD mix', value: `${kpis.opdRatio}% / ${kpis.ipdRatio}%` },
        ].map((k) => (
          <div key={k.label} className={`${sageUi.card} p-4`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#5C5A4E]">{k.label}</p>
            <p className="mt-1 text-2xl font-black text-[#A39E75]">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {EXTENDED_KPIS.map((k) => (
          <div key={k.label} className={`${sageUi.cardSolid} p-4`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#5C5A4E]">{k.label}</p>
            <p className="mt-1 text-xl font-black text-[#2B2A22]">{k.value}</p>
            <p className="text-xs text-[#A39E75]">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className={`${sageUi.card} p-4`}>
          <h3 className="mb-2 text-sm font-bold text-[#2B2A22]">Consultation volume</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.consultationTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E3C5" />
                <XAxis dataKey="date" tick={{ fill: '#5C5A4E', fontSize: 11 }} />
                <YAxis tick={{ fill: '#5C5A4E', fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E6E3C5' }} />
                <Legend />
                <Line type="monotone" dataKey="opd" stroke="#A39E75" strokeWidth={2} name="OPD" />
                <Line type="monotone" dataKey="ipd" stroke="#2B2A22" strokeWidth={2} name="IPD" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`${sageUi.card} p-4`}>
          <h3 className="mb-2 text-sm font-bold text-[#2B2A22]">Diagnosis trends</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={analytics.diagnosisBreakdown} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} label>
                  {analytics.diagnosisBreakdown.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E6E3C5' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`${sageUi.card} p-4`}>
          <h3 className="mb-2 text-sm font-bold text-[#2B2A22]">Surgery outcomes</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.surgeryOutcomes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E3C5" />
                <XAxis dataKey="name" tick={{ fill: '#5C5A4E', fontSize: 11 }} />
                <YAxis tick={{ fill: '#5C5A4E', fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E6E3C5' }} />
                <Bar dataKey="success" fill="#A39E75" name="Success %" radius={[4, 4, 0, 0]} />
                <Bar dataKey="complications" fill="#EF4444" name="Complications %" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`${sageUi.card} p-4`}>
          <h3 className="mb-2 text-sm font-bold text-[#2B2A22]">Prescription trends</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.rxDistribution} layout="vertical">
                <XAxis type="number" tick={{ fill: '#5C5A4E', fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={90} tick={{ fill: '#5C5A4E', fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E6E3C5' }} />
                <Bar dataKey="count" fill="#2B2A22" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </DoctorModuleShell>
  );
}
