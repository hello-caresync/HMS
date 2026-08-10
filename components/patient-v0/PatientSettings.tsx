'use client';

import { useCallback, useEffect, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  HeartPulse,
  Loader2,
  LogOut,
  MapPin,
  Pencil,
  Plus,
  Save,
  Trash2,
  UserRound,
  Users,
  X,
} from 'lucide-react';

import { v0Ui } from '@/components/patient-v0/ui';
import { PatientStatusBanner } from '@/components/patient/PatientStatusBanner';
import { opdUi } from '@/lib/opd/design-tokens';
import { usePatientAuth } from '@/lib/patient/auth/PatientAuthProvider';
import {
  deleteFamilyMember,
  fetchFacilities,
  fetchFamilyMembers,
  fetchPatientProfile,
  insertFamilyMember,
  setPreferredHospital,
  updateFamilyMember,
  upsertPatientProfile,
} from '@/lib/patient/settings/settings-service';
import {
  BLOOD_GROUPS,
  FAMILY_RELATIONSHIPS,
  GENDERS,
  type FacilityFilter,
  type FamilyMemberInput,
  type FamilyMemberRecord,
  type MedicalFacility,
  type PatientProfileForm,
} from '@/lib/patient/settings/types';

type SettingsTab = 'profile' | 'locations' | 'family';

const TABS: { id: SettingsTab; label: string; icon: typeof UserRound }[] = [
  { id: 'profile', label: 'Personal & Medical', icon: UserRound },
  { id: 'locations', label: 'Nearest Care Centers', icon: MapPin },
  { id: 'family', label: 'Family Members', icon: Users },
];

const emptyFamilyForm = (): FamilyMemberInput => ({
  fullName: '',
  relationship: 'Spouse',
  dateOfBirth: '',
  gender: '',
  bloodGroup: '',
  medicalNotes: '',
});

