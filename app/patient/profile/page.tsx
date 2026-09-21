'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Pencil } from 'lucide-react';
import { toast } from 'sonner';

import { PatientProfileForm } from '@/components/patient/PatientProfileForm';
import {
  loadSavedFamilyMembers,
  persistFamilyMembers,
  type FamilyMember,
} from '@/lib/patient/family-members';
import {
  createEmptyPatientProfile,
  loadPatientProfilePageState,
  savePatientProfilePageState,
  type PatientProfileState,
} from '@/lib/patient/patient-profile-page';
import {
  loadLocalPatientProfile,
  profileDataFamilyMembers,
  profileDataToClinicalRecord,
} from '@/lib/patient/profileStore';
import {
  resolveActivePatientFormIdentity,
  type ActivePatientFormIdentity,
} from '@/lib/patient/portal-session';
import { sanitizePatientDbError } from '@/lib/db/patients';
import { supabase } from '@/lib/supabaseClient';

function applySessionRegistrationLock(
  profile: PatientProfileState,
  identity: ActivePatientFormIdentity,
): PatientProfileState {
  return {
    ...profile,
    full_name: identity.patient_name,
    phone: identity.phone,
    email: identity.email,
    patient_id: profile.patient_id || identity.patient_id,
  };
}

export default function PatientProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<PatientProfileState | null>(null);
  const [sessionIdentity, setSessionIdentity] = useState<ActivePatientFormIdentity | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
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

    setSessionIdentity(identity);

    try {
      const result = await loadPatientProfilePageState(supabase);
      if (!result) {
        router.replace('/patient/login');
        return;
      }
      setProfile(applySessionRegistrationLock(result.profile, identity));
      setIsNewUser(result.isNewUser);
      setIsEditing(result.isNewUser);
      setFamilyMembers(
        result.familyMembers.length > 0
          ? result.familyMembers
          : loadSavedFamilyMembers(identity.patient_id),
      );
    } catch {
      const emptyProfile = createEmptyPatientProfile(identity);
      const localCache = loadLocalPatientProfile(identity.patient_id);
      const hydratedProfile = localCache
        ? profileDataToClinicalRecord(localCache, emptyProfile)
        : emptyProfile;
      const cachedFamily = localCache ? profileDataFamilyMembers(localCache) : [];

      setProfile(applySessionRegistrationLock(hydratedProfile, identity));
      setIsNewUser(!localCache);
      setIsEditing(!localCache);
      setFamilyMembers(
        cachedFamily.length > 0 ? cachedFamily : loadSavedFamilyMembers(identity.patient_id),
      );
      setLoadError(
        localCache
          ? 'Cloud sync unavailable — showing your last saved profile from this device.'
          : 'Could not load your saved profile. You can complete it below.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const updateProfile = (patch: Partial<PatientProfileState>) => {
    setProfile((current) => {
      if (!current || !sessionIdentity) return current;
      const next = { ...current, ...patch };
      return applySessionRegistrationLock(next, sessionIdentity);
    });
  };

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!profile) return;

    setSaving(true);
    setSaveError(null);

    try {
      const lockedProfile = sessionIdentity
        ? applySessionRegistrationLock(profile, sessionIdentity)
        : profile;
      const saved = await savePatientProfilePageState(
        supabase,
        lockedProfile,
        familyMembers,
      );
      if (sessionIdentity?.patient_id) {
        persistFamilyMembers(familyMembers, sessionIdentity.patient_id);
      }
      setProfile(saved);
      setIsNewUser(false);
      setIsEditing(false);
      toast.success('Profile and family dependents saved successfully');
    } catch (err) {
      setSaveError(
        err instanceof Error
          ? sanitizePatientDbError(err.message)
          : 'Could not save profile.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !profile) {
    return (
      <div className="mx-auto flex h-64 w-full max-w-5xl items-center justify-center rounded-xl border border-[#EADBCE] bg-white p-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#7C5C48]">
          <Loader2 className="h-5 w-5 animate-spin text-[#8C5A3C]" />
          Loading your private profile...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 font-sans text-[#2B1810]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#2B1810]">Patient Profile</h1>
          <p className="text-xs text-[#7C5C48]">
            Manage your demographics, emergency contacts, and family dependents.
          </p>
        </div>
        {!isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-[#EADBCE] bg-white px-3 py-2 text-xs font-semibold text-[#7F5539] hover:bg-[#FAF6F0]"
          >
            <Pencil className="h-4 w-4 text-[#8C5A3C]" />
            Edit Profile
          </button>
        ) : null}
      </div>

      {loadError ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs font-medium text-amber-900">
          {loadError}
        </div>
      ) : null}

      {saveError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800">
          {saveError}
        </div>
      ) : null}

      <PatientProfileForm
        profile={profile}
        verifiedSession={{
          name: sessionIdentity?.patient_name || profile.full_name,
          phone: sessionIdentity?.phone || profile.phone || 'Not provided',
          email: sessionIdentity?.email || profile.email || 'Not provided',
        }}
        isEditing={isEditing}
        isNewUser={isNewUser}
        saving={saving}
        familyMembers={familyMembers}
        onProfileChange={updateProfile}
        onFamilyMembersChange={setFamilyMembers}
        onCancel={() => {
          setIsEditing(false);
          void loadProfile();
        }}
        onSubmit={(event) => void handleSaveProfile(event)}
      />
    </div>
  );
}
