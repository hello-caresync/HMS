'use client';

import type { VoiceLanguage } from './design-tokens';

export type OpdEventType =
  | 'OPD_PATIENT_CALLED'
  | 'OPD_QUEUE_UPDATED'
  | 'OPD_CHECKIN'
  | 'OPD_FOLLOWUP_SCHEDULED'
  | 'OPD_QUEUE_PAUSED';

export type OpdPatientCalledPayload = {
  appointmentId: string;
  patientName: string;
  token: string;
  sequentialToken: string;
  roomNumber: string;
  doctorName: string;
  department: string;
  language: VoiceLanguage;
};

export type OpdEvent =
  | { type: 'OPD_PATIENT_CALLED'; payload: OpdPatientCalledPayload; at: string }
  | { type: 'OPD_QUEUE_UPDATED'; payload: { doctorId: string }; at: string }
  | { type: 'OPD_CHECKIN'; payload: { appointmentId: string; sequentialToken: string }; at: string }
  | { type: 'OPD_FOLLOWUP_SCHEDULED'; payload: { patientId: string; appointmentId: string; days: number }; at: string }
  | { type: 'OPD_QUEUE_PAUSED'; payload: { paused: boolean }; at: string };

const CHANNEL = 'nexora-opd-realtime';

export function broadcastOpdEvent(event: Omit<OpdEvent, 'at'> & { at?: string }) {
  if (typeof window === 'undefined') return;
  const full: OpdEvent = { ...event, at: event.at ?? new Date().toISOString() } as OpdEvent;
  try {
    const bc = new BroadcastChannel(CHANNEL);
    bc.postMessage(full);
    bc.close();
  } catch {
    /* BroadcastChannel unavailable */
  }
  window.dispatchEvent(new CustomEvent('nexora-opd', { detail: full }));
  try {
    localStorage.setItem('nexora-opd-last-event', JSON.stringify(full));
  } catch {
    /* ignore */
  }
}

export function subscribeOpdEvents(handler: (event: OpdEvent) => void): () => void {
  if (typeof window === 'undefined') return () => undefined;

  const bc = new BroadcastChannel(CHANNEL);
  bc.onmessage = (msg) => handler(msg.data as OpdEvent);

  const domHandler = (e: Event) => handler((e as CustomEvent<OpdEvent>).detail);
  window.addEventListener('nexora-opd', domHandler);

  const storageHandler = (e: StorageEvent) => {
    if (e.key === 'nexora-opd-last-event' && e.newValue) {
      try {
        handler(JSON.parse(e.newValue) as OpdEvent);
      } catch {
        /* ignore */
      }
    }
  };
  window.addEventListener('storage', storageHandler);

  return () => {
    bc.close();
    window.removeEventListener('nexora-opd', domHandler);
    window.removeEventListener('storage', storageHandler);
  };
}
