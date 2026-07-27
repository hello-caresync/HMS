'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  acknowledgeNotification,
  createStatLabOrder,
  emergencyAction,
  fetchAnalytics,
  fetchCalendarEvents,
  fetchClinicalMessages,
  fetchClinicalOrders,
  fetchDoctorProfile,
  fetchDoctorSchedule,
  fetchMessageChannels,
  fetchEmergencyCases,
  fetchEmrTimeline,
  fetchFormulary,
  fetchIpdAdmissions,
  fetchNotificationsFeed,
  fetchOpdQueue,
  fetchPatientLabOrders,
  fetchPatients,
  fetchTelemedicineSession,
  generateDocument,
  saveConsultation,
  saveSoapNote,
  sendClinicalMessage,
  sendPrescription,
  updateDoctorProfile,
} from '@/lib/doctor/client/clinical-data-service';

export type {
  EmergencyCaseDto,
  IpdAdmissionDto,
  NotificationDto,
  OpdQueueItem,
  PatientDto,
} from '@/lib/doctor/types/clinical-dto';

export function useOpdQueue() {
  return useQuery({
    queryKey: ['opd', 'queue'],
    queryFn: fetchOpdQueue,
  });
}

export function usePatients(opts?: { search?: string; status?: 'OPD' | 'IPD' | 'EMERGENCY' }) {
  return useQuery({
    queryKey: ['patients', opts?.search, opts?.status],
    queryFn: () => fetchPatients(opts),
  });
}

export function useIpdAdmissions() {
  return useQuery({
    queryKey: ['ipd', 'admissions'],
    queryFn: fetchIpdAdmissions,
  });
}

export function useEmergencyCases() {
  return useQuery({
    queryKey: ['emergency'],
    queryFn: fetchEmergencyCases,
  });
}

export function useNotificationsFeed() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotificationsFeed,
  });
}

export function useSaveConsultation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => saveConsultation(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['opd', 'queue'] });
    },
  });
}

export function useSendPrescription() {
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => sendPrescription(body),
  });
}

export function useSaveSoapNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { admissionId: string; soap: Record<string, string> }) => saveSoapNote(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ipd', 'admissions'] });
    },
  });
}

export function useEmergencyAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => emergencyAction(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['emergency'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useAcknowledgeNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => acknowledgeNotification(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useGenerateDocument() {
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => generateDocument(body),
  });
}

export function usePatientLabOrders(patientId: string | undefined) {
  return useQuery({
    queryKey: ['lab-orders', patientId],
    enabled: !!patientId,
    queryFn: () => fetchPatientLabOrders(patientId!),
  });
}

export function useFormulary() {
  return useQuery({
    queryKey: ['formulary'],
    queryFn: fetchFormulary,
  });
}

export function useClinicalMessages(channelId: string) {
  return useQuery({
    queryKey: ['messages', channelId],
    queryFn: () => fetchClinicalMessages(channelId),
  });
}

export function useSendClinicalMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { channelId: string; body: string; stat?: boolean }) => sendClinicalMessage(body),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['messages', vars.channelId] }),
  });
}

export function useCalendarEvents() {
  return useQuery({
    queryKey: ['calendar'],
    queryFn: fetchCalendarEvents,
  });
}

export function useAnalytics() {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: fetchAnalytics,
  });
}

export function useTelemedicineSession() {
  return useQuery({
    queryKey: ['telemedicine', 'session'],
    queryFn: fetchTelemedicineSession,
  });
}

export function useStatLabOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => createStatLabOrder(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['lab-orders'] });
    },
  });
}

export function useEmrTimeline(patientId: string | undefined) {
  return useQuery({
    queryKey: ['emr', 'timeline', patientId],
    enabled: !!patientId,
    queryFn: () => fetchEmrTimeline(patientId!),
  });
}

export function useClinicalOrders() {
  return useQuery({
    queryKey: ['clinical-orders'],
    queryFn: fetchClinicalOrders,
  });
}

export function useMessageChannels() {
  return useQuery({
    queryKey: ['message-channels'],
    queryFn: fetchMessageChannels,
  });
}

export function useDoctorProfile() {
  return useQuery({
    queryKey: ['doctor-profile'],
    queryFn: fetchDoctorProfile,
  });
}

export function useUpdateDoctorProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof updateDoctorProfile>[0]) => updateDoctorProfile(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['doctor-profile'] }),
  });
}

export function useDoctorSchedule(from?: string, to?: string) {
  return useQuery({
    queryKey: ['doctor-schedule', from, to],
    queryFn: () => fetchDoctorSchedule(from, to),
  });
}
