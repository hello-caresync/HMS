'use client';

import { useCareCenterInsights } from '@/lib/doctor/hooks/useCareCenter';
import { nxUi } from '@/lib/doctor/design-system';

export default function CareCenterInsightsStrip() {
  const { data, isLoading } = useCareCenterInsights();
  const i = data?.insights;

  if (isLoading || !i) {
    return <div className={`${nxUi.shell} h-14 animate-pulse`} />;
  }

  const metrics = [
    { label: 'Seen Today', value: i.patientsSeenToday },
    { label: 'Avg Consult', value: `${i.avgConsultMinutes}m` },
    { label: 'Admissions', value: i.admissions },
    { label: 'Discharges', value: i.discharges },
    { label: 'Follow-up Rate', value: `${i.followUpRate}%` },
    { label: 'Critical', value: i.criticalCases },
    { label: 'Lab Orders', value: i.labOrders },
    { label: 'Radiology', value: i.radiologyOrders },
    { label: 'Rx Count', value: i.prescriptionCount },
    { label: 'Revenue', value: `₹${(i.revenueContribution / 1000).toFixed(0)}k` },
    { label: 'Satisfaction', value: `${i.patientSatisfaction}/5` },
  ];

  return (
    <div className={`${nxUi.shell} overflow-x-auto`}>
      <div className="flex min-w-max divide-x divide-[rgba(28,27,24,0.08)]">
        {metrics.map((m) => (
          <div key={m.label} className="px-4 py-3 text-center">
            <p className="text-[10px] font-medium uppercase tracking-wider text-[#9C9890]">{m.label}</p>
            <p className="text-[14px] font-semibold tabular-nums text-[#1C1B18]">{m.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
