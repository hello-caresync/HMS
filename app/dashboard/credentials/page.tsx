'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  Eye,
  EyeOff,
  KeyRound,
  RotateCcw,
  Search,
  ShieldAlert,
} from 'lucide-react';

type TwoFactorStatus = 'Active' | 'Disabled';

type CredentialProfile = {
  id: string;
  systemRole: string;
  staffDescriptor: string;
  username: string;
  accessKey: string;
  authorizationTier: string;
  twoFactorStatus: TwoFactorStatus;
};

const MANIFEST_SUMMARY =
  'Standalone credential manifest · sandbox routing · role-based access tiers · read-only vault · 13 Jul 2026';

const CREDENTIAL_LEDGER: CredentialProfile[] = [
  {
    id: 'cred-1',
    systemRole: 'Primary Physician',
    staffDescriptor: 'Dr. Aishwarya D S',
    username: 'physician.aishwarya@nexora.local',
    accessKey: 'nexora_temp_pass_2026',
    authorizationTier: 'Full System Admin',
    twoFactorStatus: 'Active',
  },
  {
    id: 'cred-2',
    systemRole: 'Attending Surgeon',
    staffDescriptor: 'Dr. Sandbox M.',
    username: 'surgeon.sandbox@nexora.local',
    accessKey: 'nexora_ot_suite_2026',
    authorizationTier: 'Phases 1-5 Core Only',
    twoFactorStatus: 'Active',
  },
  {
    id: 'cred-3',
    systemRole: 'Lead Nurse',
    staffDescriptor: 'Nurse A.',
    username: 'nurse.lead@nexora.local',
    accessKey: 'nexora_nurse_vault_26',
    authorizationTier: 'Diagnostics Vault Read/Write',
    twoFactorStatus: 'Active',
  },
  {
    id: 'cred-4',
    systemRole: 'Clinic Receptionist',
    staffDescriptor: 'Reception Desk',
    username: 'reception.front@nexora.local',
    accessKey: 'nexora_frontdesk_2026',
    authorizationTier: 'Phases 1-5 Core Only',
    twoFactorStatus: 'Disabled',
  },
  {
    id: 'cred-5',
    systemRole: 'Lab Technician',
    staffDescriptor: 'Lab Desk',
    username: 'lab.tech@nexora.local',
    accessKey: 'nexora_lab_route_26',
    authorizationTier: 'Diagnostics Vault Read/Write',
    twoFactorStatus: 'Active',
  },
  {
    id: 'cred-6',
    systemRole: 'Pharmacy Head',
    staffDescriptor: 'Pharmacy Lead',
    username: 'pharmacy.head@nexora.local',
    accessKey: 'nexora_rx_safety_2026',
    authorizationTier: 'Phases 1-5 Core Only',
    twoFactorStatus: 'Active',
  },
];

const MASKED_KEY = '••••••••';

const INPUT_CLASS =
  'w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-950 placeholder:text-slate-500 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200';

const TFA_STYLES: Record<TwoFactorStatus, string> = {
  Active: 'bg-emerald-100 text-emerald-950 border border-emerald-400 font-bold',
  Disabled: 'bg-amber-100 text-amber-950 border border-amber-400 font-bold',
};

