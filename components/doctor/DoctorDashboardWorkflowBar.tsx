'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useOpdQueue } from '@/lib/doctor/hooks/useClinicalQueries';
import { clinicalClasses } from '@/lib/doctor/theme';

export default function DoctorDashboardWorkflowBar() {
  const router = useRouter();
  const { data: queueData } = useOpdQueue();
  const queue = queueData?.queue ?? [];
  const completed = 0;
  const statLabs = 0;
  const emergencyCount = 0;

  return (
    <section className={`${clinicalClasses.card} mb-4 p-4`}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Consultations today', value: completed },
          { label: 'OPD queue', value: queue.length },
          { label: 'Emergency cases', value: emergencyCount },
          { label: 'STAT lab alerts', value: statLabs, warn: statLabs > 0 },
        ].map((k) => (
          <div key={k.label}>
            <p className={clinicalClasses.sectionTitle}>{k.label}</p>
            <p className={`text-2xl font-bold ${k.warn ? 'text-[#EF4444]' : 'text-[#0D9488]'}`}>{k.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className={clinicalClasses.btnPrimary}
          onClick={() => {
            if (queue[0]) router.push('/doctor/opd');
          }}
        >
          Start next OPD patient
        </button>
        <button
          type="button"
          className={clinicalClasses.btnCritical}
          onClick={() => {
            router.push('/doctor/emergency');
          }}
        >
          Trigger critical alert
        </button>
        <Link href="/doctor/emergency" className={clinicalClasses.btnSecondary}>
          Write emergency note
        </Link>
      </div>
    </section>
  );
}
