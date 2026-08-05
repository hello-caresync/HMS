'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';

import { ui } from '@/components/nexora-hospital/ui/primitives';
import {
  finalizeHospitalSetup,
  saveSetupWizardStep,
  type SetupWizardDraft,
} from '@/lib/nexora-hospital/services/hospital-profile';

const STEPS = [
  'Hospital Profile',
  'Departments',
  'Doctors',
  'Staff Access',
  'Billing & Tax',
  'Hours & Wards',
  'Finalize',
] as const;

const STAFF_ROLES = ['Admin', 'Receptionist', 'Nurse', 'Billing', 'Pharmacist', 'Lab Tech'] as const;
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const PAYMENT_METHODS = ['Cash', 'Card', 'UPI', 'Insurance'] as const;

const emptyDraft = (): SetupWizardDraft => ({
  hospitalName: '',
  logoUrl: '',
  address: '',
  taxGstId: '',
  licenseNumber: '',
  phone: '',
  email: '',
  emergencyLine: '',
  departments: [],
  doctors: [],
  staff: [],
  taxPercentage: 18,
  currencySymbol: '₹',
  invoicePrefix: 'INV',
  paymentMethods: ['Cash', 'UPI'],
  opdWorkingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  opdHoursStart: '08:00',
  opdHoursEnd: '20:00',
  wards: [{ name: 'General Ward', beds: 12 }],
});

type Props = { onComplete: () => void };

