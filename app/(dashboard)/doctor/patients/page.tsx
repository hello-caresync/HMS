'use client';

import Link from 'next/link';

import { ClinicalPageSkeleton } from '@/components/doctor/ClinicalSkeleton';
import { DoctorModuleShell } from '@/components/doctor/doctor-ui';
import { usePatients } from '@/lib/doctor/hooks/useClinicalQueries';

export default function DoctorPatientsPage() {
  const { data, isLoading, isError } = usePatients();

  if (isLoading) return <ClinicalPageSkeleton rows={6} />;
  if (isError) return <DoctorModuleShell title="My Patients" subtitle="Database unavailable"><p className="text-sm text-red-600">Could not load patients.</p></DoctorModuleShell>;

  return (
    <DoctorModuleShell title="My Patients" subtitle="Directory from PostgreSQL via /api/patients">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {(data?.patients ?? []).map((p) => (
          <Link
            key={p.id}
            href={`/doctor/emr?patient=${p.id}`}
            className="rounded-xl border border-slate-200/60 bg-white p-4 shadow-sm transition hover:border-[#0D9488]/40 hover:shadow-md"
          >
            <p className="font-black text-[#0F172A]">{p.fullName}</p>
            <p className="text-xs text-slate-600">{p.mrn}</p>
            <p className="mt-2 text-sm text-slate-700">
              {p.age}y · {p.gender} · {p.bloodGroup}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {p.chronicConditions.map((c) => (
                <span key={c} className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                  {c}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </DoctorModuleShell>
  );
}
