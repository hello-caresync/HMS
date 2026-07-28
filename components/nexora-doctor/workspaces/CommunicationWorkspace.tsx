'use client';

import { useState } from 'react';
import { Bell, Send, Video } from 'lucide-react';
import { toast } from 'sonner';

import { ui } from '@/components/nexora-doctor/ui/primitives';
import { EmptyState, SectionHeader } from '@/components/nexora-doctor/ui/shared';
import { useDoctorClinicalStore } from '@/lib/nexora-doctor/store';

const ROLE_LABELS: Record<string, string> = {
  patient: 'Patient',
  nurse: 'Nurse',
  reception: 'Reception',
  lab: 'Laboratory',
  radiology: 'Radiology',
  pharmacy: 'Pharmacy',
};

export function CommunicationWorkspace() {
  const channels = useDoctorClinicalStore((s) => s.channels);
  const messages = useDoctorClinicalStore((s) => s.messages);
  const notifications = useDoctorClinicalStore((s) => s.notifications);
  const sendMessage = useDoctorClinicalStore((s) => s.sendMessage);
  const markNotificationRead = useDoctorClinicalStore((s) => s.markNotificationRead);
  const markAllNotificationsRead = useDoctorClinicalStore((s) => s.markAllNotificationsRead);

  const [activeChannel, setActiveChannel] = useState(channels[0]?.id ?? '');
  const [draft, setDraft] = useState('');
  const [tab, setTab] = useState<'messages' | 'notifications' | 'video'>('messages');

  const channelMessages = messages.filter((m) => m.channelId === activeChannel);
  const activeChannelData = channels.find((c) => c.id === activeChannel);

  const handleSend = () => {
    if (!draft.trim() || !activeChannel) return;
    sendMessage(activeChannel, draft.trim());
    setDraft('');
    toast.success('Message sent');
  };

  return (
    <div className={ui.page}>
      <div className="mb-6">
        <h1 className={ui.pageTitle}>Communication</h1>
        <p className={ui.pageSubtitle}>Messages, notifications & video consultation</p>
      </div>

      <div className="mb-4 flex gap-2">
        {(['messages', 'notifications', 'video'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize ${
              tab === t ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {t === 'video' ? 'Video Consultation' : t}
          </button>
        ))}
      </div>

      {tab === 'messages' && (
        <div className="grid gap-4 lg:grid-cols-3">
          <section className={`${ui.card} max-h-[65vh] overflow-y-auto p-0`}>
            <div className="border-b border-slate-100 p-4">
              <SectionHeader title="Channels" />
            </div>
            <ul>
              {channels.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setActiveChannel(c.id)}
                    className={`flex w-full items-center justify-between px-4 py-3 text-left transition ${
                      activeChannel === c.id ? 'bg-teal-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{c.name}</p>
                      <p className="text-xs text-slate-500">{ROLE_LABELS[c.role] ?? c.role}</p>
                    </div>
                    {c.unread > 0 && (
                      <span className="rounded-full bg-teal-700 px-2 py-0.5 text-xs font-bold text-white">{c.unread}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className={`${ui.card} lg:col-span-2 flex flex-col p-0`}>
            <div className="border-b border-slate-100 p-4">
              <p className="font-semibold text-slate-900">{activeChannelData?.name ?? 'Select a channel'}</p>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4" style={{ minHeight: 320 }}>
              {channelMessages.length === 0 ? (
                <EmptyState title="No messages yet" description="Start the conversation." />
              ) : (
                channelMessages.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                      m.isDoctor ? 'ml-auto bg-teal-700 text-white' : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    <p className="text-xs opacity-70">{m.sender} · {m.at}</p>
                    <p className="mt-0.5">{m.body}</p>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2 border-t border-slate-100 p-4">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type a message…"
                className={ui.input}
              />
              <button type="button" onClick={handleSend} className={ui.btnPrimary}>
                <Send className="h-4 w-4" />
              </button>
            </div>
          </section>
        </div>
      )}

      {tab === 'notifications' && (
        <section className={ui.card}>
          <SectionHeader
            title="Notifications"
            action={
              <button type="button" onClick={markAllNotificationsRead} className="text-xs font-medium text-teal-700">
                Mark all read
              </button>
            }
          />
          <ul className="divide-y divide-slate-100">
            {notifications.map((n) => (
              <li key={n.id} className={`flex items-start gap-3 py-4 ${!n.read ? 'bg-teal-50/30 -mx-5 px-5' : ''}`}>
                <Bell className={`mt-0.5 h-4 w-4 shrink-0 ${n.category === 'emergency' ? 'text-red-600' : 'text-slate-400'}`} />
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{n.title}</p>
                  <p className="text-sm text-slate-600">{n.body}</p>
                </div>
                {!n.read && (
                  <button type="button" onClick={() => markNotificationRead(n.id)} className="text-xs text-teal-700 hover:underline">
                    Mark read
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === 'video' && (
        <section className={ui.card}>
          <SectionHeader title="Video Consultation" />
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-16">
            <Video className="mb-4 h-12 w-12 text-teal-600" />
            <p className="font-medium text-slate-900">Start a teleconsultation</p>
            <p className="mt-1 text-sm text-slate-500">Connect with patients via secure video</p>
            <button
              type="button"
              onClick={() => toast.success('Video room opened · Patient notified')}
              className={`${ui.btnPrimary} mt-6`}
            >
              <Video className="h-4 w-4" /> Start Video Call
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
