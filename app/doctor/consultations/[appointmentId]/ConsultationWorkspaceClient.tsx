'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

import {
  DEFAULT_ACTIVE_DOCTOR_ID,
  DEFAULT_ACTIVE_DOCTOR_NAME,
  DEFAULT_PATIENT_ID,
  fetchConsultationAppointmentContext,
  finalizeConsultationAndPrescription,
  formatConsultationSaveError,
  type ConsultationAppointmentContext,
  type ConsultationMedicationItem,
} from '@/lib/doctor/command-center/supabase-service';

interface MedicationRow extends ConsultationMedicationItem {
  id: string;
}

const emptyMed = (): MedicationRow => ({
  id: crypto.randomUUID(),
  name: '',
  dosage: '1 tablet',
  frequency: '1-0-1',
  duration: '5 days',
  instructions: 'After food',
});

interface ConsultationWorkspaceClientProps {
  /** Used when served via Cloudflare SPA rewrite (`/doctor/consultations/index.html`). */
  appointmentIdOverride?: string;
}

export default function ConsultationWorkspaceClient({
  appointmentIdOverride,
}: ConsultationWorkspaceClientProps = {}) {
  const router = useRouter();
  const params = useParams<{ appointmentId: string }>();
  const appointmentId = appointmentIdOverride ?? params.appointmentId;

  const [appointment, setAppointment] = useState<ConsultationAppointmentContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [temperature, setTemperature] = useState('98.6');
  const [bpSystolic, setBpSystolic] = useState('120');
  const [bpDiastolic, setBpDiastolic] = useState('80');
  const [pulse, setPulse] = useState('72');
  const [spo2, setSpo2] = useState('98');
  const [weight, setWeight] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [clinicalFindings, setClinicalFindings] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [medications, setMedications] = useState<MedicationRow[]>([emptyMed()]);

  useEffect(() => {
    if (!appointmentId) return;

    let cancelled = false;

    async function loadContext() {
      setLoading(true);
      try {
        const ctx = await fetchConsultationAppointmentContext(appointmentId);
        if (cancelled) return;

        if (!ctx) {
          toast.error('Could not load appointment context for this consultation.');
          return;
        }

        setAppointment(ctx);
        setChiefComplaint(ctx.reason || '');
      } catch (err: unknown) {
        console.error('[Consultation Load Error]:', err);
        toast.error(`Failed to load consultation: ${formatConsultationSaveError(err)}`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadContext();
    return () => {
      cancelled = true;
    };
  }, [appointmentId]);

  const updateMed = (id: string, field: keyof ConsultationMedicationItem, value: string) => {
    setMedications((prev) =>
      prev.map((med) => (med.id === id ? { ...med, [field]: value } : med)),
    );
  };

  const handleFinalizeConsultation = async () => {
    if (!appointment) return;

    const doctorId = appointment.doctor_id || DEFAULT_ACTIVE_DOCTOR_ID;
    const patientId = appointment.patient_id || DEFAULT_PATIENT_ID;

    if (!diagnosis.trim() || !chiefComplaint.trim()) {
      toast.error('Chief complaint and diagnosis are required.');
      return;
    }

    setSaving(true);
    try {
      await finalizeConsultationAndPrescription({
        appointmentId,
        doctorId,
        patientId,
        patientName: appointment.patient_name,
        doctorName: DEFAULT_ACTIVE_DOCTOR_NAME,
        clinical: {
          chief_complaint: chiefComplaint,
          clinical_findings: clinicalFindings,
          diagnosis,
          clinical_notes: clinicalNotes,
          follow_up_date: followUpDate || null,
        },
        vitals: {
          temperature_f: temperature ? Number(temperature) : null,
          bp_systolic: bpSystolic ? Number(bpSystolic) : null,
          bp_diastolic: bpDiastolic ? Number(bpDiastolic) : null,
          pulse_bpm: pulse ? Number(pulse) : null,
          spo2_percent: spo2 ? Number(spo2) : null,
          weight_kg: weight ? Number(weight) : null,
        },
        medications: medications.map(({ id: _id, ...med }) => med),
        special_instructions: clinicalNotes || undefined,
      });

      toast.success('Prescription finalized and sent to patient!');
      router.push('/doctor/dashboard');
    } catch (err: unknown) {
      console.error('[Consultation Save Error]:', err);
      const errorMessage = formatConsultationSaveError(err);
      toast.error(`Error saving consultation: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-500">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
        Loading consultation workspace...
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="mx-auto max-w-3xl p-6 text-center">
        <p className="text-slate-600">Appointment not found or could not be loaded.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wider text-teal-600">
          Clinical Consultation Workspace
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          {appointment.patient_name || 'Patient'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {appointment.patient_gender ?? '—'} · Age {appointment.patient_age ?? '—'} · BG{' '}
          {appointment.blood_group ?? 'N/A'}
        </p>
        {appointment.reason && (
          <p className="mt-2 text-sm text-slate-600">
            <span className="font-semibold">Chief Complaint:</span> {appointment.reason}
          </p>
        )}
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">Vitals</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
          {[
            { label: 'Temp (°F)', value: temperature, set: setTemperature },
            { label: 'BP Sys', value: bpSystolic, set: setBpSystolic },
            { label: 'BP Dia', value: bpDiastolic, set: setBpDiastolic },
            { label: 'Pulse', value: pulse, set: setPulse },
            { label: 'SpO₂ (%)', value: spo2, set: setSpo2 },
            { label: 'Weight (kg)', value: weight, set: setWeight },
          ].map(({ label, value, set }) => (
            <div key={label}>
              <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">
                {label}
              </label>
              <input
                type="number"
                value={value}
                onChange={(e) => set(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">
          Clinical Notes
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            required
            placeholder="Chief complaint"
            value={chiefComplaint}
            onChange={(e) => setChiefComplaint(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm sm:col-span-2"
          />
          <input
            required
            placeholder="Diagnosis"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <textarea
            placeholder="Clinical findings"
            value={clinicalFindings}
            onChange={(e) => setClinicalFindings(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm sm:col-span-2"
            rows={2}
          />
          <textarea
            placeholder="Doctor notes / instructions"
            value={clinicalNotes}
            onChange={(e) => setClinicalNotes(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm sm:col-span-2"
            rows={2}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
            Prescription
          </h2>
          <button
            type="button"
            onClick={() => setMedications((prev) => [...prev, emptyMed()])}
            className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-800"
          >
            <Plus className="h-3 w-3" /> Add medicine
          </button>
        </div>
        <div className="space-y-3">
          {medications.map((med) => (
            <div
              key={med.id}
              className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-5"
            >
              <input
                placeholder="Medicine name"
                value={med.name}
                onChange={(e) => updateMed(med.id, 'name', e.target.value)}
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm sm:col-span-2"
              />
              <input
                placeholder="Dosage"
                value={med.dosage}
                onChange={(e) => updateMed(med.id, 'dosage', e.target.value)}
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              />
              <input
                placeholder="Frequency"
                value={med.frequency}
                onChange={(e) => updateMed(med.id, 'frequency', e.target.value)}
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              />
              <input
                placeholder="Duration"
                value={med.duration}
                onChange={(e) => updateMed(med.id, 'duration', e.target.value)}
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              />
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push('/doctor/dashboard')}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => void handleFinalizeConsultation()}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Finalize &amp; Send to Patient
        </button>
      </div>
    </div>
  );
}
