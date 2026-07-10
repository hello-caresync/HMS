'use client';

import { useState } from 'react';
import {
  CalendarClock,
  FileSignature,
  Lock,
  RotateCcw,
  Send,
  ShieldCheck,
} from 'lucide-react';

import { useConsultation } from '../context/ConsultationProvider';
import { CLINICAL } from '../lib/theme';
import { FOLLOW_UP_OPTIONS, REFERRAL_OPTIONS } from '../types';
import type { FollowUpTimeline, ReferralType } from '../types';
import FinalizeHandshakeBanner from './FinalizeHandshakeBanner';

export default function ConsultationActionBar() {
  const {
    encounter,
    isLocked,
    handshake,
    setFollowUp,
    setReferralType,
    setReferralNotes,
    setFollowUpDate,
    finalizeConsultation,
    resetEncounter,
  } = useConsultation();

  const [showHandshake, setShowHandshake] = useState(false);

  const handleFinalize = () => {
    const result = finalizeConsultation();
    if (result) setShowHandshake(true);
  };

  return (
    <>
      <footer
        className="fixed bottom-0 left-0 right-0 z-40 border-t shadow-[0_-4px_24px_-8px_rgba(60,90,80,0.15)]"
        style={{ borderColor: CLINICAL.border, backgroundColor: CLINICAL.panel }}
      >
        <div className="mx-auto flex max-w-[1600px] flex-col gap-3 px-4 py-3 lg:flex-row lg:items-end lg:justify-between">
          {/* Referral / Follow-up scheduler */}
          <div className="flex flex-1 flex-wrap items-end gap-3">
            <div className="min-w-[140px]">
              <label className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: CLINICAL.textSubtle }}>
                <Send className="h-3 w-3" />
                Register Referral
              </label>
              <select
                value={encounter.referralType}
                disabled={isLocked}
                onChange={(e) => setReferralType(e.target.value as ReferralType)}
                className="w-full rounded-lg border px-2.5 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#5ebda8]/40 disabled:opacity-60"
                style={{ borderColor: CLINICAL.border, color: CLINICAL.charcoal }}
              >
                {REFERRAL_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div className="min-w-[120px]">
              <label className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: CLINICAL.textSubtle }}>
                <CalendarClock className="h-3 w-3" />
                Follow-up
              </label>
              <select
                value={encounter.followUp}
                disabled={isLocked}
                onChange={(e) => setFollowUp(e.target.value as FollowUpTimeline)}
                className="w-full rounded-lg border px-2.5 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#5ebda8]/40 disabled:opacity-60"
                style={{ borderColor: CLINICAL.border, color: CLINICAL.charcoal }}
              >
                {FOLLOW_UP_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div className="min-w-[160px] flex-1">
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider" style={{ color: CLINICAL.textSubtle }}>
                Follow-up Date / Notes
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={encounter.followUpDate ?? ''}
                  disabled={isLocked}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="rounded-lg border px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#5ebda8]/40 disabled:opacity-60"
                  style={{ borderColor: CLINICAL.border }}
                />
                <input
                  value={encounter.referralNotes}
                  disabled={isLocked}
                  onChange={(e) => setReferralNotes(e.target.value)}
                  placeholder="Referral notes…"
                  className="min-w-0 flex-1 rounded-lg border px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#5ebda8]/40 disabled:opacity-60"
                  style={{ borderColor: CLINICAL.border, color: CLINICAL.charcoal }}
                />
              </div>
            </div>
          </div>

          {/* Finalize action */}
          <div className="flex shrink-0 items-center gap-2">
            {isLocked ? (
              <>
                <span
                  className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2.5 text-xs font-semibold"
                  style={{ borderColor: CLINICAL.border, color: CLINICAL.textMuted }}
                >
                  <Lock className="h-3.5 w-3.5" />
                  Record Locked
                </span>
                <button
                  type="button"
                  onClick={resetEncounter}
                  className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2.5 text-xs font-semibold hover:bg-[#edf8f3]"
                  style={{ borderColor: CLINICAL.border, color: CLINICAL.mint }}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  New Encounter
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleFinalize}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-md transition hover:opacity-95"
                style={{ backgroundColor: CLINICAL.mint }}
              >
                <FileSignature className="h-4 w-4" />
                <ShieldCheck className="h-4 w-4 opacity-80" />
                Apply Digital Signature & Finalize Consultation
              </button>
            )}
          </div>
        </div>
      </footer>

      {showHandshake && handshake && (
        <FinalizeHandshakeBanner handshake={handshake} onDismiss={() => setShowHandshake(false)} />
      )}
    </>
  );
}
