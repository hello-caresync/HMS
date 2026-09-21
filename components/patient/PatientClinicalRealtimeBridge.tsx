'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import {
  CLINICAL_STORAGE,
  readJsonLocal,
  resolveActivePatientId,
  writeJsonLocal,
} from '@/lib/clinical/bridge';
import { subscribePatientChannelMessages } from '@/lib/patient/messages/patient-channel-messages';
import type { ClinicalNote } from '@/lib/clinical/types';

/** Global patient-side realtime bridge for Rx + doctor advice toasts. */
export function PatientClinicalRealtimeBridge() {
  const patientIdRef = useRef(resolveActivePatientId());

  useEffect(() => {
    const patientId = patientIdRef.current;
    if (!patientId) return;

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
        (payload: RealtimePostgresChangesPayload<any>) => {
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
      .subscribe();

    const patientIds = [patientId].filter(Boolean);
    const unsubscribeChat = subscribePatientChannelMessages(patientIds, (message) => {
      toast.message(`Message from ${message.sender_name}`, {
        description: message.message,
      });
      window.dispatchEvent(new CustomEvent('curasync:patient-channel-message', { detail: message }));
    });

    return () => {
      void supabase.removeChannel(channel);
      unsubscribeChat();
    };
  }, []);

  return null;
}
