'use client';

import { useState } from 'react';
import { Key, Settings, Shield } from 'lucide-react';

import { DEFAULT_SYSTEM_SETTINGS, type SystemSecuritySettings } from '../../../lib/administration';

export default function SystemSettingsConsole() {
  const [settings, setSettings] = useState<SystemSecuritySettings>(DEFAULT_SYSTEM_SETTINGS);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 4000);
  };

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <header className="border-b-2 border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-sky-700" />
          <div>
            <h1 className="text-lg font-black text-slate-900">System Settings &amp; Security</h1>
            <p className="text-xs text-slate-800">
              Phase 7 · Module 25 · IT administrative controls
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4 text-slate-800" />
            <h2 className="text-sm font-black text-slate-900">Authentication Policy</h2>
          </div>
          <label className="flex cursor-pointer items-center justify-between gap-3 border-b-2 border-slate-200 py-3 text-sm">
            <span className="font-medium text-slate-800">Enforce MFA for all staff</span>
            <input
              type="checkbox"
              checked={settings.mfaEnforced}
              onChange={(e) => setSettings((s) => ({ ...s, mfaEnforced: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300"
            />
          </label>
          <label className="flex cursor-pointer items-center justify-between gap-3 border-b-2 border-slate-200 py-3 text-sm">
            <span className="font-medium text-slate-800">IP allowlist enabled</span>
            <input
              type="checkbox"
              checked={settings.ipAllowlistEnabled}
              onChange={(e) =>
                setSettings((s) => ({ ...s, ipAllowlistEnabled: e.target.checked }))
              }
              className="h-4 w-4 rounded border-slate-300"
            />
          </label>
          <label className="block space-y-1 py-3">
            <span className="text-[10px] font-bold uppercase text-slate-800">
              Session timeout (minutes)
            </span>
            <input
              type="number"
              min={5}
              max={120}
              value={settings.sessionTimeoutMinutes}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  sessionTimeoutMinutes: Number(e.target.value) || 30,
                }))
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
            />
          </label>
        </section>

        <section className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Key className="h-4 w-4 text-slate-800" />
            <h2 className="text-sm font-black text-slate-900">Audit &amp; API</h2>
          </div>
          <label className="block space-y-1 border-b-2 border-slate-200 py-3">
            <span className="text-[10px] font-bold uppercase text-slate-800">
              Audit log retention (days)
            </span>
            <input
              type="number"
              min={90}
              max={730}
              value={settings.auditRetentionDays}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  auditRetentionDays: Number(e.target.value) || 365,
                }))
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
            />
          </label>
          <dl className="py-3 text-xs">
            <dt className="text-[10px] font-bold uppercase text-slate-800">API key last rotated</dt>
            <dd className="mt-1 font-mono text-slate-900">
              {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(
                new Date(settings.apiKeyLastRotated),
              )}
            </dd>
          </dl>
          <button
            type="button"
            onClick={() =>
              setSettings((s) => ({ ...s, apiKeyLastRotated: new Date().toISOString() }))
            }
            className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 hover:bg-slate-100"
          >
            Simulate API Key Rotation
          </button>
        </section>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          className="rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-900"
        >
          Save System Settings
        </button>
        {saved && <span className="text-sm font-medium text-emerald-700">Settings saved</span>}
      </div>
    </div>
  );
}
