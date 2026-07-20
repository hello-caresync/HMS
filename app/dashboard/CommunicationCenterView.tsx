'use client';

import { useState } from 'react';
import { Mail, MessageSquare, Megaphone, Phone, Video } from 'lucide-react';

import { DataTable, KpiGrid, Panel, SearchDesk, TabBar, ViewHeader } from './_viewUi';

type CommTab = 'broadcast' | 'staff' | 'telemed';

export default function CommunicationCenterView() {
  const [tab, setTab] = useState<CommTab>('broadcast');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Communication Center"
        subtitle="Broadcast matrix, internal staff channels, patient telemedicine call queue."
        icon={Megaphone}
      />
      <KpiGrid
        items={[
          { label: 'Broadcasts Today', value: '6', icon: Megaphone, tone: 'cyan' },
          { label: 'Staff Channels', value: '12', icon: MessageSquare, tone: 'indigo' },
          { label: 'Telemed Queue', value: '4', icon: Video, tone: 'emerald' },
          { label: 'SMS Delivered', value: '98.2%', icon: Mail, tone: 'amber' },
        ]}
      />
      <SearchDesk value={search} onChange={setSearch} placeholder="Search communications..." />
      <TabBar
        tabs={[
          { id: 'broadcast', label: 'Broadcast Matrix' },
          { id: 'staff', label: 'Staff Chat' },
          { id: 'telemed', label: 'Telemed Queue' },
        ]}
        active={tab}
        onChange={setTab}
      />
      {tab === 'broadcast' && (
        <Panel title="Broadcast Messaging Matrix (SMS / Email / WhatsApp)">
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={3}
            placeholder="Compose hospital-wide announcement..."
            className="mb-3 w-full rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-200"
          />
          <div className="flex gap-2">
            <button type="button" className="rounded-lg bg-cyan-600 px-3 py-2 text-xs font-semibold text-white">
              Send SMS
            </button>
            <button type="button" className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white">
              Send Email
            </button>
          </div>
        </Panel>
      )}
      {tab === 'staff' && (
        <Panel title="Internal Staff Chat Channels">
          <DataTable
            columns={['Channel', 'Members', 'Last Activity']}
            rows={[
              ['#icu-handoff', '24', '2m ago'],
              ['#pharmacy-desk', '12', '14m ago'],
            ]}
          />
        </Panel>
      )}
      {tab === 'telemed' && (
        <Panel title="Patient Telemedicine Call Queue">
          <DataTable
            columns={['Patient', 'Provider', 'Wait', 'Action']}
            rows={[
              ['Rahul Sharma', 'Dr. Rao', '3m', 'Join'],
              ['Priya Patel', 'Dr. Iyer', '8m', 'Queued'],
            ]}
          />
          <Phone className="mt-3 h-4 w-4 text-cyan-400" />
        </Panel>
      )}
    </div>
  );
}
