'use client';

import { useMemo, useState } from 'react';
import { Building2, Heart, Siren, Users } from 'lucide-react';

import type { RegistrationChannel } from '../patientsNav.types';
import {
  CollapsibleSection,
  FieldLabel,
  inputClass,
  PatientPanel,
  SecureMaskedField,
  SecureVerificationRow,
  VerifiedPill,
} from '../components/patientsUi';

type FormState = {
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  emergencyName: string;
  emergencyPhone: string;
  corporateId: string;
  corporateName: string;
  primaryMemberUhid: string;
  relationship: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const CHANNEL_TABS: { id: RegistrationChannel; label: string; icon: typeof Users }[] = [
  { id: 'walk-in', label: 'Walk-in', icon: Users },
  { id: 'emergency', label: 'Emergency', icon: Siren },
  { id: 'corporate', label: 'Corporate', icon: Building2 },
  { id: 'family', label: 'Family Dependent', icon: Heart },
];

const EMPTY_FORM: FormState = {
  firstName: '',
  lastName: '',
  dob: '',
  gender: 'Male',
  phone: '',
  email: '',
  address: '',
  emergencyName: '',
  emergencyPhone: '',
  corporateId: '',
  corporateName: '',
  primaryMemberUhid: '',
  relationship: 'Spouse',
};

function validate(channel: RegistrationChannel, form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.firstName.trim()) errors.firstName = 'First name is required';
  if (!form.lastName.trim()) errors.lastName = 'Last name is required';
  if (!form.dob) errors.dob = 'Date of birth is required';
  if (!form.phone.trim()) errors.phone = 'Phone number is required';
  if (!form.address.trim()) errors.address = 'Address is required';
  if (!form.emergencyName.trim()) errors.emergencyName = 'Emergency contact name is required';
  if (!form.emergencyPhone.trim()) errors.emergencyPhone = 'Emergency contact phone is required';
  if (channel === 'corporate') {
    if (!form.corporateId.trim()) errors.corporateId = 'Corporate employee ID is required';
    if (!form.corporateName.trim()) errors.corporateName = 'Corporate account name is required';
  }
  if (channel === 'family') {
    if (!form.primaryMemberUhid.trim()) errors.primaryMemberUhid = 'Primary member UHID is required';
  }
  return errors;
}

