'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, FileSignature, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { ui, statusColors } from '@/components/nexora-doctor/ui/primitives';
import { EmptyState, SectionHeader } from '@/components/nexora-doctor/ui/shared';
import { doctorUi } from '@/lib/nexora-doctor/design-tokens';
import { checkDrugAlerts, useDrugCatalog, usePatient, useTodayAppointments } from '@/lib/nexora-doctor/hooks';
import {
  addPrescriptionItem,
  removePrescriptionItem,
  useDoctorClinicalStore,
} from '@/lib/nexora-doctor/store';
import type { Vitals } from '@/lib/nexora-doctor/types';
import { completeDoctorConsultation, startDoctorConsultation } from '@/lib/nexora-doctor/workflow-actions';

export function ConsultationWorkspace() {
  const consultations = useDoctorClinicalStore((s) => s.consultations);
  const activeId = useDoctorClinicalStore((s) => s.activeConsultationId);
  const updateConsultation = useDoctorClinicalStore((s) => s.updateConsultation);
  const appointments = useTodayAppointments();
  const drugs = useDrugCatalog();

  const consultation = consultations.find((c) => c.id === activeId) ?? consultations[0];
  const patient = usePatient(consultation?.patientId ?? null);
  const appt = appointments.find((a) => a.id === consultation?.appointmentId);

  const [draft, setDraft] = useState(consultation ?? null);
  const [newDrug, setNewDrug] = useState('');
  const [newDose, setNewDose] = useState('');
  const [newFreq, setNewFreq] = useState('OD');
  const [newDuration, setNewDuration] = useState('7 days');
  const [newInstructions, setNewInstructions] = useState('');
  const [signed, setSigned] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (consultation) {
      setDraft({
        ...consultation,
        vitals: consultation.vitals ?? patient?.vitals,
      });
    }
  }, [consultation?.id, patient?.vitals]);

  useEffect(() => {
    if (!draft || !activeId) return;
    const timer = setTimeout(() => updateConsultation(activeId, draft), 800);
    return () => clearTimeout(timer);
  }, [draft, activeId, updateConsultation]);

  if (!consultation || !draft) {
    const nextAppt = appointments.find((a) => a.status === 'waiting' || a.status === 'scheduled');
    return (
      <div className={ui.page}>
        <EmptyState
          title="No active consultation"
          description="Start a consultation from the schedule or dashboard."
          action={
            nextAppt ? (
              <button
                type="button"
                className={ui.btnPrimary}
                disabled={starting}
                onClick={() => {
                  void (async () => {
                    setStarting(true);
                    const result = await startDoctorConsultation(nextAppt.id);
                    setStarting(false);
                    if (result.ok) toast.success('Consultation started · synced to Supabase');
                    else toast.error(result.error);
                  })();
                }}
              >
                {starting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Starting…
                  </>
                ) : (
                  <>Start with {nextAppt.patientName}</>
                )}
              </button>
            ) : undefined
          }
        />
      </div>
    );
  }

  const drugAlerts = newDrug ? checkDrugAlerts(patient, newDrug) : { interactions: [], allergies: [] };

  const handleAddRx = () => {
    if (!newDrug.trim()) return;
    if (drugAlerts.allergies.length > 0) {
      toast.error(`Allergy alert: ${drugAlerts.allergies.join(', ')}`);
      return;
    }
    addPrescriptionItem(consultation.id, {
      drug: newDrug,
      dose: newDose || '—',
      frequency: newFreq,
      duration: newDuration,
      instructions: newInstructions,
    });
    setDraft((d) =>
      d
        ? {
            ...d,
            prescription: [
              ...d.prescription,
              {
                id: `temp-${Date.now()}`,
                drug: newDrug,
                dose: newDose,
                frequency: newFreq,
                duration: newDuration,
                instructions: newInstructions,
              },
            ],
          }
        : d,
    );
    setNewDrug('');
    setNewDose('');
    setNewInstructions('');
    toast.success('Medication added');
  };

  const handleComplete = () => {
    if (!signed) {
      toast.error('Apply digital signature before completing');
      return;
    }
    void (async () => {
      setCompleting(true);
      updateConsultation(consultation.id, draft);
      const vitals: Vitals | undefined = draft.vitals
        ? { ...draft.vitals, recordedAt: new Date().toISOString() }
        : undefined;
      const result = await completeDoctorConsultation(consultation.id, {
        chiefComplaint: draft.subjective || appt?.chiefComplaint,
        vitals,
      });
      setCompleting(false);
      if (result.ok) toast.success('Consultation completed · EMR & Rx saved to Supabase');
      else toast.error(result.error);
    })();
  };

  const updateVitals = (field: keyof Vitals, value: string) => {
    setDraft((d) =>
      d
        ? {
            ...d,
            vitals: {
              bp: d.vitals?.bp ?? '',
              hr: d.vitals?.hr ?? '',
              temp: d.vitals?.temp ?? '',
              spo2: d.vitals?.spo2 ?? '',
              ...d.vitals,
              [field]: value,
            },
          }
        : d,
    );
  };

  return (
    <div className={ui.page}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={ui.pageTitle}>Consultation</h1>
          <p className={ui.pageSubtitle}>
            {patient?.fullName} · {patient?.mrn}
          </p>
        </div>
        <span className={`${ui.badge} ${statusColors['in-progress']}`}>In consultation</span>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <aside className="space-y-4 xl:col-span-3">
          <section className={ui.card}>
            <SectionHeader title="Patient Summary" />
            {patient && (
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-[#2C3531]/60">Age / Gender</dt>
                  <dd className="font-medium">
                    {patient.age}y · {patient.gender}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#2C3531]/60">Blood group</dt>
                  <dd>{patient.bloodGroup}</dd>
                </div>
                <div>
                  <dt className="text-[#2C3531]/60">Department</dt>
                  <dd>{appt?.chiefComplaint ?? '—'}</dd>
                </div>
              </dl>
            )}
          </section>

          <section className={doctorUi.vitalsCard}>
            <SectionHeader title="Live Vitals" />
            <div className="grid grid-cols-2 gap-2 text-sm">
              <label className="space-y-1">
                <span className="text-xs text-[#2C3531]/60">BP</span>
                <input
                  value={draft.vitals?.bp ?? ''}
                  onChange={(e) => updateVitals('bp', e.target.value)}
                  className={ui.input}
                  placeholder="120/80"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-[#2C3531]/60">HR</span>
                <input
                  value={draft.vitals?.hr ?? ''}
                  onChange={(e) => updateVitals('hr', e.target.value)}
                  className={ui.input}
                  placeholder="72 bpm"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-[#2C3531]/60">Temp</span>
                <input
                  value={draft.vitals?.temp ?? ''}
                  onChange={(e) => updateVitals('temp', e.target.value)}
                  className={ui.input}
                  placeholder="98.6°F"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-[#2C3531]/60">SpO₂</span>
                <input
                  value={draft.vitals?.spo2 ?? ''}
                  onChange={(e) => updateVitals('spo2', e.target.value)}
                  className={ui.input}
                  placeholder="98%"
                />
              </label>
            </div>
          </section>

          <section className={ui.card}>
            <SectionHeader title="Allergies" />
            {patient?.allergies.length ? (
              <div className="flex flex-wrap gap-1">
                {patient.allergies.map((a) => (
                  <span
                    key={a}
                    className="rounded-full border border-[#D96B52]/30 bg-[#FDF0ED] px-2 py-0.5 text-xs font-medium text-[#D96B52]"
                  >
                    {a}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#2C3531]/60">None recorded</p>
            )}
          </section>

          <section className={ui.card}>
            <SectionHeader title="Previous Visits" />
            <ul className="space-y-2 text-sm">
              {patient?.visits.slice(0, 4).map((v) => (
                <li key={v.id} className="rounded-lg bg-[#F4F6F0] px-3 py-2">
                  <p className="font-medium">{v.date}</p>
                  <p className="text-xs text-[#2C3531]/70">{v.summary}</p>
                </li>
              ))}
            </ul>
          </section>
        </aside>

        <div className="space-y-4 xl:col-span-6">
          <section className={ui.card}>
            <SectionHeader title="Chief Complaint" />
            <textarea
              value={draft.subjective}
              onChange={(e) => setDraft({ ...draft, subjective: e.target.value })}
              rows={3}
              className={`${ui.input} resize-none`}
              placeholder="Patient's presenting complaint…"
            />
          </section>

          <section className={ui.card}>
            <SectionHeader title="Clinical Diagnosis" />
            <input
              value={draft.diagnosis}
              onChange={(e) => setDraft({ ...draft, diagnosis: e.target.value })}
              className={ui.input}
              placeholder="ICD-10 / clinical diagnosis"
            />
            <textarea
              value={draft.assessment}
              onChange={(e) => setDraft({ ...draft, assessment: e.target.value })}
              rows={3}
              className={`${ui.input} mt-3 resize-none`}
              placeholder="Assessment notes…"
            />
          </section>

          <section className={doctorUi.rxPreview}>
            <SectionHeader title="Prescription (Rx)" />
            <ul className="mb-4 space-y-2">
              {draft.prescription.map((rx) => (
                <li
                  key={rx.id}
                  className="flex items-center justify-between rounded-lg bg-[#F4F6F0] px-3 py-2 text-sm"
                >
                  <span>
                    {rx.drug} — {rx.dose} · {rx.frequency} · {rx.duration}
                    {rx.instructions ? ` · ${rx.instructions}` : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      removePrescriptionItem(consultation.id, rx.id);
                      setDraft({
                        ...draft,
                        prescription: draft.prescription.filter((p) => p.id !== rx.id),
                      });
                    }}
                    className="text-[#D96B52]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="grid gap-2 sm:grid-cols-2">
              <select value={newDrug} onChange={(e) => setNewDrug(e.target.value)} className={ui.select}>
                <option value="">Medicine name…</option>
                {drugs.map((d) => (
                  <option key={d.id} value={d.brand}>
                    {d.brand}
                  </option>
                ))}
              </select>
              <input
                value={newDose}
                onChange={(e) => setNewDose(e.target.value)}
                placeholder="Dosage"
                className={ui.input}
              />
              <select value={newFreq} onChange={(e) => setNewFreq(e.target.value)} className={ui.select}>
                <option>OD</option>
                <option>BD</option>
                <option>TDS</option>
                <option>SOS</option>
              </select>
              <input
                value={newDuration}
                onChange={(e) => setNewDuration(e.target.value)}
                placeholder="Duration"
                className={ui.input}
              />
            </div>
            <input
              value={newInstructions}
              onChange={(e) => setNewInstructions(e.target.value)}
              placeholder="Instructions (e.g. after food)"
              className={`${ui.input} mt-2`}
            />
            {(drugAlerts.allergies.length > 0 || drugAlerts.interactions.length > 0) && (
              <div className="mt-3 rounded-lg border border-[#D96B52]/30 bg-[#FDF0ED] p-3 text-sm text-[#D96B52]">
                <AlertTriangle className="mb-1 inline h-4 w-4" /> Drug interaction / allergy warnings active
              </div>
            )}
            <button type="button" onClick={handleAddRx} className={`${ui.btnSecondary} mt-3`}>
              <Plus className="h-4 w-4" /> Add medicine
            </button>
          </section>
        </div>

        <aside className="space-y-4 xl:col-span-3">
          <section className={ui.card}>
            <SectionHeader title="Follow-up" />
            <label className="text-xs font-medium text-[#2C3531]/60">Follow-up date</label>
            <input
              type="date"
              value={draft.followUpDate ?? ''}
              onChange={(e) => setDraft({ ...draft, followUpDate: e.target.value })}
              className={`${ui.input} mt-1`}
            />
          </section>

          <section className={ui.card}>
            <SectionHeader title="Digital Signature" />
            <button
              type="button"
              onClick={() => {
                setSigned(true);
                toast.success('Digital signature applied');
              }}
              className={`${ui.btnSecondary} w-full ${signed ? 'ring-2 ring-[#4A856A]' : ''}`}
            >
              <FileSignature className="h-4 w-4" />
              {signed ? 'Signed' : 'Sign consultation'}
            </button>
          </section>

          <button
            type="button"
            onClick={handleComplete}
            disabled={completing}
            className={`${ui.btnPrimary} w-full py-3 disabled:opacity-60`}
          >
            {completing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving to Supabase…
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" /> Complete Consultation
              </>
            )}
          </button>
        </aside>
      </div>
    </div>
  );
}
