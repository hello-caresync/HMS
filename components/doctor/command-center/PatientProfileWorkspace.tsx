'use client';

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  FileText,
  Heart,
  Loader2,
  Stethoscope,
} from 'lucide-react';
import VitalsTrackerCard from '@/components/doctor/VitalsTrackerCard';
import {
  usePatientEncounters,
  usePatientLabOrders,
  usePatientSearch,
} from '@/lib/doctor/command-center/hooks';
import { ccClasses } from '@/lib/doctor/command-center/theme';

const TABS = ['Overview', 'Vitals', 'Encounters', 'Diagnostics'] as const;

function labStatusColor(status: string) {
  if (status === 'REPORT_READY') return 'text-[#2E8B70]';
  if (status === 'PROCESSING') return 'text-[#E9A23B]';
  return 'text-[#20639B]';
}

export function PatientProfileWorkspace({ patientId }: { patientId: string }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Overview');
  const { data: patients = [], isLoading } = usePatientSearch('');
  const { data: encounters } = usePatientEncounters(patientId);
  const { data: labOrders = [] } = usePatientLabOrders(patientId);
  const patient = useMemo(() => patients.find((p) => p.id === patientId), [patients, patientId]);

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center gap-2 text-sm font-semibold text-[#5A7A94]">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading profile…
      </div>
    );
  }

  if (!patient) {
    return (
      <div className={`p-8 text-center ${ccClasses.card}`}>
        <p className="font-black text-[#173F5F]">Patient not found</p>
      </div>
    );
  }

  const chronicList = patient.chronic_conditions
    ? patient.chronic_conditions.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="space-y-6">
      <header className={`p-6 ${ccClasses.card}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#2A9D8F]">360° Clinical Profile</p>
            <h1 className="mt-1 text-2xl font-black text-[#173F5F]">{patient.full_name}</h1>
            <p className="text-sm font-semibold text-[#5A7A94]">
              {patient.id.slice(0, 8).toUpperCase()} · {patient.age || '—'} yrs · {patient.gender || '—'} · BG{' '}
              {patient.blood_group || '—'}
            </p>
          </div>
        </div>
        {patient.allergies ? (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#D9534F]/30 bg-[#D9534F]/10 px-4 py-3 text-sm font-black text-[#D9534F]">
            <AlertTriangle className="h-4 w-4" /> DRUG ALLERGIES: {patient.allergies}
          </div>
        ) : null}
      </header>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-xl px-4 py-2 text-xs font-black transition ${
              tab === t ? 'bg-[#173F5F] text-white' : 'bg-white text-[#173F5F] border border-[#E8F1F8]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className={`p-5 ${ccClasses.card}`}>
            <h2 className="flex items-center gap-2 font-black text-[#173F5F]">
              <Heart className="h-4 w-4 text-[#D9534F]" /> Chronic Conditions
            </h2>
            <ul className="mt-3 space-y-1 text-sm font-semibold text-[#5A7A94]">
              {(chronicList.length ? chronicList : ['None recorded']).map((c) => (
                <li key={c}>• {c}</li>
              ))}
            </ul>
          </div>
          <div className={`p-5 ${ccClasses.card}`}>
            <h2 className="font-black text-[#173F5F]">Emergency Contact</h2>
            <p className="mt-3 text-sm font-semibold text-[#5A7A94]">
              {patient.emergency_contact_name || 'Not on file'}
              {patient.emergency_contact_phone ? ` · ${patient.emergency_contact_phone}` : ''}
            </p>
          </div>
        </div>
      )}

      {tab === 'Vitals' && <VitalsTrackerCard />}

      {tab === 'Encounters' && (
        <div className={`space-y-3 p-5 ${ccClasses.card}`}>
          <h2 className="flex items-center gap-2 font-black text-[#173F5F]">
            <Stethoscope className="h-4 w-4" /> Encounter History
          </h2>
          {encounters?.consultations?.length ? (
            encounters.consultations.map((c: Record<string, unknown>) => (
              <article key={String(c.id)} className={`p-4 ${ccClasses.cardSoft}`}>
                <p className="text-xs font-black text-[#20639B]">
                  {String(c.created_at || '').slice(0, 10)}
                </p>
                <p className="font-black text-[#173F5F]">{String(c.chief_complaint || 'Consultation')}</p>
                <p className="text-xs font-semibold text-[#5A7A94]">{String(c.doctor_notes || '')}</p>
              </article>
            ))
          ) : (
            <p className="text-sm font-semibold text-[#5A7A94]">No consultations on record yet.</p>
          )}
        </div>
      )}

      {tab === 'Diagnostics' && (
        <div className={`space-y-3 p-5 ${ccClasses.card}`}>
          <h2 className="flex items-center gap-2 font-black text-[#173F5F]">
            <FileText className="h-4 w-4" /> Lab & Radiology Repository
          </h2>
          {labOrders.length ? (
            labOrders.map((order: Record<string, unknown>) => (
              <article key={String(order.id)} className={`p-4 ${ccClasses.cardSoft}`}>
                <div className="flex items-center justify-between">
                  <p className="font-black text-[#173F5F]">
                    {(order.test_names as string[])?.join(', ') || 'Diagnostic order'}
                  </p>
                  <span className={`text-xs font-black ${labStatusColor(String(order.status))}`}>
                    {String(order.status)}
                  </span>
                </div>
                {order.report_url ? (
                  <a
                    href={String(order.report_url)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-xs font-bold text-[#20639B] underline"
                  >
                    View report
                  </a>
                ) : null}
              </article>
            ))
          ) : (
            <p className="text-sm font-semibold text-[#5A7A94]">No lab orders on file.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default PatientProfileWorkspace;
