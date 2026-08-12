'use client';

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { getAuthenticatedDoctor } from '@/lib/doctor/auth';
import { fetchDoctorAppointments } from '@/lib/doctor/appointments-service';
import { resolveDoctorContext } from './doctor-context';
import {
  acknowledgeEmergency,
  escalateEmergency,
  getDoctorDashboardData,
  fetchDoctorDashboardData,
  fetchEmergencyAlerts,
  fetchLiveDoctorQueue,
  fetchPatientEncounters,
  fetchPatientLabOrders,
  resolveDoctorIdFromDb,
  rpcCallNextPatient,
  rpcCompleteConsultationEncounter,
  searchPatients,
  startEncounter,
  updateTokenStatus,
} from './supabase-service';
import type { CompleteEncounterPayload, LiveQueueRow } from './types';

export const queryKeys = {
  doctorQueue: (doctorUuid: string) => ['doctor-queue', doctorUuid] as const,
  doctorDashboard: (doctorUuid: string) => ['doctor-dashboard', doctorUuid] as const,
  resolvedDoctorId: (employeeId: string, doctorName: string) =>
    ['resolved-doctor-id', employeeId, doctorName] as const,
  patients: (search: string, token?: string) => ['patients-registry', search, token ?? ''] as const,
  emergency: (doctorUuid: string) => ['emergency-alerts', doctorUuid] as const,
  encounters: (patientId: string) => ['patient-encounters', patientId] as const,
  labOrders: (patientId: string) => ['patient-lab-orders', patientId] as const,
  doctorContext: (employeeId: string) => ['doctor-context', employeeId] as const,
  authenticatedDoctor: ['authenticated-doctor'] as const,
  doctorAppointments: (doctorId: string) => ['doctor-appointments', doctorId] as const,
  doctorMetrics: (doctorId?: string) => ['doctor-dashboard-metrics', doctorId ?? 'auto'] as const,
};

/** Dashboard KPIs + appointments + tokens via `getDoctorDashboardData()`. */
export function useDoctorDashboardMetrics(doctorId?: string) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.doctorMetrics(doctorId),
    queryFn: () => getDoctorDashboardData(doctorId),
    staleTime: 15_000,
  });

  const activeDoctorId = doctorId ?? query.data?.doctorId;

  useEffect(() => {
    if (!activeDoctorId) return;

    const channel = supabase
      .channel(`doctor-${activeDoctorId}-dashboard-metrics`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `doctor_id=eq.${activeDoctorId}`,
        },
        () => {
          void qc.invalidateQueries({ queryKey: queryKeys.doctorMetrics(doctorId) });
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'opd_tokens',
          filter: `doctor_id=eq.${activeDoctorId}`,
        },
        () => {
          void qc.invalidateQueries({ queryKey: queryKeys.doctorMetrics(doctorId) });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [activeDoctorId, doctorId, qc]);

  return query;
}

/** Phase 1: resolve logged-in doctor via Supabase Auth email or session fallback. */
export function useAuthenticatedDoctor() {
  return useQuery({
    queryKey: queryKeys.authenticatedDoctor,
    queryFn: () => getAuthenticatedDoctor(),
    staleTime: 60_000,
    retry: 1,
  });
}

/** Today's appointments with realtime refresh on `appointments` changes. */
export function useDoctorAppointmentsRealtime(doctorId: string) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.doctorAppointments(doctorId || 'pending'),
    queryFn: () => fetchDoctorAppointments(doctorId, { todayOnly: true }),
    enabled: Boolean(doctorId),
  });

  useEffect(() => {
    if (!doctorId) return;

    const channel = supabase
      .channel(`doctor-${doctorId}-appointments`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `doctor_id=eq.${doctorId}`,
        },
        () => {
          void qc.invalidateQueries({ queryKey: queryKeys.doctorAppointments(doctorId) });
          void qc.invalidateQueries({ queryKey: queryKeys.doctorDashboard(doctorId) });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [doctorId, qc]);

  return query;
}

/** Resolve active clinician → Supabase `doctor_id` UUID from `doctors` table. */
export function useResolvedDoctorId(employeeId: string, doctorName: string, userEmail?: string) {
  return useQuery({
    queryKey: queryKeys.resolvedDoctorId(employeeId, doctorName),
    queryFn: () => resolveDoctorIdFromDb(employeeId, doctorName, userEmail),
    enabled: Boolean(employeeId || doctorName || userEmail),
    staleTime: 60_000,
  });
}

/** Dashboard queue + KPIs with filtered Supabase Realtime (opd_tokens + appointments). */
export function useDoctorDashboardRealtime(
  employeeId: string,
  doctorName: string,
  userEmail?: string,
) {
  const qc = useQueryClient();
  const { data: resolvedDoctorId } = useResolvedDoctorId(employeeId, doctorName, userEmail);

  const query = useQuery({
    queryKey: queryKeys.doctorDashboard(resolvedDoctorId ?? 'pending'),
    queryFn: () => fetchDoctorDashboardData(resolvedDoctorId!, { employeeId }),
    enabled: Boolean(resolvedDoctorId),
  });

  useEffect(() => {
    if (!resolvedDoctorId) return;

    const channel = supabase
      .channel(`doctor-queue-${resolvedDoctorId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'opd_tokens',
          filter: `doctor_id=eq.${resolvedDoctorId}`,
        },
        () => {
          void qc.invalidateQueries({ queryKey: queryKeys.doctorDashboard(resolvedDoctorId) });
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `doctor_id=eq.${resolvedDoctorId}`,
        },
        () => {
          void qc.invalidateQueries({ queryKey: queryKeys.doctorDashboard(resolvedDoctorId) });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [resolvedDoctorId, qc]);

  return { ...query, resolvedDoctorId };
}

export function useDoctorContext(employeeId: string) {
  return useQuery({
    queryKey: queryKeys.doctorContext(employeeId),
    queryFn: () => resolveDoctorContext(),
    enabled: Boolean(employeeId),
    staleTime: 5 * 60_000,
  });
}

export type DoctorQueueScope = {
  doctorUuid?: string;
  employeeId?: string;
  doctorName?: string;
};

/** Live OPD queue — filtered realtime on resolved `doctor_id` */
export function useDoctorQueue(scope: DoctorQueueScope | string) {
  const qc = useQueryClient();
  const opts: DoctorQueueScope =
    typeof scope === 'string' ? { doctorUuid: scope } : scope;
  const { doctorUuid, employeeId, doctorName } = opts;
  const { data: resolvedDoctorId } = useResolvedDoctorId(employeeId ?? '', doctorName ?? '');
  const activeDoctorId = resolvedDoctorId ?? doctorUuid ?? '';
  const queueKey = activeDoctorId || employeeId || doctorName || 'unknown';

  const query = useQuery({
    queryKey: queryKeys.doctorQueue(queueKey),
    queryFn: () =>
      fetchLiveDoctorQueue({ doctorUuid: activeDoctorId, employeeId, doctorName }),
    enabled: Boolean(employeeId || activeDoctorId || doctorName),
  });

  useEffect(() => {
    if (!activeDoctorId) return;

    const channel = supabase
      .channel(`doctor-queue-${activeDoctorId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'opd_tokens',
          filter: `doctor_id=eq.${activeDoctorId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: queryKeys.doctorQueue(queueKey) });
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `doctor_id=eq.${activeDoctorId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: queryKeys.doctorQueue(queueKey) });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [activeDoctorId, queueKey, qc]);

  return query;
}

/** @deprecated alias */
export function useSmartqQueue(doctorIdOrUuid: string) {
  return useDoctorQueue(doctorIdOrUuid);
}

export function useEmergencyAlertsRealtime(doctorUuid: string) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.emergency(doctorUuid),
    queryFn: () => fetchEmergencyAlerts(doctorUuid),
    refetchInterval: 60_000,
    enabled: Boolean(doctorUuid),
  });

  useEffect(() => {
    const channel = supabase
      .channel('realtime-emergency')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'emergency_alerts' },
        () => {
          qc.invalidateQueries({ queryKey: ['emergency-alerts'] });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc]);

  return query;
}

