'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  DEFAULT_DEPARTMENTS,
  HOSPITAL_MEMBER_ROLES,
  type HospitalMemberRole,
  type IssuedCredential,
  type OnboardingMemberDraft,
} from '@/lib/auth/hospital/member-types';
import {
  credentialsToCsv,
  credentialsToPlainText,
  saveOnboardingData,
  type HospitalDetailsInput,
} from '@/lib/auth/hospital/onboarding.service';
import { APP_ROUTES } from '@/app/lib/routes';
import {
  fetchHospitalRecord,
  fetchMembersForOnboarding,
  mapHospitalRowToInput,
  REGAL_DEPARTMENTS,
  REGAL_DOCTOR_COUNT,
  REGAL_HOSPITAL_DOCTORS,
  setStoredActiveHospitalId,
} from '@/lib/hospital/hospital-members.service';

const HOSPITAL_DASHBOARD_ROUTE = APP_ROUTES.hospitalDashboard;

const STEPS = [
  'Hospital Details',
  'Departments',
  'Staff & Doctors',
  'Issue Credentials',
] as const;

function emptyMember(): OnboardingMemberDraft {
  return {
    key: crypto.randomUUID(),
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    employeeId: '',
    role: 'Doctor',
    departmentName: DEFAULT_DEPARTMENTS[0],
  };
}

function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-base font-medium text-slate-800"
    >
      {children}
    </label>
  );
}

function TextInput({
  id,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      required={required}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base font-medium text-slate-800 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
    />
  );
}

function NumberInput({
  id,
  value,
  onChange,
  min = 0,
}: {
  id: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
}) {
  return (
    <input
      id={id}
      type="number"
      min={min}
      value={value}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base font-medium text-slate-800 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
    />
  );
}