function SettingsModal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A332F]/40 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="family-modal-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#8E7692]/30 bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-[#8E7692]/25 bg-[#1A332F] px-5 py-4 text-white">
          <h3 id="family-modal-title" className="text-lg font-black">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-white/10"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function PatientSettings() {
  const { session, signOut } = usePatientAuth();
  const router = useRouter();
  const patientId = session?.patientId ?? null;

  const [tab, setTab] = useState<SettingsTab>('profile');
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profile, setProfile] = useState<PatientProfileForm | null>(null);

  // Tag inputs for Medical History
  const [allergyInput, setAllergyInput] = useState('');
  const [conditionInput, setConditionInput] = useState('');

  const [pincodeFilter, setPincodeFilter] = useState('');
  const [facilityFilter, setFacilityFilter] = useState<FacilityFilter>('all');
  const [facilitiesLoading, setFacilitiesLoading] = useState(false);
  const [facilities, setFacilities] = useState<MedicalFacility[]>([]);
  const [preferredSaving, setPreferredSaving] = useState<string | null>(null);

  const [familyLoading, setFamilyLoading] = useState(true);
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberRecord[]>([]);
  const [familyModalOpen, setFamilyModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMemberRecord | null>(null);
  const [familyForm, setFamilyForm] = useState<FamilyMemberInput>(emptyFamilyForm());
  const [familySaving, setFamilySaving] = useState(false);

  const showNotice = useCallback((msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 4000);
  }, []);

  // Fetch Patient Profile
  useEffect(() => {
    if (!patientId) return;
    setProfileLoading(true);
    void fetchPatientProfile(patientId)
      .then((data) => {
        setProfile(data);
        setPincodeFilter(data.pincode || '');
      })
      .catch(() => setError('Could not load profile — using local defaults.'))
      .finally(() => setProfileLoading(false));
  }, [patientId]);

  // Fetch Nearest Care Centers
  useEffect(() => {
    if (!patientId || tab !== 'locations') return;
    setFacilitiesLoading(true);
    void fetchFacilities(pincodeFilter, profile?.city ?? '', facilityFilter)
      .then(setFacilities)
      .catch(() => setError('Could not load nearby care centers.'))
      .finally(() => setFacilitiesLoading(false));
  }, [patientId, tab, pincodeFilter, profile?.city, facilityFilter]);

  // Fetch Family Members
  useEffect(() => {
    if (!patientId || tab !== 'family') return;
    setFamilyLoading(true);
    void fetchFamilyMembers(patientId)
      .then(setFamilyMembers)
      .catch(() => setError('Could not load family members.'))
      .finally(() => setFamilyLoading(false));
  }, [patientId, tab]);

  // Tag Badge Management Functions
  const parseTags = (str: string): string[] =>
    str ? str.split(',').map((s) => s.trim()).filter(Boolean) : [];

  const addAllergyTag = (tag: string) => {
    if (!profile || !tag.trim()) return;
    const current = parseTags(profile.knownAllergies);
    if (!current.includes(tag.trim())) {
      const updated = [...current, tag.trim()].join(', ');
      setProfile({ ...profile, knownAllergies: updated });
    }
    setAllergyInput('');
  };

  const removeAllergyTag = (tagToRemove: string) => {
    if (!profile) return;
    const current = parseTags(profile.knownAllergies);
    const updated = current.filter((t) => t !== tagToRemove).join(', ');
    setProfile({ ...profile, knownAllergies: updated });
  };

  const addConditionTag = (tag: string) => {
    if (!profile || !tag.trim()) return;
    const current = parseTags(profile.chronicConditions);
    if (!current.includes(tag.trim())) {
      const updated = [...current, tag.trim()].join(', ');
      setProfile({ ...profile, chronicConditions: updated });
    }
    setConditionInput('');
  };

  const removeConditionTag = (tagToRemove: string) => {
    if (!profile) return;
    const current = parseTags(profile.chronicConditions);
    const updated = current.filter((t) => t !== tagToRemove).join(', ');
    setProfile({ ...profile, chronicConditions: updated });
  };

  // Profile Save Action
  const handleProfileSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setProfileSaving(true);
    setError(null);
    try {
      await upsertPatientProfile(profile);
      showNotice('Profile saved successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setProfileSaving(false);
    }
  };

  // Preferred Default Hospital Action
  const handleSetPreferred = async (facilityId: string) => {
    if (!profile || !patientId) return;
    setPreferredSaving(facilityId);
    try {
      const updated = await setPreferredHospital(patientId, facilityId, profile);
      setProfile(updated);
      showNotice('Preferred default hospital updated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preferred hospital');
    } finally {
      setPreferredSaving(null);
    }
  };

  // Family Member Handlers
  const openAddFamily = () => {
    setEditingMember(null);
    setFamilyForm(emptyFamilyForm());
    setFamilyModalOpen(true);
  };

  const openEditFamily = (member: FamilyMemberRecord) => {
    setEditingMember(member);
    setFamilyForm({
      fullName: member.fullName,
      relationship: member.relationship,
      dateOfBirth: member.dateOfBirth,
      gender: member.gender,
      bloodGroup: member.bloodGroup,
      medicalNotes: member.medicalNotes,
    });
    setFamilyModalOpen(true);
  };

  const handleFamilySubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!patientId) return;
    setFamilySaving(true);
    setError(null);
    try {
      if (editingMember) {
        await updateFamilyMember(patientId, editingMember.id, familyForm);
        showNotice('Family member updated');
      } else {
        await insertFamilyMember(patientId, familyForm);
        showNotice('Family member added');
      }
      const refreshed = await fetchFamilyMembers(patientId);
      setFamilyMembers(refreshed);
      setFamilyModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save family member');
    } finally {
      setFamilySaving(false);
    }
  };

  const handleDeleteFamily = async (memberId: string) => {
    if (!patientId || !confirm('Remove this family member from your profile?')) return;
    try {
      await deleteFamilyMember(patientId, memberId);
      setFamilyMembers(await fetchFamilyMembers(patientId));
      showNotice('Family member removed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete family member');
    }
  };

  const handleLogout = () => {
    signOut();
    router.replace('/patient/auth/login');
  };

  if (!session || !patientId) return null;

  return (
    <div className={`${v0Ui.page} ${opdUi.canvas} min-h-full rounded-2xl p-1`}>
      <header className="mb-2">
        <h1 className={v0Ui.pageTitle}>Settings</h1>
        <p className={v0Ui.pageSubtitle}>Personal profile, nearby care, and family management</p>
      </header>

      {notice && <PatientStatusBanner message={notice} variant="success" />}
      {error && <PatientStatusBanner message={error} variant="warning" />}

      {/* Navigation Tabs */}
      <nav className="flex flex-wrap gap-2 my-4">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
              tab === id
                ? 'bg-[#3B8C7E] text-white shadow-sm'
                : 'border border-[#8E7692]/30 bg-white text-[#1A332F] hover:bg-[#CEB2C0]/30'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>

      {/* TAB 1: PERSONAL & MEDICAL INFORMATION */}
      {tab === 'profile' && (
        <section className={v0Ui.card}>
          {profileLoading || !profile ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-[#8E7692]">
              <Loader2 className="h-5 w-5 animate-spin text-[#3B8C7E]" />
              Loading profile…
            </div>
          ) : (
            <form onSubmit={handleProfileSave} className="space-y-8">
              {/* Basic Info */}
              <div>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-[#1A332F]">
                  <UserRound className="h-5 w-5" /> Basic Information
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Full name">
                    <input
                      className={v0Ui.input}
                      value={profile.fullName}
                      onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                      placeholder="e.g. Aishwarya D S"
                      required
                    />
                  </Field>
                  <Field label="Email">
                    <input
                      type="email"
                      className={v0Ui.input}
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      required
                    />
                  </Field>
                  <Field label="Phone">
                    <input
                      className={v0Ui.input}
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    />
                  </Field>
                  <Field label="Date of birth">
                    <input
                      type="date"
                      className={v0Ui.input}
                      value={profile.dateOfBirth}
                      onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })}
                    />
                  </Field>
                  <Field label="Gender">
                    <select
                      className={v0Ui.select}
                      value={profile.gender}
                      onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                    >
                      <option value="">Select gender</option>
                      {GENDERS.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Blood group">
                    <select
                      className={v0Ui.select}
                      value={profile.bloodGroup}
                      onChange={(e) => setProfile({ ...profile, bloodGroup: e.target.value })}
                    >
                      <option value="">Select blood group</option>
                      {BLOOD_GROUPS.map((bg) => (
                        <option key={bg} value={bg}>
                          {bg}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </div>

              {/* Address Details */}
              <div>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-[#1A332F]">
                  <MapPin className="h-5 w-5" /> Address Details
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Street address" className="sm:col-span-2">
                    <input
                      className={v0Ui.input}
                      value={profile.streetAddress}
                      onChange={(e) => setProfile({ ...profile, streetAddress: e.target.value })}
                      placeholder="House number, landmark..."
                    />
                  </Field>
                  <Field label="City">
                    <input
                      className={v0Ui.input}
                      value={profile.city}
                      onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                    />
                  </Field>
                  <Field label="Pincode">
                    <input
                      className={v0Ui.input}
                      value={profile.pincode}
                      onChange={(e) => setProfile({ ...profile, pincode: e.target.value })}
                      placeholder="560001"
                    />
                  </Field>
                </div>
              </div>

              {/* Emergency Contact */}
              <div>
                <h2 className="mb-4 text-lg font-black text-[#1A332F]">Emergency Contact</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Contact person name">
                    <input
                      className={v0Ui.input}
                      value={profile.emergencyContactName}
                      onChange={(e) =>
                        setProfile({ ...profile, emergencyContactName: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Contact phone">
                    <input
                      className={v0Ui.input}
                      value={profile.emergencyContactPhone}
                      onChange={(e) =>
                        setProfile({ ...profile, emergencyContactPhone: e.target.value })
                      }
                    />
                  </Field>
                </div>
              </div>

              {/* Medical History with Dynamic Pill Badges */}
              <div>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-[#1A332F]">
                  <HeartPulse className="h-5 w-5" /> Medical History
                </h2>
                <div className="grid gap-6">
                  {/* Known Allergies Tag Editor */}
                  <Field label="Known allergies">
                    <div className="rounded-xl border border-[#8E7692]/30 bg-white p-3 focus-within:border-[#3B8C7E]">
                      <div className="mb-2 flex flex-wrap gap-2">
                        {parseTags(profile.knownAllergies).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#B85C5C]/30 bg-[#B85C5C]/10 px-2.5 py-1 text-xs font-bold text-[#B85C5C]"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeAllergyTag(tag)}
                              className="hover:text-red-800"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <input
                        className="w-full bg-transparent text-sm focus:outline-none"
                        value={allergyInput}
                        onChange={(e) => setAllergyInput(e.target.value)}
                        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                          if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault();
                            addAllergyTag(allergyInput);
                          }
                        }}
                        placeholder="Type an allergy and press Enter (e.g., Penicillin, Peanuts)"
                      />
                    </div>
                  </Field>

                  {/* Chronic Conditions Tag Editor */}
                  <Field label="Chronic conditions">
                    <div className="rounded-xl border border-[#8E7692]/30 bg-white p-3 focus-within:border-[#3B8C7E]">
                      <div className="mb-2 flex flex-wrap gap-2">
                        {parseTags(profile.chronicConditions).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#3B8C7E]/30 bg-[#3B8C7E]/10 px-2.5 py-1 text-xs font-bold text-[#3B8C7E]"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeConditionTag(tag)}
                              className="hover:text-purple-900"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <input
                        className="w-full bg-transparent text-sm focus:outline-none"
                        value={conditionInput}
                        onChange={(e) => setConditionInput(e.target.value)}
                        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                          if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault();
                            addConditionTag(conditionInput);
                          }
                        }}
                        placeholder="Type a condition and press Enter (e.g., Asthma, Diabetes)"
                      />
                    </div>
                  </Field>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-wrap gap-3 border-t border-[#8E7692]/20 pt-6">
                <button type="submit" disabled={profileSaving} className={v0Ui.btnPrimary}>
                  {profileSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save profile details
                </button>
                <button type="button" onClick={handleLogout} className={v0Ui.btnDanger}>
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      {/* TAB 2: NEAREST CARE CENTERS */}
      {tab === 'locations' && (
        <section className="space-y-4">
          <div className={`${v0Ui.card} flex flex-wrap gap-3`}>
            <div className="min-w-[160px] flex-1">
              <label className="mb-1 block text-xs font-bold uppercase text-[#8E7692]">
                Pincode search
              </label>
              <input
                className={v0Ui.input}
                value={pincodeFilter}
                onChange={(e) => setPincodeFilter(e.target.value)}
                placeholder="Search pincode or area..."
              />
            </div>
            <div className="min-w-[160px]">
              <label className="mb-1 block text-xs font-bold uppercase text-[#8E7692]">
                Facility type
              </label>
              <select
                className={v0Ui.select}
                value={facilityFilter}
                onChange={(e) => setFacilityFilter(e.target.value as FacilityFilter)}
              >
                <option value="all">All facilities</option>
                <option value="hospital">Hospitals only</option>
                <option value="clinic">Clinics only</option>
              </select>
            </div>
          </div>

          {facilitiesLoading ? (
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-[#8E7692]/40 bg-white/60 py-16 text-sm text-[#8E7692]">
              <Loader2 className="h-5 w-5 animate-spin text-[#3B8C7E]" />
              Finding nearby facilities…
            </div>
          ) : facilities.length === 0 ? (
            <div className={v0Ui.empty}>
              <p className="text-sm text-patient-lavender">No facilities match this pincode or filter.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {facilities.map((f) => {
                const isPreferred = profile?.preferredHospitalId === f.id;
                return (
                  <article
                    key={f.id}
                    className={`${v0Ui.cardHover} ${isPreferred ? 'ring-2 ring-[#3B8C7E]/40' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Building2 className="h-4 w-4 text-[#3B8C7E]" />
                          <h3 className="font-black text-[#1A332F]">{f.facilityName}</h3>
                        </div>
                        <p className="mt-1 text-xs text-[#8E7692]">{f.address}</p>
                        <p className="mt-1 text-xs font-semibold text-[#3B8C7E]">
                          {f.city} · {f.areaPincode}
                        </p>
                      </div>
                      <span
                        className={`${v0Ui.badge} ${
                          f.facilityType === 'hospital'
                            ? 'border-[#3B8C7E]/30 bg-[#3B8C7E]/10 text-[#3B8C7E]'
                            : 'border-[#5E8B7E]/30 bg-[#5E8B7E]/10 text-[#5E8B7E]'
                        }`}
                      >
                        {f.facilityType === 'hospital' ? 'Hospital' : 'Clinic'}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-bold text-[#1A332F]">
                      {f.distanceKm.toFixed(1)} km away
                    </p>
                    <label className="mt-4 flex cursor-pointer items-center gap-2 rounded-xl border border-[#8E7692]/25 bg-[#CEB2C0]/15 px-3 py-2.5 text-sm font-bold text-[#1A332F]">
                      <input
                        type="radio"
                        name="preferred-hospital"
                        checked={isPreferred}
                        disabled={preferredSaving === f.id}
                        onChange={() => void handleSetPreferred(f.id)}
                        className="accent-[#3B8C7E]"
                      />
                      {preferredSaving === f.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isPreferred ? (
                        'Preferred default hospital'
                      ) : (
                        'Set as preferred default hospital'
                      )}
                    </label>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* TAB 3: FAMILY MEMBERS */}
      {tab === 'family' && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[#8E7692]">
              Manage dependents for family booking and shared care records.
            </p>
            <button type="button" onClick={openAddFamily} className={v0Ui.btnPrimary}>
              <Plus className="h-4 w-4" /> Add family member
            </button>
          </div>

          {familyLoading ? (
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-[#8E7692]/40 bg-white/60 py-16 text-sm text-[#8E7692]">
              <Loader2 className="h-5 w-5 animate-spin text-[#3B8C7E]" />
              Loading family members…
            </div>
          ) : familyMembers.length === 0 ? (
            <div className={v0Ui.empty}>
              <p className="text-sm text-patient-lavender">No family members registered yet.</p>
              <button type="button" onClick={openAddFamily} className={`${v0Ui.btnPrimary} mt-4`}>
                Add your first member
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {familyMembers.map((m) => (
                <article key={m.id} className={v0Ui.cardHover}>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#3B8C7E] text-lg font-black text-white">
                    {m.fullName
                      .split(' ')
                      .slice(0, 2)
                      .map((p) => p[0])
                      .join('')}
                  </div>
                  <h3 className="mt-3 font-black text-[#1A332F]">{m.fullName}</h3>
                  <p className="text-xs font-bold text-[#3B8C7E]">{m.relationship}</p>
                  <dl className="mt-3 space-y-1 text-xs text-[#8E7692]">
                    {m.dateOfBirth && (
                      <div>
                        <span className="font-bold">DOB:</span> {m.dateOfBirth}
                      </div>
                    )}
                    {m.gender && (
                      <div>
                        <span className="font-bold">Gender:</span> {m.gender}
                      </div>
                    )}
                    {m.bloodGroup && (
                      <div>
                        <span className="font-bold">Blood:</span> {m.bloodGroup}
                      </div>
                    )}
                    {m.medicalNotes && (
                      <div className="mt-2 leading-relaxed text-[#1A332F]/80">{m.medicalNotes}</div>
                    )}
                  </dl>
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEditFamily(m)}
                      className={v0Ui.btnSecondary}
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteFamily(m.id)}
                      className={v0Ui.btnDanger}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* FAMILY MEMBER MODAL */}
      {familyModalOpen && (
        <SettingsModal
          title={editingMember ? 'Edit family member' : 'Add family member'}
          onClose={() => setFamilyModalOpen(false)}
        >
          <form onSubmit={handleFamilySubmit} className="space-y-4">
            <Field label="Full name">
              <input
                className={v0Ui.input}
                value={familyForm.fullName}
                onChange={(e) => setFamilyForm({ ...familyForm, fullName: e.target.value })}
                required
              />
            </Field>
            <Field label="Relationship">
              <select
                className={v0Ui.select}
                value={familyForm.relationship}
                onChange={(e) => setFamilyForm({ ...familyForm, relationship: e.target.value })}
              >
                {FAMILY_RELATIONSHIPS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date of birth">
                <input
                  type="date"
                  className={v0Ui.input}
                  value={familyForm.dateOfBirth}
                  onChange={(e) => setFamilyForm({ ...familyForm, dateOfBirth: e.target.value })}
                />
              </Field>
              <Field label="Gender">
                <select
                  className={v0Ui.select}
                  value={familyForm.gender}
                  onChange={(e) => setFamilyForm({ ...familyForm, gender: e.target.value })}
                >
                  <option value="">Select</option>
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Blood group">
              <select
                className={v0Ui.select}
                value={familyForm.bloodGroup}
                onChange={(e) => setFamilyForm({ ...familyForm, bloodGroup: e.target.value })}
              >
                <option value="">Select</option>
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Medical notes">
              <textarea
                className={`${v0Ui.input} min-h-[80px] resize-y`}
                value={familyForm.medicalNotes}
                onChange={(e) => setFamilyForm({ ...familyForm, medicalNotes: e.target.value })}
                placeholder="Allergies, chronic conditions, or specific medical needs"
              />
            </Field>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={familySaving} className={`${v0Ui.btnPrimary} flex-1`}>
                {familySaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editingMember ? (
                  'Save changes'
                ) : (
                  'Add member'
                )}
              </button>
              <button
                type="button"
                onClick={() => setFamilyModalOpen(false)}
                className={v0Ui.btnSecondary}
              >
                Cancel
              </button>
            </div>
          </form>
        </SettingsModal>
      )}
    </div>
  );
}

function Field({
  label,
  children,
  className = '',
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-[#8E7692]">
        {label}
      </span>
      {children}
    </label>
  );
}