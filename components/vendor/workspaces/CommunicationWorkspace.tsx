'use client';

import { useCallback, useEffect, useState } from 'react';

import { VendorFeedbackBanner, useVendorFeedback } from '@/components/vendor/ui/useVendorFeedback';
import { VendorModuleHeader, VendorStatusPill } from '@/components/vendor/ui/VendorModuleHeader';
import { vendorFieldClass, vendorLabelClass, VendorModal } from '@/components/vendor/ui/VendorModal';
import { supabase } from '@/lib/supabaseClient';
import type { CommunicationThread } from '@/lib/vendor/types/domain';
import { DEFAULT_VENDOR_ID } from '@/lib/vendor-supabase/constants';
import type { VendorMeetingRequestRow, VendorMessageRow } from '@/lib/vendor-supabase/types';

const MEETING_DEPARTMENTS = ['Procurement', 'Pharmacy', 'Biomedical'] as const;

type MeetingForm = {
  scheduled_at: string;
  department: (typeof MEETING_DEPARTMENTS)[number];
  notes: string;
};

const emptyMeeting: MeetingForm = {
  scheduled_at: '',
  department: 'Procurement',
  notes: '',
};

function mapMeetingToThread(row: VendorMeetingRequestRow): CommunicationThread {
  return {
    id: row.id,
    channel: row.channel as CommunicationThread['channel'],
    subject: row.subject,
    lastMessageAt: new Date(row.scheduled_at).toLocaleString('en-IN'),
    unreadCount: 0,
  };
}

function mapMessageToThread(row: VendorMessageRow): CommunicationThread {
  return {
    id: row.id,
    channel: row.channel as CommunicationThread['channel'],
    subject: row.subject,
    lastMessageAt: new Date(row.created_at).toLocaleString('en-IN'),
    unreadCount: 1,
  };
}

