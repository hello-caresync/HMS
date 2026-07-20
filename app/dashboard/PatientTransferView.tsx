'use client';

import { useState } from 'react';
import { ArrowRightLeft, History } from 'lucide-react';

import {
  MasterDataTable,
  MasterField,
  MasterPanel,
  MasterViewHeader,
  masterBtnPrimary,
  masterInputClass,
} from './_masterLightUi';

const INPATIENTS = [
  { id: 'IP-001', name: 'Rahul Sharma', current: 'ICU-A · ICU-01' },
  { id: 'IP-002', name: 'Priya Patel', current: 'General · GEN-102' },
  { id: 'IP-003', name: 'Meera Krishnan', current: 'Deluxe · DLX-202' },
];

const TARGET_UNITS = [
  'General Ward · Block C',
  'Semi-Private · Block B',
  'ICU-A Step-Down',
  'General · GEN-101',
  'Rehab Unit',
];

type TransferLog = {
  id: string;
  patient: string;
  from: string;
  to: string;
  at: string;
};

const INITIAL_HISTORY: TransferLog[] = [
  {
    id: 'TR-441',
    patient: 'Sanjay Rao',
    from: 'ICU-A · ICU-04',
    to: 'General · GEN-205',
    at: '2026-07-15 18:30',
  },
];

export default function PatientTransferView() {
  const [selectedPatient, setSelectedPatient] = useState(INPATIENTS[0].id);
  const [targetUnit, setTargetUnit] = useState(TARGET_UNITS[0]);
  const [reason, setReason] = useState('');
  const [history, setHistory] = useState(INITIAL_HISTORY);

  const patient = INPATIENTS.find((p) => p.id === selectedPatient)!;

  const executeTransfer = () => {
    if (!reason.trim()) return;
    setHistory((h) => [
      {
        id: `TR-${442 + h.length}`,
        patient: patient.name,
        from: patient.current,
        to: targetUnit,
        at: new Date().toLocaleString('en-IN'),
      },
      ...h,
    ]);
    setReason('');
  };

  return (
    <div className="space-y-6">
      <MasterViewHeader
        title="Patient Transfer Control"
        subtitle="Ward, room, bed, and department routing with transfer history ledger."
        icon={ArrowRightLeft}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MasterPanel title="Transfer Routing Sheet" description="Select inpatient and target unit">
          <div className="space-y-4">
            <MasterField label="Current Inpatient">
              <select
                className={masterInputClass}
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
              >
                {INPATIENTS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.current}
                  </option>
                ))}
              </select>
            </MasterField>
            <MasterField label="Target Unit / Bed">
              <select
                className={masterInputClass}
                value={targetUnit}
                onChange={(e) => setTargetUnit(e.target.value)}
              >
                {TARGET_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </MasterField>
            <MasterField label="Clinical Reason">
              <textarea
                className={`${masterInputClass} min-h-[72px]`}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Step-down from ICU — stable vitals 24h"
              />
            </MasterField>
            <button type="button" className={masterBtnPrimary} onClick={executeTransfer}>
              <ArrowRightLeft className="h-3.5 w-3.5" />
              Execute Transfer
            </button>
          </div>
        </MasterPanel>

        <MasterPanel title="Current Location" description="Source routing snapshot">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-lg font-bold text-slate-800">{patient.name}</p>
            <p className="mt-1 font-mono text-sm text-blue-600">{patient.id}</p>
            <p className="mt-3 text-xs text-slate-600">
              Current: <span className="font-semibold">{patient.current}</span>
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Target: <span className="font-semibold text-blue-600">{targetUnit}</span>
            </p>
          </div>
        </MasterPanel>
      </div>

      <MasterPanel title="Transfer History Ledger" description="Immutable routing audit trail">
        <MasterDataTable
          columns={['Transfer ID', 'Patient', 'From', 'To', 'Timestamp']}
          rows={history.map((t) => [t.id, t.patient, t.from, t.to, t.at])}
        />
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
          <History className="h-3.5 w-3.5" />
          Transfers sync to bed allocation matrix and census ledger.
        </p>
      </MasterPanel>
    </div>
  );
}
