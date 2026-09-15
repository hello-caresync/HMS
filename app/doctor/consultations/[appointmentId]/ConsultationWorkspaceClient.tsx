'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

import {
  completeAppointmentAfterConsultation,
  fetchConsultationAppointmentContext,
  formatConsultationSaveError,
  type ConsultationAppointmentContext,
  type ConsultationMedicationItem,
} from '@/lib/doctor/command-center/supabase-service';
import { handoffConsultationToHospitalBilling } from '@/lib/billing/consultation-billing-handoff';
import { dispatchDigitalPrescription } from '@/lib/doctor/dispatch-prescription';
import { createLabOrder } from '@/lib/clinical/lab-orders-service';
import { createRadiologyOrder } from '@/lib/clinical/radiology-orders-service';
import { fetchActiveHospitalDoctors } from '@/lib/hospital/hospital-staff-roster';
import { HOSPITAL_TENANT_ID } from '@/lib/regal/constants';
import {
  fetchDoctorCredentialConsultationFee,
  getDoctorSession,
  resolveDoctorConsultationFeeFromSources,
  resolveDoctorSessionIdentity,
} from '@/lib/doctor/session';
import { supabase } from '@/lib/supabase/client';

interface MedicationRow extends ConsultationMedicationItem {
  id: string;
  quantity: string;
}