export default function PatientRegistrationWorkspaceView() {
  const [channel, setChannel] = useState<RegistrationChannel>('walk-in');
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState<{ uhid: string } | null>(null);
  const [sections, setSections] = useState({ identity: true, demographics: true, emergency: true });

  const toggleSection = (key: keyof typeof sections) =>
    setSections((s) => ({ ...s, [key]: !s[key] }));

  const update = (key: keyof FormState, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors = validate(channel, form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    const seq = Math.floor(100000 + Math.random() * 900000);
    setSubmitted({ uhid: `NX-2026-${seq}` });
  };

  const channelLabel = useMemo(() => CHANNEL_TABS.find((t) => t.id === channel)?.label ?? '', [channel]);

  return (
    <div className="space-y-2">
      <div>
        <h2 className="text-sm font-bold text-[#0F172A]">Patient Registration</h2>
        <p className="text-[10px] text-slate-500">{channelLabel} intake · demographics · identity verification</p>
      </div>

      <div className="flex flex-wrap gap-1 rounded-md border border-slate-200 bg-slate-50 p-0.5">
        {CHANNEL_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => { setChannel(id); setErrors({}); setSubmitted(null); }}
            className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide transition-colors ${
              channel === id ? 'bg-[#0F172A] text-white' : 'text-slate-600 hover:bg-white'
            }`}
          >
            <Icon className="h-3 w-3" />
            {label}
          </button>
        ))}
      </div>

      {submitted && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-800">
          Registration complete · UHID assigned:{' '}
          <span className="font-mono">{submitted.uhid}</span>
          <VerifiedPill label="EHR Chart Created" />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-2" noValidate>
        <CollapsibleSection
          title="Identity Verification (Secure)"
          open={sections.identity}
          onToggle={() => toggleSection('identity')}
          badge={<VerifiedPill label="KYC Ready" />}
        >
          <div className="space-y-2">
            <SecureMaskedField label="Aadhaar / National ID" verified docType="Aadhaar" />
            <SecureMaskedField label="Passport / Travel Document" docType="Passport" />
            <SecureVerificationRow
              items={[
                { label: 'Aadhaar e-KYC', verified: true },
                { label: 'Passport MRZ Scan', verified: false },
                { label: 'Photo ID Match', verified: true },
                { label: 'Address Proof', verified: true },
              ]}
            />
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Demographics"
          open={sections.demographics}
          onToggle={() => toggleSection('demographics')}
        >
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <FieldLabel required error={errors.firstName}>First Name</FieldLabel>
              <input className={inputClass(!!errors.firstName)} value={form.firstName} onChange={(e) => update('firstName', e.target.value)} />
            </div>
            <div>
              <FieldLabel required error={errors.lastName}>Last Name</FieldLabel>
              <input className={inputClass(!!errors.lastName)} value={form.lastName} onChange={(e) => update('lastName', e.target.value)} />
            </div>
            <div>
              <FieldLabel required error={errors.dob}>Date of Birth</FieldLabel>
              <input type="date" className={inputClass(!!errors.dob)} value={form.dob} onChange={(e) => update('dob', e.target.value)} />
            </div>
            <div>
              <FieldLabel required>Gender</FieldLabel>
              <select className={inputClass()} value={form.gender} onChange={(e) => update('gender', e.target.value)}>
                {['Male', 'Female', 'Other', 'Prefer not to say'].map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel required error={errors.phone}>Mobile Phone</FieldLabel>
              <input className={inputClass(!!errors.phone)} value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+91 XXXXX XXXXX" />
            </div>
            <div>
              <FieldLabel>Email</FieldLabel>
              <input type="email" className={inputClass()} value={form.email} onChange={(e) => update('email', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel required error={errors.address}>Residential Address</FieldLabel>
              <textarea className={`${inputClass(!!errors.address)} min-h-[52px]`} value={form.address} onChange={(e) => update('address', e.target.value)} />
            </div>
          </div>
        </CollapsibleSection>

        {channel === 'corporate' && (
          <PatientPanel title="Corporate Enrollment" icon={Building2}>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <FieldLabel required error={errors.corporateId}>Employee ID</FieldLabel>
                <input className={inputClass(!!errors.corporateId)} value={form.corporateId} onChange={(e) => update('corporateId', e.target.value)} />
              </div>
              <div>
                <FieldLabel required error={errors.corporateName}>Corporate Account</FieldLabel>
                <input className={inputClass(!!errors.corporateName)} value={form.corporateName} onChange={(e) => update('corporateName', e.target.value)} placeholder="e.g. Infosys Health Plan" />
              </div>
            </div>
          </PatientPanel>
        )}

        {channel === 'family' && (
          <PatientPanel title="Family Dependent Linkage" icon={Heart}>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <FieldLabel required error={errors.primaryMemberUhid}>Primary Member UHID</FieldLabel>
                <input className={inputClass(!!errors.primaryMemberUhid)} value={form.primaryMemberUhid} onChange={(e) => update('primaryMemberUhid', e.target.value)} placeholder="NX-2026-XXXXXX" />
              </div>
              <div>
                <FieldLabel required>Relationship</FieldLabel>
                <select className={inputClass()} value={form.relationship} onChange={(e) => update('relationship', e.target.value)}>
                  {['Spouse', 'Child', 'Parent', 'Sibling'].map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>
          </PatientPanel>
        )}

        {channel === 'emergency' && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[10px] font-semibold text-red-800">
            Emergency fast-track enabled — identity verification can be completed post-stabilization within 24 hours.
          </div>
        )}

        <CollapsibleSection
          title="Emergency Contact"
          open={sections.emergency}
          onToggle={() => toggleSection('emergency')}
        >
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <FieldLabel required error={errors.emergencyName}>Contact Name</FieldLabel>
              <input className={inputClass(!!errors.emergencyName)} value={form.emergencyName} onChange={(e) => update('emergencyName', e.target.value)} />
            </div>
            <div>
              <FieldLabel required error={errors.emergencyPhone}>Contact Phone</FieldLabel>
              <input className={inputClass(!!errors.emergencyPhone)} value={form.emergencyPhone} onChange={(e) => update('emergencyPhone', e.target.value)} />
            </div>
          </div>
        </CollapsibleSection>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={() => { setForm(EMPTY_FORM); setErrors({}); setSubmitted(null); }}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-50"
          >
            Reset Form
          </button>
          <button
            type="submit"
            className="rounded-md bg-[#2563EB] px-4 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white hover:bg-blue-700"
          >
            Register &amp; Assign UHID
          </button>
        </div>
      </form>
    </div>
  );
}
