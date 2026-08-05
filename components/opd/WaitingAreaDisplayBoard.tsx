'use client';

import { useEffect, useState } from 'react';
import { Megaphone, Pause, Tv, Users } from 'lucide-react';

import { opdUi, VOICE_LANGUAGES } from '@/lib/opd/design-tokens';
import { subscribeOpdEvents, type OpdEvent } from '@/lib/opd/realtime';
import { announcePatientCall, stopAnnouncements } from '@/lib/opd/voice-engine';
import { useEcosystemStore } from '@/lib/ecosystem/store';

export function WaitingAreaDisplayBoard() {
  const display = useEcosystemStore((s) => s.opdDisplay);
  const queue = useEcosystemStore((s) => s.hospitalQueue);
  const analytics = useEcosystemStore((s) => s.opdAnalytics);
  const setVoiceLanguage = useEcosystemStore((s) => s.setVoiceLanguage);
  const [lastAnnouncement, setLastAnnouncement] = useState<string | null>(null);

  useEffect(() => {
    return subscribeOpdEvents((event: OpdEvent) => {
      if (event.type === 'OPD_PATIENT_CALLED') {
        const { patientName, roomNumber, language } = event.payload;
        setLastAnnouncement(`${patientName} → ${roomNumber}`);
        announcePatientCall(patientName, roomNumber, language);
      }
    });
  }, []);

  return (
    <div className={`min-h-screen ${opdUi.canvas}`}>
      {display.queuePaused && (
        <div className="flex items-center justify-center gap-2 bg-[#D8A657] px-4 py-2 text-sm font-black text-[#482A41]">
          <Pause className="h-4 w-4" /> Queue temporarily paused — please remain seated
        </div>
      )}
      <header className={`${opdUi.topBar} flex flex-wrap items-center justify-between gap-4 px-8 py-5`}>
        <div className="flex items-center gap-3">
          <Tv className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-black">Nexora OPD · Waiting Area</h1>
            <p className="text-sm text-white/75">Live queue · multilingual voice announcements</p>
          </div>
        </div>
        <div className="flex gap-4 text-sm text-white/90">
          <span className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1">
            <Users className="h-4 w-4" /> Hall {analytics.waitingHallOccupancyPct}% full
          </span>
        </div>
        <div className="flex gap-2">
          {VOICE_LANGUAGES.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setVoiceLanguage(id)}
              className={`rounded-lg px-4 py-2 text-sm font-bold ${
                display.voiceLanguage === id ? 'bg-white text-[#482A41]' : 'bg-white/15 text-white'
              }`}
            >
              {label}
            </button>
          ))}
          <button type="button" onClick={stopAnnouncements} className="rounded-lg bg-white/15 px-3 py-2 text-xs font-bold text-white">
            Mute
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 p-8 lg:grid-cols-[1.2fr_1fr]">
        <section className={`${opdUi.card} p-8 text-center`}>
          <p className="text-sm font-black uppercase tracking-widest text-[#8E7692]">Now Calling</p>
          {display.calledPatientName ? (
            <>
              <p className="mt-4 text-5xl font-black text-[#572E54]">{display.calledPatientName}</p>
              <p className="mt-3 text-2xl font-bold text-[#482A41]">
                Token {display.sequentialToken ?? display.calledToken}
              </p>
              <p className="mt-6 flex items-center justify-center gap-2 text-xl font-black text-[#5E8B7E]">
                <Megaphone className="h-6 w-6" /> Proceed to {display.roomNumber}
              </p>
              <p className="mt-2 text-[#8E7692]">{display.doctorName} · {display.department}</p>
            </>
          ) : (
            <p className="mt-8 text-xl text-[#8E7692]">Waiting for next patient call…</p>
          )}
          {lastAnnouncement && (
            <p className="mt-6 text-xs text-[#8E7692]">Last announcement: {lastAnnouncement}</p>
          )}
        </section>

        <section className={`${opdUi.card} p-6`}>
          <h2 className="mb-4 text-lg font-black text-[#482A41]">Queue Board</h2>
          <ul className="space-y-2">
            {queue.slice(0, 12).map((row) => (
              <li
                key={row.id}
                className="flex items-center justify-between rounded-xl border border-[#8E7692]/25 bg-[#CEB2C0]/20 px-4 py-3"
              >
                <div>
                  <p className="font-bold text-[#482A41]">{row.patientName}</p>
                  <p className="text-xs text-[#8E7692]">{row.doctorName} · {row.roomNumber ?? '—'}</p>
                </div>
                <span className="font-black text-[#572E54]">{row.sequentialToken ?? row.token}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
