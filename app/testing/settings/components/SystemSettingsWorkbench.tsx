'use client';

import { useState } from 'react';
import { Database, Key, Shield, Settings } from 'lucide-react';

import {
  SANDBOX_SECURED_PLACEHOLDER,
  SEED_BACKUP_CONFIG,
  SEED_RBAC_ROLES,
  SEED_WEBHOOK_CREDENTIALS,
} from '../../../lib/testing';

export default function SystemSettingsWorkbench() {
  const [backupEnabled, setBackupEnabled] = useState(SEED_BACKUP_CONFIG.coldBackupEnabled);
  const [selectedRole, setSelectedRole] = useState(SEED_RBAC_ROLES[0]?.roleId ?? '');

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <header className="border-b-2 border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-slate-900" />
          <div>
            <h1 className="text-lg font-black text-slate-900">System Settings &amp; Configurations</h1>
            <p className="text-sm font-medium text-slate-800">
              Sandbox testing terminal · all credentials masked · no live PII
            </p>
          </div>
        </div>
      </header>

      <p className="rounded-lg border-2 border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800">
        Privacy boundary active: API keys, database snapshot references, and integration secrets render
        as <span className="font-mono text-slate-900">{SANDBOX_SECURED_PLACEHOLDER}</span> only.
      </p>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* RBAC */}
        <section className="rounded-xl border-2 border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 border-b-2 border-slate-200 pb-3">
            <Shield className="h-5 w-5 text-slate-900" />
            <h2 className="text-sm font-black text-slate-900">Role-Based Access Control</h2>
          </div>
          <p className="mb-3 text-sm font-medium text-slate-800">
            Configure permission bundles for clinical and administrative roles.
          </p>
          <label className="mb-3 block space-y-1">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-900">Active Role</span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-sky-700 focus:ring-2 focus:ring-sky-200"
            >
              {SEED_RBAC_ROLES.map((role) => (
                <option key={role.roleId} value={role.roleId}>
                  {role.roleLabel}
                </option>
              ))}
            </select>
          </label>
          <ul className="space-y-2">
            {SEED_RBAC_ROLES.map((role) => (
              <li
                key={role.roleId}
                className={`rounded-lg border-2 px-3 py-2 ${
                  role.roleId === selectedRole
                    ? 'border-sky-700 bg-sky-50'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <p className="text-xs font-black text-slate-900">{role.roleLabel}</p>
                <p className="text-sm font-bold text-slate-800">
                  {role.permissionCount} permissions
                </p>
                <p className="font-mono text-[10px] font-semibold text-slate-800">
                  Modified {role.lastModified}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* Cold Backup */}
        <section className="rounded-xl border-2 border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 border-b-2 border-slate-200 pb-3">
            <Database className="h-5 w-5 text-slate-900" />
            <h2 className="text-sm font-black text-slate-900">Database Cold Backup Hub</h2>
          </div>
          <p className="mb-3 text-sm font-medium text-slate-800">
            Automated scheduling for encrypted cold snapshots.
          </p>
          <dl className="space-y-2 text-sm">
            <div className="rounded-lg border-2 border-slate-200 bg-slate-50 px-3 py-2">
              <dt className="text-xs font-bold uppercase text-slate-900">Schedule</dt>
              <dd className="font-bold text-slate-800">{SEED_BACKUP_CONFIG.scheduleLabel}</dd>
            </div>
            <div className="rounded-lg border-2 border-slate-200 bg-slate-50 px-3 py-2">
              <dt className="text-xs font-bold uppercase text-slate-900">Next Run</dt>
              <dd className="font-mono font-bold text-slate-900">{SEED_BACKUP_CONFIG.nextRunAt}</dd>
            </div>
            <div className="rounded-lg border-2 border-slate-200 bg-slate-50 px-3 py-2">
              <dt className="text-xs font-bold uppercase text-slate-900">Retention</dt>
              <dd className="text-lg font-black text-slate-900">
                {SEED_BACKUP_CONFIG.retentionDays} days
              </dd>
            </div>
            <div className="rounded-lg border-2 border-slate-200 bg-slate-50 px-3 py-2">
              <dt className="text-xs font-bold uppercase text-slate-900">Last Snapshot Log</dt>
              <dd className="font-mono text-xs font-bold text-slate-900">
                {SEED_BACKUP_CONFIG.lastSnapshotRef}
              </dd>
            </div>
          </dl>
          <label className="mt-3 flex cursor-pointer items-center justify-between gap-2 rounded-lg border-2 border-slate-200 px-3 py-2">
            <span className="text-sm font-bold text-slate-900">Cold backup enabled</span>
            <input
              type="checkbox"
              checked={backupEnabled}
              onChange={(e) => setBackupEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-2 border-slate-300"
            />
          </label>
        </section>

        {/* Webhooks */}
        <section className="rounded-xl border-2 border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 border-b-2 border-slate-200 pb-3">
            <Key className="h-5 w-5 text-slate-900" />
            <h2 className="text-sm font-black text-slate-900">API &amp; Webhook Credentials</h2>
          </div>
          <p className="mb-3 text-sm font-medium text-slate-800">
            External integration tracker · credentials are read-only in sandbox.
          </p>
          <ul className="space-y-2">
            {SEED_WEBHOOK_CREDENTIALS.map((hook) => (
              <li key={hook.integrationId} className="rounded-lg border-2 border-slate-200 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-black text-slate-900">{hook.integrationName}</p>
                  <span
                    className={`rounded px-2 py-0.5 text-[9px] font-black uppercase ${
                      hook.status === 'Active'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-slate-700 text-white'
                    }`}
                  >
                    {hook.status}
                  </span>
                </div>
                <p className="mt-1 font-mono text-[10px] font-semibold text-slate-800">
                  {hook.endpointLabel}
                </p>
                <input
                  readOnly
                  value={hook.credentialMasked}
                  aria-label={`${hook.integrationName} credential`}
                  className="mt-2 w-full cursor-not-allowed rounded border-2 border-slate-200 bg-slate-100 px-2 py-1.5 font-mono text-[10px] font-bold text-slate-900"
                />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
