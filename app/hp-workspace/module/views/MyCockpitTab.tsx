'use client';

import {
  Activity,
  Building2,
  Calendar,
  CheckSquare,
  ClipboardList,
  IndianRupee,
  MessageSquare,
  ShoppingCart,
  UserPlus,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

import type { CommSubTab, HpModalType } from '../hpWorkspaceNav.types';
import type { ActivityFeedItem, ChatThread, WorkQueueItem } from '../lib/hpWorkspaceMockData';
import {
  CHAT_THREADS,
  HP_CENSUS,
  INITIAL_ACTIVITY_FEED,
  MEETING_AGENDAS,
  SHARED_DOCUMENTS,
  formatDateTime,
  formatTime,
  getRoleFilteredTasks,
} from '../lib/hpWorkspaceMockData';
import type { HpRolePersona } from '../hpWorkspaceNav.types';
import {
  ActivityCategoryDot,
  HpPanel,
  PriorityPill,
  RoleBadge,
  SecureIdentityPlaceholder,
  TaskStatusPill,
} from '../components/hpWorkspaceUi';

type MyCockpitTabProps = {
  activeRole: HpRolePersona;
  widgetsExpanded: boolean;
  tasks: WorkQueueItem[];
  activityFeed: ActivityFeedItem[];
  onAdvanceTask: (id: string) => void;
  onOpenThread: (thread: ChatThread) => void;
  onQuickAction: (action: Exclude<HpModalType, null>) => void;
};

export default function MyCockpitTab({
  activeRole,
  widgetsExpanded,
  tasks,
  activityFeed,
  onAdvanceTask,
  onOpenThread,
  onQuickAction,
}: MyCockpitTabProps) {
  const [commTab, setCommTab] = useState<CommSubTab>('chat');
  const census = HP_CENSUS;
  const roleTasks = getRoleFilteredTasks(tasks, activeRole);

  return (
    <div className="space-y-2">
      <div className={`grid gap-1.5 ${widgetsExpanded ? 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-5' : 'grid-cols-3 sm:grid-cols-5'}`}>
        {[
          { label: "Today's Appointments", value: census.todayAppointments, accent: true },
          { label: 'Admissions', value: census.admissions, success: true },
          { label: 'Discharges', value: census.discharges, success: true },
          { label: 'Emergency Cases', value: census.emergencyCases, danger: true },
          { label: 'Pending Tasks', value: census.pendingTasks, warn: true },
        ].map((k) => (
          <div key={k.label} className={`rounded-md border bg-white p-2 ${k.danger ? 'border-red-200' : 'border-[#E2E8F0]'}`}>
            <p className={`text-sm font-bold tabular-nums ${k.danger ? 'text-red-600' : k.warn ? 'text-amber-600' : k.success ? 'text-emerald-600' : k.accent ? 'text-[#2563EB]' : 'text-[#0F172A]'}`}>{k.value}</p>
            <p className="text-[7px] font-bold uppercase tracking-wide text-slate-500">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
        <HpPanel title="Hospital Activity Feed" subtitle="Real-time operational timeline" icon={Activity}>
          <ul className="max-h-[220px] space-y-1 overflow-y-auto">
            {activityFeed.map((item) => (
              <li key={item.id} className="flex gap-2 rounded border border-slate-50 px-2 py-1.5 hover:bg-slate-50/80">
                <ActivityCategoryDot category={item.category} />
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] text-slate-800">{item.message}</p>
                  <p className="text-[8px] text-slate-500">{item.actor} · {item.department} · {formatTime(item.timestamp)}</p>
                </div>
              </li>
            ))}
          </ul>
        </HpPanel>

        <HpPanel
          title="My Tasks & Work Queue"
          subtitle={`Role: ${activeRole} · Emergency · High · Normal priorities`}
          icon={ClipboardList}
          headerRight={<RoleBadge role={activeRole} />}
        >
          <table className="w-full min-w-[480px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Task', 'Priority', 'Queue', 'Status', 'Due', 'Action'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roleTasks.map((t) => (
                <tr key={t.id} className={`border-b border-slate-50 ${t.priority === 'Emergency' ? 'bg-red-50/30' : 'hover:bg-slate-50/80'}`}>
                  <td className="px-1.5 py-1">
                    <p className="text-[9px] font-semibold">{t.title}</p>
                    {t.patientRef && <p className="font-mono text-[7px] text-slate-500">{t.patientRef}</p>}
                  </td>
                  <td className="px-1.5 py-1"><PriorityPill priority={t.priority} /></td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-600">{t.queueType}</td>
                  <td className="px-1.5 py-1">
                    <button type="button" onClick={() => onAdvanceTask(t.id)} disabled={t.status === 'Completed'} title="Advance status">
                      <TaskStatusPill status={t.status} />
                    </button>
                  </td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-500">{formatTime(t.dueAt)}</td>
                  <td className="px-1.5 py-1 text-[8px] text-[#2563EB]">{t.department}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </HpPanel>
      </div>

      <HpPanel title="Communication & Meeting Workspace" subtitle="Staff chat · shared documents · review agendas" icon={MessageSquare}>
        <div className="mb-2 flex gap-0.5">
          {(['chat', 'documents', 'meetings'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setCommTab(tab)}
              className={`rounded px-2 py-0.5 text-[8px] font-bold uppercase ${commTab === tab ? 'bg-[#2563EB] text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              {tab}
            </button>
          ))}
        </div>
        {commTab === 'chat' && (
          <div className="space-y-1">
            {CHAT_THREADS.map((ch) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => onOpenThread(ch)}
                className="flex w-full items-center justify-between rounded border border-slate-100 px-2 py-1.5 text-left hover:bg-slate-50"
              >
                <div>
                  <p className="text-[9px] font-semibold text-[#2563EB]">{ch.channel}</p>
                  <p className="truncate text-[8px] text-slate-600">{ch.lastMessage}</p>
                </div>
                {ch.unread > 0 && <span className="rounded-full bg-red-500 px-1.5 text-[8px] font-bold text-white">{ch.unread}</span>}
              </button>
            ))}
          </div>
        )}
        {commTab === 'documents' && (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Document', 'Dept', 'Version', 'Access', 'Updated'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SHARED_DOCUMENTS.map((d) => (
                <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50/80">
                  <td className="px-1.5 py-1 text-[9px] font-semibold">{d.title}</td>
                  <td className="px-1.5 py-1 text-[8px]">{d.department}</td>
                  <td className="px-1.5 py-1 font-mono text-[8px]">{d.version}</td>
                  <td className="px-1.5 py-1 text-[8px]">{d.accessLevel}</td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-500">{d.updatedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {commTab === 'meetings' && (
          <ul className="space-y-1">
            {MEETING_AGENDAS.map((m) => (
              <li key={m.id} className="rounded border border-slate-100 px-2 py-1.5">
                <p className="text-[9px] font-semibold">{m.title}</p>
                <p className="text-[8px] text-slate-600">{formatDateTime(m.datetime)} · {m.location}</p>
                <p className="text-[8px] text-slate-500">{m.attendees}</p>
                <span className={`mt-0.5 inline-block rounded px-1 text-[7px] font-bold uppercase ${m.status === 'Scheduled' ? 'bg-sky-100 text-sky-800' : 'bg-emerald-100 text-emerald-800'}`}>{m.status}</span>
              </li>
            ))}
          </ul>
        )}
      </HpPanel>

      <HpPanel title="Quick Actions Hub" subtitle="Immediate operational triggers" icon={Zap}>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: 'Register Patient', icon: UserPlus, action: 'register-patient' as const },
            { label: 'Create Appointment', icon: Calendar, action: 'create-appointment' as const },
            { label: 'Admit Patient', icon: Building2, action: 'admit-patient' as const },
            { label: 'Generate Bill', icon: IndianRupee, action: 'generate-bill' as const },
            { label: 'Create PR', icon: ShoppingCart, action: 'create-purchase-request' as const },
            { label: 'Approve Request', icon: CheckSquare, action: 'approve-request' as const },
          ].map(({ label, icon: Icon, action }) => (
            <button
              key={action}
              type="button"
              onClick={() => onQuickAction(action)}
              className="flex flex-col items-center gap-1 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-2 text-center transition-colors hover:border-[#2563EB] hover:bg-blue-50"
            >
              <Icon className="h-4 w-4 text-[#2563EB]" />
              <span className="text-[8px] font-bold uppercase text-[#0F172A]">{label}</span>
            </button>
          ))}
        </div>
        <SecureIdentityPlaceholder verified />
      </HpPanel>
    </div>
  );
}
