'use client';

import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getAuthenticatedDoctor } from '@/lib/doctor/auth';
import { resolveDoctorContext } from '@/lib/doctor/command-center/doctor-context';
import { dispatchDigitalPrescription } from '@/lib/doctor/dispatch-prescription';
import { handoffConsultationToHospitalBilling } from '@/lib/billing/consultation-billing-handoff';
import { fetchPatient360History } from '@/lib/doctor/patient-360-history';
import {
  appointmentBelongsToDoctor,
  getDoctorSession,
  type DoctorSession,
} from '@/lib/doctor/session';
import { acknowledgeEmergencyAlert } from '@/lib/hospital/operations/emergency-alert-sync';
import {
  formatDoctorArrivalToast,
  playDoctorOpdChime,
} from '@/lib/notifications/opd-alerts';
import { CACHE_KEYS, readLocalJson } from '@/lib/persistence/local-cache';
import { isDemoMode } from '@/lib/shared/demo-mode';
import { supabase } from '@/lib/supabase';

import {
  DEFAULT_QUEUE_DATE_FILTER,
  fetchDoctorDashboardMetrics,
  fetchDoctorQueueRows,
  mapAppointmentRecordToQueueRow,
  rpcCallNextPatient,
  startEncounter,
  toLiveQueueRow,
  type QueueDateFilter,
} from './supabase-service';
import { queueDateFilterKey } from '@/lib/scheduling/queue-date-filter';
import type { DoctorQueueRow, LiveQueueRow, PrescriptionItem } from './types';

const APPOINTMENTS_REALTIME_TABLE = 'appointments';

type DoctorQueueCache = {
  doctorId: string;
  appointments: DoctorQueueRow[];
};

type QueueInput = DoctorSession | null | {
  employeeId?: string;
  doctorName?: string;
  doctorUuid?: string;
  department?: string;
};

function toSession(input: QueueInput): DoctorSession | null {
  if (!input) return null;
  if ('doctorId' in input && input.doctorId) {
    return input as DoctorSession;
  }
  const alt = input as {
    employeeId?: string;
    doctorName?: string;
    department?: string;
    doctorUuid?: string;
  };
  const doctorId = alt.employeeId || alt.doctorUuid;
  if (!doctorId) return null;
  return {
    doctorId,
    doctorUuid: alt.doctorUuid,
    doctorName: alt.doctorName || 'Doctor',
    department: alt.department,
    employeeId: alt.employeeId || doctorId,
  };
}

type QueueHookResult = {
  tokens: DoctorQueueRow[];
  appointments: DoctorQueueRow[];
  data: LiveQueueRow[];
  isLoading: boolean;
  isFetching: boolean;
  refetch: ReturnType<typeof useQuery<DoctorQueueRow[]>>['refetch'];
};

