'use client';

import { Loader2, MapPin, Save, ShieldAlert, User, X } from 'lucide-react';

import { FamilyMembersBlock } from '@/components/patient/FamilyMembersBlock';
import {
  blockNonDigitPhoneKey,
  sanitizePhoneDigits,
} from '@/lib/hospital/indian-patient';
import { BLOOD_GROUPS, normalizeBloodGroup } from '@/lib/patient/blood-groups';
import type { FamilyMember } from '@/lib/patient/family-members';
import type { PatientProfileState } from '@/lib/patient/patient-profile-page';

const cardClass = 'rounded-xl border border-[#EADBCE] bg-white p-4 shadow-xs space-y-3';
const inputClass =
  'w-full rounded-lg border border-[#EADBCE] bg-white px-3 py-2 text-xs font-medium text-[#2B1810] focus:border-[#8C5A3C] focus:outline-none focus:ring-2 focus:ring-[#8C5A3C]/20';
const verifiedInputClass =
  'w-full cursor-not-allowed rounded-xl border border-[#EADBCE] bg-[#FAF6F0]/80 px-3 py-2 text-xs font-semibold text-stone-700';

function displayValue(value: string, fallback = '—'): string {
  return value.trim() ? value.trim() : fallback;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#7C5C48]">
      {children}
    </label>
  );
}

function VerifiedFieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#7C5C48]">
      {children}{' '}
      <span className="text-[10px] font-normal normal-case text-stone-400">(Registered)</span>
    </label>
  );
}

function ReadonlyField({ value, fallback = 'Not provided' }: { value: string; fallback?: string }) {
  return (
    <p className="rounded-lg bg-[#FAF6F0] px-3 py-2 text-xs font-medium text-[#2B1810]">
      {displayValue(value, fallback)}
    </p>
  );
}

function SectionTitle({
  icon: Icon,
  children,
}: {
  icon: typeof User;
  children: React.ReactNode;
}) {
  return (
    <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-600">
      <Icon className="h-4 w-4 text-[#8C5A3C]" aria-hidden />
      {children}
    </h2>
  );
}

export type VerifiedSessionFields = {
  name: string;
  phone: string;
  email: string;
};

export type PatientProfileFormProps = {
  profile: PatientProfileState;
  verifiedSession: VerifiedSessionFields;
  isEditing: boolean;
  isNewUser: boolean;
  saving: boolean;
  familyMembers: FamilyMember[];
  onProfileChange: (patch: Partial<PatientProfileState>) => void;
  onFamilyMembersChange: (members: FamilyMember[]) => void;
  onCancel: () => void;
  onSubmit: (event: React.FormEvent) => void;
};

