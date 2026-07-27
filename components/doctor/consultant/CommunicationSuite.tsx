'use client';

import { useState } from 'react';
import { AlertTriangle, Mic, Paperclip, Send, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

import NotificationHub from '@/components/doctor/notifications/NotificationHub';
import TeleconsultWorkspace from '@/components/doctor/telemedicine/TeleconsultWorkspace';
import { ClinicalPageHeader } from '@/components/doctor/doctor-ui';
import { sageUi } from '@/lib/doctor/ui-tokens';

type CommTab = 'hub' | 'tele' | 'alerts';

const CHANNELS = [
  { id: 'nursing', name: '#Nursing-Ward-3', unread: 2, last: 'Post-op obs due 14:00' },
  { id: 'pathology', name: '#Pathology-STAT', unread: 1, last: 'K+ 6.1 flagged · repeat sent' },
  { id: 'radiology', name: '#Radiology-PACS', unread: 0, last: 'CT Chest uploaded · ER Bay 3' },
  { id: 'consultant', name: '#Consultant-Team', unread: 3, last: 'MDT slides for Friday' },
];

const MOCK_THREAD = [
  {
    id: 'm1',
    sender: 'Charge Nurse · Ward 3',
    at: '13:42',
    stat: true,
    body: 'Patient in Bed 12 — BP 180/110 post-op. Please review.',
    referral: null,
  },
  {
    id: 'm2',
    sender: 'You',
    at: '13:45',
    stat: false,
    body: 'Acknowledged. Increase monitoring to q15min. Ordering BMP stat.',
    referral: null,
  },
  {
    id: 'm3',
    sender: 'Pathology Lab',
    at: '13:50',
    stat: true,
    body: 'Critical potassium result transmitted.',
    referral: { patient: 'Rajesh K · MRN NX-8842', to: 'Nephrology consult' },
  },
];

function EnterpriseCollaborationHub() {
  const [channelId, setChannelId] = useState('nursing');
  const [draft, setDraft] = useState('');
  const [statFlag, setStatFlag] = useState(false);

  const channel = CHANNELS.find((c) => c.id === channelId);

  const send = () => {
    if (!draft.trim()) return;
    toast.success(statFlag ? 'STAT message dispatched' : 'Message sent');
    setDraft('');
    setStatFlag(false);
  };

  return (
    <div className="flex min-h-[calc(100vh-10rem)] gap-4 overflow-hidden">
      <aside className={`${sageUi.cardSolid} w-full max-w-xs shrink-0 overflow-y-auto p-2`}>
        <p className="px-2 py-1 text-[10px] font-bold uppercase text-[#5C5A4E]">Channels</p>
        {CHANNELS.map((ch) => (
          <button
            key={ch.id}
            type="button"
            onClick={() => setChannelId(ch.id)}
            className={`mb-1 w-full rounded-lg px-3 py-2 text-left text-sm ${
              channelId === ch.id ? 'bg-[#A39E75] font-semibold text-white' : 'hover:bg-[#E6E3C5]/50'
            }`}
          >
            <div className="flex justify-between gap-2">
              <span className="truncate">{ch.name}</span>
              {ch.unread > 0 ? (
                <span className="shrink-0 rounded-full bg-[#EF4444] px-1.5 text-[10px] text-white">{ch.unread}</span>
              ) : null}
            </div>
            <p className="truncate text-xs opacity-80">{ch.last}</p>
          </button>
        ))}
      </aside>

      <div className={`${sageUi.cardSolid} flex min-h-0 flex-1 flex-col overflow-hidden p-0`}>
        <div className="border-b border-[#E6E3C5] bg-[#2B2A22] px-4 py-2.5 text-sm font-semibold text-[#F7F6E8]">
          {channel?.name ?? 'Channel'}
        </div>
        <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
          {MOCK_THREAD.map((m) => (
            <li
              key={m.id}
              className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                m.sender === 'You' ? 'ml-auto bg-[#A39E75] text-white' : 'bg-[#E6E3C5]/60 text-[#2B2A22]'
              }`}
            >
              {m.stat ? (
                <span className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase text-amber-600">
                  <AlertTriangle className="h-3 w-3" /> STAT Urgent
                </span>
              ) : null}
              <p className="text-[10px] opacity-80">
                {m.sender} · {m.at}
              </p>
              <p>{m.body}</p>
              {m.referral ? (
                <div className="mt-2 rounded-lg border border-[#C7C39E] bg-white/80 p-2 text-xs text-[#2B2A22]">
                  <p className="flex items-center gap-1 font-bold">
                    <UserPlus className="h-3.5 w-3.5" /> Patient referral
                  </p>
                  <p className="mt-1">{m.referral.patient}</p>
                  <p className="text-[#5C5A4E]">→ {m.referral.to}</p>
                </div>
              ) : null}
              {m.id === 'm3' ? (
                <button
                  type="button"
                  className="mt-2 flex items-center gap-1 text-[10px] font-bold underline"
                  onClick={() => toast.info('Voice note playback (demo)')}
                >
                  <Mic className="h-3 w-3" /> Play voice note · 0:42
                </button>
              ) : null}
            </li>
          ))}
        </ul>
        <div className="border-t border-[#E6E3C5] p-3">
          <label className="mb-2 flex items-center gap-2 text-xs font-bold text-[#5C5A4E]">
            <input type="checkbox" checked={statFlag} onChange={(e) => setStatFlag(e.target.checked)} />
            STAT Urgent priority
          </label>
          <div className="flex gap-2">
            <button type="button" className={sageUi.btnSecondary} aria-label="Attach file" onClick={() => toast.info('Attachment picker')}>
              <Paperclip className="h-4 w-4" />
            </button>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className={`${sageUi.input} flex-1`}
              placeholder="Secure clinical message…"
              onKeyDown={(e) => e.key === 'Enter' && send()}
            />
            <button type="button" className={sageUi.btnPrimary} onClick={send}>
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CommunicationSuite() {
  const [tab, setTab] = useState<CommTab>('hub');

  return (
    <div className={sageUi.page}>
      <ClinicalPageHeader
        title="Communication"
        subtitle="Enterprise collaboration · STAT channels · telemedicine · critical broadcasts"
        actions={
          <div className="flex gap-1 rounded-lg border border-[#C7C39E] bg-[#F7F6E8] p-1">
            {(
              [
                { id: 'hub' as const, label: 'Collaboration hub' },
                { id: 'tele' as const, label: 'Telemedicine' },
                { id: 'alerts' as const, label: 'Alerts' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-bold ${
                  tab === t.id ? sageUi.segmentActive : sageUi.segmentIdle
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        }
      />
      {tab === 'hub' && <EnterpriseCollaborationHub />}
      {tab === 'tele' && <TeleconsultWorkspace />}
      {tab === 'alerts' && <NotificationHub />}
    </div>
  );
}