export function useDoctorQueue(
  input: QueueInput,
  options?: { dateFilter?: QueueDateFilter },
): QueueHookResult {
  const queryClient = useQueryClient();
  const session = toSession(input);
  const dateFilter = options?.dateFilter ?? DEFAULT_QUEUE_DATE_FILTER;
  const dateFilterKey = queueDateFilterKey(dateFilter);
  const cached =
    isDemoMode() && session?.doctorId ? readLocalJson<DoctorQueueCache>(CACHE_KEYS.doctorQueue) : null;
  const initialData =
    isDemoMode() && cached && session?.doctorId && cached.doctorId === session.doctorId
      ? cached.appointments
      : undefined;

  const query = useQuery({
    queryKey: ['doctor-queue', session?.doctorId, session?.department, dateFilterKey],
    queryFn: () => fetchDoctorQueueRows(supabase, session as DoctorSession, dateFilter),
    enabled: Boolean(session?.doctorId && session?.doctorName),
    staleTime: 30000,
    refetchOnWindowFocus: false,
    initialData,
    initialDataUpdatedAt: 0,
    placeholderData: (previous) => previous,
  });

  useEffect(() => {
    if (!session?.doctorId || !session.doctorName) return;

    const queueQueryKey = ['doctor-queue', session.doctorId, session.department, dateFilterKey] as const;

    const upsertQueueRow = (record: Record<string, unknown>) => {
      const mapped = mapAppointmentRecordToQueueRow(record);
      const rowKey = String(mapped.appointment_id || mapped.id);

      queryClient.setQueryData<DoctorQueueRow[]>(queueQueryKey, (previous) => {
        const list = previous ?? [];
        const withoutDuplicate = list.filter(
          (row) => String(row.appointment_id || row.id) !== rowKey,
        );
        return [mapped, ...withoutDuplicate];
      });
    };

    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: ['doctor-queue'] });
    };

    const channel = supabase
      .channel(`doctor-appointments-live-${session.doctorId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: APPOINTMENTS_REALTIME_TABLE,
        },
        (payload: { new?: Record<string, unknown> }) => {
          const newRecord = (payload.new ?? {}) as Record<string, unknown>;
          if (!appointmentBelongsToDoctor(newRecord, session)) return;

          upsertQueueRow(newRecord);
          void queryClient.invalidateQueries({ queryKey: ['doctor-queue'] });
          toast.success(formatDoctorArrivalToast(newRecord), { duration: 6000 });
          void playDoctorOpdChime();
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: APPOINTMENTS_REALTIME_TABLE,
        },
        (payload: { new?: Record<string, unknown> }) => {
          const newRecord = (payload.new ?? {}) as Record<string, unknown>;
          if (!appointmentBelongsToDoctor(newRecord, session)) return;
          upsertQueueRow(newRecord);
          void queryClient.invalidateQueries({ queryKey: ['doctor-queue'] });
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hospital_opd_queue',
        },
        refresh,
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [dateFilterKey, queryClient, session?.department, session?.doctorId, session?.doctorName]);

  const tokens = query.data ?? [];
  const live = tokens.map(toLiveQueueRow);

  return {
    tokens,
    appointments: tokens,
    data: live,
    isLoading: query.isLoading && tokens.length === 0,
    isFetching: query.isFetching,
    refetch: query.refetch,
  };
}

export function useAuthenticatedDoctor() {
  return useQuery({
    queryKey: ['authenticated-doctor'],
    queryFn: getAuthenticatedDoctor,
    staleTime: 30000,
    retry: 0,
  });
}

export function useDoctorContext(employeeId: string) {
  return useQuery({
    queryKey: ['doctor-context', employeeId],
    queryFn: () => resolveDoctorContext(getDoctorSession() ?? { doctorId: employeeId, doctorName: 'Doctor' }),
    enabled: Boolean(employeeId),
    staleTime: 30000,
  });
}

export function useDoctorDashboardRealtime(employeeId: string, doctorName: string, email?: string) {
  const session: DoctorSession = {
    doctorId: employeeId,
    doctorName,
    email,
    employeeId,
  };
  const query = useQuery({
    queryKey: ['doctor-dashboard', employeeId, doctorName],
    queryFn: () => fetchDoctorDashboardMetrics(session),
    enabled: Boolean(employeeId),
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
  return {
    ...query,
    resolvedDoctorId: employeeId,
  };
}

export function useDoctorAppointmentsRealtime(doctorId: string) {
  const queue = useDoctorQueue({ employeeId: doctorId, doctorName: 'Doctor', doctorUuid: doctorId });
  const appointments = queue.tokens.map((row) => ({
    appointment_id: String(row.appointment_id || row.id),
    patient_id: String(row.patient_id || row.id),
    doctor_id: row.doctor_id || doctorId,
    patient_name: row.patient_name || 'Patient',
    patient_age: row.age == null ? undefined : Number(row.age) || undefined,
    patient_gender: row.gender,
    doctor_name: row.doctor_name,
    department: row.department,
    reason_for_visit: row.reason_for_visit || row.chief_complaint,
    appointment_date: String(row.created_at || '').slice(0, 10),
    appointment_time: row.appointment_time || row.time_slot || '',
    status: row.status || 'WAITING',
    token_number: row.token_number ? String(row.token_number) : undefined,
  }));
  return {
    data: appointments,
    isLoading: queue.isLoading,
    refetch: queue.refetch,
  };
}

type EmergencyAlertView = {
  id: string;
  source: 'alert' | 'triage';
  severity?: string;
  status?: string;
  patient_name?: string;
  patient_id?: string;
  message?: string;
  location?: string;
  emergency_contact?: string;
  vitals_summary?: string;
  emergency_alert_id?: string;
};

export function useEmergencyAlertsRealtime(doctorId: string) {
  const [data, setData] = useState<EmergencyAlertView[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!doctorId) {
      setData([]);
      setIsLoading(false);
      return;
    }

    const [alertsRes, triageRes] = await Promise.all([
      supabase.from('emergency_alerts').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('emergency_triage').select('*').order('created_at', { ascending: false }).limit(50),
    ]);

    const alerts: EmergencyAlertView[] = (alertsRes.data ?? []).map((row: Record<string, unknown>) => ({
      id: String(row.id ?? ''),
      source: 'alert' as const,
      severity: String(row.severity ?? ''),
      status: String(row.status ?? ''),
      patient_name: String(row.patient_name ?? row.patient_info ?? ''),
      patient_id: String(row.patient_id ?? ''),
      message: String(row.emergency_notes ?? row.place_description ?? ''),
      location: String(row.place_description ?? ''),
    }));

    const triage: EmergencyAlertView[] = (triageRes.data ?? []).map((row: Record<string, unknown>) => ({
      id: String(row.id ?? ''),
      source: 'triage' as const,
      severity: String(row.priority_tier ?? row.priority ?? ''),
      status: String(row.status ?? 'active'),
      patient_name: String(row.patient_name ?? ''),
      patient_id: String(row.patient_uhid ?? row.uhid ?? ''),
      message: String(row.chief_complaint ?? ''),
      emergency_alert_id: row.emergency_alert_id ? String(row.emergency_alert_id) : undefined,
    }));

    setData([...alerts, ...triage].sort(
      (a, b) => (b.id > a.id ? 1 : -1),
    ));
    setIsLoading(false);
  }, [doctorId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  useEffect(() => {
    if (!doctorId) return;

    const channel = supabase
      .channel(`doctor-emergency-live-${doctorId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'emergency_alerts' },
        () => {
          void refetch();
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'emergency_triage' },
        () => {
          void refetch();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [doctorId, refetch]);

  return { data, isLoading, refetch };
}

