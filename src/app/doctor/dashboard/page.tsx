'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { NotificationHandler } from '@/components/common/NotificationHandler';
import { PatientQueue } from '@/components/doctor/command-center/PatientQueue';
import { PatientHistory360Section } from '@/components/doctor/PatientHistory360Section';
import { PatientHistorySection } from '@/components/doctor/PatientHistorySection';
import {
  EMERGENCY_CONTINUE_KEY,
  emergencyAssignedToDoctor,
  useAcknowledgeEmergency,
  useDoctorQueue,
  useEmergencyAlertsRealtime,
  type EmergencyAlertView,
} from '@/lib/doctor/command-center/hooks';
import { displayClinicalText } from '@/lib/clinical/clinical-text';
import { isQueueDoneStatus } from '@/lib/doctor/command-center/supabase-service';
import { todayIsoDate, type QueueDateFilter } from '@/lib/scheduling/queue-date-filter';
import {
  buildOptimisticFeedItem,
  fetchDoctorConsultationFeed,
  type DoctorConsultationFeedItem,
} from '@/lib/doctor/doctor-consultation-feed';
import type { DoctorQueueRow } from '@/lib/doctor/command-center/types';
import {
  clearDoctorSession,
  fetchDoctorCredentialConsultationFee,
  getDoctorSession,
  loadDoctorWorkspaceSession,
  resolveDoctorConsultationFeeFromSources,
  resolveDoctorSessionIdentity,
} from '@/lib/doctor/session';
import { CACHE_KEYS, writeLocalJson } from '@/lib/persistence/local-cache';
import { handoffConsultationToHospitalBilling } from '@/lib/billing/consultation-billing-handoff';
import { dispatchDigitalPrescription } from '@/lib/doctor/dispatch-prescription';
import { computeMedicineQuantity } from '@/lib/doctor/medicine-quantity';
import { toast } from 'sonner';
import {
  Clock,
  Plus,
  RefreshCw,
  Search,
  Stethoscope,
  Trash2,
  User,
  CheckCircle2,
  Pill,
  FileText,
  LogOut,
  AlertCircle,
  Siren,
} from 'lucide-react';

interface ActiveDoctorSession {
  doctorId: string;
  doctorName: string;
  department: string;
  specialization?: string;
  email: string;
  portalRoute?: string;
}

type QueueAppointment = DoctorQueueRow;

type MedicationRow = {
  name: string;
  dosage: string;
  timing: string;
  duration: string;
};

const NO_NUMBER_SPINNER =
  '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]';

function formatIntakeVitals(patient: QueueAppointment): string {
  if (patient.vitals_summary?.trim()) return patient.vitals_summary.trim();
  const raw = patient.vitals;
  if (!raw) return '';
  if (typeof raw === 'string') return raw.trim();
  const parts = [
    raw.bp ? `BP ${String(raw.bp)}` : '',
    raw.pulse ? `HR ${String(raw.pulse)}` : '',
    raw.temp ? `Temp ${String(raw.temp)}` : '',
    raw.spo2 ? `SpO2 ${String(raw.spo2)}` : '',
    raw.weight ? `Wt ${String(raw.weight)}` : '',
  ].filter(Boolean);
  return parts.join(' · ');
}

function readDoctorSessionFromStorage(): ActiveDoctorSession | null {
  const stored = loadDoctorWorkspaceSession();
  if (!stored?.doctorId || !stored.doctorName) return null;
  return {
    doctorId: stored.doctorId,
    doctorName: stored.doctorName,
    department: stored.department || 'Clinical',
    specialization: stored.specialization,
    email: stored.email || '',
    portalRoute: stored.portalRoute,
  };
}

function formatToken(token?: string | number | null): string {
  if (token === undefined || token === null || String(token).trim() === '') return '—';
  return `#${String(token).replace(/^#/, '')}`;
}

function resetEncounterForm(
  setDiagnosis: (value: string) => void,
  setClinicalNotes: (value: string) => void,
  setDoctorAdvice: (value: string) => void,
  setMedications: (value: MedicationRow[]) => void,
  setDrugInput: (value: string) => void,
) {
  setDiagnosis('');
  setClinicalNotes('');
  setDoctorAdvice('');
  setMedications([]);
  setDrugInput('');
}

