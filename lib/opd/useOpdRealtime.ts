'use client';

import { useEffect } from 'react';

import { useEcosystemStore } from '@/lib/ecosystem/store';
import { usePatientAuth } from '@/lib/patient/auth/PatientAuthProvider';

import { subscribeOpdEvents } from './realtime';
import { announcePatientCall } from './voice-engine';

/** Patient App listener — live queue refresh + TTS when doctor calls this patient */
export function useOpdRealtime() {
  const { patient } = usePatientAuth();
  const patientId = patient?.id ?? null;
  const refreshOpdMetrics = useEcosystemStore((s) => s.refreshOpdMetrics);

  useEffect(() => {
    return subscribeOpdEvents((event) => {
      if (event.type === 'OPD_QUEUE_UPDATED' || event.type === 'OPD_CHECKIN') {
        refreshOpdMetrics();
      }

      if (event.type !== 'OPD_PATIENT_CALLED' || !patientId) return;

      const appt = useEcosystemStore
        .getState()
        .appointments.find((a) => a.id === event.payload.appointmentId && a.patientId === patientId);

      if (appt) {
        announcePatientCall(
          event.payload.patientName,
          event.payload.roomNumber,
          event.payload.language,
        );
      }
    });
  }, [patientId, refreshOpdMetrics]);
}
