'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { useDoctorAuth } from '@/lib/doctor/auth/DoctorAuthProvider';
import { usePatientAuth } from '@/lib/patient/auth/PatientAuthProvider';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

import {
  fetchAppointmentsForDoctor,
  fetchAppointmentsForPatient,
  fetchDoctorNotifications,
  fetchPatientNotifications,
  mergeAppointmentsIntoStores,
  notificationRowToDoctor,
  notificationRowToPatient,
  upsertDoctorNotificationsFromDb,
  upsertPatientNotificationsFromDb,
  type NotificationRow,
} from './cross-app-sync';

function useRealtimeSync(actorId: string | null | undefined, app: 'doctor' | 'patient') {
  const refreshRef = useRef(0);

  useEffect(() => {
    if (!actorId) return;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const refreshAppointments = async () => {
      const fetchId = ++refreshRef.current;
      const appts =
        app === 'doctor'
          ? await fetchAppointmentsForDoctor(supabase, actorId)
          : await fetchAppointmentsForPatient(supabase, actorId);
      if (fetchId !== refreshRef.current) return;
      mergeAppointmentsIntoStores(appts);
    };

    const refreshNotifications = async () => {
      if (app === 'doctor') {
        upsertDoctorNotificationsFromDb(await fetchDoctorNotifications(supabase, actorId));
      } else {
        upsertPatientNotificationsFromDb(await fetchPatientNotifications(supabase, actorId));
      }
    };

    void Promise.all([refreshAppointments(), refreshNotifications()]);

    const channel = supabase
      .channel(`realtime-${app}-${actorId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        (payload: RealtimePostgresChangesPayload<any>) => {
          const row = (payload.new ?? payload.old) as Record<string, string | null> | undefined;
          if (!row) return;
          if (app === 'doctor' && row.doctor_id !== actorId) return;
          if (app === 'patient' && row.patient_id !== actorId) return;

          void refreshAppointments();

          if (payload.eventType === 'INSERT' && app === 'doctor') {
            toast.info('New appointment booked', {
              description: row.patient_name
                ? `${row.patient_name} · ${row.appointment_date}`
                : 'Patient app booking received',
            });
          }
          if (payload.eventType === 'UPDATE' && app === 'patient') {
            toast.info('Appointment updated', {
              description: `Status: ${row.ecosystem_status ?? row.status ?? 'updated'}`,
            });
          }
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ecosystem_appointments' },
        (payload: RealtimePostgresChangesPayload<any>) => {
          const row = (payload.new ?? payload.old) as Record<string, string | null> | undefined;
          if (!row) return;
          if (app === 'doctor' && row.doctor_id !== actorId) return;
          if (app === 'patient' && row.patient_id !== actorId) return;
          void refreshAppointments();
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload: RealtimePostgresChangesPayload<any>) => {
          const row = payload.new as NotificationRow;
          if (app === 'doctor') {
            if (row.doctor_id && row.doctor_id !== actorId && row.target_audience !== 'both') return;
            upsertDoctorNotificationsFromDb([notificationRowToDoctor(row)]);
            if (row.target_audience === 'doctor' || row.target_audience === 'both') {
              toast.info(row.title, { description: row.body });
            }
          } else {
            if (row.patient_id && row.patient_id !== actorId && row.target_audience !== 'both') return;
            upsertPatientNotificationsFromDb([notificationRowToPatient(row)]);
            if (row.target_audience === 'patient' || row.target_audience === 'both') {
              toast.info(row.title, { description: row.body });
            }
          }
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ecosystem_notifications' },
        (payload: RealtimePostgresChangesPayload<any>) => {
          if (app !== 'patient') return;
          const row = payload.new as {
            id: string;
            patient_id: string;
            title: string;
            body: string;
            category: string;
            read: boolean;
            related_id: string | null;
            created_at: string;
          };
          if (row.patient_id !== actorId) return;
          upsertPatientNotificationsFromDb([
            {
              id: row.id,
              patientId: row.patient_id,
              title: row.title,
              body: row.body,
              category: row.category as 'appointment',
              read: row.read,
              relatedId: row.related_id ?? undefined,
              createdAt: row.created_at,
            },
          ]);
          toast.info(row.title, { description: row.body });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [actorId, app]);
}

/** Mount inside DoctorAppShell (requires DoctorAuthProvider) */
export function DoctorRealtimeSync() {
  const { session } = useDoctorAuth();
  useRealtimeSync(session?.doctorId, 'doctor');
  return null;
}

/** Mount inside PatientShell (requires PatientAuthProvider) */
export function PatientRealtimeSync() {
  const { session } = usePatientAuth();
  useRealtimeSync(session?.patientId, 'patient');
  return null;
}