export function useCallNextPatient(doctorId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => rpcCallNextPatient(doctorId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['doctor-queue'] });
    },
  });
}

export function useCallPatient(doctorId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (tokenId: string) => {
      await supabase.from('appointments').update({ status: 'CALLED', queue_status: 'CALLED' }).eq('id', tokenId);
      return tokenId;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['doctor-queue'] });
      void doctorId;
    },
  });
}

export function useStartConsultation(doctorId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (token: LiveQueueRow | DoctorQueueRow) => {
      await startEncounter(toLiveQueueRow(token as DoctorQueueRow), doctorId);
      return String(token.appointment_id || token.id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['doctor-queue'] });
    },
  });
}

export function useCompleteConsultation(doctorId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (tokenId: string) => {
      await supabase.from('appointments').update({ status: 'billing_pending' }).eq('id', tokenId);
      return tokenId;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['doctor-queue'] });
      void doctorId;
    },
  });
}

export function useEmergencyQueueBypass(doctorId: string) {
  return useMutation({
    mutationFn: async (_tokenId?: string) => rpcCallNextPatient(doctorId),
  });
}

export function useAcknowledgeEmergency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (alertId: string) => {
      const result = await acknowledgeEmergencyAlert(supabase, alertId);
      if (!result.ok) throw new Error(result.error ?? 'Acknowledge failed');
      return result.triageId;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['emergency-alerts'] });
    },
  });
}

export function useEscalateEmergency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (alertId: string) => {
      await supabase.from('emergency_alerts').update({ status: 'ESCALATED', severity: 'CRITICAL' }).eq('id', alertId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['emergency-alerts'] });
    },
  });
}

type PatientSearchRow = {
  id: string;
  full_name: string;
  age?: number;
  gender?: string;
  blood_group?: string;
  allergies?: string;
  chronic_conditions?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
};

export function usePatientSearch(queryText: string) {
  return useQuery({
    queryKey: ['patient-search', queryText],
    queryFn: async (): Promise<PatientSearchRow[]> => {
      let request = supabase.from('appointments').select('*').order('created_at', { ascending: false }).limit(40);
      if (queryText.trim().length >= 2) {
        request = request.ilike('patient_name', `%${queryText.trim()}%`);
      }
      const { data } = await request;
      return (data ?? []).map((row: Record<string, unknown>) => {
        return {
          id: String(row.patient_id ?? row.id ?? ''),
          full_name: String(row.patient_name ?? row.name ?? 'Patient'),
          age: row.age as number | undefined,
          gender: row.gender ? String(row.gender) : undefined,
          blood_group: row.blood_group ? String(row.blood_group) : undefined,
          allergies: row.allergies ? String(row.allergies) : undefined,
          chronic_conditions: row.chronic_conditions ? String(row.chronic_conditions) : undefined,
          emergency_contact_name: row.emergency_contact_name ? String(row.emergency_contact_name) : undefined,
          emergency_contact_phone: row.emergency_contact_phone ? String(row.emergency_contact_phone) : undefined,
        };
      });
    },
  });
}

