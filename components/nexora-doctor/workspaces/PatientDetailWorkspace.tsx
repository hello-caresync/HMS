'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, Play, ScrollText } from 'lucide-react';
import { toast } from 'sonner';

import { ui } from '@/components/nexora-doctor/ui/primitives';
import { SectionHeader } from '@/components/nexora-doctor/ui/shared';
import { usePatient, useTodayAppointments } from '@/lib/nexora-doctor/hooks';
import { useDoctorClinicalStore } from '@/lib/nexora-doctor/store';
import { startDoctorConsultation } from '@/lib/nexora-doctor/workflow-actions';

const TABS = [
  'Personal Info',
  'Medical History',
  'Previous Visits',
  'Allergies',
  'Current Medicines',
  'Recent Reports',
  'Visit Timeline',
] as const;

type Tab = (typeof TABS)[number];

export function PatientDetailWorkspace({ patientId }: { patientId: string }) {
  const router = useRouter();
  const patient = usePatient(patientId);
  const appointments = useTodayAppointments();
  const prescriptions = useDoctorClinicalStore((s) => s.prescriptions);
  const [tab, setTab] = useState<Tab>('Personal Info');
  const [starting, setStarting] = useState(false);

  const appt = appointments.find((a) => a.patientId === patientId);
  const patientRx = prescriptions.filter((p) => p.patientId === patientId);

  if (!patient) {
    return (
      <div className={ui.page}>
        <p className="text-[#2C3531]/60">Patient not found.</p>
        <Link href="/doctor/patients" className={ui.link}>
          Back to patients
        </Link>
      </div>
    );
  }

  const handleStart = async () => {
    if (!appt) {
      toast.info('No appointment scheduled today');
      return;
    }
    setStarting(true);
    const result = await startDoctorConsultation(appt.id);
    setStarting(false);
    if (result.ok) router.push('/doctor/consultation');
    else toast.error(result.error);
  };

  return (
    <div className={ui.page}>
      <Link href="/doctor/patients" className={`${ui.link} mb-4 inline-flex items-center gap-1`}>
        <ArrowLeft className="h-4 w-4" /> Back to patients
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7A9A8B] text-xl font-bold text-white">
            {patient.fullName
              .split(' ')
              .slice(0, 2)
              .map((s) => s[0])
              .join('')}
          </div>
          <div>
            <h1 className={ui.pageTitle}>{patient.fullName}</h1>
            <p className={ui.pageSubtitle}>
              {patient.mrn} · {patient.age}y · {patient.gender} · {patient.bloodGroup}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void handleStart()} disabled={starting} className={`${ui.btnPrimary} disabled:opacity-60`}>
            <Play className="h-4 w-4" /> {starting ? 'Starting…' : 'Start Consultation'}
          </button>
          <Link href={`/doctor/prescriptions?patient=${patientId}`} className={ui.btnSecondary}>
            <ScrollText className="h-4 w-4" /> New Prescription
          </Link>
          <Link href={`/doctor/prescriptions?patient=${patientId}`} className={ui.btnSecondary}>
            View Prescriptions
          </Link>
        </div>
      </div>

      <nav className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-xl px-3 py-2 text-xs font-medium ${
              tab === t
                ? 'bg-[#7A9A8B] text-white'
                : 'border border-[#E2E8E0] bg-[#FAFCF8] text-[#2C3531]'
            }`}
          >
            {t}
          </button>
        ))}
      </nav>

      <section className={ui.card}>
        {tab === 'Personal Info' && (
          <dl className="grid gap-4 sm:grid-cols-2 text-sm">
            <div>
              <dt className="text-[#2C3531]/60">Phone</dt>
              <dd>{patient.phone ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-[#2C3531]/60">Email</dt>
              <dd>{patient.email ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-[#2C3531]/60">Diagnosis</dt>
              <dd>{patient.diagnosis ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-[#2C3531]/60">Vitals</dt>
              <dd>
                BP {patient.vitals.bp} · HR {patient.vitals.hr} · SpO₂ {patient.vitals.spo2}
              </dd>
            </div>
          </dl>
        )}

        {tab === 'Medical History' && (
          <p className="text-sm">{patient.chronicConditions.join(', ') || 'No chronic conditions recorded'}</p>
        )}

        {tab === 'Previous Visits' && (
          <ul className="space-y-3 text-sm">
            {patient.visits.map((v) => (
              <li key={v.id} className="rounded-lg bg-[#F4F6F0] px-3 py-2">
                <p className="font-medium">
                  {v.date} · {v.type}
                </p>
                <p className="text-[#2C3531]/70">{v.summary}</p>
              </li>
            ))}
          </ul>
        )}

        {tab === 'Allergies' && (
          <div className="flex flex-wrap gap-2">
            {patient.allergies.map((a) => (
              <span
                key={a}
                className="rounded-full border border-[#D96B52]/30 bg-[#FDF0ED] px-3 py-1 text-sm text-[#D96B52]"
              >
                {a}
              </span>
            ))}
          </div>
        )}

        {tab === 'Current Medicines' && (
          <ul className="space-y-2 text-sm">
            {patient.medications.map((m) => (
              <li key={m.id}>
                {m.name} — {m.dose} · {m.frequency} (since {m.since})
              </li>
            ))}
          </ul>
        )}

        {tab === 'Recent Reports' && (
          <div className="space-y-4 text-sm">
            <div>
              <SectionHeader title="Lab" />
              {patient.labReports.map((r) => (
                <p key={r.id}>
                  {r.test}: {r.result} ({r.status})
                </p>
              ))}
            </div>
            <div>
              <SectionHeader title="Radiology" />
              {patient.radiologyReports.map((r) => (
                <p key={r.id}>
                  {r.study}: {r.findings}
                </p>
              ))}
            </div>
          </div>
        )}

        {tab === 'Visit Timeline' && (
          <ul className="space-y-3 border-l-2 border-[#7A9A8B]/30 pl-4 text-sm">
            {patient.visits.map((v) => (
              <li key={v.id}>
                <p className="font-medium">{v.date}</p>
                <p className="text-[#2C3531]/70">{v.doctor} — {v.summary}</p>
              </li>
            ))}
            {patientRx.map((rx) => (
              <li key={rx.id}>
                <p className="font-medium">{new Date(rx.issuedAt).toLocaleDateString()} · Prescription</p>
                <p className="text-[#2C3531]/70">{rx.medicines.map((m) => m.drug).join(', ')}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
