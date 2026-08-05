'use client';

import type { VoiceLanguage } from './design-tokens';

const ANNOUNCEMENTS: Record<VoiceLanguage, (name: string, room: string) => string> = {
  en: (name, room) => `${name}, please proceed to Consultation ${room}.`,
  hi: (name, room) => `${name}, कृपया ${room} पर जाएँ।`,
  ml: (name, room) => `${name}, ദയവായി ${room} ലേക്ക് വരിക.`,
};

const LANG_CODES: Record<VoiceLanguage, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  ml: 'ml-IN',
};

export function announcePatientCall(patientName: string, roomNumber: string, language: VoiceLanguage) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  playAnnouncementChime();

  const room = roomNumber.startsWith('Room') ? roomNumber : `Room ${roomNumber}`;
  const text = ANNOUNCEMENTS[language](patientName, room);

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = LANG_CODES[language];
  utterance.rate = 0.92;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

function playAnnouncementChime() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.value = 0.08;
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
    setTimeout(() => {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.value = 1174;
      gain2.gain.value = 0.06;
      osc2.start();
      osc2.stop(ctx.currentTime + 0.2);
    }, 160);
  } catch {
    /* AudioContext unavailable */
  }
}

export function stopAnnouncements() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
