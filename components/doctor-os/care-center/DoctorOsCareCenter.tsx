'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  BedDouble,
  Clock,
  HeartPulse,
  Phone,
  Play,
  Shield,
  Video,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  OsBadge,
  OsBtn,
  OsEmpty,
  OsPage,
  OsSegment,
  OsSkeleton,
  OsWidget,
} from '@/components/doctor-os/ui/OsPrimitives';
import {
  useCareCenterIpd,
  useCareCenterOpd,
  useStartCareCenterConsultation,
} from '@/lib/doctor/hooks/useCareCenter';
import { useEmergencyCases, type EmergencyCaseDto } from '@/lib/doctor/hooks/useClinicalQueries';
import type { IpdPatientCard, OpdQueueCard } from '@/lib/doctor/types/care-center-dto';
import { useOsColors } from '@/lib/doctor-os/store';

type Tab = 'opd' | 'ipd' | 'tele' | 'emergency' | 'followups';

function PatientCard({
  variant,
  data,
  onStart,
}: {
  variant: 'opd' | 'ipd';
  data: OpdQueueCard | IpdPatientCard;
  onStart?: () => void;
}) {
  const c = useOsColors();

  if (variant === 'opd') {
    const card = data as OpdQueueCard;
    const priorityTone = card.priority === 'STAT' ? 'critical' : card.priority === 'Urgent' ? 'warning' : 'default';
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl border p-4 transition-shadow hover:shadow-lg"
        style={{ backgroundColor: c.surface, borderColor: c.border }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="rounded-lg px-2 py-1 text-[11px] font-bold tabular-nums" style={{ backgroundColor: c.accentSoft, color: c.accent }}>
              {card.token}
            </span>
            <OsBadge tone={priorityTone}>{card.priority}</OsBadge>
            <OsBadge tone="info">{card.visitType}</OsBadge>
          </div>
          <span className="flex items-center gap-1 text-[11px] font-semibold tabular-nums" style={{ color: c.textSecondary }}>
            <Clock className="h-3 w-3" /> {card.waitMinutes}m
          </span>
        </div>
        <h3 className="mt-2 text-[16px] font-bold tracking-tight">{card.patientName}</h3>
        <p className="text-[12px]" style={{ color: c.textSecondary }}>{card.age}y · {card.gender} · {card.uhid}</p>
        <p className="mt-2 text-[13px] font-medium">{card.chiefComplaint}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: card.vitalsStatus === 'critical' ? c.critical : c.success }}>
            <HeartPulse className="h-3 w-3" /> Vitals {card.vitalsStatus}
          </span>
          {card.hasAllergies && (
            <OsBadge tone="critical"><AlertTriangle className="mr-0.5 h-2.5 w-2.5" /> {card.allergyList[0] ?? 'Allergies'}</OsBadge>
          )}
          <OsBadge tone="default"><Shield className="mr-0.5 h-2.5 w-2.5" /> {card.insuranceStatus}</OsBadge>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 border-t pt-3" style={{ borderColor: c.border }}>
          <OsBtn size="sm" onClick={onStart}><Play className="h-3 w-3" /> Start</OsBtn>
          <OsBtn size="sm" variant="secondary" href={`/doctor/patients?patient=${card.patientId}`}>Chart</OsBtn>
          <OsBtn size="sm" variant="ghost" onClick={() => toast.info(`Calling ${card.patientName}`)}><Phone className="h-3 w-3" /></OsBtn>
          <OsBtn size="sm" variant="ghost" href="/doctor/clinical">Consult</OsBtn>
        </div>
      </motion.div>
    );
  }

  const p = data as IpdPatientCard;
  const riskTone = p.riskLevel === 'critical' || p.riskLevel === 'high' ? 'critical' : p.riskLevel === 'moderate' ? 'warning' : 'success';
  return (
    <motion.div
      layout
      className="rounded-2xl border p-4"
      style={{ backgroundColor: c.surface, borderColor: c.border }}
    >
      <div className="flex justify-between">
        <div className="flex items-center gap-2">
          <BedDouble className="h-4 w-4" style={{ color: c.accent }} />
          <span className="font-bold">{p.ward} · Bed {p.bed}</span>
        </div>
        <OsBadge tone={riskTone}>{p.riskLevel}</OsBadge>
      </div>
      <h3 className="mt-2 text-[16px] font-bold">{p.patient.fullName}</h3>
      <p className="text-[12px]" style={{ color: c.textSecondary }}>LOS {p.losDays}d · {p.primaryDiagnosis}</p>
      <p className="mt-1 text-[12px]">{p.currentCondition}</p>
      <div className="mt-4 flex gap-2">
        <OsBtn size="sm" href={`/doctor/clinical?admission=${p.id}`}>Round</OsBtn>
        <OsBtn size="sm" variant="secondary" href={`/doctor/patients?patient=${p.patientId}`}>Chart</OsBtn>
      </div>
    </motion.div>
  );
}

