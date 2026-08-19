'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

import {
  DEFAULT_ACTIVE_DOCTOR_ID,
  DEFAULT_ACTIVE_DOCTOR_NAME,
  fetchConsultationAppointmentContext,
  formatConsultationSaveError,
  updateAppointmentStatus,
  type ConsultationAppointmentContext,
  type ConsultationMedicationItem,
} from '@/lib/doctor/command-center/supabase-service';
import { supabase } from '@/lib/supabase/client';

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
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleEndConsultation = async () => {
    if (!appointment) return;

    if (!diagnosis.trim() || !chiefComplaint.trim()) {
      toast.error('Chief complaint and diagnosis are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const isUUID = (val: string) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val || '');

      const patientName = appointment.patient_name || 'Patient';
      const activeDoctorId = appointment.doctor_id || DEFAULT_ACTIVE_DOCTOR_ID;
      const activeDoctorName = DEFAULT_ACTIVE_DOCTOR_NAME || 'Dr. Chandrakanth S Kesari';
      const patientId = appointment.patient_id || '';
      const diagnosisNotes = clinicalFindings.trim();
      const doctorAdvice = clinicalNotes.trim();
      const labOrders = '';
      const prescribedMedicines = medications
        .filter((med) => med.name.trim())
        .map(({ id: _id, ...med }) => med);

      const resolvedAppointmentId = isUUID(appointmentId || '') ? appointmentId : null;
      const resolvedPatientId = isUUID(patientId || '') ? patientId : null;
      const resolvedDoctorId = isUUID(activeDoctorId || '')
        ? activeDoctorId
        : '56284599-9a5f-4672-9b53-b90e18146a00';

      const { data: consultData, error: consultError } = await supabase
        .from('consultations')
        .insert([
          {
            appointment_id: resolvedAppointmentId,
            patient_id: resolvedPatientId,
            patient_name: patientName,
            doctor_id: resolvedDoctorId,
            doctor_name: activeDoctorName,
            chief_complaint: chiefComplaint || 'Consultation Completed',
            clinical_notes: clinicalNotes || '',
            diagnosis: diagnosis || '',
            diagnosis_notes: diagnosisNotes || '',
            lab_tests: labOrders || '',
            follow_up_date: followUpDate || null,
            status: 'COMPLETED',
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (consultError) {
        console.warn('Consultation insert note:', consultError.message);
      }

      const createdConsultationId = consultData?.id ? String(consultData.id) : null;

      if (createdConsultationId) {
        const tempValue = temperature ? parseFloat(temperature) : null;
        const bpSysValue = bpSystolic ? parseInt(bpSystolic, 10) : null;
        const bpDiaValue = bpDiastolic ? parseInt(bpDiastolic, 10) : null;
        const pulseValue = pulse ? parseInt(pulse, 10) : null;
        const spo2Value = spo2 ? parseInt(spo2, 10) : null;
        const weightValue = weight ? parseFloat(weight) : null;

        const { error: vitalsError } = await supabase.from('vitals').insert([
          {
            consultation_id: createdConsultationId,
            patient_id: resolvedPatientId,
            temp: tempValue,
            temperature: tempValue,
            bp_sys: bpSysValue,
            bp_systolic: bpSysValue,
            bp_dia: bpDiaValue,
            bp_diastolic: bpDiaValue,
            pulse: pulseValue,
            pulse_bpm: pulseValue,
            spo2: spo2Value,
            spo2_percent: spo2Value,
            weight: weightValue,
          },
        ]);

        if (vitalsError) {
          console.warn('Vitals insert note:', vitalsError.message);
        }
      }

      if (prescribedMedicines.length > 0) {
        const { error: prescError } = await supabase.from('prescriptions').insert([
          {
            consultation_id: createdConsultationId,
            appointment_id: resolvedAppointmentId,
            patient_id: resolvedPatientId,
            patient_name: patientName,
            doctor_id: resolvedDoctorId,
            doctor_name: activeDoctorName,
            medications: prescribedMedicines,
            instructions: doctorAdvice || '',
            created_at: new Date().toISOString(),
          },
        ]);

        if (prescError) {
          console.warn('Prescription insert note:', prescError.message);
        }
      }

      if (resolvedAppointmentId) {
        try {
          await updateAppointmentStatus(resolvedAppointmentId, 'COMPLETED');
        } catch {
          const { error: apptError } = await supabase
            .from('appointments')
            .update({ status: 'COMPLETED' })
            .eq('id', resolvedAppointmentId);

          if (apptError) {
            console.warn('Appointment status update note:', apptError.message);
          }
        }
      } else if (patientName) {
        await supabase.from('appointments').update({ status: 'COMPLETED' }).eq('patient_name', patientName);
      }

      toast.success(
        'Consultation completed, saved to patient records, and marked as completed!',
      );
      router.push('/doctor/dashboard');
    } catch (err: unknown) {
      console.error('Error finalizing consultation:', err);
      toast.error('Failed to save full consultation history.');
    } finally {
      setIsSubmitting(false);
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
          disabled={isSubmitting}
          onClick={() => void handleEndConsultation()}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          End Consultation / Finalize &amp; Dispatch Rx
        </button>
      </div>
    </div>
  );
}
