'use client';

import { useEffect, useRef } from 'react';

import { syncAppointmentToDoctor } from '@/lib/ecosystem/doctor-sync';
import { useEcosystemStore } from '@/lib/ecosystem/store';
import type { EcosystemAppointment } from '@/lib/ecosystem/types';
import { getSupabaseBrowserClient } from '@/lib/supabase';

import { useDoctorAuth } from '@/lib/doctor/auth/DoctorAuthProvider';

import { mergeEcosystemIntoDoctor } from '@/lib/ecosystem/doctor-sync';
import { useDoctorClinicalStore } from './store';

type EcoAppointmentRow = {
  id: string;
  patient_id: string;
  doctor_id: string;
  patient_name: string;
  patient_mrn: string | null;
  doctor_name: string;
  department: string;
  appointment_date: string;
  appointment_time: string;
  end_time: string | null;
  reason: string | null;
  status: string;
  visit_type: string | null;
  token: string | null;
  location: string | null;
};

function mapRow(row: EcoAppointmentRow): EcosystemAppointment {
  return {
    id: row.id,
    patientId: row.patient_id,
    patientName: row.patient_name,
    patientMrn: row.patient_mrn ?? '',
    doctorId: row.doctor_id,
    doctorName: row.doctor_name,
    department: row.department,
    date: row.appointment_date,
    time: String(row.appointment_time).slice(0, 5),
    endTime: row.end_time ? String(row.end_time).slice(0, 5) : '',
    reason: row.reason ?? '',
    status: row.status as EcosystemAppointment['status'],
    type: row.visit_type === 'Teleconsult' ? 'Teleconsult' : 'OPD',
    token: row.token ?? '',
    location: row.location ?? '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/** Live Supabase + ecosystem sync for doctor V0 */
export function useDoctorRealtime() {
  const { session } = useDoctorAuth();
  const doctorId = session?.doctorId;
  const fetchIdRef = useRef(0);

  useEffect(() => {
    if (!doctorId) return;

    mergeEcosystemIntoDoctor(doctorId);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const fetchAppointments = async () => {
      const fetchId = ++fetchIdRef.current;
      const { data, error } = await supabase
        .from('ecosystem_appointments')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('appointment_date', { ascending: true });

      if (error || fetchId !== fetchIdRef.current) return;

      const rows = (data ?? []) as EcoAppointmentRow[];
      const eco = useEcosystemStore.getState();
      const merged = [...eco.appointments];

      rows.forEach((row) => {
        const mapped = mapRow(row);
        const idx = merged.findIndex((a) => a.id === mapped.id);
        if (idx >= 0) merged[idx] = mapped;
        else merged.push(mapped);
        syncAppointmentToDoctor(mapped);
      });

      useEcosystemStore.setState({ appointments: merged });
      mergeEcosystemIntoDoctor(doctorId);
    };

    void fetchAppointments();

    const channel = supabase
      .channel(`doctor_appts_${doctorId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ecosystem_appointments' },
        () => {
          void fetchAppointments();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [doctorId]);

  useEffect(() => {
    if (!doctorId) return;

    const unsub = useEcosystemStore.subscribe((state, prev) => {
      if (state.appointments === prev.appointments) return;
      mergeEcosystemIntoDoctor(doctorId);
      const forDoctor = state.appointments.filter((a) => a.doctorId === doctorId);
      forDoctor.forEach((a) => syncAppointmentToDoctor(a));
    });

    return unsub;
  }, [doctorId]);
}
