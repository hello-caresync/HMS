'use client';

import { useMemo } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  AlertTriangle,
  BedDouble,
  ClipboardList,
  FileText,
  HeartPulse,
  Stethoscope,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCareCenterIpd } from '@/lib/doctor/hooks/useCareCenter';
import { sendClinicalMessage } from '@/lib/doctor/client/clinical-data-service';
import { useCareCenterStore } from '@/lib/doctor/stores/care-center-store';
import type { CareCenterFilter, IpdPatientCard, IpdRiskLevel } from '@/lib/doctor/types/care-center-dto';
import { nxUi } from '@/lib/doctor/design-system';

function riskBadge(level: IpdRiskLevel) {
  const map: Record<IpdRiskLevel, string> = {
    low: 'bg-emerald-100 text-emerald-800',
    moderate: 'bg-amber-100 text-amber-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  };
  return map[level];
}

function filterIpdPatients(patients: IpdPatientCard[], filter: CareCenterFilter, search: string) {
  const q = search.trim().toLowerCase();
  return patients.filter((p) => {
    if (q) {
      const hay = `${p.patient.fullName} ${p.patient.mrn} ${p.primaryDiagnosis} ${p.ward} ${p.bed}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    switch (filter) {
      case 'admitted':
        return p.status === 'ADMITTED';
      case 'icu':
        return p.isIcu;
      case 'high_risk':
        return p.riskLevel === 'high' || p.riskLevel === 'critical';
      case 'discharge_today':
        return p.status === 'DISCHARGE_PLANNED';
      default:
        return true;
    }
  });
}

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: LucideIcon }) {
  return (
    <div className={`${nxUi.card} group p-4`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#5C5A4E]">{label}</p>
          <p className="mt-1 text-2xl font-black tabular-nums text-[#2B2A22]">{value}</p>
        </div>
        <div className="rounded-xl bg-[#A39E75]/15 p-2 text-[#A39E75]">
          <Icon className="h-4 w-4" aria-hidden />
        </div>
      </div>
    </div>
  );
}

function IpdCard({ patient }: { patient: IpdPatientCard }) {
  const openIpd = useCareCenterStore((s) => s.openIpdPatient);

  return (
    <article className={`${nxUi.cardInteractive} flex flex-col gap-3 p-4`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BedDouble className="h-4 w-4 text-[#A39E75]" aria-hidden />
            <span className="font-black text-[#2B2A22]">
              {patient.ward} · Bed {patient.bed}
            </span>
          </div>
          <p className="text-xs text-[#5C5A4E]">{patient.room}</p>
        </div>
        <Badge className={riskBadge(patient.riskLevel)}>{patient.riskLevel} risk</Badge>
      </div>

      <div>
        <h3 className="text-base font-black">{patient.patient.fullName}</h3>
        <p className="text-xs text-[#5C5A4E]">
          {patient.patient.mrn} · LOS {patient.losDays}d · {patient.insuranceStatus}
        </p>
      </div>

      <div className="space-y-1 text-xs">
        <p>
          <span className="font-bold text-[#A39E75]">Diagnosis:</span> {patient.primaryDiagnosis}
        </p>
        <p>
          <span className="font-bold text-[#A39E75]">Attending:</span> {patient.attendingDoctor}
        </p>
        <p>
          <span className="font-bold text-[#A39E75]">Condition:</span> {patient.currentCondition}
        </p>
        <p>
          <span className="font-bold text-[#A39E75]">Admitted:</span>{' '}
          {new Date(patient.admissionDate).toLocaleDateString()}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {patient.pendingProgressNotes && (
          <Badge variant="secondary" className="border-amber-300 text-amber-700">
            Progress note pending
          </Badge>
        )}
        {patient.pendingOrders > 0 && (
          <Badge variant="secondary">Orders pending · {patient.pendingOrders}</Badge>
        )}
        {patient.isIcu && <Badge className="bg-red-100 text-red-700">ICU</Badge>}
      </div>

      <div className="mt-auto flex flex-wrap gap-1.5 border-t border-[#E6E3C5]/80 pt-3">
        <Button size="sm" className={nxUi.btnPrimary} onClick={() => openIpd(patient, 'round')}>
          Daily Round
        </Button>
        <Button size="sm" variant="secondary" onClick={() => openIpd(patient, 'summary')}>
          Open Chart
        </Button>
        <Button size="sm" variant="secondary" onClick={() => openIpd(patient, 'discharge')}>
          Discharge
        </Button>
        <Link href={`/doctor/patients?patient=${patient.patientId}`} className={nxUi.btnSecondary + ' inline-flex h-8 items-center rounded-md px-3 text-xs font-semibold'}>
          History
        </Link>
        <Button
          size="sm"
          variant="secondary"
          onClick={() =>
            sendClinicalMessage({
              channelId: 'nursing-station',
              body: `Round requested · ${patient.patient.fullName} · ${patient.ward}`,
            })
              .then(() => toast.success('Nursing notified'))
              .catch((e) => toast.error(e.message))
          }
        >
          Notify Nurse
        </Button>
      </div>
    </article>
  );
}

export default function CareCenterIpdPanel() {
  const { data, isLoading, isError, error } = useCareCenterIpd();
  const filter = useCareCenterStore((s) => s.filter);
  const search = useCareCenterStore((s) => s.search);

  const patients = useMemo(
    () => filterIpdPatients(data?.patients ?? [], filter, search),
    [data?.patients, filter, search],
  );

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`${nxUi.card} h-56 animate-pulse`} />
        ))}
      </div>
    );
  }

  if (isError) {
    return <p className="text-sm text-red-600">{(error as Error).message}</p>;
  }

  const stats = data!.stats;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <StatCard label="Admissions Today" value={stats.todayAdmissions} icon={Activity} />
        <StatCard label="Inpatients" value={stats.currentInpatients} icon={BedDouble} />
        <StatCard label="ICU" value={stats.icuPatients} icon={HeartPulse} />
        <StatCard label="Critical" value={stats.criticalPatients} icon={AlertTriangle} />
        <StatCard label="Discharge Due" value={stats.dischargeDue} icon={FileText} />
        <StatCard label="Rounds Today" value={stats.roundsToday} icon={Stethoscope} />
        <StatCard label="Pending Notes" value={stats.pendingProgressNotes} icon={ClipboardList} />
        <StatCard label="Pending Orders" value={stats.pendingOrders} icon={ClipboardList} />
      </div>

      {patients.length === 0 ? (
        <div className={`${nxUi.shell} py-16 text-center`}>
          <BedDouble className="mx-auto h-10 w-10 text-[#A39E75]/50" aria-hidden />
          <p className="mt-3 font-semibold">No inpatients match your filters</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {patients.map((p) => (
            <IpdCard key={p.id} patient={p} />
          ))}
        </div>
      )}
    </div>
  );
}
