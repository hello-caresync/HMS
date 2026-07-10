'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Hash } from 'lucide-react';

import { usePatientRegistry } from '../context/PatientRegistryProvider';
import { generateStandardUhid } from '../lib/uhid';
import {
  BILLING_TYPES,
  BLOOD_GROUPS,
  GENDERS,
  INDIAN_STATES,
  type BillingType,
  type BloodGroup,
  type DemographicsFormData,
  type EmergencyAddressFormData,
  type Gender,
  type InsuranceFormData,
} from '../types';
import { inputCls, RegField, selectCls } from './shared/RegField';

const STEPS = [
  { id: 1, label: 'Demographics' },
  { id: 2, label: 'Emergency & Address' },
  { id: 3, label: 'Insurance & Corporate' },
] as const;

const EMPTY_DEMO: DemographicsFormData = {
  firstName: '',
  lastName: '',
  dob: '',
  gender: 'Male',
  bloodGroup: 'Unknown',
  nationalIdOptional: '',
  phone: '',
  email: '',
};

const EMPTY_EMERGENCY: EmergencyAddressFormData = {
  contactName: '',
  relationship: '',
  emergencyPhone: '',
  street: '',
  city: '',
  state: INDIAN_STATES[0],
  zipCode: '',
};

const EMPTY_INSURANCE: InsuranceFormData = {
  billingType: 'Self',
  providerName: '',
  policyNumber: '',
  corporateGroupCode: '',
  validityDate: '',
};

type PatientRegistrationWizardProps = {
  onComplete?: (uhid: string) => void;
};

