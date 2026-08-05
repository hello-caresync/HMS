'use client';

import { Sparkles } from 'lucide-react';

import { opdUi } from '@/lib/opd/design-tokens';
import { buildAiSchedulingSummary } from '@/lib/opd/scheduling-ai';
import type { EcosystemAppointment, EcosystemDoctor } from '@/lib/ecosystem/types';

type Props = {
  doctor: EcosystemDoctor;
  date?: string;
  appointments: EcosystemAppointment[];
  compact?: boolean;
};

export function AiSchedulingSummary({ doctor, date, appointments, compact }: Props) {
  const targetDate = date ?? new Date().toISOString().slice(0, 10);
  const { recommendation, summaryLines } = buildAiSchedulingSummary(doctor, targetDate, appointments);

  if (!recommendation) return null;

  return (
    <section className={`${compact ? 'rounded-xl border border-[#D8A657]/50 bg-[#D8A657]/10 p-3' : `${opdUi.cardMauve} p-4`}`}>
      <h3 className={`flex items-center gap-2 font-black text-[#482A41] ${compact ? 'text-xs' : 'text-sm'}`}>
        <Sparkles className="h-4 w-4 text-[#572E54]" /> AI Scheduling Intelligence
      </h3>
      <p className={`mt-2 font-bold text-[#572E54] ${compact ? 'text-xs' : 'text-sm'}`}>{recommendation.label}</p>
      <ul className={`mt-2 space-y-1 text-[#8E7692] ${compact ? 'text-[11px]' : 'text-xs'}`}>
        {summaryLines.map((line) => (
          <li key={line}>· {line}</li>
        ))}
      </ul>
      {!compact && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {recommendation.factors.map((f) => (
            <div
              key={f.name}
              className={`rounded-lg border px-3 py-2 text-xs ${
                f.impact === 'positive'
                  ? 'border-[#5E8B7E]/40 bg-[#5E8B7E]/10'
                  : f.impact === 'negative'
                    ? 'border-[#B85C5C]/40 bg-[#B85C5C]/10'
                    : 'border-[#8E7692]/30 bg-white/60'
              }`}
            >
              <p className="font-bold text-[#482A41]">{f.name}</p>
              <p className="text-[#8E7692]">{f.detail}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
