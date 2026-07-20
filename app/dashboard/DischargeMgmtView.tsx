'use client';

import { useState } from 'react';
import {
  BedDouble,
  Calendar,
  CheckCircle2,
  FileText,
  LogOut,
  Wallet,
} from 'lucide-react';

import {
  MasterField,
  MasterPanel,
  MasterViewHeader,
  masterBtnPrimary,
  masterInputClass,
} from './_masterLightUi';

const CHECKLIST = [
  { id: 'doctor', label: 'Formal doctor discharge request signed', key: 'doctorRequest' },
  { id: 'summary', label: 'Discharge summary completed', key: 'summary' },
  { id: 'billing', label: 'Final billing finance clearance', key: 'billing' },
  { id: 'bed', label: 'Bed release hook triggered', key: 'bedRelease' },
  { id: 'followup', label: 'Follow-up consultation scheduled', key: 'followup' },
] as const;

type CheckKey = (typeof CHECKLIST)[number]['key'];

export default function DischargeMgmtView() {
  const [checks, setChecks] = useState<Record<CheckKey, boolean>>({
    doctorRequest: false,
    summary: false,
    billing: false,
    bedRelease: false,
    followup: false,
  });
  const [summaryText, setSummaryText] = useState(
    'Patient admitted for acute coronary syndrome. Stabilized on medical management. Discharged in stable condition with medication compliance instructions.',
  );
  const [followUpDate, setFollowUpDate] = useState('');
  const [discharged, setDischarged] = useState(false);

  const toggle = (key: CheckKey) => setChecks((c) => ({ ...c, [key]: !c[key] }));

  const allComplete = Object.values(checks).every(Boolean);

  const processDischarge = () => {
    if (!allComplete) return;
    setDischarged(true);
  };

  return (
    <div className="space-y-6">
      <MasterViewHeader
        title="Discharge Management"
        subtitle="Pre-discharge checklist, summary builder, billing clearance, and follow-up planning."
        icon={LogOut}
      />

      {discharged && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          <CheckCircle2 className="h-5 w-5" />
          Discharge processed — bed released and follow-up logged.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MasterPanel title="Pre-Discharge Checklist Audit" description="All items required before release">
          <ul className="space-y-2">
            {CHECKLIST.map((item) => (
              <li key={item.id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={checks[item.key]}
                    onChange={() => toggle(item.key)}
                    className="h-4 w-4 rounded text-blue-600"
                  />
                  <span className="text-sm text-slate-800">{item.label}</span>
                </label>
              </li>
            ))}
          </ul>
        </MasterPanel>

        <MasterPanel title="Discharge Summary Builder" description="Electronic clinical narrative">
          <MasterField label="Summary Text">
            <textarea
              className={`${masterInputClass} min-h-[140px]`}
              value={summaryText}
              onChange={(e) => setSummaryText(e.target.value)}
            />
          </MasterField>
          <p className="mt-2 flex items-center gap-1 text-[11px] text-slate-500">
            <FileText className="h-3.5 w-3.5" />
            {summaryText.length} characters
          </p>
        </MasterPanel>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MasterPanel title="Finance Clearance" description="Final billing sign-off">
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <span className="flex items-center gap-2 text-sm text-slate-800">
              <Wallet className="h-4 w-4 text-blue-600" />
              Pending balance: ₹12,400
            </span>
            <button
              type="button"
              onClick={() => setChecks((c) => ({ ...c, billing: true }))}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Mark cleared
            </button>
          </div>
        </MasterPanel>

        <MasterPanel title="Follow-Up Consultation" description="Post-discharge care planning">
          <MasterField label="Follow-up Date">
            <input
              type="date"
              className={masterInputClass}
              value={followUpDate}
              onChange={(e) => {
                setFollowUpDate(e.target.value);
                if (e.target.value) setChecks((c) => ({ ...c, followup: true }));
              }}
            />
          </MasterField>
          <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
            <Calendar className="h-3.5 w-3.5" />
            OPD slot auto-reserved on confirm
          </p>
        </MasterPanel>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setChecks((c) => ({ ...c, bedRelease: true }))}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          <BedDouble className="h-3.5 w-3.5" />
          Trigger Bed Release Hook
        </button>
        <button
          type="button"
          disabled={!allComplete || discharged}
          onClick={processDischarge}
          className={`${masterBtnPrimary} disabled:opacity-50`}
        >
          <LogOut className="h-3.5 w-3.5" />
          Complete Discharge
        </button>
      </div>
    </div>
  );
}
