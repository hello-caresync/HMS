'use client';

import { ShieldAlert } from 'lucide-react';

type RakshakSosCardProps = {
  hospitalName: string;
  onTrigger: () => void;
  disabled?: boolean;
};

export function RakshakSosCard({ hospitalName, onTrigger, disabled }: RakshakSosCardProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-rose-300/60 bg-gradient-to-br from-rose-700 via-[#E11D48] to-red-600 p-6 text-white shadow-lg">
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-white/10" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/25 bg-white/15">
            <span className="absolute inset-0 animate-ping rounded-2xl bg-white/20 [animation-duration:2.5s]" />
            <ShieldAlert className="relative h-7 w-7" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-100">
              One-tap emergency
            </p>
            <h2 className="mt-1 text-xl font-black tracking-tight">Rakshak Emergency SOS</h2>
            <p className="mt-1 max-w-xl text-sm font-semibold text-rose-50/95">
              Instantly notify <span className="font-black text-white">{hospitalName}</span> with your
              live GPS location and emergency notes.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onTrigger}
          disabled={disabled}
          className="relative shrink-0 rounded-2xl border-2 border-white/40 bg-white px-6 py-3.5 text-sm font-black uppercase tracking-wider text-rose-700 shadow-xl transition hover:scale-[1.02] hover:bg-rose-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Trigger SOS
        </button>
      </div>
    </section>
  );
}