export function HospitalSetupWizard({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<SetupWizardDraft>(emptyDraft);

  const patch = (partial: Partial<SetupWizardDraft>) => setDraft((d) => ({ ...d, ...partial }));

  const next = async () => {
    if (step === 0 && !draft.hospitalName.trim()) {
      toast.error('Hospital name is required');
      return;
    }
    setBusy(true);
    await saveSetupWizardStep(step + 1, draft);
    setBusy(false);
    if (step < STEPS.length - 1) setStep((s) => s + 1);
  };

  const back = () => setStep((s) => Math.max(0, s - 1));

  const finish = async () => {
    setBusy(true);
    try {
      await finalizeHospitalSetup(draft);
      toast.success('Hospital setup complete — welcome to your live dashboard');
      onComplete();
    } catch {
      toast.error('Setup failed — please retry');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#004D56]/90 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#B2EBF2] bg-white shadow-2xl">
        <header className="border-b border-[#B2EBF2] bg-[#F0F8F9] px-6 py-5">
          <p className="text-sm font-bold uppercase tracking-wider text-[#007B8A]">First-Time Setup</p>
          <h1 className="mt-1 text-2xl font-extrabold text-[#0A2E36]">Configure Your Hospital</h1>
          <div className="mt-4 flex flex-wrap gap-2">
            {STEPS.map((label, i) => (
              <span
                key={label}
                className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
                  i === step
                    ? 'bg-[#007B8A] text-white'
                    : i < step
                      ? 'bg-[#A8D5BA] text-[#0A2E36]'
                      : 'bg-[#E0F7FA] text-[#005F6B]'
                }`}
              >
                {i < step ? <Check className="h-3 w-3" /> : null}
                {i + 1}. {label}
              </span>
            ))}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {step === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className={ui.label}>Hospital Name *</span>
                <input className={`${ui.input} mt-1`} value={draft.hospitalName} onChange={(e) => patch({ hospitalName: e.target.value })} />
              </label>
              <label className="sm:col-span-2">
                <span className={ui.label}>Logo URL</span>
                <input className={`${ui.input} mt-1`} value={draft.logoUrl} onChange={(e) => patch({ logoUrl: e.target.value })} placeholder="https://…" />
              </label>
              <label className="sm:col-span-2">
                <span className={ui.label}>Address</span>
                <textarea className={`${ui.input} mt-1 min-h-[80px]`} value={draft.address} onChange={(e) => patch({ address: e.target.value })} />
              </label>
              <label>
                <span className={ui.label}>Tax / GST ID</span>
                <input className={`${ui.input} mt-1`} value={draft.taxGstId} onChange={(e) => patch({ taxGstId: e.target.value })} />
              </label>
              <label>
                <span className={ui.label}>License Number</span>
                <input className={`${ui.input} mt-1`} value={draft.licenseNumber} onChange={(e) => patch({ licenseNumber: e.target.value })} />
              </label>
              <label>
                <span className={ui.label}>Phone</span>
                <input className={`${ui.input} mt-1`} value={draft.phone} onChange={(e) => patch({ phone: e.target.value })} />
              </label>
              <label>
                <span className={ui.label}>Email</span>
                <input className={`${ui.input} mt-1`} type="email" value={draft.email} onChange={(e) => patch({ email: e.target.value })} />
              </label>
              <label className="sm:col-span-2">
                <span className={ui.label}>Emergency Line</span>
                <input className={`${ui.input} mt-1`} value={draft.emergencyLine} onChange={(e) => patch({ emergencyLine: e.target.value })} />
              </label>
            </div>
          )}

          {step === 1 && (
            <DepartmentStep
              departments={draft.departments}
              onChange={(departments) => patch({ departments })}
            />
          )}

          {step === 2 && (
            <DoctorStep doctors={draft.doctors} departments={draft.departments} onChange={(doctors) => patch({ doctors })} />
          )}

          {step === 3 && (
            <StaffStep staff={draft.staff} onChange={(staff) => patch({ staff })} />
          )}

          {step === 4 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className={ui.label}>Tax Percentage (%)</span>
                <input className={`${ui.input} mt-1`} type="number" value={draft.taxPercentage} onChange={(e) => patch({ taxPercentage: Number(e.target.value) })} />
              </label>
              <label>
                <span className={ui.label}>Currency Symbol</span>
                <input className={`${ui.input} mt-1`} value={draft.currencySymbol} onChange={(e) => patch({ currencySymbol: e.target.value })} />
              </label>
              <label>
                <span className={ui.label}>Invoice Prefix</span>
                <input className={`${ui.input} mt-1`} value={draft.invoicePrefix} onChange={(e) => patch({ invoicePrefix: e.target.value })} />
              </label>
              <div className="sm:col-span-2">
                <span className={ui.label}>Default Payment Methods</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={draft.paymentMethods.includes(m) ? ui.btnPrimary : ui.btnSecondary}
                      onClick={() =>
                        patch({
                          paymentMethods: draft.paymentMethods.includes(m)
                            ? draft.paymentMethods.filter((x) => x !== m)
                            : [...draft.paymentMethods, m],
                        })
                      }
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <WardStep draft={draft} patch={patch} />
          )}

          {step === 6 && (
            <div className="space-y-4">
              <p className="text-base text-[#005F6B]">
                Review your configuration. Clicking <strong>Launch Dashboard</strong> will mark setup complete and seed core tables.
              </p>
              <ul className="space-y-2 rounded-xl border border-[#B2EBF2] bg-[#FAFDFF] p-4 text-sm">
                <li><strong>Hospital:</strong> {draft.hospitalName || '—'}</li>
                <li><strong>Departments:</strong> {draft.departments.length || 0}</li>
                <li><strong>Doctors:</strong> {draft.doctors.length}</li>
                <li><strong>Staff:</strong> {draft.staff.length}</li>
                <li><strong>Tax:</strong> {draft.taxPercentage}% · {draft.currencySymbol} · {draft.invoicePrefix}-*</li>
                <li><strong>OPD Hours:</strong> {draft.opdHoursStart} – {draft.opdHoursEnd}</li>
                <li><strong>Wards:</strong> {draft.wards.map((w) => `${w.name} (${w.beds} beds)`).join(', ')}</li>
              </ul>
            </div>
          )}
        </div>

        <footer className="flex items-center justify-between border-t border-[#B2EBF2] px-6 py-4">
          <button type="button" className={ui.btnSecondary} disabled={step === 0 || busy} onClick={back}>
            <ChevronLeft className="mr-1 inline h-4 w-4" /> Back
          </button>
          {step < STEPS.length - 1 ? (
            <button type="button" className={ui.btnPrimary} disabled={busy} onClick={() => void next()}>
              {busy ? 'Saving…' : 'Continue'} <ChevronRight className="ml-1 inline h-4 w-4" />
            </button>
          ) : (
            <button type="button" className={ui.btnPrimary} disabled={busy} onClick={() => void finish()}>
              {busy ? 'Launching…' : 'Launch Dashboard'}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}

function DepartmentStep({
  departments,
  onChange,
}: {
  departments: string[];
  onChange: (d: string[]) => void;
}) {
  const [name, setName] = useState('');
  return (
    <div>
      <p className="mb-4 text-sm text-[#005F6B]">Add all clinical and administrative departments.</p>
      <div className="flex gap-2">
        <input className={ui.input} placeholder="e.g. Cardiology" value={name} onChange={(e) => setName(e.target.value)} />
        <button
          type="button"
          className={ui.btnPrimary}
          onClick={() => {
            const n = name.trim();
            if (!n) return;
            onChange([...departments, n]);
            setName('');
          }}
        >
          Add
        </button>
      </div>
      <ul className="mt-4 flex flex-wrap gap-2">
        {departments.map((d) => (
          <li key={d} className="flex items-center gap-2 rounded-full bg-[#E0F7FA] px-3 py-1 text-sm font-bold text-[#0A2E36]">
            {d}
            <button type="button" className="text-[#007B8A]" onClick={() => onChange(departments.filter((x) => x !== d))}>×</button>
          </li>
        ))}
      </ul>
      {departments.length === 0 && <p className="mt-4 text-sm text-[#005F6B]">No departments yet — add at least one.</p>}
    </div>
  );
}

function DoctorStep({
  doctors,
  departments,
  onChange,
}: {
  doctors: SetupWizardDraft['doctors'];
  departments: string[];
  onChange: (d: SetupWizardDraft['doctors']) => void;
}) {
  const [form, setForm] = useState({
    fullName: '',
    department: departments[0] ?? '',
    licenseNo: '',
    consultationFee: 800,
    slotStart: '09:00',
    slotEnd: '17:00',
  });

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        <input className={ui.input} placeholder="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        <select className={ui.select} value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
          <option value="">Department</option>
          {departments.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <input className={ui.input} placeholder="License No." value={form.licenseNo} onChange={(e) => setForm({ ...form, licenseNo: e.target.value })} />
        <input className={ui.input} type="number" placeholder="Consultation fee" value={form.consultationFee} onChange={(e) => setForm({ ...form, consultationFee: Number(e.target.value) })} />
        <input className={ui.input} type="time" value={form.slotStart} onChange={(e) => setForm({ ...form, slotStart: e.target.value })} />
        <input className={ui.input} type="time" value={form.slotEnd} onChange={(e) => setForm({ ...form, slotEnd: e.target.value })} />
      </div>
      <button
        type="button"
        className={`${ui.btnPrimary} mt-4`}
        onClick={() => {
          if (!form.fullName.trim()) return;
          onChange([...doctors, { ...form }]);
          setForm({ ...form, fullName: '', licenseNo: '' });
        }}
      >
        + Add Doctor
      </button>
      <ul className="mt-4 space-y-2">
        {doctors.map((d, i) => (
          <li key={i} className="rounded-xl border border-[#B2EBF2] p-3 text-sm">
            <strong>{d.fullName}</strong> · {d.department} · ₹{d.consultationFee} · {d.slotStart}–{d.slotEnd}
          </li>
        ))}
      </ul>
    </div>
  );
}

function StaffStep({
  staff,
  onChange,
}: {
  staff: SetupWizardDraft['staff'];
  onChange: (s: SetupWizardDraft['staff']) => void;
}) {
  const [form, setForm] = useState({ fullName: '', role: STAFF_ROLES[0], email: '' });
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-3">
        <input className={ui.input} placeholder="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        <select className={ui.select} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as typeof STAFF_ROLES[number] })}>
          {STAFF_ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <input className={ui.input} type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      </div>
      <button
        type="button"
        className={`${ui.btnPrimary} mt-4`}
        onClick={() => {
          if (!form.fullName.trim()) return;
          onChange([...staff, { ...form }]);
          setForm({ fullName: '', role: STAFF_ROLES[0], email: '' });
        }}
      >
        + Add Staff Member
      </button>
      <ul className="mt-4 space-y-2">
        {staff.map((s, i) => (
          <li key={i} className="rounded-xl border border-[#B2EBF2] p-3 text-sm">
            <strong>{s.fullName}</strong> · {s.role} · {s.email || 'no email'}
          </li>
        ))}
      </ul>
    </div>
  );
}

function WardStep({
  draft,
  patch,
}: {
  draft: SetupWizardDraft;
  patch: (p: Partial<SetupWizardDraft>) => void;
}) {
  const [wardName, setWardName] = useState('');
  const [beds, setBeds] = useState(12);

  return (
    <div className="space-y-6">
      <div>
        <span className={ui.label}>OPD Working Days</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {WEEKDAYS.map((d) => (
            <button
              key={d}
              type="button"
              className={draft.opdWorkingDays.includes(d) ? ui.btnPrimary : ui.btnSecondary}
              onClick={() =>
                patch({
                  opdWorkingDays: draft.opdWorkingDays.includes(d)
                    ? draft.opdWorkingDays.filter((x) => x !== d)
                    : [...draft.opdWorkingDays, d],
                })
              }
            >
              {d}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className={ui.label}>OPD Start</span>
          <input className={`${ui.input} mt-1`} type="time" value={draft.opdHoursStart} onChange={(e) => patch({ opdHoursStart: e.target.value })} />
        </label>
        <label>
          <span className={ui.label}>OPD End</span>
          <input className={`${ui.input} mt-1`} type="time" value={draft.opdHoursEnd} onChange={(e) => patch({ opdHoursEnd: e.target.value })} />
        </label>
      </div>
      <div>
        <span className={ui.label}>Ward / Bed Matrix</span>
        <div className="mt-2 flex flex-wrap gap-2">
          <input className={ui.input} placeholder="Ward name" value={wardName} onChange={(e) => setWardName(e.target.value)} />
          <input className={`${ui.input} w-24`} type="number" min={1} value={beds} onChange={(e) => setBeds(Number(e.target.value))} />
          <button
            type="button"
            className={ui.btnPrimary}
            onClick={() => {
              const n = wardName.trim();
              if (!n) return;
              patch({ wards: [...draft.wards, { name: n, beds }] });
              setWardName('');
            }}
          >
            Add Ward
          </button>
        </div>
        <ul className="mt-3 space-y-2">
          {draft.wards.map((w, i) => (
            <li key={i} className="text-sm font-medium text-[#0A2E36]">
              {w.name} — {w.beds} beds
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