export default function HospitalOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [memberSource, setMemberSource] = useState<'database' | 'seed' | null>(null);
  const [activeHospitalId, setActiveHospitalId] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [issuedCredentials, setIssuedCredentials] = useState<IssuedCredential[]>([]);

  const [hospital, setHospital] = useState<HospitalDetailsInput>({
    hospitalName: '',
    registrationNumber: '',
    taxGstinId: '',
    officialEmail: '',
    phone: '',
    emergencyHelpline: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    totalBeds: 100,
    icuBeds: 20,
    opdRooms: 12,
    otSuites: 4,
  });

  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([
    ...DEFAULT_DEPARTMENTS,
  ]);
  const [customDepartment, setCustomDepartment] = useState('');
  const [members, setMembers] = useState<OnboardingMemberDraft[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrapMembers() {
      setLoadingMembers(true);
      try {
        const { members: loaded, hospitalId, source } = await fetchMembersForOnboarding();

        if (cancelled) return;

        setMembers(loaded);
        setMemberSource(source);
        setActiveHospitalId(hospitalId);

        if (source === 'database') {
          setSelectedDepartments((prev) =>
            Array.from(
              new Set([...prev, ...loaded.map((m) => m.departmentName), ...REGAL_DEPARTMENTS]),
            ),
          );
          toast.success(`Successfully loaded ${loaded.length} Regal Hospital Doctors!`, {
            description: 'Roster restored from Supabase hospital_members.',
          });

          if (hospitalId) {
            const hospitalRow = await fetchHospitalRecord(hospitalId);
            if (hospitalRow && !cancelled) {
              setHospital(mapHospitalRowToInput(hospitalRow as Record<string, unknown>));
            }
          }
        } else {
          setSelectedDepartments((prev) => Array.from(new Set([...prev, ...REGAL_DEPARTMENTS])));
          toast.success(`Successfully loaded ${REGAL_DOCTOR_COUNT} Regal Hospital Doctors!`, {
            description: 'Local seed roster applied — save in Step 4 to persist to Supabase.',
          });
        }
      } catch {
        if (!cancelled) {
          setMembers(REGAL_HOSPITAL_DOCTORS);
          setMemberSource('seed');
          setSelectedDepartments((prev) => Array.from(new Set([...prev, ...REGAL_DEPARTMENTS])));
          toast.error('Could not reach Supabase — using local Regal seed roster.');
        }
      } finally {
        if (!cancelled) setLoadingMembers(false);
      }
    }

    void bootstrapMembers();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeDepartmentOptions = useMemo(
    () => selectedDepartments.filter(Boolean),
    [selectedDepartments],
  );

  const toggleDepartment = (name: string) => {
    setSelectedDepartments((prev) =>
      prev.includes(name) ? prev.filter((d) => d !== name) : [...prev, name],
    );
  };

  const addCustomDepartment = () => {
    const name = customDepartment.trim();
    if (!name) return;
    if (!selectedDepartments.includes(name)) {
      setSelectedDepartments((prev) => [...prev, name]);
    }
    setCustomDepartment('');
  };

  const updateMember = (key: string, patch: Partial<OnboardingMemberDraft>) => {
    setMembers((prev) => prev.map((m) => (m.key === key ? { ...m, ...patch } : m)));
  };

  const removeMember = (key: string) => {
    setMembers((prev) => prev.filter((m) => m.key !== key));
  };

  const handlePreloadRegalDoctors = () => {
    setMembers(REGAL_HOSPITAL_DOCTORS.map((m) => ({ ...m, key: m.key || crypto.randomUUID() })));
    setSelectedDepartments((prev) => Array.from(new Set([...prev, ...REGAL_DEPARTMENTS])));
    setMemberSource('seed');
    toast.success(`Successfully loaded ${REGAL_DOCTOR_COUNT} Regal Hospital Doctors!`, {
      description:
        'Roster reset to official Regal directory. You can still add, edit, or remove members.',
    });
  };

  const validateStep = (): boolean => {
    if (step === 0) {
      const required = [
        hospital.hospitalName,
        hospital.registrationNumber,
        hospital.officialEmail,
        hospital.phone,
        hospital.address,
        hospital.city,
        hospital.state,
        hospital.pincode,
      ];
      if (required.some((v) => !v.trim())) {
        toast.error('Complete all required hospital fields.');
        return false;
      }
    }

    if (step === 1 && activeDepartmentOptions.length === 0) {
      toast.error('Select at least one department.');
      return false;
    }

    if (step === 2) {
      for (const m of members) {
        if (!m.firstName || !m.lastName || !m.email || !m.employeeId || !m.departmentName) {
          toast.error('Each member needs name, email, employee ID, and department.');
          return false;
        }
        if (m.role === 'Doctor') {
          if (!m.medicalLicenseNumber || !m.specialization || !m.qualification) {
            toast.error('Doctor profiles require license, specialization, and qualification.');
            return false;
          }
        }
      }
    }

    return true;
  };

  const goNext = () => {
    if (!validateStep()) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleIssueCredentials = async () => {
    if (!validateStep() || saving) return;

    setSaving(true);
    let result;
    try {
      result = await saveOnboardingData(
        hospital,
        activeDepartmentOptions,
        members,
        activeHospitalId,
      );
    } catch (err) {
      setSaving(false);
      const message =
        err instanceof Error ? err.message : 'Unexpected error during onboarding submission.';
      console.error('[onboarding] handleIssueCredentials:', err);
      toast.error('Supabase connection required', {
        description: message.includes('fetch')
          ? `Network error: ${message}. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.`
          : message,
      });
      return;
    }

    if (result.ok === false) {
      setSaving(false);
      console.error('[onboarding]', result.error);
      toast.error('Supabase connection required', { description: result.error });
      return;
    }

    setActiveHospitalId(result.hospitalId);
    setStoredActiveHospitalId(result.hospitalId);
    setMemberSource('database');

    try {
      const refreshed = await fetchMembersForOnboarding(result.hospitalId);
      setMembers(refreshed.members);
    } catch (err) {
      console.warn('[onboarding] post-save member refresh failed:', err);
    }

    setIssuedCredentials(result.credentials);
    setShowSummary(true);

    toast.success('Onboarding complete! Redirecting to Hospital Dashboard...', {
      description: `${result.membersSaved} members saved · Hospital ID ${result.hospitalId.slice(0, 8)}…`,
    });

    window.setTimeout(() => {
      router.push(HOSPITAL_DASHBOARD_ROUTE);
    }, 1500);
  };

  const copySummary = async () => {
    await navigator.clipboard.writeText(credentialsToPlainText(issuedCredentials));
    toast.success('Credentials copied to clipboard');
  };

  const downloadSummary = () => {
    const blob = new Blob([credentialsToCsv(issuedCredentials)], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${hospital.hospitalName.replace(/\s+/g, '_')}_credentials.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success('CSV downloaded');
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-teal-700">
              Nexora Hospital App V0
            </p>
            <h1 className="mt-1 text-3xl font-extrabold text-slate-900">
              Hospital Admin Onboarding
            </h1>
            <p className="mt-2 max-w-2xl text-base font-medium text-slate-600">
              Register your facility, configure departments, provision staff credentials, and
              activate unified role-based access.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <Building2 className="h-5 w-5 text-teal-700" />
            <span className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Step {step + 1} / {STEPS.length}
            </span>
          </div>
        </header>

        <nav className="mb-8 grid gap-2 sm:grid-cols-4">
          {STEPS.map((label, index) => {
            const active = index === step;
            const done = index < step;
            return (
              <div
                key={label}
                className={`rounded-xl border px-4 py-3 ${
                  active
                    ? 'border-teal-600 bg-teal-50'
                    : done
                      ? 'border-emerald-200 bg-emerald-50'
                      : 'border-slate-200 bg-white'
                }`}
              >
                <p className="text-sm font-bold uppercase tracking-wider text-slate-500">
                  Step {index + 1}
                </p>
                <p className="text-base font-medium text-slate-800">{label}</p>
              </div>
            );
          })}
        </nav>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {step === 0 && (
            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900">Complete Hospital Details</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="hospitalName">Hospital Name *</Label>
                  <TextInput
                    id="hospitalName"
                    value={hospital.hospitalName}
                    onChange={(v) => setHospital((h) => ({ ...h, hospitalName: v }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="registrationNumber">Registration / License Number *</Label>
                  <TextInput
                    id="registrationNumber"
                    value={hospital.registrationNumber}
                    onChange={(v) => setHospital((h) => ({ ...h, registrationNumber: v }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="taxGstinId">Tax / GSTIN ID</Label>
                  <TextInput
                    id="taxGstinId"
                    value={hospital.taxGstinId}
                    onChange={(v) => setHospital((h) => ({ ...h, taxGstinId: v }))}
                  />
                </div>
                <div>
                  <Label htmlFor="officialEmail">Official Email *</Label>
                  <TextInput
                    id="officialEmail"
                    type="email"
                    value={hospital.officialEmail}
                    onChange={(v) => setHospital((h) => ({ ...h, officialEmail: v }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <TextInput
                    id="phone"
                    value={hospital.phone}
                    onChange={(v) => setHospital((h) => ({ ...h, phone: v }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyHelpline">Emergency Helpline</Label>
                  <TextInput
                    id="emergencyHelpline"
                    value={hospital.emergencyHelpline}
                    onChange={(v) => setHospital((h) => ({ ...h, emergencyHelpline: v }))}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="address">Address *</Label>
                  <TextInput
                    id="address"
                    value={hospital.address}
                    onChange={(v) => setHospital((h) => ({ ...h, address: v }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="city">City *</Label>
                  <TextInput
                    id="city"
                    value={hospital.city}
                    onChange={(v) => setHospital((h) => ({ ...h, city: v }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <TextInput
                    id="state"
                    value={hospital.state}
                    onChange={(v) => setHospital((h) => ({ ...h, state: v }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="pincode">Pincode *</Label>
                  <TextInput
                    id="pincode"
                    value={hospital.pincode}
                    onChange={(v) => setHospital((h) => ({ ...h, pincode: v }))}
                    required
                  />
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-2xl font-bold text-slate-900">Infrastructure Specs</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <Label htmlFor="totalBeds">Total Bed Count</Label>
                    <NumberInput
                      id="totalBeds"
                      value={hospital.totalBeds}
                      onChange={(v) => setHospital((h) => ({ ...h, totalBeds: v }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="icuBeds">ICU Beds</Label>
                    <NumberInput
                      id="icuBeds"
                      value={hospital.icuBeds}
                      onChange={(v) => setHospital((h) => ({ ...h, icuBeds: v }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="opdRooms">OPD Consultation Rooms</Label>
                    <NumberInput
                      id="opdRooms"
                      value={hospital.opdRooms}
                      onChange={(v) => setHospital((h) => ({ ...h, opdRooms: v }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="otSuites">OT Suites</Label>
                    <NumberInput
                      id="otSuites"
                      value={hospital.otSuites}
                      onChange={(v) => setHospital((h) => ({ ...h, otSuites: v }))}
                    />
                  </div>
                </div>
              </div>
            </section>
          )}

          {step === 1 && (
            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900">Department Setup</h2>
              <p className="text-base font-medium text-slate-600">
                Select active departments. Add custom units as needed.
              </p>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_DEPARTMENTS.map((dept) => {
                  const active = selectedDepartments.includes(dept);
                  return (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => toggleDepartment(dept)}
                      className={`rounded-full px-4 py-2 text-sm font-bold uppercase tracking-wider transition ${
                        active
                          ? 'bg-teal-700 text-white'
                          : 'border border-slate-200 bg-white text-slate-700 hover:border-teal-300'
                      }`}
                    >
                      {dept}
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedDepartments
                  .filter((d) => !DEFAULT_DEPARTMENTS.includes(d as (typeof DEFAULT_DEPARTMENTS)[number]))
                  .map((dept) => (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => toggleDepartment(dept)}
                      className="rounded-full bg-teal-700 px-4 py-2 text-sm font-bold uppercase tracking-wider text-white"
                    >
                      {dept} ×
                    </button>
                  ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  value={customDepartment}
                  onChange={(e) => setCustomDepartment(e.target.value)}
                  placeholder="Custom department name"
                  className="min-w-[220px] flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-base font-medium text-slate-800"
                />
                <button
                  type="button"
                  onClick={addCustomDepartment}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-white"
                >
                  <Plus className="h-4 w-4" /> Add
                </button>
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="relative space-y-6">
              {loadingMembers && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-xl bg-white/80 backdrop-blur-sm">
                  <Loader2 className="h-8 w-8 animate-spin text-teal-700" aria-hidden />
                  <p className="text-sm font-bold uppercase tracking-wider text-slate-700">
                    Loading Regal Hospital roster…
                  </p>
                </div>
              )}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Staff & Doctor Credentials</h2>
                  <p className="text-base font-medium text-slate-600">
                    Add hospital members. Doctor-specific fields appear when role is Doctor.
                    {memberSource === 'database' && activeHospitalId && (
                      <span className="mt-1 block text-sm font-bold uppercase tracking-wider text-teal-700">
                        Synced from Supabase · Hospital ID {activeHospitalId.slice(0, 8)}…
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handlePreloadRegalDoctors}
                    className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-amber-950 transition hover:bg-amber-100"
                  >
                    ⚡ Preload {REGAL_DOCTOR_COUNT} Regal Hospital Doctors
                  </button>
                  <button
                    type="button"
                    onClick={() => setMembers((prev) => [...prev, emptyMember()])}
                    className="inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-teal-900"
                  >
                    <Plus className="h-4 w-4" /> Add Member
                  </button>
                </div>
              </div>

              {members.length > 0 && (
                <p className="text-base font-medium text-slate-600">
                  {members.length} member{members.length === 1 ? '' : 's'} in roster — including any
                  manually added staff.
                </p>
              )}

              <div className="space-y-4">
                {members.map((member, index) => (
                  <div
                    key={member.key}
                    className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-base font-medium text-slate-800">
                        Member #{index + 1}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeMember(member.key)}
                        className="inline-flex items-center gap-1 text-sm font-bold uppercase tracking-wider text-rose-700"
                      >
                        <Trash2 className="h-4 w-4" /> Remove
                      </button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <Label>First Name *</Label>
                        <TextInput
                          id={`first-${member.key}`}
                          value={member.firstName}
                          onChange={(v) => updateMember(member.key, { firstName: v })}
                        />
                      </div>
                      <div>
                        <Label>Last Name *</Label>
                        <TextInput
                          id={`last-${member.key}`}
                          value={member.lastName}
                          onChange={(v) => updateMember(member.key, { lastName: v })}
                        />
                      </div>
                      <div>
                        <Label>Email *</Label>
                        <TextInput
                          id={`email-${member.key}`}
                          type="email"
                          value={member.email}
                          onChange={(v) => updateMember(member.key, { email: v })}
                        />
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <TextInput
                          id={`phone-${member.key}`}
                          value={member.phone}
                          onChange={(v) => updateMember(member.key, { phone: v })}
                        />
                      </div>
                      <div>
                        <Label>Employee ID *</Label>
                        <TextInput
                          id={`emp-${member.key}`}
                          value={member.employeeId}
                          onChange={(v) => updateMember(member.key, { employeeId: v })}
                        />
                      </div>
                      <div>
                        <Label>Role *</Label>
                        <select
                          value={member.role}
                          onChange={(e) =>
                            updateMember(member.key, {
                              role: e.target.value as HospitalMemberRole,
                            })
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base font-medium text-slate-800"
                        >
                          {HOSPITAL_MEMBER_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label>Department *</Label>
                        <select
                          value={member.departmentName}
                          onChange={(e) =>
                            updateMember(member.key, { departmentName: e.target.value })
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base font-medium text-slate-800"
                        >
                          {Array.from(
                            new Set([...activeDepartmentOptions, member.departmentName].filter(Boolean)),
                          ).map((dept) => (
                            <option key={dept} value={dept}>
                              {dept}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {member.role === 'Doctor' && (
                      <div className="mt-3 grid gap-3 border-t border-slate-200 pt-3 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <Label>Medical License Number *</Label>
                          <TextInput
                            id={`license-${member.key}`}
                            value={member.medicalLicenseNumber ?? ''}
                            onChange={(v) =>
                              updateMember(member.key, { medicalLicenseNumber: v })
                            }
                          />
                        </div>
                        <div>
                          <Label>Specialization *</Label>
                          <TextInput
                            id={`spec-${member.key}`}
                            value={member.specialization ?? ''}
                            onChange={(v) => updateMember(member.key, { specialization: v })}
                          />
                        </div>
                        <div>
                          <Label>Qualification *</Label>
                          <TextInput
                            id={`qual-${member.key}`}
                            value={member.qualification ?? ''}
                            onChange={(v) => updateMember(member.key, { qualification: v })}
                            placeholder="MBBS, MD"
                          />
                        </div>
                        <div>
                          <Label>Experience (Years)</Label>
                          <NumberInput
                            id={`exp-${member.key}`}
                            value={member.experienceYears ?? 0}
                            onChange={(v) => updateMember(member.key, { experienceYears: v })}
                          />
                        </div>
                        <div>
                          <Label>Consultation Fee (₹)</Label>
                          <NumberInput
                            id={`fee-${member.key}`}
                            value={member.consultationFee ?? 0}
                            onChange={(v) => updateMember(member.key, { consultationFee: v })}
                          />
                        </div>
                        <div>
                          <Label>OPD Room #</Label>
                          <TextInput
                            id={`room-${member.key}`}
                            value={member.opdRoomNumber ?? ''}
                            onChange={(v) => updateMember(member.key, { opdRoomNumber: v })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900">Credential Generation & Summary</h2>
              <p className="text-base font-medium text-slate-600">
                Review provisioning details. Secure temporary passwords will be generated for each
                member when you save.
              </p>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-sm font-bold uppercase tracking-wider text-slate-500">
                    Hospital
                  </p>
                  <p className="mt-1 text-base font-medium text-slate-800">
                    {hospital.hospitalName || '—'}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-sm font-bold uppercase tracking-wider text-slate-500">
                    Departments
                  </p>
                  <p className="mt-1 text-base font-medium text-slate-800">
                    {activeDepartmentOptions.length} active
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-sm font-bold uppercase tracking-wider text-slate-500">
                    Members
                  </p>
                  <p className="mt-1 text-base font-medium text-slate-800">{members.length}</p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full text-left">
                  <thead className="bg-slate-100">
                    <tr>
                      {['Name', 'Employee ID', 'Email', 'Role', 'Department', 'App'].map(
                        (col) => (
                          <th
                            key={col}
                            className="px-4 py-3 text-sm font-bold uppercase tracking-wider text-slate-600"
                          >
                            {col}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => (
                      <tr key={m.key} className="border-t border-slate-200">
                        <td className="px-4 py-3 text-base font-medium text-slate-800">
                          {m.firstName} {m.lastName}
                        </td>
                        <td className="px-4 py-3 text-base font-medium text-slate-800">
                          {m.employeeId}
                        </td>
                        <td className="px-4 py-3 text-base font-medium text-slate-800">
                          {m.email}
                        </td>
                        <td className="px-4 py-3 text-base font-medium text-slate-800">
                          {m.role}
                        </td>
                        <td className="px-4 py-3 text-base font-medium text-slate-800">
                          {m.departmentName}
                        </td>
                        <td className="px-4 py-3 text-base font-medium text-slate-800">
                          {m.role === 'Doctor' ? 'Doctor App' : 'Hospital App'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={handleIssueCredentials}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-800 px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-teal-900 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Completing onboarding…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Complete Onboarding
                  </>
                )}
              </button>
            </section>
          )}

          <footer className="mt-8 flex flex-wrap justify-between gap-3 border-t border-slate-200 pt-6">
            <button
              type="button"
              onClick={goBack}
              disabled={step === 0 || saving}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-slate-700 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            {step < STEPS.length - 1 && (
              <button
                type="button"
                onClick={goNext}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-white"
              >
                Continue <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </footer>
        </div>
      </div>

      {showSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
                <p className="text-sm font-bold uppercase tracking-wider">Credentials Issued</p>
              </div>
              <h3 className="mt-1 text-xl font-bold text-slate-900">Member Login Summary</h3>
              <p className="text-base font-medium text-slate-600">
                Share these temporary passwords securely. They will not be shown again.
              </p>
            </div>
            <div className="max-h-[50vh] overflow-auto px-6 py-4">
              <table className="min-w-full text-left">
                <thead className="sticky top-0 bg-white">
                  <tr>
                    {[
                      'Employee ID',
                      'Email',
                      'Temp Password',
                      'Role',
                      'Assigned App',
                    ].map((col) => (
                      <th
                        key={col}
                        className="px-3 py-2 text-sm font-bold uppercase tracking-wider text-slate-600"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {issuedCredentials.map((c) => (
                    <tr key={c.employeeId} className="border-t border-slate-100">
                      <td className="px-3 py-2 text-base font-medium text-slate-800">
                        {c.employeeId}
                      </td>
                      <td className="px-3 py-2 text-base font-medium text-slate-800">{c.email}</td>
                      <td className="px-3 py-2 font-mono text-base font-medium text-teal-800">
                        {c.temporaryPassword}
                      </td>
                      <td className="px-3 py-2 text-base font-medium text-slate-800">{c.role}</td>
                      <td className="px-3 py-2 text-base font-medium text-slate-800">
                        {c.assignedApp}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap gap-2 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={copySummary}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-slate-800"
              >
                <Copy className="h-4 w-4" /> Copy All
              </button>
              <button
                type="button"
                onClick={downloadSummary}
                className="inline-flex items-center gap-2 rounded-xl bg-teal-800 px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-white"
              >
                <Download className="h-4 w-4" /> Download CSV
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSummary(false);
                  router.push(HOSPITAL_DASHBOARD_ROUTE);
                }}
                className="ml-auto rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-white"
              >
                Go to Hospital Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
