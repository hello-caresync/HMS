'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  completeCareCenterConsultation,
  fetchCareCenterInsights,
  fetchCareCenterIpd,
  fetchCareCenterOpd,
  requestCareCenterAdmission,
  saveCareCenterProgressNote,
  startCareCenterConsultation,
  submitCareCenterDischarge,
} from '@/lib/doctor/client/care-center-data-service';

export const CARE_CENTER_KEYS = {
  opd: ['care-center', 'opd'] as const,
  ipd: ['care-center', 'ipd'] as const,
  insights: ['care-center', 'insights'] as const,
};

export function useCareCenterOpd() {
  return useQuery({
    queryKey: CARE_CENTER_KEYS.opd,
    queryFn: fetchCareCenterOpd,
    refetchInterval: 30_000,
  });
}

export function useCareCenterIpd() {
  return useQuery({
    queryKey: CARE_CENTER_KEYS.ipd,
    queryFn: fetchCareCenterIpd,
    refetchInterval: 30_000,
  });
}

export function useCareCenterInsights() {
  return useQuery({
    queryKey: CARE_CENTER_KEYS.insights,
    queryFn: fetchCareCenterInsights,
  });
}

function invalidateCareCenter(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['care-center'] });
  qc.invalidateQueries({ queryKey: ['opd', 'queue'] });
  qc.invalidateQueries({ queryKey: ['ipd', 'admissions'] });
  qc.invalidateQueries({ queryKey: ['notifications'] });
}

export function useStartCareCenterConsultation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (appointmentId: string) => startCareCenterConsultation(appointmentId),
    onSuccess: () => invalidateCareCenter(qc),
  });
}

export function useCompleteCareCenterConsultation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: completeCareCenterConsultation,
    onSuccess: () => invalidateCareCenter(qc),
  });
}

export function useRequestCareCenterAdmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: requestCareCenterAdmission,
    onSuccess: () => invalidateCareCenter(qc),
  });
}

export function useSaveCareCenterProgressNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: saveCareCenterProgressNote,
    onSuccess: () => invalidateCareCenter(qc),
  });
}

export function useSubmitCareCenterDischarge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: submitCareCenterDischarge,
    onSuccess: () => invalidateCareCenter(qc),
  });
}
