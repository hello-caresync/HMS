'use client';

import { Brain, FileText, HardDrive, Link2, Lock, ScrollText, Shield } from 'lucide-react';

import type { IntegrationEndpoint } from '../lib/settingsMockData';
import {
  BACKUP_PROTOCOLS,
  COMPLIANCE_THRESHOLDS,
  PRINT_TEMPLATES,
  SECURITY_CONTROLS,
  SYSTEM_LOGS,
  formatTime,
} from '../lib/settingsMockData';
import type { IntegrationLogId } from '../settingsNav.types';
import { LogLevelBadge, SecureParameterBlock, SettingsPanel, SettingsStatusPill, settingsType } from '../components/settingsUi';

type IntegrationsSecurityTabProps = {
  integrations: IntegrationEndpoint[];
  onOpenIntegrationLog: (id: IntegrationLogId) => void;
};

export default function IntegrationsSecurityTab({ integrations, onOpenIntegrationLog }: IntegrationsSecurityTabProps) {
  return (
    <div className="space-y-4">
      <SettingsPanel title="Technical Sourcing & Protocol Ledger" subtitle="HL7 · FHIR · PACS · LIS · API keys · webhooks · rate limits" icon={Link2}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Protocol', 'Integration', 'Endpoint', 'Rate Limit', 'Last Sync', 'Status', 'Log'].map((h) => (
                  <th key={h} className={settingsType.tableHead}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {integrations.map((row) => (
                <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/80">
                  <td className={`${settingsType.tableCell} font-semibold text-violet-700`}>{row.protocol}</td>
                  <td className={`${settingsType.tableCell} font-semibold`}>{row.name}</td>
                  <td className={`max-w-[180px] truncate ${settingsType.tableCellMuted}`} title={row.endpoint}>{row.endpoint}</td>
                  <td className={settingsType.tableCell}>{row.rateLimit}</td>
                  <td className={settingsType.tableCellMuted}>{formatTime(row.lastSync)}</td>
                  <td className={settingsType.tableCell}><SettingsStatusPill status={row.status} /></td>
                  <td className={settingsType.tableCell}>
                    <button type="button" onClick={() => onOpenIntegrationLog(row.id)} className={`${settingsType.button} text-[#2563EB] hover:underline`}>
                      View Log
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SettingsPanel>

      <div className="grid gap-4 xl:grid-cols-2">
        <SettingsPanel title="Backup & Recovery Protocols" subtitle="Full · incremental · DMS · offsite DR" icon={HardDrive}>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                  {['Type', 'Schedule', 'Retention', 'Last Run', 'Status'].map((h) => (
                    <th key={h} className={settingsType.tableHead}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BACKUP_PROTOCOLS.map((bk) => (
                  <tr key={bk.id} className="border-b border-slate-50">
                    <td className={`${settingsType.tableCell} font-semibold`}>{bk.type}</td>
                    <td className={settingsType.tableCell}>{bk.schedule}</td>
                    <td className={settingsType.tableCell}>{bk.retention}</td>
                    <td className={settingsType.tableCellMuted}>{formatTime(bk.lastRun)}</td>
                    <td className={settingsType.tableCell}><SettingsStatusPill status={bk.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SettingsPanel>

        <SettingsPanel title="Document Printing Templates" subtitle="OPD · IPD · Lab · Radiology · Pharmacy formats" icon={FileText}>
          <ul className="space-y-2">
            {PRINT_TEMPLATES.map((pt) => (
              <li key={pt.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3">
                <div>
                  <p className={`${settingsType.body} font-semibold`}>{pt.name}</p>
                  <p className={settingsType.bodyMuted}>{pt.module} · {pt.format}</p>
                </div>
                <SettingsStatusPill status={pt.status} />
              </li>
            ))}
          </ul>
        </SettingsPanel>
      </div>

      <SettingsPanel title="Security Control Zone" subtitle="2FA · IP restrictions · device filters · session policies" icon={Lock} secure>
        <div className="grid gap-3 sm:grid-cols-2">
          {SECURITY_CONTROLS.map((sc) => (
            <div key={sc.id} className="rounded-lg border border-slate-100 bg-[#F8FAFC] px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <p className={`${settingsType.body} font-semibold`}>{sc.control}</p>
                <SettingsStatusPill status={sc.status} />
              </div>
              <div className="mt-2">
                {sc.masked ? <SecureParameterBlock verified /> : <p className={settingsType.bodyMuted}>{sc.configuration}</p>}
              </div>
            </div>
          ))}
        </div>
      </SettingsPanel>

      <div className="grid gap-4 xl:grid-cols-2">
        <SettingsPanel title="AI Engine Permissions" subtitle="Predictive analytics · forecasting · auto-action controls" icon={Brain} secure>
          <ul className="space-y-2">
            <li className="rounded-lg border border-violet-100 bg-violet-50/40 px-4 py-3">
              <p className="text-base font-semibold text-violet-900">Operational Forecasting</p>
              <p className="text-base text-violet-700">Patient load · staff shortage · bed demand — read-only dashboards</p>
            </li>
            <li className="rounded-lg border border-violet-100 bg-violet-50/40 px-4 py-3">
              <p className="text-base font-semibold text-violet-900">Clinical Decision Support</p>
              <p className="text-base text-violet-700">Drug interaction alerts · lab trend analysis — physician override required</p>
            </li>
            <li className="rounded-lg border border-amber-100 bg-amber-50/40 px-4 py-3">
              <p className="text-base font-semibold text-amber-900">Auto-Actions</p>
              <p className="text-base text-amber-700">Disabled — all AI outputs require human approval before system changes</p>
            </li>
          </ul>
        </SettingsPanel>

        <SettingsPanel title="Regulatory Compliance Thresholds" subtitle="NABH · HIPAA · CDSCO control parameters" icon={Shield}>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                  {['Framework', 'Control', 'Threshold', 'Current', 'Status'].map((h) => (
                    <th key={h} className={settingsType.tableHead}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPLIANCE_THRESHOLDS.map((ct) => (
                  <tr key={ct.id} className="border-b border-slate-50">
                    <td className={`${settingsType.tableCell} font-bold`}>{ct.framework}</td>
                    <td className={settingsType.tableCell}>{ct.control}</td>
                    <td className={settingsType.tableCell}>{ct.threshold}</td>
                    <td className={`${settingsType.tableCell} font-semibold`}>{ct.current}</td>
                    <td className={settingsType.tableCell}><SettingsStatusPill status={ct.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SettingsPanel>
      </div>

      <SettingsPanel title="System Log Tracks" subtitle="Immutable audit trail · auth · integration · security events" icon={ScrollText}>
        <ul className="max-h-[320px] space-y-2 overflow-y-auto">
          {SYSTEM_LOGS.map((log) => (
            <li
              key={log.id}
              className={`flex gap-3 rounded-lg border px-4 py-3 ${log.level === 'ERROR' ? 'border-red-200 bg-red-50/40' : log.level === 'SECURITY' ? 'border-violet-200 bg-violet-50/30' : log.level === 'WARN' ? 'border-amber-100 bg-amber-50/30' : 'border-slate-100'}`}
            >
              <LogLevelBadge level={log.level} />
              <div className="min-w-0 flex-1">
                <p className={settingsType.body}>{log.message}</p>
                <p className={settingsType.bodyMuted}>{log.source} · {formatTime(log.timestamp)}</p>
              </div>
            </li>
          ))}
        </ul>
      </SettingsPanel>
    </div>
  );
}