const emptyMed = (): MedicationRow => ({
  id: crypto.randomUUID(),
  name: '',
  dosage: '1 tablet',
  frequency: '1-0-1',
  duration: '5 days',
  instructions: 'After food',
  quantity: '1',
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
  const [labTestName, setLabTestName] = useState('');
  const [radiologyStudy, setRadiologyStudy] = useState('');
  const [orderingDiagnostics, setOrderingDiagnostics] = useState(false);

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

  const handleOrderLab = async () => {
    if (!appointment || !labTestName.trim()) {
      toast.error('Enter a lab test name');
      return;
    }
    setOrderingDiagnostics(true);
    try {
      const doctorIdentity = resolveDoctorSessionIdentity(getDoctorSession());
      const result = await createLabOrder(supabase, {
        appointmentId: String(appointmentId),
        patientId: String(appointment.patient_id ?? ''),
        patientName: appointment.patient_name,
        doctorId: doctorIdentity.employeeId,
        doctorName: doctorIdentity.doctorName,
        testName: labTestName.trim(),
      });
      if (!result.ok) throw new Error(result.error);
      toast.success(`Lab order placed: ${labTestName.trim()}`);
      setLabTestName('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lab order failed');
    } finally {
      setOrderingDiagnostics(false);
    }
  };

  const handleOrderRadiology = async () => {
    if (!appointment || !radiologyStudy.trim()) {
      toast.error('Enter an imaging study');
      return;
    }
    setOrderingDiagnostics(true);
    try {
      const doctorIdentity = resolveDoctorSessionIdentity(getDoctorSession());
      const result = await createRadiologyOrder(supabase, {
        appointmentId: String(appointmentId),
        patientId: String(appointment.patient_id ?? ''),
        patientName: appointment.patient_name,
        doctorId: doctorIdentity.employeeId,
        doctorName: doctorIdentity.doctorName,
        studyName: radiologyStudy.trim(),
      });
      if (!result.ok) throw new Error(result.error);
      toast.success(`Radiology order placed: ${radiologyStudy.trim()}`);
      setRadiologyStudy('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Radiology order failed');
    } finally {
      setOrderingDiagnostics(false);
    }
  };

  const handleFinalizeConsultation = async () => {
    if (!appointment) return;

    if (!diagnosis.trim() || !chiefComplaint.trim()) {
      toast.error('Chief complaint and diagnosis are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const patientName = appointment.patient_name || 'Patient';
      const doctorIdentity = resolveDoctorSessionIdentity(getDoctorSession());
      const doctorAdvice = clinicalNotes.trim();
      const prescribedMedicines = medications.filter((med) => med.name.trim());
      const targetAppointmentId = String(appointmentId || appointment.appointment_id || '').trim();
      const targetPatientId = String(appointment.patient_id || '').trim();

      const vitalsSnapshot = {
        temperature: temperature || null,
        bp: bpSystolic && bpDiastolic ? `${bpSystolic}/${bpDiastolic}` : null,
        pulse: pulse || null,
        spo2: spo2 || null,
        weight: weight || null,
      };

      const doctors = await fetchActiveHospitalDoctors(supabase, HOSPITAL_TENANT_ID);
      const matchedDoctor = doctors.find(
        (doc) =>
          doc.id === doctorIdentity.employeeId ||
          doc.full_name === doctorIdentity.doctorName,
      );
      const profileFee = await fetchDoctorCredentialConsultationFee(supabase, getDoctorSession());
      const consultationFee = resolveDoctorConsultationFeeFromSources([
        appointment as Record<string, unknown>,
        matchedDoctor,
        getDoctorSession(),
        { consultationFee: profileFee },
      ]);

      const medicineLines = prescribedMedicines.map((med) => ({
        name: med.name.trim(),
        dosage: med.dosage,
        timing: med.frequency,
        duration: med.duration,
        qty: Math.max(1, Number(med.quantity) || 1),
      }));

      const rxResult = await dispatchDigitalPrescription(supabase, {
        appointmentId: targetAppointmentId,
        patientId: targetPatientId || null,
        patientName,
        doctorId: doctorIdentity.employeeId,
        doctorName: doctorIdentity.doctorName,
        department: doctorIdentity.department || doctorIdentity.specialization,
        diagnosis: diagnosis.trim() || clinicalFindings.trim() || chiefComplaint.trim(),
        clinicalNotes: [clinicalFindings.trim(), clinicalNotes.trim()].filter(Boolean).join('\n'),
        doctorInstructions: doctorAdvice,
        medications: medicineLines,
        vitals: vitalsSnapshot,
        consultationFee,
        skipBilling: true,
      });

      if (!rxResult.ok) {
        throw new Error(rxResult.error || 'Failed to write prescription to the patient app.');
      }

      const billing = await handoffConsultationToHospitalBilling(
        supabase,
        {
          id: targetAppointmentId,
          appointment_id: targetAppointmentId,
          patient_id: targetPatientId || null,
          patient_name: patientName,
          token_number: appointment.token_number ?? null,
          _source_table: 'appointments',
          department: doctorIdentity.department || doctorIdentity.specialization,
          booking_source: 'patient_app',
        },
        {
          doctorId: doctorIdentity.employeeId,
          doctorName: doctorIdentity.doctorName,
          department: doctorIdentity.department || doctorIdentity.specialization,
          consultationFee,
        },
        {
          consultationFee,
          medicines: [],
          prescribedItems: prescribedMedicines.map((med) => ({
            drug: med.name.trim(),
            dosage: med.dosage,
            frequency: med.frequency,
            duration: med.duration,
            instructions: med.instructions || '',
            quantity: Math.max(1, Number(med.quantity) || 1),
          })),
        },
      );

      if (!billing.ok) {
        throw new Error(billing.error || 'Failed to create hospital billing record.');
      }

      try {
        await supabase.from('consultations').insert([
          {
            appointment_id: targetAppointmentId || null,
            patient_id: targetPatientId || null,
            patient_name: patientName,
            doctor_id: doctorIdentity.employeeId,
            doctor_name: doctorIdentity.doctorName,
            chief_complaint: chiefComplaint || '',
            clinical_notes: clinicalNotes || '',
            diagnosis: diagnosis || '',
            diagnosis_notes: clinicalFindings.trim() || '',
            follow_up_date: followUpDate || null,
            status: 'COMPLETED',
            created_at: new Date().toISOString(),
          },
        ]);
      } catch (consultErr: unknown) {
        console.warn('Consultation insert note:', consultErr);
      }

      const appointmentUpdated = await completeAppointmentAfterConsultation({
        appointmentId: targetAppointmentId || null,
        patientId: targetPatientId || null,
        patientName,
        tokenNumber: appointment.token_number ?? null,
        status: 'billing_pending',
      });

      if (!appointmentUpdated) {
        console.warn(
          'Appointment status update note: no matching row updated for',
          targetAppointmentId || patientName,
        );
      }

      toast.success('Consultation completed and patient moved to Completed queue!');
      router.push('/doctor/dashboard');
    } catch (err: unknown) {
      console.error('Error ending consultation:', err);
      toast.error('Failed to complete appointment');
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

      <section className="rounded-2xl border border-slate-200 bg-[#FAFDFC] p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">
          Diagnostics Orders
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
            <label className="text-[10px] font-bold uppercase text-slate-400">Lab test</label>
            <input
              value={labTestName}
              onChange={(e) => setLabTestName(e.target.value)}
              placeholder="e.g. CBC, LFT, HbA1c"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
            <button
              type="button"
              disabled={orderingDiagnostics}
              onClick={() => void handleOrderLab()}
              className="rounded-xl bg-teal-600 px-3 py-2 text-xs font-bold text-white hover:bg-teal-700 disabled:opacity-50"
            >
              Order lab test
            </button>
          </div>
          <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
            <label className="text-[10px] font-bold uppercase text-slate-400">Radiology study</label>
            <input
              value={radiologyStudy}
              onChange={(e) => setRadiologyStudy(e.target.value)}
              placeholder="e.g. Chest X-Ray, MRI Brain"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
            <button
              type="button"
              disabled={orderingDiagnostics}
              onClick={() => void handleOrderRadiology()}
              className="rounded-xl bg-teal-600 px-3 py-2 text-xs font-bold text-white hover:bg-teal-700 disabled:opacity-50"
            >
              Order imaging
            </button>
          </div>
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
              className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-6"
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
              <input
                placeholder="Qty"
                type="number"
                min={1}
                value={med.quantity}
                onChange={(e) =>
                  setMedications((prev) =>
                    prev.map((row) =>
                      row.id === med.id ? { ...row, quantity: e.target.value } : row,
                    ),
                  )
                }
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm font-mono"
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
          onClick={() => void handleFinalizeConsultation()}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          End Consultation / Finalize &amp; Dispatch Rx
        </button>
      </div>
    </div>
  );
}
