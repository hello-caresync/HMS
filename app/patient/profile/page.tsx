'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  ShieldAlert,
  MapPin,
  Stethoscope,
  Activity,
  CheckCircle2,
  Save,
  Loader2,
  Pencil,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  createEmptyPatientProfile,
  isPatientProfileIncomplete,
  loadPatientProfilePageState,
  savePatientProfilePageState,
  type PatientProfileState,
} from '@/lib/patient/patient-profile-page';
import { calculatePatientBmi } from '@/lib/patient/patients-record';
import { resolveActivePatientFormIdentity } from '@/lib/patient/portal-session';
import { supabase } from '@/lib/supabaseClient';

function displayValue(value: string, fallback = '—'): string {
  return value.trim() ? value.trim() : fallback;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1 block text-[10px] font-black uppercase text-[#227B6B]">{children}</label>
  );
}

const inputClass =
  'w-full rounded-2xl border border-[#D5E8E3] bg-white p-3.5 text-xs font-bold text-[#0E2924] focus:outline-none';
const readonlyInputClass =
  'w-full rounded-2xl border border-[#D5E8E3] bg-[#F4F8F7] p-3.5 text-xs font-bold text-[#0E2924] focus:outline-none';

export default function PatientProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<PatientProfileState | null>(null);
  const [isNewUser, setIsNewUser] = useState(true);
  const [isEditing, setIsEditing] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    const identity = resolveActivePatientFormIdentity();
    if (!identity) {
      router.replace('/patient/login');
      return;
    }

    try {
      const result = await loadPatientProfilePageState(supabase);
      if (!result) {
        router.replace('/patient/login');
        return;
      }
      setProfile(result.profile);
      setIsNewUser(result.isNewUser);
      setIsEditing(result.isNewUser);
    } catch (err) {
      console.warn('Profile load failed:', err);
      setProfile(createEmptyPatientProfile(identity));
      setIsNewUser(true);
      setIsEditing(true);
      setLoadError('Could not load your saved profile. You can complete it below.');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const updateProfile = (patch: Partial<PatientProfileState>) => {
    setProfile((current) => {
      if (!current) return current;
      const next = { ...current, ...patch };
      if ('height_cm' in patch || 'weight_kg' in patch) {
        next.bmi = calculatePatientBmi(next.height_cm, next.weight_kg);
      }
      return next;
    });
  };

  const profileIncomplete = useMemo(
    () => (profile ? isPatientProfileIncomplete(profile) : true),
    [profile],
  );

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!profile) return;

    setSaving(true);
    setSaveError(null);

    try {
      const saved = await savePatientProfilePageState(supabase, profile);
      setProfile(saved);
      setIsNewUser(false);
      setIsEditing(false);
      toast.success('Medical profile updated successfully');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !profile) {
    return (
      <div className="flex h-64 items-center justify-center rounded-3xl border border-[#D5E8E3] bg-white">
        <div className="flex items-center gap-2 text-xs font-black text-[#113831]">
          <Loader2 className="h-5 w-5 animate-spin text-[#227B6B]" />
          Loading your private profile...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 font-sans text-[#0E2924]">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#D5E8E3] pb-4">
        <div>
          <h1 className="text-2xl font-black text-[#0E2924]">Patient Profile & Vitals</h1>
          <p className="text-xs font-bold text-[#227B6B]">
            Manage your clinical identity, emergency contacts, address, medical history, and baseline vitals.
          </p>
        </div>
        {!isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-[#D5E8E3] bg-white px-4 py-2 text-xs font-black text-[#113831] shadow-sm transition hover:border-[#227B6B]"
          >
            <Pencil className="h-4 w-4 text-[#227B6B]" />
            Edit Profile
          </button>
        ) : null}
      </div>

      {isNewUser || profileIncomplete ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold text-amber-900">
          <p className="font-black uppercase tracking-wide">Incomplete Profile</p>
          <p className="mt-1">
            {isNewUser
              ? 'Welcome — only your verified name, phone, and email are pre-filled. Complete the remaining blocks and save once to activate your verified patient profile.'
              : 'Please add emergency contacts and baseline vitals so clinicians can review your records during consultation.'}
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl border border-[#227B6B]/30 bg-[#EAF5F2] p-4 text-xs font-bold text-[#113831] shadow-sm">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-[#227B6B]" />
          <span>Verified Patient Profile — your records are securely stored for Regal Hospital.</span>
        </div>
      )}

      {loadError ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold text-amber-900">
          {loadError}
        </div>
      ) : null}

      {saveError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800">
          {saveError}
        </div>
      ) : null}

      <form onSubmit={(event) => void handleSaveProfile(event)} className="space-y-8">
        <div className="space-y-4 rounded-3xl border border-[#D5E8E3] bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-base font-black text-[#0E2924]">
            <User className="h-4 w-4 text-[#227B6B]" /> 1. Personal & Demographics
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <FieldLabel>Full Name</FieldLabel>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.full_name}
                  onChange={(e) => updateProfile({ full_name: e.target.value })}
                  className={readonlyInputClass}
                />
              ) : (
                <p className="rounded-2xl bg-[#F4F8F7] p-3.5 text-xs font-bold">{displayValue(profile.full_name)}</p>
              )}
            </div>
            <div>
              <FieldLabel>Phone</FieldLabel>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.phone}
                  onChange={(e) => updateProfile({ phone: e.target.value })}
                  className={readonlyInputClass}
                />
              ) : (
                <p className="rounded-2xl bg-[#F4F8F7] p-3.5 text-xs font-bold">{displayValue(profile.phone)}</p>
              )}
            </div>
            <div>
              <FieldLabel>Email</FieldLabel>
              {isEditing ? (
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => updateProfile({ email: e.target.value })}
                  className={readonlyInputClass}
                />
              ) : (
                <p className="rounded-2xl bg-[#F4F8F7] p-3.5 text-xs font-bold">{displayValue(profile.email)}</p>
              )}
            </div>
            <div>
              <FieldLabel>Age</FieldLabel>
              {isEditing ? (
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={profile.age}
                  onChange={(e) => updateProfile({ age: e.target.value })}
                  placeholder="Enter age"
                  className={inputClass}
                />
              ) : (
                <p className="rounded-2xl bg-[#F4F8F7] p-3.5 text-xs font-bold">
                  {displayValue(profile.age, 'Not provided')}
                </p>
              )}
            </div>
            <div>
              <FieldLabel>Gender</FieldLabel>
              {isEditing ? (
                <select
                  value={profile.gender}
                  onChange={(e) => updateProfile({ gender: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Select gender</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              ) : (
                <p className="rounded-2xl bg-[#F4F8F7] p-3.5 text-xs font-bold">
                  {displayValue(profile.gender, 'Not provided')}
                </p>
              )}
            </div>
            <div>
              <FieldLabel>Blood Group</FieldLabel>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.blood_group}
                  onChange={(e) => updateProfile({ blood_group: e.target.value })}
                  placeholder="e.g. O+"
                  className={inputClass}
                />
              ) : (
                <p className="rounded-2xl bg-[#F4F8F7] p-3.5 text-xs font-bold">
                  {displayValue(profile.blood_group, 'Not provided')}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-3xl border border-[#D5E8E3] bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-base font-black text-[#0E2924]">
            <ShieldAlert className="h-4 w-4 text-[#227B6B]" /> 2. Emergency Contacts
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <FieldLabel>Contact Name</FieldLabel>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.emergency_contact_name}
                  onChange={(e) => updateProfile({ emergency_contact_name: e.target.value })}
                  placeholder="Emergency contact name"
                  className={inputClass}
                />
              ) : (
                <p className="rounded-2xl bg-[#F4F8F7] p-3.5 text-xs font-bold">
                  {displayValue(profile.emergency_contact_name, 'Not provided')}
                </p>
              )}
            </div>
            <div>
              <FieldLabel>Contact Phone</FieldLabel>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.emergency_contact_phone}
                  onChange={(e) => updateProfile({ emergency_contact_phone: e.target.value })}
                  placeholder="+91 ..."
                  className={inputClass}
                />
              ) : (
                <p className="rounded-2xl bg-[#F4F8F7] p-3.5 text-xs font-bold">
                  {displayValue(profile.emergency_contact_phone, 'Not provided')}
                </p>
              )}
            </div>
            <div>
              <FieldLabel>Relation</FieldLabel>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.emergency_contact_relation}
                  onChange={(e) => updateProfile({ emergency_contact_relation: e.target.value })}
                  placeholder="e.g. Spouse"
                  className={inputClass}
                />
              ) : (
                <p className="rounded-2xl bg-[#F4F8F7] p-3.5 text-xs font-bold">
                  {displayValue(profile.emergency_contact_relation, 'Not provided')}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-3xl border border-[#D5E8E3] bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-base font-black text-[#0E2924]">
            <MapPin className="h-4 w-4 text-[#227B6B]" /> 3. Residential Address
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <FieldLabel>Street Address</FieldLabel>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.address}
                  onChange={(e) => updateProfile({ address: e.target.value })}
                  placeholder="Residential address"
                  className={inputClass}
                />
              ) : (
                <p className="rounded-2xl bg-[#F4F8F7] p-3.5 text-xs font-bold">
                  {displayValue(profile.address, 'Not provided')}
                </p>
              )}
            </div>
            <div>
              <FieldLabel>City</FieldLabel>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.city}
                  onChange={(e) => updateProfile({ city: e.target.value })}
                  className={inputClass}
                />
              ) : (
                <p className="rounded-2xl bg-[#F4F8F7] p-3.5 text-xs font-bold">
                  {displayValue(profile.city, 'Not provided')}
                </p>
              )}
            </div>
            <div>
              <FieldLabel>State</FieldLabel>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.state}
                  onChange={(e) => updateProfile({ state: e.target.value })}
                  className={inputClass}
                />
              ) : (
                <p className="rounded-2xl bg-[#F4F8F7] p-3.5 text-xs font-bold">
                  {displayValue(profile.state, 'Not provided')}
                </p>
              )}
            </div>
            <div>
              <FieldLabel>Postal Code</FieldLabel>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.postal_code}
                  onChange={(e) => updateProfile({ postal_code: e.target.value })}
                  className={inputClass}
                />
              ) : (
                <p className="rounded-2xl bg-[#F4F8F7] p-3.5 text-xs font-bold">
                  {displayValue(profile.postal_code, 'Not provided')}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-3xl border border-[#D5E8E3] bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-base font-black text-[#0E2924]">
            <Stethoscope className="h-4 w-4 text-[#227B6B]" /> 4. Clinical Background
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <FieldLabel>Known Allergies</FieldLabel>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.allergies}
                  onChange={(e) => updateProfile({ allergies: e.target.value })}
                  placeholder="None known"
                  className={inputClass}
                />
              ) : (
                <p className="rounded-2xl bg-[#F4F8F7] p-3.5 text-xs font-bold">
                  {displayValue(profile.allergies, 'Not provided')}
                </p>
              )}
            </div>
            <div>
              <FieldLabel>Chronic Conditions</FieldLabel>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.chronic_conditions}
                  onChange={(e) => updateProfile({ chronic_conditions: e.target.value })}
                  placeholder="None reported"
                  className={inputClass}
                />
              ) : (
                <p className="rounded-2xl bg-[#F4F8F7] p-3.5 text-xs font-bold">
                  {displayValue(profile.chronic_conditions, 'Not provided')}
                </p>
              )}
            </div>
            <div className="md:col-span-2">
              <FieldLabel>Current Medications</FieldLabel>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.current_medications}
                  onChange={(e) => updateProfile({ current_medications: e.target.value })}
                  placeholder="List ongoing medications"
                  className={inputClass}
                />
              ) : (
                <p className="rounded-2xl bg-[#F4F8F7] p-3.5 text-xs font-bold">
                  {displayValue(profile.current_medications, 'Not provided')}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-3xl border border-[#D5E8E3] bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-base font-black text-[#0E2924]">
            <Activity className="h-4 w-4 text-[#227B6B]" /> 5. Baseline Vitals
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <FieldLabel>Height (cm)</FieldLabel>
              {isEditing ? (
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={profile.height_cm}
                  onChange={(e) => updateProfile({ height_cm: e.target.value })}
                  placeholder="165"
                  className={inputClass}
                />
              ) : (
                <p className="rounded-2xl bg-[#F4F8F7] p-3.5 text-xs font-bold">
                  {displayValue(profile.height_cm, 'Not provided')}
                </p>
              )}
            </div>
            <div>
              <FieldLabel>Weight (kg)</FieldLabel>
              {isEditing ? (
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={profile.weight_kg}
                  onChange={(e) => updateProfile({ weight_kg: e.target.value })}
                  placeholder="58"
                  className={inputClass}
                />
              ) : (
                <p className="rounded-2xl bg-[#F4F8F7] p-3.5 text-xs font-bold">
                  {displayValue(profile.weight_kg, 'Not provided')}
                </p>
              )}
            </div>
            <div>
              <FieldLabel>BMI</FieldLabel>
              <p className="rounded-2xl bg-[#F4F8F7] p-3.5 text-xs font-bold">
                {displayValue(
                  profile.bmi || calculatePatientBmi(profile.height_cm, profile.weight_kg),
                  'Not provided',
                )}
              </p>
            </div>
            <div>
              <FieldLabel>Blood Pressure</FieldLabel>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.blood_pressure}
                  onChange={(e) => updateProfile({ blood_pressure: e.target.value })}
                  placeholder="120/80"
                  className={inputClass}
                />
              ) : (
                <p className="rounded-2xl bg-[#F4F8F7] p-3.5 text-xs font-bold">
                  {displayValue(profile.blood_pressure, 'Not provided')}
                </p>
              )}
            </div>
            <div>
              <FieldLabel>Heart Rate (bpm)</FieldLabel>
              {isEditing ? (
                <input
                  type="number"
                  min={0}
                  value={profile.heart_rate_bpm}
                  onChange={(e) => updateProfile({ heart_rate_bpm: e.target.value })}
                  placeholder="72"
                  className={inputClass}
                />
              ) : (
                <p className="rounded-2xl bg-[#F4F8F7] p-3.5 text-xs font-bold">
                  {displayValue(profile.heart_rate_bpm, 'Not provided')}
                </p>
              )}
            </div>
            <div>
              <FieldLabel>SpO2 (%)</FieldLabel>
              {isEditing ? (
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={profile.spo2_percentage}
                  onChange={(e) => updateProfile({ spo2_percentage: e.target.value })}
                  placeholder="98"
                  className={inputClass}
                />
              ) : (
                <p className="rounded-2xl bg-[#F4F8F7] p-3.5 text-xs font-bold">
                  {displayValue(profile.spo2_percentage, 'Not provided')}
                </p>
              )}
            </div>
            <div>
              <FieldLabel>Temperature (°F)</FieldLabel>
              {isEditing ? (
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={profile.temperature_f}
                  onChange={(e) => updateProfile({ temperature_f: e.target.value })}
                  placeholder="98.6"
                  className={inputClass}
                />
              ) : (
                <p className="rounded-2xl bg-[#F4F8F7] p-3.5 text-xs font-bold">
                  {displayValue(profile.temperature_f, 'Not provided')}
                </p>
              )}
            </div>
          </div>
        </div>

        {isEditing ? (
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#113831] py-4 text-xs font-black text-white shadow-lg transition hover:bg-[#227B6B] disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-[#A6E2D8]" /> Saving Profile...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 text-[#A6E2D8]" /> Save Profile
                </>
              )}
            </button>
            {!isNewUser ? (
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  void loadProfile();
                }}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#D5E8E3] bg-white px-6 py-4 text-xs font-black text-[#113831]"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            ) : null}
          </div>
        ) : null}
      </form>
    </div>
  );
}
