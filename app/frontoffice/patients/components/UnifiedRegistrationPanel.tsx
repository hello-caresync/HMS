'use client';

import { useState } from 'react';
import { CheckCircle2, IdCard, ShieldCheck, UserPlus } from 'lucide-react';

import MockQrCode from '../../components/MockQrCode';
import { SANDBOX_SECURED_PLACEHOLDER } from '../../../lib/testing';
import {
  generateUhid,
  IDENTITY_DOC_LABELS,
  type Gender,
  type IdentityDocType,
  type PatientRegistrationDraft,
  type RegistrationSuccessPayload,
} from '../../../lib/frontoffice';

const EMPTY_DRAFT: PatientRegistrationDraft = {
  fullName: '',
  dateOfBirth: '',
  gender: 'Male',
  phone: '',
  insuranceProvider: '',
  emergencyContact: '',
  identityDocType: 'none',
  identityDocValue: '',
};

const INPUT_CLASS =
  'w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 placeholder:text-slate-500 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200';

const INSURANCE_OPTIONS = [
  'Self Pay / Cash',
  'Star Health · Medi Assist',
  'HDFC ERGO',
  'ICICI Lombard',
  'Government Scheme',
];

export default function UnifiedRegistrationPanel() {
  const [draft, setDraft] = useState<PatientRegistrationDraft>(EMPTY_DRAFT);
  const [success, setSuccess] = useState<RegistrationSuccessPayload | null>(null);
  const [idFocused, setIdFocused] = useState(false);

  const requiresIdField = draft.identityDocType !== 'none';

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSuccess({
      uhid: generateUhid(),
      registeredAt: new Date().toISOString(),
      patientName: draft.fullName.trim(),
    });
    setDraft(EMPTY_DRAFT);
  };

  const handleReset = () => {
    setSuccess(null);
    setDraft(EMPTY_DRAFT);
  };

  if (success) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-emerald-300 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-8 w-8 shrink-0 text-emerald-600" />
          <div>
            <h2 className="text-lg font-black text-slate-900">Registration Complete</h2>
            <p className="mt-1 text-sm text-slate-800">
              Patient record provisioned in master index.
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
            Universal Health ID (UHID)
          </p>
          <p className="mt-1 font-mono text-2xl font-black tracking-wide text-slate-900">
            {success.uhid}
          </p>
          <p className="mt-1 text-xs text-slate-800">{success.patientName}</p>
        </div>

        <div className="mt-4 flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white p-4">
          <MockQrCode value={success.uhid} size={140} />
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-800">
            Scannable patient wristband QR · simulation
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="mt-5 w-full rounded-lg bg-slate-800 py-2.5 text-sm font-bold text-white hover:bg-slate-900"
        >
          Register Another Patient
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <header className="border-b-2 border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-sky-700" />
          <div>
            <h1 className="text-lg font-black text-slate-900">
              Unified Registration &amp; Verification
            </h1>
            <p className="text-xs text-slate-800">Phase 2 · Module 5 · Front Office Intake</p>
          </div>
        </div>
      </header>

      <section className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-800">
          Demographics
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1 sm:col-span-2">
            <span className="text-xs font-semibold text-slate-800">Full Name</span>
            <input
              required
              value={draft.fullName}
              onChange={(e) => setDraft((d) => ({ ...d, fullName: e.target.value }))}
              className={INPUT_CLASS}
              placeholder="Patient legal name · e.g. P.N."
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-slate-800">Date of Birth</span>
            <input
              required
              type="date"
              value={draft.dateOfBirth}
              onChange={(e) => setDraft((d) => ({ ...d, dateOfBirth: e.target.value }))}
              className={INPUT_CLASS}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-slate-800">Gender</span>
            <select
              value={draft.gender}
              onChange={(e) =>
                setDraft((d) => ({ ...d, gender: e.target.value as Gender }))
              }
              className={INPUT_CLASS}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-slate-800">Phone</span>
            <input
              required
              value={draft.phone}
              onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
              className={INPUT_CLASS}
              placeholder="+91 98765 43210"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-slate-800">Insurance Provider</span>
            <select
              value={draft.insuranceProvider}
              onChange={(e) =>
                setDraft((d) => ({ ...d, insuranceProvider: e.target.value }))
              }
              className={INPUT_CLASS}
            >
              <option value="">Select provider</option>
              {INSURANCE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1 sm:col-span-2">
            <span className="text-xs font-semibold text-slate-800">Emergency Contact</span>
            <input
              required
              value={draft.emergencyContact}
              onChange={(e) =>
                setDraft((d) => ({ ...d, emergencyContact: e.target.value }))
              }
              className={INPUT_CLASS}
              placeholder="Name · relationship · phone"
            />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <IdCard className="h-4 w-4 text-slate-800" />
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-800">
            Identity Verification
          </p>
        </div>

        <label className="block space-y-1">
          <span className="text-xs font-semibold text-slate-800">Document Type</span>
          <select
            value={draft.identityDocType}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                identityDocType: e.target.value as IdentityDocType,
                identityDocValue: '',
              }))
            }
            className={INPUT_CLASS}
          >
            {(Object.keys(IDENTITY_DOC_LABELS) as IdentityDocType[]).map((key) => (
              <option key={key} value={key}>
                {IDENTITY_DOC_LABELS[key]}
              </option>
            ))}
          </select>
        </label>

        {requiresIdField && (
          <label className="mt-3 block space-y-1">
            <span className="text-xs font-semibold text-slate-800">Document Number</span>
            <input
              required
              readOnly={!idFocused}
              value={
                idFocused
                  ? draft.identityDocValue
                  : draft.identityDocValue.trim() || SANDBOX_SECURED_PLACEHOLDER
              }
              onChange={(e) =>
                setDraft((d) => ({ ...d, identityDocValue: e.target.value }))
              }
              onFocus={() => setIdFocused(true)}
              onBlur={() => {
                setIdFocused(false);
                if (!draft.identityDocValue.trim()) {
                  setDraft((d) => ({ ...d, identityDocValue: '' }));
                }
              }}
              placeholder={SANDBOX_SECURED_PLACEHOLDER}
              className={`${INPUT_CLASS} font-mono ${!idFocused ? 'cursor-default bg-slate-50' : ''}`}
            />
            {!idFocused && (
              <p className="flex items-center gap-1 text-[10px] font-bold text-slate-800">
                <ShieldCheck className="h-3 w-3 text-emerald-700" />
                Sandbox isolation · national ID / passport strings are never persisted across testers
              </p>
            )}
          </label>
        )}
      </section>

      <button
        type="submit"
        className="w-full rounded-xl bg-slate-800 py-3 text-sm font-bold text-white hover:bg-slate-900"
      >
        Complete Registration
      </button>
    </form>
  );
}
