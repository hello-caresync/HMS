'use client';

import { useMemo } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  AlertTriangle,
  BedDouble,
  Clock,
  HeartPulse,
  Phone,
  Play,
  Shield,
  Stethoscope,
  UserRound,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  useCareCenterOpd,
  useRequestCareCenterAdmission,
  useStartCareCenterConsultation,
} from '@/lib/doctor/hooks/useCareCenter';
import { sendClinicalMessage, updateAppointmentStatus } from '@/lib/doctor/client/clinical-data-service';
import { useCareCenterStore } from '@/lib/doctor/stores/care-center-store';
import type { CareCenterFilter } from '@/lib/doctor/types/care-center-dto';
import type { OpdQueueCard } from '@/lib/doctor/types/care-center-dto';
import { nxUi } from '@/lib/doctor/design-system';

function priorityColor(p: OpdQueueCard['priority']) {
  if (p === 'STAT') return 'bg-red-100 text-red-700 border-red-200';
  if (p === 'Urgent') return 'bg-amber-100 text-amber-800 border-amber-200';
  return 'bg-[#E6E3C5]/60 text-[#5C5A4E] border-[#C7C39E]/50';
}

function vitalsColor(v: OpdQueueCard['vitalsStatus']) {
  if (v === 'critical') return 'text-red-600';
  if (v === 'attention') return 'text-amber-600';
  return 'text-emerald-600';
}