export default function DoctorOsCareCenter() {
  const [tab, setTab] = useState<Tab>('opd');
  const c = useOsColors();
  const { data: opdData, isLoading: opdLoading } = useCareCenterOpd();
  const { data: ipdData, isLoading: ipdLoading } = useCareCenterIpd();
  const { data: erData } = useEmergencyCases();
  const startConsult = useStartCareCenterConsultation();

  const opdQueue = opdData?.queue ?? [];
  const ipdPatients = ipdData?.patients ?? [];
  const followUps = useMemo(() => opdQueue.filter((q) => q.visitType === 'Follow-up'), [opdQueue]);
  const tele = useMemo(() => opdQueue.filter((q) => q.visitType === 'Teleconsult'), [opdQueue]);

  const handleStart = (card: OpdQueueCard) => {
    startConsult.mutate(card.id, {
      onSuccess: () => {
        toast.success('Consultation started');
        window.location.href = `/doctor/clinical?appointment=${card.id}&patient=${card.patientId}`;
      },
      onError: (e) => toast.error(e.message),
    });
  };

  return (
    <OsPage>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: c.accent }}>Primary workspace</p>
          <h1 className="text-[24px] font-bold tracking-[-0.03em]">Care Center</h1>
        </div>
        <OsSegment
          value={tab}
          onChange={(id) => setTab(id as Tab)}
          options={[
            { id: 'opd', label: 'OPD' },
            { id: 'ipd', label: 'IPD' },
            { id: 'tele', label: 'Teleconsult' },
            { id: 'emergency', label: 'Emergency' },
            { id: 'followups', label: 'Follow-ups' },
          ]}
        />
      </div>

      {tab === 'opd' && (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {opdData?.stats && Object.entries({
              Today: opdData.stats.todayTotal,
              Waiting: opdData.stats.waiting,
              Ongoing: opdData.stats.ongoing,
              Done: opdData.stats.completed,
            }).map(([k, v]) => (
              <div key={k} className="rounded-xl border p-3 text-center" style={{ borderColor: c.border, backgroundColor: c.surface }}>
                <p className="text-[22px] font-bold tabular-nums">{v}</p>
                <p className="text-[10px] font-medium uppercase" style={{ color: c.textSecondary }}>{k}</p>
              </div>
            ))}
          </div>
          {opdLoading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[1, 2, 3].map((i) => <OsSkeleton key={i} className="h-48" />)}</div>
          ) : opdQueue.length === 0 ? (
            <OsEmpty title="Queue empty" description="Patients appear when they check in." icon={Clock} />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {opdQueue.map((card) => (
                <PatientCard key={card.id} variant="opd" data={card} onStart={() => handleStart(card)} />
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'ipd' && (
        <>
          {ipdLoading ? (
            <OsSkeleton className="h-64" />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {ipdPatients.map((p) => (
                <PatientCard key={p.id} variant="ipd" data={p} />
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'tele' && (
        <div className="grid gap-4 md:grid-cols-2">
          {tele.length === 0 ? (
            <OsWidget title="Teleconsultation"><OsEmpty title="No teleconsults" description="Scheduled virtual visits appear here." icon={Video} /></OsWidget>
          ) : (
            tele.map((card) => <PatientCard key={card.id} variant="opd" data={card} onStart={() => handleStart(card)} />)
          )}
          <OsWidget title="Join virtual room">
            <OsBtn href="/doctor/communication?tab=tele"><Video className="h-4 w-4" /> Open teleconsult hub</OsBtn>
          </OsWidget>
        </div>
      )}

      {tab === 'emergency' && (
        <div className="space-y-3">
          {(erData?.cases ?? []).map((e: EmergencyCaseDto) => (
            <div key={e.id} className="flex items-center justify-between rounded-2xl border p-4" style={{ borderColor: c.critical, backgroundColor: `${c.critical}08` }}>
              <div>
                <OsBadge tone="critical">ESI {e.esiLevel}</OsBadge>
                <p className="mt-1 font-bold">{e.patientName}</p>
                <p className="text-[12px]" style={{ color: c.textSecondary }}>{e.presentation} · {e.bay}</p>
              </div>
              <OsBtn href="/doctor/emergency" variant="critical">Respond</OsBtn>
            </div>
          ))}
        </div>
      )}

      {tab === 'followups' && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {followUps.map((card) => (
            <PatientCard key={card.id} variant="opd" data={card} onStart={() => handleStart(card)} />
          ))}
        </div>
      )}
    </OsPage>
  );
}