export default function PatientRegistrationWizard({ onComplete }: PatientRegistrationWizardProps) {
  const { registerFullPatient } = usePatientRegistry();
  const [step, setStep] = useState(1);
  const [previewUhid] = useState(() => generateStandardUhid());
  const [demographics, setDemographics] = useState<DemographicsFormData>(EMPTY_DEMO);
  const [emergencyAddress, setEmergencyAddress] = useState<EmergencyAddressFormData>(EMPTY_EMERGENCY);
  const [insurance, setInsurance] = useState<InsuranceFormData>(EMPTY_INSURANCE);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successUhid, setSuccessUhid] = useState<string | null>(null);

  const validateStep = (s: number): boolean => {
    const next: Record<string, string> = {};

    if (s === 1) {
      if (!demographics.firstName.trim()) next.firstName = 'First name is required';
      if (!demographics.lastName.trim()) next.lastName = 'Last name is required';
      if (!demographics.dob) next.dob = 'Date of birth is required';
      if (!demographics.phone.trim()) next.phone = 'Phone number is required';
      else if (demographics.phone.replace(/\D/g, '').length < 10) {
        next.phone = 'Enter a valid 10-digit mobile number';
      }
      if (demographics.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(demographics.email)) {
        next.email = 'Invalid email format';
      }
    }

    if (s === 2) {
      if (!emergencyAddress.contactName.trim()) next.contactName = 'Emergency contact name required';
      if (!emergencyAddress.relationship.trim()) next.relationship = 'Relationship required';
      if (!emergencyAddress.emergencyPhone.trim()) next.emergencyPhone = 'Emergency phone required';
      if (!emergencyAddress.street.trim()) next.street = 'Street address required';
      if (!emergencyAddress.city.trim()) next.city = 'City required';
      if (!emergencyAddress.zipCode.trim()) next.zipCode = 'PIN / ZIP required';
    }

    if (s === 3) {
      if (insurance.billingType === 'Insurance') {
        if (!insurance.providerName.trim()) next.providerName = 'Insurance provider required';
        if (!insurance.policyNumber.trim()) next.policyNumber = 'Policy number required';
      }
      if (insurance.billingType === 'Corporate') {
        if (!insurance.corporateGroupCode.trim()) next.corporateGroupCode = 'Corporate group code required';
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(3, s + 1));
  };

  const goBack = () => {
    setErrors({});
    setStep((s) => Math.max(1, s - 1));
  };

  const handleSubmit = () => {
    if (!validateStep(3)) return;
    const record = registerFullPatient(demographics, emergencyAddress, insurance, previewUhid);
    setSuccessUhid(record.profile.uhid);
    onComplete?.(record.profile.uhid);
  };

  const showInsuranceFields = insurance.billingType === 'Insurance';
  const showCorporateFields = insurance.billingType === 'Corporate';

  const stepComplete = useMemo(
    () => ({
      1: Boolean(demographics.firstName && demographics.lastName && demographics.dob && demographics.phone),
      2: Boolean(emergencyAddress.contactName && emergencyAddress.emergencyPhone && emergencyAddress.city),
      3: true,
    }),
    [demographics, emergencyAddress],
  );

  if (successUhid) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white">
          <Check className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-emerald-900">Patient Registered</h3>
        <p className="mt-1 font-mono text-lg font-bold text-emerald-800">{successUhid}</p>
        <p className="mt-2 text-xs text-emerald-700">
          {demographics.firstName} {demographics.lastName} · {insurance.billingType} billing
        </p>
        <button
          type="button"
          onClick={() => {
            setSuccessUhid(null);
            setStep(1);
            setDemographics(EMPTY_DEMO);
            setEmergencyAddress(EMPTY_EMERGENCY);
            setInsurance(EMPTY_INSURANCE);
            setErrors({});
          }}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-hover"
        >
          Register Another Patient
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-xs">
      {/* Stepper header */}
      <div className="border-b-2 border-slate-200 px-4 py-3 sm:px-5">
        <div className="flex items-center justify-between gap-2">
          {STEPS.map((s, i) => {
            const active = step === s.id;
            const done = step > s.id || (step === s.id && stepComplete[s.id as 1 | 2 | 3]);
            return (
              <div key={s.id} className="flex flex-1 items-center gap-2">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                    active
                      ? 'bg-primary text-white'
                      : done
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  {step > s.id ? <Check className="h-3.5 w-3.5" /> : s.id}
                </div>
                <span
                  className={`hidden text-[11px] font-semibold sm:block ${
                    active ? 'text-slate-900' : 'text-slate-800'
                  }`}
                >
                  {s.label}
                </span>
                {i < STEPS.length - 1 && (
                  <div className={`mx-1 hidden h-px flex-1 sm:block ${step > s.id ? 'bg-primary' : 'bg-slate-200'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {/* Step 1: Demographics */}
        {step === 1 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg bg-primary-muted/50 px-3 py-2 ring-1 ring-primary/20">
              <Hash className="h-4 w-4 text-primary" />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">Assigned UHID</p>
                <p className="font-mono text-sm font-bold text-slate-900">{previewUhid}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <RegField label="First Name" htmlFor="p-fn" required error={errors.firstName}>
                <input
                  id="p-fn"
                  value={demographics.firstName}
                  onChange={(e) => setDemographics({ ...demographics, firstName: e.target.value })}
                  className={inputCls(Boolean(errors.firstName))}
                />
              </RegField>
              <RegField label="Last Name" htmlFor="p-ln" required error={errors.lastName}>
                <input
                  id="p-ln"
                  value={demographics.lastName}
                  onChange={(e) => setDemographics({ ...demographics, lastName: e.target.value })}
                  className={inputCls(Boolean(errors.lastName))}
                />
              </RegField>
              <RegField label="Date of Birth" htmlFor="p-dob" required error={errors.dob}>
                <input
                  id="p-dob"
                  type="date"
                  value={demographics.dob}
                  onChange={(e) => setDemographics({ ...demographics, dob: e.target.value })}
                  className={inputCls(Boolean(errors.dob))}
                />
              </RegField>
              <RegField label="Gender" htmlFor="p-gender" required>
                <select
                  id="p-gender"
                  value={demographics.gender}
                  onChange={(e) =>
                    setDemographics({ ...demographics, gender: e.target.value as Gender })
                  }
                  className={selectCls()}
                >
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </RegField>
              <RegField label="Blood Group" htmlFor="p-bg">
                <select
                  id="p-bg"
                  value={demographics.bloodGroup}
                  onChange={(e) =>
                    setDemographics({ ...demographics, bloodGroup: e.target.value as BloodGroup })
                  }
                  className={selectCls()}
                >
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </RegField>
              <RegField
                label="National ID / Aadhaar"
                htmlFor="p-nid"
                hint="Optional · last 4 digits masked in reports"
              >
                <input
                  id="p-nid"
                  value={demographics.nationalIdOptional}
                  onChange={(e) =>
                    setDemographics({ ...demographics, nationalIdOptional: e.target.value })
                  }
                  className={inputCls()}
                  placeholder="XXXX-XXXX-9012"
                />
              </RegField>
              <RegField label="Phone" htmlFor="p-phone" required error={errors.phone}>
                <input
                  id="p-phone"
                  type="tel"
                  value={demographics.phone}
                  onChange={(e) => setDemographics({ ...demographics, phone: e.target.value })}
                  className={inputCls(Boolean(errors.phone))}
                  placeholder="+91 98765 43210"
                />
              </RegField>
              <RegField label="Email" htmlFor="p-email" error={errors.email}>
                <input
                  id="p-email"
                  type="email"
                  value={demographics.email}
                  onChange={(e) => setDemographics({ ...demographics, email: e.target.value })}
                  className={inputCls(Boolean(errors.email))}
                  placeholder="patient@email.com"
                />
              </RegField>
            </div>
          </div>
        )}

        {/* Step 2: Emergency & Address */}
        {step === 2 && (
          <div className="space-y-4">
            <fieldset className="rounded-lg border border-slate-200 p-3">
              <legend className="px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-800">
                Emergency Contact
              </legend>
              <div className="mt-2 grid gap-3 sm:grid-cols-3">
                <RegField label="Contact Name" htmlFor="e-name" required error={errors.contactName}>
                  <input
                    id="e-name"
                    value={emergencyAddress.contactName}
                    onChange={(e) =>
                      setEmergencyAddress({ ...emergencyAddress, contactName: e.target.value })
                    }
                    className={inputCls(Boolean(errors.contactName))}
                  />
                </RegField>
                <RegField label="Relationship" htmlFor="e-rel" required error={errors.relationship}>
                  <input
                    id="e-rel"
                    value={emergencyAddress.relationship}
                    onChange={(e) =>
                      setEmergencyAddress({ ...emergencyAddress, relationship: e.target.value })
                    }
                    className={inputCls(Boolean(errors.relationship))}
                    placeholder="Spouse, Parent…"
                  />
                </RegField>
                <RegField label="Phone" htmlFor="e-phone" required error={errors.emergencyPhone}>
                  <input
                    id="e-phone"
                    type="tel"
                    value={emergencyAddress.emergencyPhone}
                    onChange={(e) =>
                      setEmergencyAddress({ ...emergencyAddress, emergencyPhone: e.target.value })
                    }
                    className={inputCls(Boolean(errors.emergencyPhone))}
                  />
                </RegField>
              </div>
            </fieldset>

            <fieldset className="rounded-lg border border-slate-200 p-3">
              <legend className="px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-800">
                Residential Address
              </legend>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <RegField label="Street" htmlFor="a-street" required error={errors.street} className="sm:col-span-2">
                  <input
                    id="a-street"
                    value={emergencyAddress.street}
                    onChange={(e) =>
                      setEmergencyAddress({ ...emergencyAddress, street: e.target.value })
                    }
                    className={inputCls(Boolean(errors.street))}
                  />
                </RegField>
                <RegField label="City" htmlFor="a-city" required error={errors.city}>
                  <input
                    id="a-city"
                    value={emergencyAddress.city}
                    onChange={(e) =>
                      setEmergencyAddress({ ...emergencyAddress, city: e.target.value })
                    }
                    className={inputCls(Boolean(errors.city))}
                  />
                </RegField>
                <RegField label="State" htmlFor="a-state" required>
                  <select
                    id="a-state"
                    value={emergencyAddress.state}
                    onChange={(e) =>
                      setEmergencyAddress({ ...emergencyAddress, state: e.target.value })
                    }
                    className={selectCls()}
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </RegField>
                <RegField label="PIN / ZIP" htmlFor="a-zip" required error={errors.zipCode}>
                  <input
                    id="a-zip"
                    value={emergencyAddress.zipCode}
                    onChange={(e) =>
                      setEmergencyAddress({
                        ...emergencyAddress,
                        zipCode: e.target.value.replace(/\D/g, '').slice(0, 6),
                      })
                    }
                    className={`${inputCls(Boolean(errors.zipCode))} font-mono`}
                    placeholder="560034"
                  />
                </RegField>
              </div>
            </fieldset>
          </div>
        )}

        {/* Step 3: Insurance & Corporate */}
        {step === 3 && (
          <div className="space-y-3">
            <RegField label="Billing Type" htmlFor="i-type" required>
              <select
                id="i-type"
                value={insurance.billingType}
                onChange={(e) =>
                  setInsurance({ ...insurance, billingType: e.target.value as BillingType })
                }
                className={selectCls()}
              >
                {BILLING_TYPES.map((bt) => (
                  <option key={bt} value={bt}>
                    {bt}
                  </option>
                ))}
              </select>
            </RegField>

            {showInsuranceFields && (
              <div className="grid gap-3 sm:grid-cols-2">
                <RegField label="Insurance Provider" htmlFor="i-prov" required error={errors.providerName}>
                  <input
                    id="i-prov"
                    value={insurance.providerName}
                    onChange={(e) =>
                      setInsurance({ ...insurance, providerName: e.target.value })
                    }
                    className={inputCls(Boolean(errors.providerName))}
                    placeholder="Star Health, ICICI Lombard…"
                  />
                </RegField>
                <RegField label="Policy Number" htmlFor="i-pol" required error={errors.policyNumber}>
                  <input
                    id="i-pol"
                    value={insurance.policyNumber}
                    onChange={(e) =>
                      setInsurance({ ...insurance, policyNumber: e.target.value })
                    }
                    className={`${inputCls(Boolean(errors.policyNumber))} font-mono`}
                  />
                </RegField>
                <RegField label="Validity Date" htmlFor="i-val">
                  <input
                    id="i-val"
                    type="date"
                    value={insurance.validityDate}
                    onChange={(e) =>
                      setInsurance({ ...insurance, validityDate: e.target.value })
                    }
                    className={inputCls()}
                  />
                </RegField>
              </div>
            )}

            {showCorporateFields && (
              <div className="grid gap-3 sm:grid-cols-2">
                <RegField
                  label="Corporate Group Code"
                  htmlFor="i-corp"
                  required
                  error={errors.corporateGroupCode}
                >
                  <input
                    id="i-corp"
                    value={insurance.corporateGroupCode}
                    onChange={(e) =>
                      setInsurance({ ...insurance, corporateGroupCode: e.target.value })
                    }
                    className={`${inputCls(Boolean(errors.corporateGroupCode))} font-mono uppercase`}
                    placeholder="TCS-GRP-09"
                  />
                </RegField>
                <RegField label="Policy / Emp. ID" htmlFor="i-corp-pol">
                  <input
                    id="i-corp-pol"
                    value={insurance.policyNumber}
                    onChange={(e) =>
                      setInsurance({ ...insurance, policyNumber: e.target.value })
                    }
                    className={inputCls()}
                  />
                </RegField>
              </div>
            )}

            {insurance.billingType === 'Self' && (
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-800">
                Self-pay billing — no insurance or corporate linkage required.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 sm:px-5">
        <button
          type="button"
          onClick={goBack}
          disabled={step === 1}
          className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-100 disabled:opacity-40"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back
        </button>
        {step < 3 ? (
          <button
            type="button"
            onClick={goNext}
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover"
          >
            Continue
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            <Check className="h-3.5 w-3.5" />
            Register Patient
          </button>
        )}
      </div>
    </div>
  );
}
