'use client';

import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  FileSignature,
  Lightbulb,
  Plus,
  Save,
  Send,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import { ui, statusColors } from '@/components/nexora-doctor/ui/primitives';
import { EmptyState, SectionHeader } from '@/components/nexora-doctor/ui/shared';
import { checkDrugAlerts, useDrugCatalog, usePatient, useTodayAppointments } from '@/lib/nexora-doctor/hooks';
import {
  addPrescriptionItem,
  removePrescriptionItem,
  useDoctorClinicalStore,
} from '@/lib/nexora-doctor/store';

export function ConsultationsWorkspace() {
  const consultations = useDoctorClinicalStore((s) => s.consultations);
  const activeId = useDoctorClinicalStore((s) => s.activeConsultationId);
  const updateConsultation = useDoctorClinicalStore((s) => s.updateConsultation);
  const completeConsultation = useDoctorClinicalStore((s) => s.completeConsultation);
  const addOrder = useDoctorClinicalStore((s) => s.addOrder);
  const startConsultation = useDoctorClinicalStore((s) => s.startConsultation);
  const appointments = useTodayAppointments();
  const drugs = useDrugCatalog();

  const consultation = consultations.find((c) => c.id === activeId) ?? consultations[0];
  const patient = usePatient(consultation?.patientId ?? null);

  const [draft, setDraft] = useState(consultation ?? null);
  const [newDrug, setNewDrug] = useState('');
  const [newDose, setNewDose] = useState('');
  const [newFreq, setNewFreq] = useState('OD');
  const [autoSaved, setAutoSaved] = useState(false);

  useEffect(() => {
    if (consultation) setDraft(consultation);
  }, [consultation?.id]);

  useEffect(() => {
    if (!draft || !activeId) return;
    const timer = setTimeout(() => {
      updateConsultation(activeId, draft);
      setAutoSaved(true);
      setTimeout(() => setAutoSaved(false), 2000);
    }, 800);
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
                onClick={() => {
                  startConsultation(nextAppt.id);
                  toast.success('Consultation started');
                }}
              >
                Start with {nextAppt.patientName}
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
      duration: '7 days',
    });
    setDraft((d) =>
      d
        ? {
            ...d,
            prescription: [
              ...d.prescription,
              { id: `temp-${Date.now()}`, drug: newDrug, dose: newDose, frequency: newFreq, duration: '7 days' },
            ],
          }
        : d,
    );
    setNewDrug('');
    setNewDose('');
    toast.success('Medication added');
  };

  const handleComplete = () => {
    updateConsultation(consultation.id, draft);
    completeConsultation(consultation.id);
    toast.success('Consultation completed · EMR & pharmacy updated');
  };

  const handleFollowUp = () => {
    addOrder({
      type: 'procedure',
      patientId: consultation.patientId,
      patientName: patient?.fullName ?? 'Patient',
      title: 'Follow-up appointment scheduled',
      department: 'OPD',
      status: 'pending',
    });
    toast.success('Follow-up scheduled');
  };

  const handleAdmission = () => {
    addOrder({
      type: 'admission',
      patientId: consultation.patientId,
      patientName: patient?.fullName ?? 'Patient',
      title: 'Admission request',
      department: 'Admissions',
      status: 'pending',
    });
    toast.success('Admission request sent');
  };

  return (
    <div className={ui.page}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={ui.pageTitle}>Consultation</h1>
          <p className={ui.pageSubtitle}>
            {patient?.fullName} · {patient?.mrn}
            {autoSaved && <span className="ml-2 text-teal-600">· Saved</span>}
          </p>
        </div>
        <span className={`${ui.badge} ${statusColors[draft.status]}`}>{draft.status}</span>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        {/* LEFT — Patient Summary */}
        <aside className="space-y-4 xl:col-span-3">
          <section className={ui.card}>
            <SectionHeader title="Patient Summary" />
            {patient && (
              <div className="space-y-3 text-sm">
                <p><span className="text-slate-500">Age/Gender:</span> {patient.age}y · {patient.gender}</p>
                <p><span className="text-slate-500">Blood:</span> {patient.bloodGroup}</p>
                <p><span className="text-slate-500">Diagnosis:</span> {patient.diagnosis ?? '—'}</p>
              </div>
            )}
          </section>
          <section className={ui.card}>
            <SectionHeader title="Vitals" />
            {patient && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <p>BP {patient.vitals.bp}</p>
                <p>HR {patient.vitals.hr}</p>
                <p>Temp {patient.vitals.temp}</p>
                <p>SpO₂ {patient.vitals.spo2}</p>
              </div>
            )}
          </section>
          <section className={ui.card}>
            <SectionHeader title="History" />
            <p className="text-sm text-slate-600">{patient?.chronicConditions.join(', ') || 'None'}</p>
            {patient?.allergies.length ? (
              <div className="mt-2 flex flex-wrap gap-1">
                {patient.allergies.map((a) => (
                  <span key={a} className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-700">{a}</span>
                ))}
              </div>
            ) : null}
          </section>
        </aside>

        {/* CENTER — SOAP & Rx */}
        <div className="space-y-4 xl:col-span-6">
          {(['subjective', 'objective', 'assessment', 'plan'] as const).map((field) => (
            <section key={field} className={ui.card}>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                {field === 'subjective' ? 'S — Subjective' : field === 'objective' ? 'O — Objective' : field === 'assessment' ? 'A — Assessment' : 'P — Plan'}
              </label>
              <textarea
                value={draft[field]}
                onChange={(e) => setDraft({ ...draft, [field]: e.target.value })}
                rows={3}
                className={`${ui.input} resize-none`}
                placeholder={`Enter ${field} notes…`}
              />
            </section>
          ))}

          <section className={ui.card}>
            <SectionHeader title="Diagnosis" />
            <input
              value={draft.diagnosis}
              onChange={(e) => setDraft({ ...draft, diagnosis: e.target.value })}
              className={ui.input}
              placeholder="ICD-10 / clinical diagnosis"
            />
          </section>

          <section className={ui.card}>
            <SectionHeader title="Treatment Plan" />
            <textarea
              value={draft.treatmentPlan}
              onChange={(e) => setDraft({ ...draft, treatmentPlan: e.target.value })}
              rows={2}
              className={`${ui.input} resize-none`}
            />
          </section>

          <section className={ui.card}>
            <SectionHeader title="Prescription" />
            <ul className="mb-4 space-y-2">
              {draft.prescription.map((rx) => (
                <li key={rx.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <span>{rx.drug} — {rx.dose} {rx.frequency} × {rx.duration}</span>
                  <button type="button" onClick={() => { removePrescriptionItem(consultation.id, rx.id); setDraft({ ...draft, prescription: draft.prescription.filter((p) => p.id !== rx.id) }); }} className="text-red-500 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              <select value={newDrug} onChange={(e) => setNewDrug(e.target.value)} className={ui.select}>
                <option value="">Select drug…</option>
                {drugs.map((d) => <option key={d.id} value={d.brand}>{d.brand}</option>)}
              </select>
              <input value={newDose} onChange={(e) => setNewDose(e.target.value)} placeholder="Dose" className={`${ui.input} w-24`} />
              <select value={newFreq} onChange={(e) => setNewFreq(e.target.value)} className={ui.select}>
                <option>OD</option><option>BD</option><option>TDS</option><option>SOS</option>
              </select>
              <button type="button" onClick={handleAddRx} className={ui.btnSecondary}><Plus className="h-4 w-4" /> Add</button>
            </div>
          </section>
        </div>

        {/* RIGHT — AI & Actions */}
        <aside className="space-y-4 xl:col-span-3">
          <section className={ui.card}>
            <SectionHeader title="AI Suggestions" />
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2"><Lightbulb className="mt-0.5 h-4 w-4 text-amber-500" /> Consider HbA1c if not done in 3 months</li>
              <li className="flex items-start gap-2"><Lightbulb className="mt-0.5 h-4 w-4 text-amber-500" /> Review medication adherence</li>
            </ul>
          </section>

          {(drugAlerts.allergies.length > 0 || drugAlerts.interactions.length > 0) && (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <SectionHeader title="Alerts" />
              {drugAlerts.allergies.map((a) => (
                <p key={a} className="flex items-center gap-1 text-sm text-red-700"><AlertTriangle className="h-4 w-4" /> Allergy: {a}</p>
              ))}
              {drugAlerts.interactions.map((i) => (
                <p key={i} className="flex items-center gap-1 text-sm text-amber-800"><AlertTriangle className="h-4 w-4" /> Interaction: {i}</p>
              ))}
            </section>
          )}

          <section className={ui.card}>
            <SectionHeader title="Actions" />
            <div className="space-y-2">
              <button type="button" onClick={() => { updateConsultation(consultation.id, draft); toast.success('Draft saved'); }} className={`${ui.btnSecondary} w-full`}>
                <Save className="h-4 w-4" /> Save Draft
              </button>
              <button type="button" onClick={handleComplete} className={`${ui.btnPrimary} w-full`}>
                <CheckCircle className="h-4 w-4" /> Complete Consultation
              </button>
              <button type="button" onClick={handleFollowUp} className={`${ui.btnSecondary} w-full`}>Schedule Follow-up</button>
              <button type="button" onClick={handleAdmission} className={`${ui.btnSecondary} w-full`}>Request Admission</button>
              <button type="button" onClick={() => toast.success('Referral letter generated')} className={`${ui.btnSecondary} w-full`}>
                <Send className="h-4 w-4" /> Referral
              </button>
              <button type="button" onClick={() => toast.success('Medical certificate issued')} className={`${ui.btnSecondary} w-full`}>
                <FileSignature className="h-4 w-4" /> Medical Certificate
              </button>
              <button type="button" onClick={() => toast.success('Digital signature applied')} className={`${ui.btnSecondary} w-full`}>
                <FileSignature className="h-4 w-4" /> Digital Signature
              </button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