export function usePatientEncounters(patientId: string) {
  return useQuery({
    queryKey: ['patient-encounters', patientId],
    queryFn: async () => {
      const history = await fetchPatient360History(supabase, { patient_id: patientId, id: patientId });
      return {
        consultations: history.map((item) => ({
          id: item.id,
          created_at: item.created_at,
          chief_complaint: item.diagnosis,
          doctor_notes: item.clinical_notes,
        })),
      };
    },
    enabled: Boolean(patientId),
  });
}

export function usePatientLabOrders(patientId: string) {
  return useQuery({
    queryKey: ['patient-lab-orders', patientId],
    queryFn: async () => {
      const { data } = await supabase.from('lab_orders').select('*').eq('patient_id', patientId);
      return (data ?? []) as Array<{ id: string; status?: string; test_name?: string }>;
    },
    enabled: Boolean(patientId),
  });
}

export function useCompleteEncounter(doctorId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      consultationId: string;
      patientId?: string | null;
      patientName?: string;
      uhid?: string | null;
      doctorId: string;
      doctorName: string;
      department?: string;
      chiefComplaint?: string;
      symptoms?: string[];
      clinicalExamination?: string;
      doctorNotes?: string;
      primaryDiagnosis?: string;
      icd10Code?: string;
      diagnosisSeverity?: string;
      prescriptions: PrescriptionItem[];
      followUpDate?: string;
      labTests?: string[];
      vitals?: Record<string, unknown>;
      appointmentId?: string | null;
      sourceTable?: string;
      consultationFee?: number;
      appointmentType?: string;
      source?: string;
      bookingSource?: string;
      tokenNumber?: string | number | null;
    }) => {
      const appointmentId = String(input.appointmentId || input.consultationId);
      const patientName = String(input.patientName || 'Patient').trim() || 'Patient';
      const diagnosis = input.primaryDiagnosis || input.chiefComplaint || 'General Consultation';
      const clinicalNotes = [input.clinicalExamination, input.doctorNotes].filter(Boolean).join('\n');
      const medications = input.prescriptions.map((item) => ({
        name: item.medicine_name,
        dosage: item.dosage,
        timing: item.frequency,
        duration: item.duration,
        qty: 1,
      }));

      const dispatch = await dispatchDigitalPrescription(supabase, {
        appointmentId,
        sourceTable: input.sourceTable,
        patientId: input.patientId || null,
        patientName,
        uhid: input.uhid || input.patientId || null,
        doctorId: input.doctorId || doctorId,
        doctorName: input.doctorName,
        department: input.department,
        diagnosis,
        clinicalNotes,
        doctorInstructions: input.doctorNotes || '',
        medications,
        vitals: input.vitals || null,
        consultationFee: input.consultationFee ?? 500,
        skipBilling: true,
      });

      if (!dispatch.ok) {
        throw new Error(dispatch.error || 'Failed to dispatch prescription.');
      }

      const billing = await handoffConsultationToHospitalBilling(
        supabase,
        {
          id: appointmentId,
          appointment_id: appointmentId,
          patient_id: input.patientId || input.uhid || appointmentId,
          patient_name: patientName,
          uhid: input.uhid || input.patientId || undefined,
          _source_table: input.sourceTable,
          department: input.department,
          appointment_type: input.appointmentType,
          source: input.source,
          booking_source: input.bookingSource,
          token_number: input.tokenNumber,
        },
        {
          doctorId: input.doctorId || doctorId,
          doctorName: input.doctorName,
          department: input.department,
          consultationFee: input.consultationFee ?? 500,
        },
        {
          consultationFee: input.consultationFee ?? 500,
          medicines: [],
          prescribedItems: input.prescriptions.map((item) => ({
            drug: item.medicine_name,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration,
            instructions: item.instructions || '',
            quantity: 1,
          })),
        },
      );

      if (!billing.ok) {
        throw new Error(billing.error || 'Hospital billing handoff failed.');
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['doctor-queue'] });
      void queryClient.invalidateQueries({ queryKey: ['patient-records'] });
      void queryClient.invalidateQueries({ queryKey: ['patient-encounters'] });
      void queryClient.invalidateQueries({ queryKey: ['hospital-billing'] });
      void queryClient.invalidateQueries({ queryKey: ['billing-invoices'] });
      void queryClient.invalidateQueries({ queryKey: ['patient-prescriptions'] });
      void queryClient.invalidateQueries({ queryKey: ['opd-charges'] });
    },
  });
}
