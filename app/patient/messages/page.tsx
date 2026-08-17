'use client';

import { useState } from 'react';

import { ChannelMessagingPanel } from '@/components/ecosystem/ChannelMessagingPanel';
import { createClient } from '@/lib/supabase/client';
import {
  DEFAULT_DOCTOR_EMPLOYEE_ID,
  sendClinicalMessage,
} from '@/lib/ecosystem/channel-messaging-service';
import { msgClasses } from '@/lib/ecosystem/messaging-theme';
import { useChannelMessaging } from '@/lib/ecosystem/use-channel-messaging';
import {
  DEFAULT_ACTIVE_DOCTOR_ID,
  DEFAULT_ACTIVE_DOCTOR_NAME,
  DEFAULT_PATIENT_ID,
} from '@/lib/doctor/command-center/supabase-service';

const DOCTOR_IDS = [DEFAULT_ACTIVE_DOCTOR_ID, DEFAULT_DOCTOR_EMPLOYEE_ID];

/** Patient app · secure clinical messaging via unified channel_messages. */
export default function ClinicalMessagingPage() {
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const { messages, loading, error, connected, reload, upsertMessage } = useChannelMessaging({
    filter: {
      channel_type: 'clinical',
      doctor_ids: DOCTOR_IDS,
      patient_ids: [DEFAULT_PATIENT_ID],
      limit: 200,
    },
    viewerRole: 'patient',
  });

  const handleSend = async () => {
    const text = draft.trim();
    if (!text) return;

    setSending(true);
    setSendError(null);
    try {
      const result = await sendClinicalMessage(createClient(), {
        message: text,
        sender_role: 'patient',
        sender_name: 'Regal Patient',
        doctor_id: DEFAULT_ACTIVE_DOCTOR_ID,
        patient_id: DEFAULT_PATIENT_ID,
      });

      if (!result.ok) {
        setSendError(result.error ?? 'Could not send message.');
        return;
      }

      if (result.row) upsertMessage(result.row);
      setDraft('');
      await reload();
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Could not send message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`${msgClasses.page} mx-auto max-w-4xl space-y-4 p-4`}>
      <header className={`${msgClasses.card} p-4`}>
        <p className={msgClasses.label}>Clinical Messaging</p>
        <h1 className="text-xl font-black text-slate-900">Message Your Care Team</h1>
        <p className="mt-0.5 text-xs font-medium text-slate-500">
          Live two-way chat with {DEFAULT_ACTIVE_DOCTOR_NAME} · channel_type clinical (doctor care only)
        </p>
      </header>

      <ChannelMessagingPanel
        title={DEFAULT_ACTIVE_DOCTOR_NAME}
        subtitle={`${DEFAULT_DOCTOR_EMPLOYEE_ID} · clinical channel · not hospital admin desk`}
        messages={messages}
        loading={loading}
        error={error ?? sendError}
        connected={connected}
        viewerRole="patient"
        draft={draft}
        onDraftChange={setDraft}
        onSend={handleSend}
        sending={sending}
        onRefresh={reload}
        placeholder={`Type your health question for ${DEFAULT_ACTIVE_DOCTOR_NAME}…`}
        emptyMessage="No messages yet. Send your first note — it appears instantly on the doctor dashboard."
      />
    </div>
  );
}