export default function CredentialsVaultPage() {
  const [filterQuery, setFilterQuery] = useState('');
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [actionNote, setActionNote] = useState<string | null>(null);

  const showNotice = useCallback((message: string) => {
    setActionNote(message);
    window.setTimeout(() => setActionNote(null), 4500);
  }, []);

  const filteredLedger = useMemo(() => {
    const query = filterQuery.trim().toLowerCase();
    if (!query) return CREDENTIAL_LEDGER;
    return CREDENTIAL_LEDGER.filter(
      (row) =>
        row.systemRole.toLowerCase().includes(query) ||
        row.staffDescriptor.toLowerCase().includes(query) ||
        row.username.toLowerCase().includes(query) ||
        row.authorizationTier.toLowerCase().includes(query),
    );
  }, [filterQuery]);

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleResetToken = (profile: CredentialProfile) => {
    showNotice(
      `Reset token simulated · ${profile.systemRole} · ${profile.username} · sandbox only · no backend write`,
    );
  };

  const handleModifyScope = (profile: CredentialProfile) => {
    showNotice(
      `Modify scope queued · ${profile.systemRole} · tier ${profile.authorizationTier} · sandbox routing`,
    );
  };

  return (
    <div className="min-h-screen w-full font-sans text-slate-950 selection:bg-slate-200">
      <div className="w-full space-y-5 p-4 sm:p-6 lg:p-8">
        {/* Compliance & security header */}
        <header className="flex w-full flex-col gap-4 border-b-2 border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Credential Manifest &amp; System Access Controls
            </h1>
            <p className="mt-1 max-w-3xl text-sm font-medium leading-relaxed text-slate-800">
              {MANIFEST_SUMMARY}
            </p>
            <p className="mt-2 font-mono text-xs font-black text-slate-950">
              Active profiles · {filteredLedger.length}/{CREDENTIAL_LEDGER.length} · 2FA deployed ·{' '}
              {CREDENTIAL_LEDGER.filter((r) => r.twoFactorStatus === 'Active').length}/
              {CREDENTIAL_LEDGER.length}
            </p>
          </div>
          <div className="inline-flex shrink-0 items-center gap-2 rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-950 shadow-sm">
            <KeyRound className="h-4 w-4 text-sky-700" aria-hidden />
            <span>AUTH_SANDBOX_READ_ONLY</span>
          </div>
        </header>

        {/* Safety notice banner */}
        <div
          role="alert"
          className="w-full rounded-lg border-2 border-amber-400 bg-amber-50 p-3 text-xs font-bold text-amber-950"
        >
          Notice: These profiles represent temporary sandbox entry variables generated for the local
          development stack environment. Force update passwords upon initial production workspace
          initialization.
        </div>

        {actionNote && (
          <p
            role="status"
            className="w-full rounded-lg border-2 border-sky-300 bg-sky-50 px-4 py-2.5 text-sm font-bold text-sky-950"
          >
            {actionNote}
          </p>
        )}

        {/* Filter */}
        <section aria-label="Credential filter" className="w-full">
          <label className="block space-y-1.5">
            <span className="text-xs font-black uppercase text-slate-950">
              Filter by Role or Staff Descriptor
            </span>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                aria-hidden
              />
              <input
                type="search"
                className={`${INPUT_CLASS} pl-10`}
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Search role, staff name, username, tier…"
                aria-label="Filter credentials"
              />
            </div>
          </label>
        </section>

        {/* Credentials matrix */}
        <section
          aria-label="Credentials access ledger"
          className="w-full overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_4px_16px_-4px_rgba(0,117,140,0.03)] shadow-sm"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 bg-slate-100">
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase text-slate-950">
                    Role Target
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase text-slate-950">
                    Username Token
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase text-slate-950">
                    Default Access Key
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase text-slate-950">
                    Authorization Tier
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase text-slate-950">
                    Security Status
                  </th>
                  <th className="px-4 py-3 text-right text-[10px] font-black uppercase text-slate-950">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLedger.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-sm font-bold text-slate-800"
                    >
                      No credential profiles match the current filter.
                    </td>
                  </tr>
                ) : (
                  filteredLedger.map((profile) => {
                    const isRevealed = revealedIds.has(profile.id);
                    return (
                      <tr key={profile.id} className="border-b-2 border-slate-200">
                        <td className="px-4 py-3.5">
                          <p className="text-xs font-black text-slate-950">{profile.systemRole}</p>
                          <p className="mt-0.5 text-[10px] font-bold text-slate-800">
                            {profile.staffDescriptor}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs font-bold text-slate-950">
                          {profile.username}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-black tabular-nums text-slate-950">
                              {isRevealed ? profile.accessKey : MASKED_KEY}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleReveal(profile.id)}
                              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-black uppercase text-slate-950 transition-colors hover:bg-white"
                              aria-pressed={isRevealed}
                              aria-label={isRevealed ? 'Hide access key' : 'Reveal access key'}
                            >
                              {isRevealed ? (
                                <>
                                  <EyeOff className="h-3 w-3" aria-hidden />
                                  Hide Key
                                </>
                              ) : (
                                <>
                                  <Eye className="h-3 w-3" aria-hidden />
                                  Reveal Key
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-xs font-bold text-slate-950">
                          {profile.authorizationTier}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex rounded-md px-2 py-0.5 text-[10px] uppercase ${TFA_STYLES[profile.twoFactorStatus]}`}
                          >
                            2FA · {profile.twoFactorStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-wrap justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleResetToken(profile)}
                              className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-sky-800 hover:text-sky-950"
                            >
                              <RotateCcw className="h-3 w-3" aria-hidden />
                              Reset Token
                            </button>
                            <span className="text-slate-300" aria-hidden>
                              |
                            </span>
                            <button
                              type="button"
                              onClick={() => handleModifyScope(profile)}
                              className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-slate-950 hover:text-slate-800"
                            >
                              <ShieldAlert className="h-3 w-3" aria-hidden />
                              Modify Scope
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800">
          <KeyRound className="h-4 w-4 shrink-0 text-slate-950" aria-hidden />
          <span>
            Sandbox credential vault · read-only manifest · no live IAM integration · force password
            rotation before production
          </span>
        </div>
      </div>
    </div>
  );
}