export function usePatientSearch(search: string, tokenNumber?: string) {
  return useQuery({
    queryKey: queryKeys.patients(search, tokenNumber),
    queryFn: () => searchPatients(search, tokenNumber),
  });
}

export function usePatientEncounters(patientId: string) {
  return useQuery({
    queryKey: queryKeys.encounters(patientId),
    queryFn: () => fetchPatientEncounters(patientId),
    enabled: Boolean(patientId),
  });
}

export function usePatientLabOrders(patientId: string) {
  return useQuery({
    queryKey: queryKeys.labOrders(patientId),
    queryFn: () => fetchPatientLabOrders(patientId),
    enabled: Boolean(patientId),
  });
}

export function useCallNextPatient(doctorUuid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => rpcCallNextPatient(doctorUuid),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.doctorQueue(doctorUuid) }),
  });
}

export function useCallPatient(doctorUuid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tokenId: string) => updateTokenStatus(tokenId, 'CALLED'),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.doctorQueue(doctorUuid) }),
  });
}

export function useStartConsultation(doctorUuid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (token: LiveQueueRow) => startEncounter(token, doctorUuid),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.doctorQueue(doctorUuid) }),
  });
}

export function useCompleteConsultation(doctorUuid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tokenId: string) => updateTokenStatus(tokenId, 'COMPLETED'),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.doctorQueue(doctorUuid) }),
  });
}

export function useCompleteEncounter(doctorUuid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CompleteEncounterPayload) => rpcCompleteConsultationEncounter(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.doctorQueue(doctorUuid) }),
  });
}

/** @deprecated use useCompleteEncounter */
export function useSignPrescription(doctorUuid: string) {
  return useCompleteEncounter(doctorUuid);
}

export function useAcknowledgeEmergency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: acknowledgeEmergency,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['emergency-alerts'] }),
  });
}

export function useEscalateEmergency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: escalateEmergency,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['emergency-alerts'] }),
  });
}

export function useEmergencyQueueBypass(doctorUuid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tokenId: string) => {
      await updateTokenStatus(tokenId, 'SKIPPED');
      return rpcCallNextPatient(doctorUuid);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.doctorQueue(doctorUuid) }),
  });
}
