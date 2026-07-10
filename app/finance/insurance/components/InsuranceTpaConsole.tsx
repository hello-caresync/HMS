'use client';

import { useCallback, useState } from 'react';
import { Building2 } from 'lucide-react';

import {
  SEED_PRE_AUTH_REQUESTS,
  generatePreAuthId,
  type PreAuthorizationRequest,
} from '../../../lib/finance';
import ClaimFilingForm from './ClaimFilingForm';
import PreAuthGrid from './PreAuthGrid';

export default function InsuranceTpaConsole() {
  const [requests, setRequests] = useState<PreAuthorizationRequest[]>(SEED_PRE_AUTH_REQUESTS);
  const [filedMessage, setFiledMessage] = useState<string | null>(null);

  const handleFileClaim = useCallback(
    (draft: {
      policyNumber: string;
      tpaCompany: string;
      coPayAmount: number;
      documentLabel: string;
    }) => {
      const entry: PreAuthorizationRequest = {
        requestId: generatePreAuthId(),
        patientName: 'P.N.',
        patientUhid: 'NX-2026-NEWCLM',
        policyNumber: draft.policyNumber,
        tpaCompany: draft.tpaCompany,
        procedureSummary: draft.documentLabel || 'Corporate claim bundle upload',
        estimatedAmount: 0,
        coPayAmount: draft.coPayAmount,
        status: 'Submitted to TPA',
        submittedAt: new Date().toISOString(),
      };
      setRequests((prev) => [entry, ...prev]);
      setFiledMessage(`Claim bundle filed · ${entry.requestId} · ${draft.tpaCompany}`);
      window.setTimeout(() => setFiledMessage(null), 5000);
    },
    [],
  );

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <header className="border-b-2 border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-sky-700" />
          <div>
            <h1 className="text-lg font-black text-slate-900">Insurance Pre-Auth &amp; Claims</h1>
            <p className="text-xs text-slate-800">
              Phase 5 · Module 16 · TPA settlement &amp; corporate claims console
            </p>
          </div>
        </div>
      </header>

      {filedMessage && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-800">
          {filedMessage}
        </div>
      )}

      <PreAuthGrid requests={requests} />
      <ClaimFilingForm onFileClaim={handleFileClaim} />
    </div>
  );
}
