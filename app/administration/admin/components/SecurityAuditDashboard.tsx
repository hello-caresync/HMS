'use client';

import { ShieldAlert } from 'lucide-react';

import { SEED_SECURITY_AUDIT_LOG } from '../../../lib/administration';
import SecurityAuditLogTable from './SecurityAuditLogTable';

export default function SecurityAuditDashboard() {
  return (
    <div className="space-y-4 p-4 sm:p-6">
      <header className="border-b-2 border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-rose-700" />
          <div>
            <h1 className="text-lg font-black text-slate-900">Security &amp; Audit Console</h1>
            <p className="text-xs text-slate-800">
              Phase 7 · Modules 23–24 · Immutable audit trail · read-only
            </p>
          </div>
        </div>
      </header>

      <div className="rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-xs text-slate-800">
        Audit log is append-only. Entries require MFA for privileged actions and are retained per
        system policy.
      </div>

      <SecurityAuditLogTable entries={SEED_SECURITY_AUDIT_LOG} />
    </div>
  );
}
