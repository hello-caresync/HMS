'use client';

import { useState } from 'react';
import { AlertTriangle, Pause, PhoneForwarded, RotateCcw, SkipForward, Volume2 } from 'lucide-react';
import { toast } from 'sonner';

import { opdUi, VOICE_LANGUAGES } from '@/lib/opd/design-tokens';
import { useDoctorAuth } from '@/lib/doctor/auth/DoctorAuthProvider';
import { useEcosystemStore } from '@/lib/ecosystem/store';
import { useTodayAppointments } from '@/lib/nexora-doctor/hooks';

export function OpdConsultationControls() {
  const { session } = useDoctorAuth();
  const appointments = useTodayAppointments();
  const callNext = useEcosystemStore((s) => s.callNextPatient);
  const skipPatient = useEcosystemStore((s) => s.skipPatient);
  const recallPatient = useEcosystemStore((s) => s.recallPatient);
  const markEmergency = useEcosystemStore((s) => s.markEmergency);
  const setPriorityTier = useEcosystemStore((s) => s.setPriorityTier);
  const pauseQueue = useEcosystemStore((s) => s.pauseQueue);
  const scheduleFollowUp = useEcosystemStore((s) => s.scheduleFollowUp);
  const setVoiceLanguage = useEcosystemStore((s) => s.setVoiceLanguage);
  const queuePaused = useEcosystemStore((s) => s.opdDisplay.queuePaused);
  const voiceLanguage = useEcosystemStore((s) => s.opdDisplay.voiceLanguage);
  const [followUpDays, setFollowUpDays] = useState('7');
  const [selectedAppt, setSelectedAppt] = useState('');

  const waiting = appointments.filter((a) => a.status === 'waiting' || a.status === 'scheduled');
  const activeAppt = selectedAppt || waiting[0]?.id;

  const handleCallNext = () => {
    if (!session?.doctorId) return;
    if (queuePaused) {
      toast.error('Queue is paused');
      return;
    }
    const next = callNext(session.doctorId);
    if (next) toast.success(`Calling ${next.patientName} · voice announcement sent`);
    else toast.error('No patients in queue');
  };

  return (
    <section className={`${opdUi.card} border-[#8E7692]/40`}>
      <div className={`${opdUi.topBar} -mx-6 -mt-6 mb-4 rounded-t-2xl px-5 py-3`}>
        <h3 className="flex items-center gap-2 text-sm font-black">
          <Volume2 className="h-4 w-4" /> OPD Queue Controls
          {queuePaused && (
            <span className="rounded-full bg-[#D8A657] px-2 py-0.5 text-[10px] font-bold text-[#482A41]">PAUSED</span>
          )}
        </h3>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {VOICE_LANGUAGES.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setVoiceLanguage(id)}
            className={`rounded-lg px-3 py-1 text-xs font-bold ${
              voiceLanguage === id ? 'bg-[#572E54] text-white' : 'border border-[#8E7692]/40 bg-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={handleCallNext} className={opdUi.btnPrimary} disabled={queuePaused}>
          <PhoneForwarded className="h-4 w-4" /> Call Next Patient
        </button>
        <button
          type="button"
          onClick={() => { pauseQueue(!queuePaused); toast.info(queuePaused ? 'Queue resumed' : 'Queue paused'); }}
          className={opdUi.btnSecondary}
        >
          <Pause className="h-4 w-4" /> {queuePaused ? 'Resume Queue' : 'Pause Queue'}
        </button>
        {activeAppt && (
          <>
            <button type="button" onClick={() => { skipPatient(activeAppt); toast.success('Patient skipped'); }} className={opdUi.btnSecondary}>
              <SkipForward className="h-4 w-4" /> Skip
            </button>
            <button type="button" onClick={() => { recallPatient(activeAppt); toast.success('Patient recalled'); }} className={opdUi.btnSecondary}>
              <RotateCcw className="h-4 w-4" /> Recall
            </button>
            <button type="button" onClick={() => { markEmergency(activeAppt); toast.warning('Emergency override'); }} className={opdUi.btnEmergency}>
              <AlertTriangle className="h-4 w-4" /> Emergency
            </button>
            <button type="button" onClick={() => { setPriorityTier(activeAppt, 'senior'); toast.success('Senior citizen priority'); }} className={opdUi.btnSecondary}>
              Senior Priority
            </button>
            <button type="button" onClick={() => { setPriorityTier(activeAppt, 'vip'); toast.success('VIP priority'); }} className={opdUi.btnSecondary}>
              VIP Override
            </button>
          </>
        )}
      </div>

      {waiting.length > 0 && (
        <select
          className="mt-4 w-full rounded-xl border border-[#8E7692]/40 px-3 py-2 text-sm"
          value={activeAppt}
          onChange={(e) => setSelectedAppt(e.target.value)}
        >
          {waiting.map((a) => (
            <option key={a.id} value={a.id}>{a.patientName} · {a.token}</option>
          ))}
        </select>
      )}

      <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-[#8E7692]/20 pt-4">
        <div>
          <label className="text-xs font-bold text-[#8E7692]">Auto follow-up (days)</label>
          <input
            type="number"
            min={1}
            max={90}
            value={followUpDays}
            onChange={(e) => setFollowUpDays(e.target.value)}
            className="mt-1 w-20 rounded-lg border border-[#8E7692]/40 px-2 py-1 text-sm"
          />
        </div>
        <button
          type="button"
          className={opdUi.btnSecondary}
          onClick={() => {
            const appt = appointments.find((a) => a.id === activeAppt);
            if (!appt || !session?.doctorId) return;
            scheduleFollowUp({
              patientId: appt.patientId,
              doctorId: session.doctorId,
              days: parseInt(followUpDays, 10) || 7,
              sourceAppointmentId: appt.id,
            });
            toast.success(`Follow-up queued in ${followUpDays} days`);
          }}
        >
          Schedule Follow-up
        </button>
      </div>
    </section>
  );
}