function CommunicationWorkspace() {
  const { feedback, showSuccess, showError } = useVendorFeedback();
  const [draft, setDraft] = useState('');
  const [messageChannel, setMessageChannel] = useState<(typeof MEETING_DEPARTMENTS)[number]>('Procurement');
  const [threads, setThreads] = useState<CommunicationThread[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [meetingForm, setMeetingForm] = useState<MeetingForm>(emptyMeeting);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadThreads = useCallback(async () => {
    setThreadsLoading(true);
    const [meetingsRes, messagesRes] = await Promise.all([
      supabase
        .from('vendor_meeting_requests')
        .select('id, vendor_id, channel, subject, scheduled_at, notes, created_at')
        .eq('vendor_id', DEFAULT_VENDOR_ID)
        .order('created_at', { ascending: false }),
      supabase
        .from('vendor_messages')
        .select('id, vendor_id, channel, subject, body, created_at')
        .eq('vendor_id', DEFAULT_VENDOR_ID)
        .order('created_at', { ascending: false }),
    ]);

    const merged: CommunicationThread[] = [];

    if (!meetingsRes.error && meetingsRes.data) {
      merged.push(...(meetingsRes.data as VendorMeetingRequestRow[]).map(mapMeetingToThread));
    }
    if (!messagesRes.error && messagesRes.data) {
      merged.push(...(messagesRes.data as VendorMessageRow[]).map(mapMessageToThread));
    }

    merged.sort((a, b) => {
      const ta = new Date(a.lastMessageAt).getTime();
      const tb = new Date(b.lastMessageAt).getTime();
      return tb - ta;
    });

    setThreads(merged);
    if (meetingsRes.error) showError(meetingsRes.error.message);
    if (messagesRes.error && !messagesRes.error.message.includes('vendor_messages')) {
      showError(messagesRes.error.message);
    }
    setThreadsLoading(false);
  }, [showError]);

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  const handleSend = async () => {
    const body = draft.trim();
    if (!body) return;

    setIsSubmitting(true);
    const subject = body.length > 64 ? `${body.slice(0, 61)}…` : body;
    const { error } = await supabase.from('vendor_messages').insert([
      {
        vendor_id: DEFAULT_VENDOR_ID,
        channel: messageChannel,
        subject,
        body,
      },
    ]);
    setIsSubmitting(false);

    if (error) {
      showError(error.message);
      window.alert(`Error: ${error.message}`);
      return;
    }

    showSuccess('Secure message sent.');
    setDraft('');
    await loadThreads();
  };

  const handleMeetingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingForm.scheduled_at) {
      window.alert('Select date and time.');
      return;
    }
    setIsSubmitting(true);
    const subject = `Video meeting · ${meetingForm.department}`;
    const payload = {
      vendor_id: DEFAULT_VENDOR_ID,
      channel: meetingForm.department,
      subject,
      scheduled_at: new Date(meetingForm.scheduled_at).toISOString(),
      notes: meetingForm.notes.trim() || null,
    };
    const { error } = await supabase.from('vendor_meeting_requests').insert([payload]);
    setIsSubmitting(false);

    if (error) {
      showError(error.message);
      window.alert(`Error: ${error.message}`);
      return;
    }

    showSuccess('Video meeting request submitted.');
    setMeetingOpen(false);
    setMeetingForm(emptyMeeting);
    await loadThreads();
  };

  return (
    <div className="space-y-6">
      <VendorModuleHeader
        title="Communication Center"
        description="Procurement, pharmacy, inventory, biomedical channels · attachments · video requests."
        actions={
          <button
            type="button"
            onClick={() => setMeetingOpen(true)}
            className="rounded-xl bg-vendor-secondary px-4 py-2 text-xs font-bold text-white hover:opacity-90"
          >
            Request video meeting
          </button>
        }
      />

      <VendorFeedbackBanner feedback={feedback} />

      {threadsLoading ? (
        <p className="text-sm text-vendor-muted">Loading threads…</p>
      ) : threads.length === 0 ? (
        <p className="text-sm text-vendor-muted">No threads yet. Send a message or request a meeting.</p>
      ) : (
        <ul className="space-y-2">
          {threads.map((t) => (
            <li
              key={t.id}
              className="rounded-xl border border-vendor-accent/20 bg-vendor-card px-4 py-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <VendorStatusPill label={t.channel} tone="info" />
                {t.unreadCount > 0 ? (
                  <span className="rounded-full bg-amber-500/20 px-2 text-[10px] font-bold text-amber-700">
                    {t.unreadCount} new
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm font-bold">{t.subject}</p>
              <p className="text-xs text-vendor-muted">{t.lastMessageAt}</p>
            </li>
          ))}
        </ul>
      )}

      <section className="rounded-2xl border border-vendor-accent/20 bg-vendor-card p-4">
        <label className={vendorLabelClass}>
          Channel
          <select
            value={messageChannel}
            onChange={(e) => setMessageChannel(e.target.value as MeetingForm['department'])}
            className={vendorFieldClass}
          >
            {MEETING_DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          placeholder="Secure message with attachment…"
          className="mt-2 w-full rounded-lg border border-vendor-accent/20 px-3 py-2 text-sm"
        />
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => showSuccess('Attachment picker opened (demo).')}
            className="rounded-lg border border-vendor-accent/20 px-3 py-1.5 text-xs font-bold"
          >
            Attach file
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => void handleSend()}
            className="rounded-lg bg-vendor-secondary px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
          >
            Send
          </button>
        </div>
      </section>

      <VendorModal
        title="Request video meeting"
        open={meetingOpen}
        onClose={() => setMeetingOpen(false)}
        footer={
          <>
            <button type="button" onClick={() => setMeetingOpen(false)} className="rounded-lg border px-4 py-2 text-sm font-bold">
              Cancel
            </button>
            <button
              type="submit"
              form="meeting-form"
              disabled={isSubmitting}
              className="rounded-lg bg-vendor-secondary px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              {isSubmitting ? 'Saving…' : 'Submit request'}
            </button>
          </>
        }
      >
        <form id="meeting-form" onSubmit={(e) => void handleMeetingSubmit(e)} className="space-y-3">
          <label className={vendorLabelClass}>
            Date & time
            <input
              required
              type="datetime-local"
              value={meetingForm.scheduled_at}
              onChange={(e) => setMeetingForm((f) => ({ ...f, scheduled_at: e.target.value }))}
              className={vendorFieldClass}
            />
          </label>
          <label className={vendorLabelClass}>
            Target department
            <select
              value={meetingForm.department}
              onChange={(e) =>
                setMeetingForm((f) => ({
                  ...f,
                  department: e.target.value as MeetingForm['department'],
                }))
              }
              className={vendorFieldClass}
            >
              {MEETING_DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className={vendorLabelClass}>
            Agenda notes
            <textarea
              rows={3}
              value={meetingForm.notes}
              onChange={(e) => setMeetingForm((f) => ({ ...f, notes: e.target.value }))}
              className={vendorFieldClass}
            />
          </label>
        </form>
      </VendorModal>
    </div>
  );
}

export default CommunicationWorkspace;
export { CommunicationWorkspace };
