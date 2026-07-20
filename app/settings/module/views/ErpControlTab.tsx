'use client';

import {
  Building2,
  Database,
  HardDrive,
  Link2,
  Shield,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react';

import type { SettingsModalType } from '../settingsNav.types';
import type { ProvisionedUser } from '../lib/settingsMockData';
import { FIELD_ACCESS_GRID, SYSTEM_HEALTH, formatDateTime, formatTime } from '../lib/settingsMockData';
import { KpiMetricCard, SettingsPanel, SettingsStatusPill, settingsType } from '../components/settingsUi';

type ErpControlTabProps = {
  users: ProvisionedUser[];
  onToggleUserStatus: (id: string) => void;
  onQuickAction: (action: Exclude<SettingsModalType, null>) => void;
};

export default function ErpControlTab({ users, onToggleUserStatus, onQuickAction }: ErpControlTabProps) {
  const h = SYSTEM_HEALTH;

  return (
    <div className="space-y-4">
      <div>
        <h2 className={settingsType.sectionTitle}>Real-Time System Health Cockpit</h2>
        <p className={`mt-1 ${settingsType.bodyMuted}`}>Live telemetry for users, infrastructure, integrations, and backup posture</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-8">
        <KpiMetricCard label="Total Users" value={h.totalUsers.toLocaleString()} tone="accent" />
        <KpiMetricCard label="Active Users" value={h.activeUsers.toLocaleString()} tone="success" />
        <KpiMetricCard label="Database Health" value={h.databaseHealth} tone="success" />
        <KpiMetricCard label="System Health" value={h.systemHealth} tone="success" />
        <KpiMetricCard label="Active Integrations" value={h.activeIntegrations} tone="purple" />
        <KpiMetricCard label="Pending Configs" value={h.pendingConfigs} tone="warn" />
        <KpiMetricCard label="Storage Usage" value={`${h.storageUsedPct}%`} tone={h.storageUsedPct > 65 ? 'warn' : 'default'} />
        <KpiMetricCard label="Backup Status" value={h.backupStatus} tone="success" />
      </div>

      <div className="rounded-lg border border-[#E2E8F0] bg-white px-5 py-4">
        <p className={settingsType.bodyMuted}>
          Last full backup: <span className="font-semibold text-[#0F172A]">{formatDateTime(h.lastBackupAt)}</span>
          {' · '}
          Incremental logs every 15 min · Offsite DR pending sync
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SettingsPanel title="User Provisioning & Audit Log" subtitle="Doctor · Nurse · Finance · Admin · Pharmacist accounts" icon={Users}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                  {['User', 'Type', 'Department', 'Last Login', 'Audit', 'Status'].map((col) => (
                    <th key={col} className={settingsType.tableHead}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/80">
                    <td className={`${settingsType.tableCell} font-semibold`}>{u.displayName}</td>
                    <td className={settingsType.tableCell}>{u.accountType}</td>
                    <td className={settingsType.tableCell}>{u.department}</td>
                    <td className={settingsType.tableCellMuted}>{formatTime(u.lastLogin)}</td>
                    <td className={`max-w-[180px] truncate ${settingsType.tableCellMuted}`} title={u.auditAction}>{u.auditAction}</td>
                    <td className={settingsType.tableCell}>
                      <button type="button" onClick={() => onToggleUserStatus(u.id)} className="inline-flex items-center gap-1">
                        <SettingsStatusPill status={u.status} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SettingsPanel>

        <SettingsPanel title="Role & Field-Level Access Grid" subtitle="Granular capability matrix · module permissions · approval rights" icon={Shield}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                  {['Role', 'Module', 'R', 'W', 'Approve', 'Field Mask', 'Status'].map((col) => (
                    <th key={col} className={settingsType.tableHead}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FIELD_ACCESS_GRID.map((row) => (
                  <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/80">
                    <td className={`${settingsType.tableCell} font-semibold`}>{row.role}</td>
                    <td className={`max-w-[140px] truncate ${settingsType.tableCell}`}>{row.module}</td>
                    <td className={`${settingsType.tableCell} text-center`}>{row.readAccess ? '✓' : '—'}</td>
                    <td className={`${settingsType.tableCell} text-center`}>{row.writeAccess ? '✓' : '—'}</td>
                    <td className={`${settingsType.tableCell} text-center`}>{row.approveRights ? '✓' : '—'}</td>
                    <td className={`max-w-[120px] truncate ${settingsType.tableCellMuted}`}>{row.fieldMask}</td>
                    <td className={settingsType.tableCell}><SettingsStatusPill status={row.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SettingsPanel>
      </div>

      <SettingsPanel title="Quick Actions Matrix" subtitle="User · role · department · integration · notifications · backup" icon={Zap}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: 'Create User', icon: UserPlus, action: 'create-user' as const },
            { label: 'Configure Role', icon: Shield, action: 'configure-role' as const },
            { label: 'Add Department', icon: Building2, action: 'add-department' as const },
            { label: 'Setup Integration', icon: Link2, action: 'setup-integration' as const },
            { label: 'Manage Notifications', icon: Database, action: 'manage-notifications' as const },
            { label: 'Backup System', icon: HardDrive, action: 'backup-system' as const },
          ].map(({ label, icon: Icon, action }) => (
            <button
              key={action}
              type="button"
              onClick={() => onQuickAction(action)}
              className="flex flex-col items-center gap-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-4 hover:border-[#2563EB] hover:bg-blue-50"
            >
              <Icon className="h-6 w-6 text-[#2563EB]" />
              <span className={`text-center ${settingsType.button} text-[#0F172A]`}>{label}</span>
            </button>
          ))}
        </div>
      </SettingsPanel>
    </div>
  );
}