export default function DoctorWorkstation() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isMounted, setIsMounted] = useState(false);

  const [session, setSession] = useState<ActiveDoctorSession | null>(null);
  const [activePatient, setActivePatient] = useState<QueueAppointment | null>(null);
  const [appointmentId, setAppointmentId] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [intakeVitals, setIntakeVitals] = useState('');
  const [queueTab, setQueueTab] = useState<'waiting' | 'done'>('waiting');
  const [queueDateMode, setQueueDateMode] = useState<'today' | 'tomorrow' | 'upcoming' | 'custom'>(
    'today',
  );
  const [customQueueDate, setCustomQueueDate] = useState(todayIsoDate());
  const [searchQuery, setSearchQuery] = useState('');

  const queueDateFilter: QueueDateFilter = useMemo(() => {
    if (queueDateMode === 'custom') {
      return { mode: 'custom', customDate: customQueueDate };
    }
    return { mode: queueDateMode };
  }, [customQueueDate, queueDateMode]);

  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [doctorAdvice, setDoctorAdvice] = useState('');
  const [medications, setMedications] = useState<MedicationRow[]>([]);
  const [drugInput, setDrugInput] = useState('');
  const [dosageInput, setDosageInput] = useState('1-0-1');
  const [durationInput, setDurationInput] = useState('3 Days');
  const [consultationFee, setConsultationFee] = useState(() =>
    resolveDoctorConsultationFeeFromSources([loadDoctorWorkspaceSession()]),
  );
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isBilling, setIsBilling] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );

  const [patientHistory, setPatientHistory] = useState<DoctorConsultationFeedItem[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<DoctorConsultationFeedItem | null>(
    null,
  );
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [autoExpandFeedId, setAutoExpandFeedId] = useState<string | null>(null);

  const {
    tokens: appointments,
    isLoading,
    refetch,
  } = useDoctorQueue(isMounted && session ? loadDoctorWorkspaceSession() : null, {
    dateFilter: queueDateFilter,
  });
  const emergencyIdentity = resolveDoctorSessionIdentity(
    isMounted ? (getDoctorSession() ?? (session ? { ...session, employeeId: session.doctorId } : null)) : null,
  );
  const { data: emergencyAlerts = [] } = useEmergencyAlertsRealtime(emergencyIdentity.employeeId);
  const ackEmergency = useAcknowledgeEmergency();
  const assignedEmergencies = emergencyAlerts.filter(
    (alert) =>
      alert.status !== 'RESOLVED' &&
      emergencyAssignedToDoctor(alert, {
        doctorName: session?.doctorName || emergencyIdentity.doctorName,
        email: session?.email || emergencyIdentity.email,
        employeeId: session?.doctorId || emergencyIdentity.employeeId,
      }),
  );

  const loadConsultationFeed = useCallback(async () => {
    const workspace = loadDoctorWorkspaceSession();
    if (!workspace?.doctorId) return;
    setIsLoadingHistory(true);
    try {
      const feed = await fetchDoctorConsultationFeed(supabase, workspace);
      setPatientHistory(feed);
    } catch {
      setPatientHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    const stored = readDoctorSessionFromStorage();
    if (!stored) {
      router.replace('/doctor/login');
      return;
    }
    setSession(stored);
  }, [isMounted, router]);

  useEffect(() => {
    if (!session?.doctorId) return;
    void loadConsultationFeed();
  }, [session?.doctorId, loadConsultationFeed]);

  useEffect(() => {
    if (!session?.doctorId) return;
    void fetchDoctorCredentialConsultationFee(supabase, loadDoctorWorkspaceSession()).then(
      setConsultationFee,
    );
  }, [session?.doctorId]);

  useEffect(() => {
    const workspace = loadDoctorWorkspaceSession();
    const nextFee = resolveDoctorConsultationFeeFromSources([activePatient, workspace]);
    if (nextFee > 0) setConsultationFee(nextFee);
  }, [
    activePatient?.id,
    activePatient?.appointment_id,
    activePatient?.consultation_fee,
    activePatient?.fee,
  ]);

  useEffect(() => {
    if (!autoExpandFeedId) {
      setSelectedHistoryItem(null);
      return;
    }
    const match =
      patientHistory.find(
        (item) => item.id === autoExpandFeedId || item.appointment_id === autoExpandFeedId,
      ) ?? null;
    setSelectedHistoryItem(match);
  }, [autoExpandFeedId, patientHistory]);

  useEffect(() => {
    const waiting = appointments.filter((row) => !isQueueDoneStatus(row.status));
    setActivePatient((prev) => {
      if (prev?.source === 'emergency') return prev;
      if (!prev) return waiting[0] || null;
      const updated = appointments.find(
        (row) => row.id === prev.id || row.appointment_id === prev.appointment_id,
      );
      if (!updated) return waiting[0] || null;
      if (isQueueDoneStatus(updated.status) && queueTab === 'waiting') {
        return waiting[0] || null;
      }
      return updated;
    });
  }, [appointments, queueTab]);

  useEffect(() => {
    if (!activePatient) {
      setAppointmentId('');
      setChiefComplaint('');
      setIntakeVitals('');
      return;
    }
    setAppointmentId(String(activePatient.appointment_id || activePatient.id || ''));
    setChiefComplaint(
      displayClinicalText(activePatient.chief_complaint || activePatient.reason_for_visit || ''),
    );
    setIntakeVitals(formatIntakeVitals(activePatient));
  }, [activePatient?.id, activePatient?.appointment_id, activePatient?.patient_id, activePatient?.uhid]);

  const openEmergencyCase = useCallback(
    (alert: Pick<EmergencyAlertView, 'id' | 'patient_name' | 'patient_id' | 'message'>) => {
      const complaint = displayClinicalText(alert.message || '') || 'Emergency attendance';
      const patient: QueueAppointment = {
        id: alert.id,
        patient_id: alert.patient_id,
        patient_name: alert.patient_name || 'Emergency patient',
        chief_complaint: complaint,
        reason_for_visit: complaint,
        status: 'waiting',
        source: 'emergency',
        token_number: 'ER',
        appointment_type: 'Emergency',
      };
      setActivePatient(patient);
      setAppointmentId(alert.id);
      setChiefComplaint(complaint);
      setIntakeVitals('');
      setDiagnosis('');
      setClinicalNotes('');
      setDoctorAdvice('');
      setMedications([]);
      setStatusMessage(null);
    },
    [],
  );

  useEffect(() => {
    if (!isMounted || !session) return;
    const raw = sessionStorage.getItem(EMERGENCY_CONTINUE_KEY);
    if (!raw) return;
    sessionStorage.removeItem(EMERGENCY_CONTINUE_KEY);
    try {
      openEmergencyCase(JSON.parse(raw) as EmergencyAlertView);
    } catch {
      /* ignore a bad handoff */
    }
  }, [isMounted, openEmergencyCase, session]);

  const handleSelectPatient = async (patient: QueueAppointment) => {
    const nextAppointmentId = String(patient.appointment_id || patient.id || '').trim();
    const nextComplaint = displayClinicalText(
      patient.chief_complaint || patient.reason_for_visit || '',
    );
    const nextVitals = formatIntakeVitals(patient);

    setActivePatient(patient);
    setAppointmentId(nextAppointmentId);
    setChiefComplaint(nextComplaint);
    setIntakeVitals(nextVitals);
    if (session?.doctorId) {
      writeLocalJson(CACHE_KEYS.doctorQueue, {
        doctorId: session.doctorId,
        appointments,
        activePatientId: patient.id,
      });
    }
    setDiagnosis(nextComplaint);
    setClinicalNotes('');
    setDoctorAdvice('');
    setMedications([]);
    setStatusMessage(null);

    if (isQueueDoneStatus(patient.status)) {
      setAutoExpandFeedId(nextAppointmentId);
    }
  };

  const handleAddMedication = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!drugInput.trim()) return;
    setMedications((prev) => [
      ...prev,
      {
        name: drugInput.trim(),
        dosage: dosageInput,
        timing: 'After Food',
        duration: durationInput,
      },
    ]);
    setDrugInput('');
  };

  const handleDoneAndDispatch = async () => {
    if (!activePatient) {
      toast.error('Please select an active patient encounter first.');
      return;
    }
    await finalizeEncounter(activePatient, { source: 'dispatch' });
  };

  const handleCompleteAndBill = async (patient: QueueAppointment) => {
    await finalizeEncounter(patient, { source: 'queue' });
  };

  const finalizeEncounter = async (
    patient: QueueAppointment,
    options: { source: 'dispatch' | 'queue' },
  ) => {
    if (!session) {
      toast.error('Doctor session is missing. Please sign in again.');
      return;
    }

    const activeAppointmentId = String(
      appointmentId || patient.appointment_id || patient.id || '',
    ).trim();
    const patientId = String(patient.patient_id || patient.uhid || patient.id || '').trim();
    const patientName = (patient.patient_name || patient.name || '').trim();
    const complaint =
      (options.source === 'dispatch' ? chiefComplaint : '') ||
      patient.chief_complaint ||
      patient.reason_for_visit ||
      '';

    if (!patientId && !patientName) {
      toast.error('Please select an active patient encounter first.');
      return;
    }

    const doctor = resolveDoctorSessionIdentity(
      getDoctorSession() ?? {
        doctorId: session.doctorId,
        doctorName: session.doctorName,
        department: session.department,
        employeeId: session.doctorId,
      },
    );

    const billingKey = String(patient.patient_id || patient.id);
    if (options.source === 'dispatch') setIsFinalizing(true);
    else setIsBilling(billingKey);
    setStatusMessage(null);

    try {
      const result = await dispatchDigitalPrescription(supabase, {
        appointmentId: activeAppointmentId,
        sourceTable: patient._source_table,
        patientId: patientId || null,
        patientName: patientName || 'Patient',
        uhid: patient.uhid || patientId || null,
        doctorId: doctor.employeeId || doctor.doctorId,
        doctorName: doctor.doctorName,
        department: doctor.department || session.department,
        diagnosis: diagnosis.trim() || complaint || 'General Consultation',
        clinicalNotes: clinicalNotes.trim(),
        doctorInstructions: doctorAdvice.trim(),
        medications: options.source === 'dispatch' ? medications : medications,
        vitals: patient.vitals || intakeVitals || patient.vitals_summary || null,
        consultationFee,
        hospitalId: 'HOSP-01',
        skipBilling: true,
      });

      if (!result.ok) {
        throw new Error(result.error || 'Failed to write prescription to the patient app.');
      }

      const billing = await handoffConsultationToHospitalBilling(
        supabase,
        {
          ...patient,
          appointment_id: activeAppointmentId || patient.appointment_id,
          booking_source: patient.source,
          appointment_type: patient.appointment_type,
        },
        {
          doctorId: doctor.employeeId || doctor.doctorId,
          employeeId: doctor.employeeId,
          doctorName: doctor.doctorName,
          department: doctor.department || session.department,
          consultationFee,
          hospitalCode: 'HOSP-01',
        },
        {
          consultationFee,
          medicines: [],
          diagnosis: diagnosis.trim() || complaint || 'General Consultation',
          clinicalNotes: clinicalNotes.trim(),
          doctorInstructions: doctorAdvice.trim(),
          prescribedItems: medications.map((med) => ({
            drug: med.name,
            dosage: med.dosage,
            frequency: med.dosage,
            duration: med.duration,
            instructions: doctorAdvice.trim() || med.timing,
            quantity: computeMedicineQuantity(med.dosage, med.duration),
          })),
        },
      );

      if (!billing.ok) {
        throw new Error(billing.error || 'Error processing consultation and invoice.');
      }

      await Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: ['doctor-records'] }),
        queryClient.invalidateQueries({ queryKey: ['patient-records'] }),
        queryClient.invalidateQueries({ queryKey: ['patient-prescriptions'] }),
        queryClient.invalidateQueries({ queryKey: ['hospital-billing'] }),
        queryClient.invalidateQueries({ queryKey: ['billing-invoices'] }),
        queryClient.invalidateQueries({ queryKey: ['opd-charges'] }),
      ]);

      const completedRow: QueueAppointment = {
        ...patient,
        appointment_id: activeAppointmentId || patient.appointment_id,
        status: 'billing_pending',
        queue_status: 'billing_pending',
      };
      queryClient.setQueriesData<QueueAppointment[]>({ queryKey: ['doctor-queue'] }, (current) => {
        if (!Array.isArray(current)) return current;
        const seen = current.some(
          (row) =>
            row.id === patient.id ||
            row.appointment_id === patient.appointment_id ||
            row.appointment_id === activeAppointmentId,
        );
        const next = current.map((row) =>
          row.id === patient.id ||
          row.appointment_id === patient.appointment_id ||
          row.appointment_id === activeAppointmentId
            ? { ...row, ...completedRow }
            : row,
        );
        return seen ? next : [completedRow, ...next];
      });
      setQueueTab('done');

      toast.success(
        `Consultation completed for ${patientName || 'the patient'}. Invoice sent to hospital billing.`,
      );
      setStatusMessage({
        type: 'success',
        text: 'Pending invoice posted to Hospital Billing & Checkout Queue.',
      });
      const optimisticFeedItem = buildOptimisticFeedItem({
        appointmentId: activeAppointmentId,
        patientName: patientName || 'Patient',
        tokenNumber: patient.token_number,
        status: 'billing_pending',
        diagnosis: diagnosis.trim() || complaint || 'General Consultation',
        clinicalNotes: clinicalNotes.trim(),
        doctorInstructions: doctorAdvice.trim(),
        vitalsSummary: intakeVitals || formatIntakeVitals(patient),
        age: patient.age,
        gender: patient.gender,
        prescriptions: medications.map((med) => ({
          name: med.name,
          dosage: med.dosage,
          frequency: med.dosage,
          duration: med.duration,
        })),
      });
      setPatientHistory((prev) => [
        optimisticFeedItem,
        ...prev.filter((item) => item.id !== activeAppointmentId),
      ]);
      setAutoExpandFeedId(activeAppointmentId);
      void loadConsultationFeed();
      resetEncounterForm(setDiagnosis, setClinicalNotes, setDoctorAdvice, setMedications, setDrugInput);
      setAppointmentId('');
      setChiefComplaint('');
      setIntakeVitals('');

      const refreshedQueue = await refetch();
      const refreshedRows = refreshedQueue.data ?? appointments;
      const completedPatient =
        refreshedRows.find(
          (row) =>
            (row.id === patient.id ||
              row.appointment_id === patient.appointment_id ||
              row.appointment_id === activeAppointmentId) &&
            isQueueDoneStatus(row.status),
        ) ?? null;

      if (!completedPatient) {
        queryClient.setQueriesData<QueueAppointment[]>({ queryKey: ['doctor-queue'] }, (current) => {
          const list = Array.isArray(current) ? current : [];
          const rest = list.filter(
            (row) =>
              row.id !== patient.id &&
              row.appointment_id !== patient.appointment_id &&
              row.appointment_id !== activeAppointmentId,
          );
          return [completedRow, ...rest];
        });
        setActivePatient(completedRow);
      } else if (completedPatient) {
        setActivePatient(completedPatient);
        setChiefComplaint(
          completedPatient.chief_complaint || completedPatient.reason_for_visit || complaint,
        );
        setIntakeVitals(formatIntakeVitals(completedPatient));
        setAutoExpandFeedId(
          String(completedPatient.appointment_id || completedPatient.id || activeAppointmentId),
        );
      }
    } catch (err: unknown) {
      console.error('Error finalizing encounter:', err);
      const message = err instanceof Error ? err.message : 'Unknown database error';
      setStatusMessage({ type: 'error', text: `Dispatch failed: ${message}` });
      toast.error(`Dispatch failed: ${message}`);
    } finally {
      setIsFinalizing(false);
      setIsBilling(null);
    }
  };

  const handleLogout = () => {
    clearDoctorSession();
    router.replace('/doctor/login');
  };

  if (!isMounted) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00A896] border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00A896] border-t-transparent" />
      </div>
    );
  }

  const isCompleted = (status?: string) => isQueueDoneStatus(status);

  const waitingList = appointments.filter((a) => !isCompleted(a.status));
  const completedList = appointments
    .filter((a) => isCompleted(a.status))
    .sort(
      (a, b) =>
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(),
    );

  const filteredQueue = (queueTab === 'waiting' ? waitingList : completedList).filter((item) => {
    const name = item.patient_name || '';
    const token = String(item.token_number || '');
    const q = searchQuery.toLowerCase().trim();
    return name.toLowerCase().includes(q) || token.toLowerCase().includes(q);
  });

  const queueEmptyLabel =
    queueTab === 'done'
      ? queueDateMode === 'today'
        ? 'No completed consultations today.'
        : 'No completed consultations for this date.'
      : queueDateMode === 'tomorrow'
        ? 'No advance bookings for tomorrow.'
        : queueDateMode === 'upcoming'
          ? 'No upcoming advance bookings.'
          : queueDateMode === 'custom'
            ? `No patients scheduled for ${customQueueDate}.`
            : 'No outpatient bookings assigned to your desk today.';

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F8FAFC] text-slate-800 font-sans">
      <NotificationHandler />
      <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-teal-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base text-slate-900">Regal Clinical Workstation</h1>
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Node Sync
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {session.department} • Isolated Clinician Environment
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full bg-teal-600" />
            <span className="font-bold text-slate-800">{session.doctorName}</span>
            <span className="text-[10px] text-teal-700 font-mono font-bold">({session.doctorId})</span>
          </div>

          <button
            type="button"
            onClick={() => void refetch()}
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 transition-all cursor-pointer"
            title="Refresh Live Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="p-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs font-bold"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {assignedEmergencies.length > 0 ? (
        <div className="shrink-0 space-y-2 border-b border-rose-200 bg-rose-50 px-6 py-3">
          {assignedEmergencies.map((alert) => (
            <div key={alert.id} className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-black text-rose-800">
                  {alert.severity || 'Emergency'} · {alert.patient_name || 'Emergency patient'}
                </p>
                <p className="text-xs font-semibold text-rose-700">
                  {alert.message || 'Attend the trauma desk and continue the procedure.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const identity = resolveDoctorSessionIdentity(getDoctorSession());
                  const accept =
                    alert.status === 'ACTIVE'
                      ? ackEmergency.mutateAsync({
                          alertId: alert.id,
                          assigned_doctor_id: identity.employeeId,
                          assigned_doctor_name: identity.doctorName,
                        })
                      : Promise.resolve(undefined);
                  void accept
                    .then(() => {
                      openEmergencyCase(alert);
                      toast.success('Emergency case is open. Continue the procedure.');
                    })
                    .catch((err: unknown) => {
                      toast.error(err instanceof Error ? err.message : 'Could not open this case');
                    });
                }}
                className="rounded-xl bg-rose-700 px-4 py-2 text-xs font-black text-white"
              >
                Start emergency
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3.5 p-3.5 overflow-hidden">
        <section className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl flex flex-col h-full overflow-hidden shadow-xs">
          <div className="p-3.5 border-b border-slate-100 bg-slate-50/70 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black tracking-wider uppercase text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-600" />
                1. Patient Queue
              </span>
              <div className="flex bg-slate-200/80 p-0.5 rounded-xl text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setQueueTab('waiting')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    queueTab === 'waiting' ? 'bg-white text-teal-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Waiting ({waitingList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setQueueTab('done')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    queueTab === 'done' ? 'bg-white text-teal-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Done ({completedList.length})
                </button>
              </div>
            </div>

            <div className="mb-2 flex flex-wrap gap-1">
              {(
                [
                  ['today', 'Today'],
                  ['tomorrow', 'Tomorrow'],
                  ['upcoming', 'All Upcoming'],
                ] as const
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setQueueDateMode(mode)}
                  className={`rounded-lg px-2 py-1 text-[10px] font-bold transition-all cursor-pointer ${
                    queueDateMode === mode
                      ? 'bg-teal-700 text-white'
                      : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
              <input
                type="date"
                value={queueDateMode === 'custom' ? customQueueDate : customQueueDate}
                onChange={(event) => {
                  setCustomQueueDate(event.target.value);
                  setQueueDateMode('custom');
                }}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-700"
                aria-label="Select queue date"
              />
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Filter patient name or token..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-600"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            <PatientQueue
              queue={filteredQueue}
              selectedTokenId={activePatient?.appointment_id || activePatient?.id || null}
              isLoading={isLoading}
              emptyLabel={queueEmptyLabel}
              queueDateMode={queueDateMode}
              onSelectPatient={handleSelectPatient}
              renderActions={(patient) => {
                const done = isCompleted(patient.status);
                if (done) return null;
                return (
                  <button
                    type="button"
                    disabled={isBilling === String(patient.patient_id || patient.id)}
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleCompleteAndBill(patient);
                    }}
                    className="w-full rounded-lg bg-teal-800 px-2 py-1.5 text-[10px] font-black text-white disabled:opacity-50"
                  >
                    {isBilling === String(patient.patient_id || patient.id)
                      ? 'Posting…'
                      : 'Complete & Bill'}
                  </button>
                );
              }}
            />
          </div>
        </section>

        <section className="lg:col-span-6 bg-[#FAFDFC] border border-slate-200 rounded-2xl flex flex-col h-full overflow-hidden shadow-xs">
          <div className="p-3.5 border-b border-slate-100 bg-slate-50/60 shrink-0">
            <span className="text-xs font-black tracking-wider uppercase text-slate-700">
              2. Active Consultation
            </span>
            <p className="mt-1 text-[10px] font-semibold text-slate-400">
              {activePatient ? activePatient.patient_name || 'Selected patient' : 'Select a patient from the queue'}
            </p>
          </div>
          {activePatient ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="flex-1 space-y-3.5 overflow-y-auto p-4 pb-6">
              {statusMessage && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 shrink-0 ${
                    statusMessage.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{statusMessage.text}</span>
                </div>
              )}

              <div className="bg-slate-900 text-white rounded-2xl p-4 flex items-center justify-between shadow-xs shrink-0">
                <div className="flex min-w-0 flex-1 items-center gap-3.5">
                  <span
                    className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-xl border border-teal-600 bg-teal-800 px-2.5 py-1 font-mono text-sm font-black tracking-tight text-teal-200"
                    style={{ wordBreak: 'keep-all', overflowWrap: 'normal' }}
                  >
                    {formatToken(activePatient.token_number)}
                  </span>
                  <div>
                    <h2 className="text-base font-extrabold text-white">
                      {activePatient.patient_name || '—'}
                    </h2>
                    <p className="text-xs text-slate-300">
                      {activePatient.age ? `${activePatient.age} Yrs` : '—'} •{' '}
                      {activePatient.gender || '—'} • Slot:{' '}
                      {activePatient.appointment_time || activePatient.time_slot || '—'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Intake Vitals
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {intakeVitals || activePatient.vitals_summary || '—'}
                  </span>
                </div>
              </div>

              <div className="bg-teal-50/70 border border-teal-200/80 rounded-xl p-3 flex items-start gap-2.5 shrink-0">
                <FileText className="w-4 h-4 text-teal-700 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <span className="text-[10px] font-black uppercase text-teal-900 tracking-wider block">
                    Reported Chief Complaint
                  </span>
                  <p className="mt-0.5 line-clamp-3 break-words text-xs font-bold text-teal-950">
                    {displayClinicalText(
                      chiefComplaint ||
                        activePatient.chief_complaint ||
                        activePatient.reason_for_visit ||
                        '',
                    ) || '—'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 shrink-0">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 mb-1">
                    Diagnosis
                  </label>
                  <input
                    type="text"
                    placeholder="Enter confirmed diagnosis..."
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-teal-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 mb-1">
                    Examination Findings
                  </label>
                  <input
                    type="text"
                    placeholder="Clinical findings / notes..."
                    value={clinicalNotes}
                    onChange={(e) => setClinicalNotes(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-teal-600 outline-none"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-2 shrink-0">
                  <Pill className="w-3.5 h-3.5 text-teal-700" />
                  Prescription Pad ({medications.length} Prescribed)
                </span>

                <div className="mb-2.5 grid grid-cols-2 gap-2 shrink-0">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                    Consultation fee (₹)
                    <input
                      type="number"
                      min={0}
                      value={consultationFee}
                      onChange={(e) => setConsultationFee(Number(e.target.value) || 0)}
                      className={`mt-1 w-full text-xs font-mono font-bold p-2 bg-white border border-slate-200 rounded-xl outline-none ${NO_NUMBER_SPINNER}`}
                    />
                  </label>
                  <div className="rounded-xl border border-teal-200 bg-teal-50 px-3 py-2">
                    <div className="text-[10px] font-black uppercase text-teal-800">Billing handoff</div>
                    <div className="text-sm font-black text-teal-950 font-mono">₹{consultationFee}</div>
                    <div className="text-[10px] text-teal-700">Pharmacy charges settled at billing counter</div>
                  </div>
                </div>

                <form onSubmit={handleAddMedication} className="flex flex-wrap items-center gap-2 mb-2.5 shrink-0">
                  <input
                    type="text"
                    placeholder="Enter medicine name..."
                    value={drugInput}
                    onChange={(e) => setDrugInput(e.target.value)}
                    className="flex-1 min-w-[140px] text-xs p-2 bg-white border border-slate-200 rounded-xl outline-none"
                  />
                  <select
                    value={dosageInput}
                    onChange={(e) => setDosageInput(e.target.value)}
                    className="text-xs p-2 bg-white border border-slate-200 rounded-xl"
                  >
                    <option value="1-0-1">1-0-1 (BID)</option>
                    <option value="1-1-1">1-1-1 (TID)</option>
                    <option value="1-0-0">1-0-0 (Morning)</option>
                    <option value="0-0-1">0-0-1 (Night)</option>
                    <option value="STAT">1 STAT (Immediate)</option>
                  </select>
                  <select
                    value={durationInput}
                    onChange={(e) => setDurationInput(e.target.value)}
                    className="text-xs p-2 bg-white border border-slate-200 rounded-xl"
                  >
                    <option value="3 Days">3 Days</option>
                    <option value="5 Days">5 Days</option>
                    <option value="7 Days">7 Days</option>
                    <option value="15 Days">15 Days</option>
                    <option value="30 Days">30 Days</option>
                  </select>
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </form>

                <div className="flex max-h-[180px] min-h-[44px] flex-col gap-2.5 overflow-y-auto overflow-x-hidden pr-1">
                  {medications.length === 0 ? (
                    <div className="py-6 text-center text-xs italic text-slate-400">
                      No drugs added yet. Type medication above.
                    </div>
                  ) : (
                    medications.map((med, i) => (
                      <div
                        key={i}
                        className="flex min-h-[44px] w-full items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3"
                      >
                        <span className="min-w-0 truncate text-sm font-semibold text-slate-800">
                          {med.name}
                        </span>
                        <div className="flex shrink-0 items-center gap-2.5 text-xs text-slate-600">
                          <span className="rounded border border-emerald-200/60 bg-emerald-50 px-2 py-0.5 font-mono font-medium text-emerald-700">
                            {med.dosage}
                          </span>
                          <span>{med.duration}</span>
                          <button
                            type="button"
                            onClick={() => setMedications((prev) => prev.filter((_, idx) => idx !== i))}
                            className="ml-1 rounded p-1 text-rose-500 transition hover:bg-rose-50 hover:text-rose-700"
                            title="Remove item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="doctor-advice-input"
                  className="text-xs font-semibold text-stone-700"
                >
                  Doctor&apos;s Instructions / Dietary Advice
                </label>
                <textarea
                  id="doctor-advice-input"
                  rows={3}
                  placeholder="Doctor's Instructions / Dietary Advice..."
                  value={doctorAdvice}
                  onChange={(e) => setDoctorAdvice(e.target.value)}
                  className="w-full resize-y rounded-xl border border-stone-200 p-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              </div>

              <div className="shrink-0 border-t border-stone-100 bg-white/95 p-4 shadow-lg backdrop-blur">
                <button
                  type="button"
                  disabled={isFinalizing}
                  onClick={handleDoneAndDispatch}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-900 active:bg-emerald-950 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-5 w-5 text-emerald-200" />
                  {isFinalizing ? 'DISPATCHING TO PATIENT APP...' : '✓ DONE & DISPATCH DIGITAL PRESCRIPTION'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#F0F7F5]">
              <div className="w-14 h-14 rounded-2xl bg-white border border-[#D5E8E3] text-[#2A9D8F]/50 flex items-center justify-center mb-3 shadow-inner">
                <User className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-[#173F5F] text-sm">No Patient Selected</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                Select an appointment from Section 1 to begin the active consultation workflow.
              </p>
            </div>
          )}
        </section>

        <section className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl flex flex-col h-full overflow-hidden shadow-xs">
          <div className="p-3.5 border-b border-slate-100 bg-slate-50/60 shrink-0">
            <span className="text-xs font-black tracking-wider uppercase text-slate-600">
              3. 360 HISTORY
            </span>
            <p className="mt-1 text-[10px] font-semibold text-slate-400">Consultations & prescriptions</p>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-3">
            {assignedEmergencies.length > 0 ? (
              <div className="mb-3 space-y-2">
                {assignedEmergencies.map((alert) => (
                  <div
                    key={`sos-${alert.id}`}
                    className="rounded-xl border border-rose-200 bg-rose-50 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] font-black uppercase tracking-wide text-rose-700">
                        Emergency
                      </p>
                      <span className="rounded-full bg-rose-700 px-2 py-0.5 text-[9px] font-black text-white">
                        SOS active
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-black text-rose-950">
                      {alert.patient_name || 'Emergency patient'}
                    </p>
                    <p className="mt-0.5 text-[11px] font-semibold text-rose-800">
                      {alert.severity || 'Emergency'} · {alert.message || 'Assigned to you'}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        openEmergencyCase(alert);
                        toast.success('Emergency case is open. Continue the procedure.');
                      }}
                      className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-rose-700 px-3 py-2 text-[11px] font-black text-white"
                    >
                      <Siren className="h-3.5 w-3.5" />
                      Start emergency
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
            <PatientHistory360Section activePatient={activePatient} />
            <div className="mb-2 shrink-0 border-t border-slate-100 pt-3">
              <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                Consultation History
              </p>
            </div>
            <PatientHistorySection
              feed={patientHistory}
              isLoading={isLoadingHistory}
              autoExpandId={autoExpandFeedId}
              onAutoExpandConsumed={() => {
                setAutoExpandFeedId(null);
                setSelectedHistoryItem(null);
              }}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
