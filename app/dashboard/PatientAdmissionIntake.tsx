'use client';

import { useState } from 'react';
import {
  CheckSquare,
  CreditCard,
  FileUp,
  ShieldCheck,
  Wallet,
} from 'lucide-react';

import {
  MasterField,
  MasterPanel,
  MasterViewHeader,
  masterBtnPrimary,
  masterInputClass,
} from './_masterLightUi';

const PACKAGES = ['Standard Ward', 'Semi-Private Suite', 'Deluxe Package', 'ICU Critical Care'];
const CONSENT_ITEMS = [
  'General treatment consent',
  'Financial responsibility acknowledgment',
  'Data privacy & HIPAA equivalent',
  'Photography / media opt-out',
];

export default function PatientAdmissionIntake() {
  const [packageType, setPackageType] = useState(PACKAGES[0]);
  const [deposit, setDeposit] = useState({ cash: '', upi: '' });
  const [tpaStatus, setTpaStatus] = useState<'Pending' | 'Verified' | 'Rejected'>('Pending');
  const [consents, setConsents] = useState<Record<string, boolean>>({});
  const [uploads, setUploads] = useState<string[]>([]);

  const toggleConsent = (item: string) => {
    setConsents((c) => ({ ...c, [item]: !c[item] }));
  };

  const simulateUpload = () => {
    setUploads((u) => [...u, `document_${u.length + 1}.pdf`]);
  };

  const verifyTpa = () => setTpaStatus('Verified');

  return (
    <div className="space-y-6">
      <MasterViewHeader
        title="Patient Admission Intake"
        subtitle="Package selection, advance deposit, TPA verification, consent, and document capture."
        icon={Wallet}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MasterPanel title="Admission Package & Deposit" description="Care pathway and advance collection">
          <div className="space-y-4">
            <MasterField label="Care Package">
              <select
                className={masterInputClass}
                value={packageType}
                onChange={(e) => setPackageType(e.target.value)}
              >
                {PACKAGES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </MasterField>
            <div className="grid grid-cols-2 gap-3">
              <MasterField label="Advance Cash (₹)">
                <input
                  className={masterInputClass}
                  value={deposit.cash}
                  onChange={(e) => setDeposit((d) => ({ ...d, cash: e.target.value }))}
                  placeholder="0.00"
                />
              </MasterField>
              <MasterField label="Advance UPI (₹)">
                <input
                  className={masterInputClass}
                  value={deposit.upi}
                  onChange={(e) => setDeposit((d) => ({ ...d, upi: e.target.value }))}
                  placeholder="0.00"
                />
              </MasterField>
            </div>
            <p className="flex items-center gap-2 text-xs text-slate-500">
              <CreditCard className="h-4 w-4 text-blue-600" />
              Total advance: ₹
              {(parseFloat(deposit.cash || '0') + parseFloat(deposit.upi || '0')).toLocaleString('en-IN')}
            </p>
          </div>
        </MasterPanel>

        <MasterPanel title="Insurance TPA Verification" description="Real-time clearance status">
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <span className="text-sm font-semibold text-slate-800">Star Health TPA</span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ring-1 ${
                  tpaStatus === 'Verified'
                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                    : tpaStatus === 'Rejected'
                      ? 'bg-rose-50 text-rose-700 ring-rose-200'
                      : 'bg-amber-50 text-amber-700 ring-amber-200'
                }`}
              >
                {tpaStatus}
              </span>
            </div>
            <button type="button" className={masterBtnPrimary} onClick={verifyTpa}>
              <ShieldCheck className="h-3.5 w-3.5" />
              Run TPA Verification
            </button>
          </div>
        </MasterPanel>
      </div>

      <MasterPanel title="Digital Consent Checklist" description="Signed acknowledgments required before admit">
        <ul className="space-y-2">
          {CONSENT_ITEMS.map((item) => (
            <li key={item}>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={!!consents[item]}
                  onChange={() => toggleConsent(item)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                <CheckSquare className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-800">{item}</span>
              </label>
            </li>
          ))}
        </ul>
      </MasterPanel>

      <MasterPanel title="Document Upload Slots" description="Simulated attachment capture">
        <div className="flex flex-wrap gap-2">
          {uploads.map((f) => (
            <span
              key={f}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-mono text-slate-600"
            >
              {f}
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={simulateUpload}
          className="mt-3 flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white px-4 py-3 text-xs font-semibold text-slate-600 hover:border-blue-400 hover:text-blue-600"
        >
          <FileUp className="h-4 w-4" />
          Simulate Document Upload
        </button>
      </MasterPanel>
    </div>
  );
}