export function PatientProfileForm({
  profile,
  verifiedSession,
  isEditing,
  isNewUser,
  saving,
  familyMembers,
  onProfileChange,
  onFamilyMembersChange,
  onCancel,
  onSubmit,
}: PatientProfileFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <div className={cardClass}>
          <SectionTitle icon={User}>Personal & Demographics</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <VerifiedFieldLabel>Full Name</VerifiedFieldLabel>
              <input
                type="text"
                value={verifiedSession.name}
                disabled
                readOnly
                className={verifiedInputClass}
              />
            </div>
            <div>
              <VerifiedFieldLabel>Phone Number</VerifiedFieldLabel>
              <input
                type="text"
                value={verifiedSession.phone}
                disabled
                readOnly
                className={verifiedInputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <VerifiedFieldLabel>Email Address</VerifiedFieldLabel>
              <input
                type="email"
                value={verifiedSession.email}
                disabled
                readOnly
                className={verifiedInputClass}
              />
            </div>
            <div>
              <FieldLabel>Age</FieldLabel>
              {isEditing ? (
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={profile.age}
                  onChange={(e) => onProfileChange({ age: e.target.value })}
                  placeholder="Enter age"
                  className={inputClass}
                />
              ) : (
                <ReadonlyField value={profile.age} />
              )}
            </div>
            <div>
              <FieldLabel>Gender</FieldLabel>
              {isEditing ? (
                <select
                  value={profile.gender}
                  onChange={(e) => onProfileChange({ gender: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Select gender</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              ) : (
                <ReadonlyField value={profile.gender} />
              )}
            </div>
            <div>
              <FieldLabel>Blood Group</FieldLabel>
              {isEditing ? (
                <select
                  value={normalizeBloodGroup(profile.blood_group)}
                  onChange={(e) => onProfileChange({ blood_group: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Select blood group</option>
                  {BLOOD_GROUPS.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              ) : (
                <ReadonlyField value={profile.blood_group} />
              )}
            </div>
          </div>
        </div>

        <FamilyMembersBlock
          members={familyMembers}
          onChange={onFamilyMembersChange}
          disabled={!isEditing}
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <div className={cardClass}>
          <SectionTitle icon={ShieldAlert}>Emergency Contact</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <FieldLabel>Contact Name</FieldLabel>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.emergency_contact_name}
                  onChange={(e) => onProfileChange({ emergency_contact_name: e.target.value })}
                  className={inputClass}
                />
              ) : (
                <ReadonlyField value={profile.emergency_contact_name} />
              )}
            </div>
            <div>
              <FieldLabel>Contact Phone</FieldLabel>
              {isEditing ? (
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  maxLength={10}
                  pattern="[0-9]{10}"
                  placeholder="10-digit mobile"
                  value={sanitizePhoneDigits(profile.emergency_contact_phone)}
                  onChange={(e) =>
                    onProfileChange({
                      emergency_contact_phone: sanitizePhoneDigits(e.target.value),
                    })
                  }
                  onKeyDown={blockNonDigitPhoneKey}
                  className={inputClass}
                />
              ) : (
                <ReadonlyField value={profile.emergency_contact_phone} />
              )}
            </div>
            <div>
              <FieldLabel>Relationship</FieldLabel>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.emergency_contact_relation}
                  onChange={(e) =>
                    onProfileChange({ emergency_contact_relation: e.target.value })
                  }
                  className={inputClass}
                />
              ) : (
                <ReadonlyField value={profile.emergency_contact_relation} />
              )}
            </div>
          </div>
        </div>

        <div className={cardClass}>
          <SectionTitle icon={MapPin}>Residential Address</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FieldLabel>Street Address</FieldLabel>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.address}
                  onChange={(e) => onProfileChange({ address: e.target.value })}
                  className={inputClass}
                />
              ) : (
                <ReadonlyField value={profile.address} />
              )}
            </div>
            <div>
              <FieldLabel>City</FieldLabel>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.city}
                  onChange={(e) => onProfileChange({ city: e.target.value })}
                  className={inputClass}
                />
              ) : (
                <ReadonlyField value={profile.city} />
              )}
            </div>
            <div>
              <FieldLabel>State</FieldLabel>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.state}
                  onChange={(e) => onProfileChange({ state: e.target.value })}
                  className={inputClass}
                />
              ) : (
                <ReadonlyField value={profile.state} />
              )}
            </div>
            <div>
              <FieldLabel>Postal Code</FieldLabel>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.postal_code}
                  onChange={(e) => onProfileChange({ postal_code: e.target.value })}
                  className={inputClass}
                />
              ) : (
                <ReadonlyField value={profile.postal_code} />
              )}
            </div>
          </div>
        </div>
      </div>

      {isEditing ? (
        <div className="flex items-center justify-end gap-3 border-t border-[#EADBCE] pt-3">
          {!isNewUser ? (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-[#7C5C48] transition-colors hover:bg-[#FAF6F0]"
            >
              <span className="inline-flex items-center gap-1.5">
                <X className="h-3.5 w-3.5" />
                Cancel
              </span>
            </button>
          ) : null}
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-[#8C5A3C] px-6 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#6F4E37] disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Save Profile Details
          </button>
        </div>
      ) : null}
    </form>
  );
}

export default PatientProfileForm;
