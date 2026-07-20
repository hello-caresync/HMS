'use client';

import { useState } from 'react';
import { Barcode, CheckCircle2, ClipboardList, UserPlus } from 'lucide-react';

import {
  MasterField,
  MasterPanel,
  MasterViewHeader,
  masterBtnPrimary,
  masterInputClass,
} from './_masterLightUi';

type Toast = { message: string; uhid: string } | null;

function generateUhid(): string {
  const seq = Math.floor(100000 + Math.random() * 900000);
  return `NX-2026-${seq}`;
}

function BarcodePlaceholder({ uhid }: { uhid: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-col items-center gap-2">
        <Barcode className="h-8 w-8 text-slate-400" />
        <div className="flex h-12 w-full max-w-xs items-end justify-center gap-0.5 px-2">
          {Array.from({ length: 32 }).map((_, i) => (
            <div
              key={i}
              className="bg-slate-800"
              style={{ width: i % 3 === 0 ? 3 : 2, height: `${28 + (i % 5) * 4}px` }}
            />
          ))}
        </div>
        <p className="font-mono text-sm font-bold tracking-wider text-slate-800">{uhid}</p>
        <p className="text-[10px] uppercase tracking-wider text-slate-400">Structural UHID Barcode</p>
      </div>
    </div>
  );
}

export default function PatientRegistrationView() {
  const [toast, setToast] = useState<Toast>(null);
  const [generatedUhid, setGeneratedUhid] = useState<string | null>(null);
  const [ehrLog, setEhrLog] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: '',
    age: '',
    sex: 'Male',
    phone: '',
    address: '',
    nextOfKin: '',
    primaryPayer: 'Self Pay',
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return;

    const uhid = generateUhid();
    setGeneratedUhid(uhid);
    setEhrLog([
      `[${new Date().toLocaleTimeString()}] EHR chart provisioned — empty clinical record initialized`,
      `[${new Date().toLocaleTimeString()}] Demographics indexed · payer: ${form.primaryPayer}`,
      `[${new Date().toLocaleTimeString()}] Next of kin contact linked`,
    ]);
    setToast({ message: 'Patient registered successfully. UHID assigned.', uhid });
    window.setTimeout(() => setToast(null), 5000);
  };

  return (
    <div className="space-y-6">
      <MasterViewHeader
        title="Patient Registration"
        subtitle="Intake desk for demographics capture, UHID provisioning, and EHR chart initialization."
        icon={UserPlus}
      />

      {toast && (
        <div
          className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 shadow-sm"
          role="alert"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <div>
            <p>{toast.message}</p>
            <p className="mt-0.5 font-mono text-xs text-emerald-700">UHID: {toast.uhid}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <form onSubmit={handleSubmit} className="space-y-4 lg:col-span-2">
          <MasterPanel title="Demographics Intake Form" description="Required fields for master patient index">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <MasterField label="Full Name">
                <input
                  required
                  className={masterInputClass}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Patient full legal name"
                />
              </MasterField>
              <div className="grid grid-cols-2 gap-3">
                <MasterField label="Age">
                  <input
                    required
                    type="number"
                    min={0}
                    className={masterInputClass}
                    value={form.age}
                    onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
                  />
                </MasterField>
                <MasterField label="Sex">
                  <select
                    className={masterInputClass}
                    value={form.sex}
                    onChange={(e) => setForm((f) => ({ ...f, sex: e.target.value }))}
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </MasterField>
              </div>
              <MasterField label="Phone">
                <input
                  required
                  className={masterInputClass}
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+91 …"
                />
              </MasterField>
              <MasterField label="Primary Payer">
                <select
                  className={masterInputClass}
                  value={form.primaryPayer}
                  onChange={(e) => setForm((f) => ({ ...f, primaryPayer: e.target.value }))}
                >
                  <option>Self Pay</option>
                  <option>Corporate Insurance</option>
                  <option>TPA Cashless</option>
                  <option>Government Scheme</option>
                </select>
              </MasterField>
              <MasterField label="Address">
                <input
                  className={masterInputClass}
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                />
              </MasterField>
              <MasterField label="Next of Kin">
                <input
                  className={masterInputClass}
                  value={form.nextOfKin}
                  onChange={(e) => setForm((f) => ({ ...f, nextOfKin: e.target.value }))}
                  placeholder="Name · relationship · contact"
                />
              </MasterField>
            </div>
            <button type="submit" className={`${masterBtnPrimary} mt-5`}>
              <UserPlus className="h-3.5 w-3.5" />
              Register &amp; Provision UHID
            </button>
          </MasterPanel>
        </form>

        <div className="space-y-4">
          {generatedUhid ? (
            <MasterPanel title="UHID Assignment" description="Auto-generated structural identifier">
              <BarcodePlaceholder uhid={generatedUhid} />
            </MasterPanel>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <Barcode className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-2 text-xs font-medium text-slate-500">
                Submit intake form to generate UHID barcode
              </p>
            </div>
          )}

          <MasterPanel title="EHR Chart Log" description="Provisioned clinical record events">
            {ehrLog.length === 0 ? (
              <p className="text-xs text-slate-400">No chart provisioned yet.</p>
            ) : (
              <ul className="space-y-2">
                {ehrLog.map((line, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600"
                  >
                    <ClipboardList className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />
                    {line}
                  </li>
                ))}
              </ul>
            )}
          </MasterPanel>
        </div>
      </div>
    </div>
  );
}