function filterOpdQueue(queue: OpdQueueCard[], filter: CareCenterFilter, search: string) {
  const q = search.trim().toLowerCase();
  return queue.filter((item) => {
    if (q) {
      const hay = `${item.patientName} ${item.uhid} ${item.chiefComplaint} ${item.department}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    switch (filter) {
      case 'waiting':
        return item.status === 'WAITING' || item.status === 'SCHEDULED' || item.status === 'CHECKED_IN';
      case 'in_consult':
        return item.status === 'IN_CONSULT' || item.status === 'RUNNING';
      case 'completed':
        return item.status === 'COMPLETED' || item.status === 'FINISHED';
      case 'emergency':
        return item.visitType === 'Emergency Walk-in' || item.priority === 'STAT';
      case 'follow_up':
        return item.visitType === 'Follow-up';
      default:
        return true;
    }
  });
}

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: LucideIcon }) {
  return (
    <div className={`${nxUi.card} group p-4 transition-all hover:shadow-[0_4px_16px_rgba(28,27,24,0.08)]`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#5C5A4E]">{label}</p>
          <p className="mt-1 text-2xl font-black tabular-nums text-[#2B2A22]">{value}</p>
        </div>
        <div className="rounded-xl bg-[#A39E75]/15 p-2 text-[#A39E75] transition-colors group-hover:bg-[#A39E75]/25">
          <Icon className="h-4 w-4" aria-hidden />
        </div>
      </div>
    </div>
  );
}

function OpdPatientCard({ card }: { card: OpdQueueCard }) {
  const openConsultation = useCareCenterStore((s) => s.openOpdConsultation);
  const startConsult = useStartCareCenterConsultation();
  const requestAdmit = useRequestCareCenterAdmission();

  const onStart = () => {
    startConsult.mutate(card.id, {
      onSuccess: () => {
        openConsultation({ ...card, status: 'IN_CONSULT' });
        toast.success('Consultation started · reception updated');
      },
      onError: (e) => toast.error(e.message),
    });
  };

  const onEmergency = () => {
    updateAppointmentStatus(card.id, 'RUNNING')
      .then(() => toast.warning('Moved to emergency track'))
      .catch((e) => toast.error(e.message));
  };

  const onAdmit = () => {
    requestAdmit.mutate(
      {
        patientId: card.patientId,
        wardName: 'General Male',
        bedNumber: `B-${Math.floor(Math.random() * 20) + 1}`,
        reason: `Admission from OPD · ${card.chiefComplaint}`,
      },
      {
        onSuccess: () => toast.success('Admission created · bed assigned · nursing notified'),
        onError: (e) => toast.error(e.message),
      },
    );
  };

  const onMessage = () => {
    sendClinicalMessage({ channelId: 'nursing-station', body: `Please prepare ${card.patientName} (${card.token})` })
      .then(() => toast.success('Message sent to nursing'))
      .catch((e) => toast.error(e.message));
  };

  return (
    <article
      className={`${nxUi.cardInteractive} animate-in fade-in flex flex-col gap-3 p-4 duration-300`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-[#A39E75] px-2 py-1 text-xs font-black text-white">{card.token}</span>
          <Badge className={priorityColor(card.priority)}>{card.priority}</Badge>
          <Badge variant="secondary">{card.visitType}</Badge>
        </div>
        <span className="text-xs font-semibold text-[#5C5A4E]">
          <Clock className="mr-1 inline h-3 w-3" aria-hidden />
          {card.waitMinutes}m wait
        </span>
      </div>

      <div>
        <h3 className="text-base font-black text-[#2B2A22]">{card.patientName}</h3>
        <p className="text-xs text-[#5C5A4E]">
          {card.age}y · {card.gender} · {card.uhid}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="font-bold uppercase text-[#A39E75]">Appointment</p>
          <p>{new Date(card.appointmentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <div>
          <p className="font-bold uppercase text-[#A39E75]">Department</p>
          <p>{card.department}</p>
        </div>
        <div className="col-span-2">
          <p className="font-bold uppercase text-[#A39E75]">Chief complaint</p>
          <p className="font-medium">{card.chiefComplaint}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className={`flex items-center gap-1 text-xs font-bold ${vitalsColor(card.vitalsStatus)}`}>
          <HeartPulse className="h-3.5 w-3.5" aria-hidden />
          Vitals {card.vitalsStatus}
        </span>
        {card.hasAllergies && (
          <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
            <AlertTriangle className="h-3 w-3" aria-hidden />
            {card.allergyList.join(', ') || 'Allergies'}
          </span>
        )}
        <span className="flex items-center gap-1 text-[10px] font-bold text-[#5C5A4E]">
          <Shield className="h-3 w-3" aria-hidden />
          {card.insuranceStatus}
        </span>
      </div>

      <div className="mt-auto flex flex-wrap gap-1.5 border-t border-[#E6E3C5]/80 pt-3">
        <Button size="sm" className={nxUi.btnPrimary} onClick={onStart} disabled={startConsult.isPending}>
          <Play className="mr-1 h-3.5 w-3.5" aria-hidden />
          Start Consultation
        </Button>
        <Link href={`/doctor/patients?patient=${card.patientId}`} className={nxUi.btnSecondary + ' inline-flex h-8 items-center rounded-md px-3 text-xs font-semibold'}>
          History
        </Link>
        <Button size="sm" variant="secondary" onClick={onMessage}>
          Message
        </Button>
        <Button size="sm" variant="secondary" onClick={() => toast.info(`Calling ${card.patientName}…`)}>
          <Phone className="h-3.5 w-3.5" aria-hidden />
        </Button>
        <Button size="sm" variant="secondary" onClick={onEmergency}>
          Emergency
        </Button>
        <Button size="sm" variant="secondary" onClick={onAdmit} disabled={requestAdmit.isPending}>
          <BedDouble className="mr-1 h-3.5 w-3.5" aria-hidden />
          Admit
        </Button>
      </div>
    </article>
  );
}

export default function CareCenterOpdPanel() {
  const { data, isLoading, isError, error } = useCareCenterOpd();
  const filter = useCareCenterStore((s) => s.filter);
  const search = useCareCenterStore((s) => s.search);

  const queue = useMemo(
    () => filterOpdQueue(data?.queue ?? [], filter, search),
    [data?.queue, filter, search],
  );

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={`${nxUi.card} h-48 animate-pulse`} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-red-600">
        {(error as Error).message}. Run npm run db:push && npm run db:seed
      </p>
    );
  }

  const stats = data!.stats;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <StatCard label="Today's OPD" value={stats.todayTotal} icon={UserRound} />
        <StatCard label="Waiting" value={stats.waiting} icon={Clock} />
        <StatCard label="Checked-In" value={stats.checkedIn} icon={Activity} />
        <StatCard label="Ongoing" value={stats.ongoing} icon={Stethoscope} />
        <StatCard label="Completed" value={stats.completed} icon={Activity} />
        <StatCard label="Follow-ups" value={stats.followUpsToday} icon={UserRound} />
        <StatCard label="Teleconsult" value={stats.teleconsultations} icon={Phone} />
        <StatCard label="Emergency Walk-ins" value={stats.emergencyWalkIns} icon={AlertTriangle} />
      </div>

      {queue.length === 0 ? (
        <div className={`${nxUi.shell} py-16 text-center`}>
          <Stethoscope className="mx-auto h-10 w-10 text-[#A39E75]/50" aria-hidden />
          <p className="mt-3 font-semibold text-[#2B2A22]">No patients match your filters</p>
          <p className="text-sm text-[#5C5A4E]">Queue updates in real time when patients check in</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {queue.map((card) => (
            <OpdPatientCard key={card.id} card={card} />
          ))}
        </div>
      )}
    </div>
  );
}
