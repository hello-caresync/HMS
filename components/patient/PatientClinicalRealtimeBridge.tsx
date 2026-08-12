'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import {
  CLINICAL_STORAGE,
  readJsonLocal,
  resolveActivePatientId,
  writeJsonLocal,
} from '@/lib/clinical/bridge';
import type { ClinicalAdviceMessage, ClinicalNote } from '@/lib/clinical/types';

/** Global patient-side realtime bridge for Rx + doctor advice toasts. */
export function PatientClinicalRealtimeBridge() {
  useEffect(() => {
    const patientId = resolveActivePatientId();

    const channel = supabase
      .channel(`patient_clinical_bridge_${patientId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'clinical_notes',
          filter: `patient_id=eq.${patientId}`,
        },
        (payload) => {
          const note = payload.new as ClinicalNote;
          const notes = readJsonLocal<ClinicalNote[]>(CLINICAL_STORAGE.clinicalNotes, []);
          writeJsonLocal(CLINICAL_STORAGE.clinicalNotes, [note, ...notes.filter((n) => n.id !== note.id)]);

          toast.success('New e-Prescription received', {
            description: `${note.doctor_name || 'Your doctor'} issued a digital prescription.`,
            action: {
              label: 'View',
              onClick: () => {
                window.location.href = '/patient/prescriptions/';
              },
            },
          });

          window.dispatchEvent(new CustomEvent('curasync:clinical-note', { detail: note }));
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'patient_messages',
          filter: `patient_id=eq.${patientId}`,
        },
        (payload) => {
          const msg = payload.new as ClinicalAdviceMessage;
          if (msg.sender_type && msg.sender_type !== 'doctor') return;

          const msgs = readJsonLocal<ClinicalAdviceMessage[]>(CLINICAL_STORAGE.messages, []);
          writeJsonLocal(CLINICAL_STORAGE.messages, [
            {
              id: String(msg.id || `msg_${Date.now()}`),
              patient_id: String(msg.patient_id || patientId),
              patient_name: String(msg.patient_name || ''),
              doctor_id: String(msg.doctor_id || ''),
              doctor_name: String(msg.doctor_name || 'Doctor'),
              message: String(msg.message || ''),
              priority: String(msg.priority || 'high'),
              sender_type: 'doctor',
              created_at: String(msg.created_at || new Date().toISOString()),
            },
            ...msgs,
          ]);

          toast.message('Clinical alert from your doctor', {
            description: String(msg.message || 'New advice available in Messages.'),
            action: {
              label: 'Open',
              onClick: () => {
                window.location.href = '/patient/messages/';
              },
            },
          });

          window.dispatchEvent(new CustomEvent('curasync:doctor-message', { detail: msg }));
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  return null;
}
