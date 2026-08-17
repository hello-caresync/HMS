'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  BadgeCheck,
  Building2,
  GraduationCap,
  Image as ImageIcon,
  Loader2,
  PenLine,
  Save,
  Signature,
  Stethoscope,
  Upload,
  UserRound,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  getDoctorSession,
  setDoctorSession,
  type DoctorSession,
} from '@/lib/doctor/session';
import { supabase } from '@/lib/supabaseClient';

type DoctorProfile = {
  employeeId: string;
  fullName: string;
  department: string;
  departmentId: string | null;
  medicalLicenseNumber: string;
  specialization: string;
  qualification: string;
  experienceYears: string;
  consultationFee: string;
  opdRoomNumber: string;
  email: string;
  phone: string;
};

type HospitalMember = {
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  department_id: string | null;
  medical_license_number: string | null;
  specialization: string | null;
  qualification: string | null;
  experience_years: number | null;
  consultation_fee: number | null;
  opd_room_number: string | null;
  departments?: { name?: string } | { name?: string }[] | null;
};

type DigitalSignature = {
  mode: 'typed' | 'image';
  typedValue: string;
  imageDataUrl: string;
  imageName: string;
  storagePath?: string;
  storageUrl?: string;
};

const SIGNATURE_KEY = 'curasync_doctor_signature';
const ACTIVE_DOCTOR_KEY = 'curasync_active_doctor';
const DOCTOR_PROFILE_UPDATED_EVENT = 'doctor-profile-updated';
const DOCTOR_CONFLICT_TARGETS = ['employee_id', 'registration_number', 'email'] as const;
const emptySignature: DigitalSignature = {
  mode: 'typed',
  typedValue: '',
  imageDataUrl: '',
  imageName: '',
};
const clayCard =
  'rounded-3xl border border-white/80 bg-gradient-to-br from-white via-white/95 to-[#F2F6FA] shadow-[10px_10px_24px_rgba(137,74,102,0.12),-8px_-8px_20px_rgba(255,255,255,0.95)]';
const glassPanel =
  'rounded-3xl border border-white/70 bg-white/55 backdrop-blur-xl shadow-[0_18px_45px_rgba(44,36,59,0.10)]';

function readSignature(): DigitalSignature {
  try {
    return {
      ...emptySignature,
      ...(JSON.parse(localStorage.getItem(SIGNATURE_KEY) ?? '{}') as Partial<DigitalSignature>),
    };
  } catch {
    return emptySignature;
  }
}

function writeSignature(signature: DigitalSignature) {
  localStorage.setItem(SIGNATURE_KEY, JSON.stringify(signature));
}

function departmentName(value: HospitalMember['departments'], fallback: string) {
  if (Array.isArray(value)) return value[0]?.name || fallback;
  return value?.name || fallback;
}

// The doctors directory exists in two historical shapes, so unknown columns are
// dropped and the conflict target falls back until one combination is accepted.
async function upsertDoctorRow(payload: Record<string, unknown>) {
  let candidate: Record<string, unknown> = { ...payload };
  let targetIndex = 0;

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const { error } = await supabase
      .from('doctors')
      .upsert(candidate, { onConflict: DOCTOR_CONFLICT_TARGETS[targetIndex] });
    if (!error) return { synced: true };

    if (error.code === '42P01') return { synced: false };

    const missingColumn = error.message.match(/'([^']+)' column/)?.[1];
    if (missingColumn && missingColumn in candidate) {
      const next = { ...candidate };
      delete next[missingColumn];
      candidate = next;
      continue;
    }

    if (error.code === '42P10' && targetIndex < DOCTOR_CONFLICT_TARGETS.length - 1) {
      targetIndex += 1;
      continue;
    }

    throw error;
  }

  throw new Error('The doctors directory rejected every supported column combination.');
}

function fromSession(session: DoctorSession): DoctorProfile {
  return {
    employeeId: session.employeeId,
    fullName: session.fullName,
    department: session.department,
    departmentId: null,
    medicalLicenseNumber: '',
    specialization: '',
    qualification: '',
    experienceYears: '',
    consultationFee: session.consultationFee ? String(session.consultationFee) : '',
    opdRoomNumber: session.opdRoom ?? '',
    email: '',
    phone: '',
  };
}

export default function DoctorProfilePage() {
  const [session] = useState(getDoctorSession);
  const [profile, setProfile] = useState<DoctorProfile>(() => fromSession(session));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [offline, setOffline] = useState(false);
  const [source, setSource] = useState<'database' | 'session'>('session');
  const [signature, setSignature] = useState<DigitalSignature>(emptySignature);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('hospital_members')
        .select(
          'employee_id, first_name, last_name, email, phone, department_id, medical_license_number, specialization, qualification, experience_years, consultation_fee, opd_room_number, departments(name)',
        )
        .eq('employee_id', session.employeeId)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        setProfile(fromSession(session));
        setSource('session');
        return;
      }

      const member = data as unknown as HospitalMember;
      const rawName = `${member.first_name ?? ''} ${member.last_name ?? ''}`.trim();
      setProfile({
        employeeId: member.employee_id,
        fullName: rawName
          ? `Dr. ${rawName}`.replace(/^Dr\.\s*Dr\.?\s*/i, 'Dr. ')
          : session.fullName,
        department: departmentName(member.departments, session.department),
        departmentId: member.department_id,
        medicalLicenseNumber: member.medical_license_number ?? '',
        specialization: member.specialization ?? '',
        qualification: member.qualification ?? '',
        experienceYears:
          member.experience_years === null ? '' : String(member.experience_years),
        consultationFee:
          member.consultation_fee === null ? '' : String(member.consultation_fee),
        opdRoomNumber: member.opd_room_number ?? '',
        email: member.email ?? '',
        phone: member.phone ?? '',
      });
      setSource('database');
      setOffline(false);
    } catch (error) {
      setProfile(fromSession(session));
      setSource('session');
      setOffline(true);
      toast.warning('Profile is in local mode', {
        description:
          error instanceof Error ? error.message : 'Using the active doctor session.',
      });
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      setSignature(readSignature());
      void loadProfile();
    }, 0);
    return () => window.clearTimeout(initialLoad);
  }, [loadProfile]);

  const setField = (field: keyof DoctorProfile, value: string) => {
    setProfile((current) => ({ ...current, [field]: value }));
  };

  const handleSaveProfile = async (formData: Record<string, unknown>) => {
    setSaving(true);
    try {
      const specialty =
        (formData.specialty as string) || (formData.specialization as string) || 'Consultant';
      const license =
        (formData.medical_license as string) ||
        (formData.registration_number as string) ||
        'REG-PENDING';
      const payload = {
        employee_id: (formData.employee_id as string) || 'RH-D06',
        full_name: (formData.full_name as string) || (formData.name as string) || 'Doctor',
        department: (formData.department as string) || 'General Medicine',
        specialty,
        specialization: specialty,
        medical_license: license,
        registration_number: license,
        email: (formData.email as string) || '',
        phone: (formData.phone as string) || '',
        qualification: (formData.qualification as string) || 'MBBS',
        room_number: (formData.room_number as string) || '',
        consultation_fee: formData.consultation_fee ? Number(formData.consultation_fee) : 800,
        bio: (formData.bio as string) || '',
        updated_at: new Date().toISOString(),
      };

      // Written before the network call so a refresh keeps the chosen profile even offline.
      localStorage.setItem(ACTIVE_DOCTOR_KEY, JSON.stringify(payload));
      window.dispatchEvent(new Event(DOCTOR_PROFILE_UPDATED_EVENT));

      const { synced } = await upsertDoctorRow(payload);
      toast.success(
        synced
          ? 'Doctor profile updated and synced successfully.'
          : 'Doctor profile saved to this device.',
      );
    } catch (error) {
      console.error('Error saving doctor profile:', error);
      toast.error('Failed to save profile changes');
    } finally {
      setSaving(false);
    }
  };

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    writeSignature(signature);
    const nextSession: DoctorSession = {
      ...session,
      employeeId: profile.employeeId,
      fullName: profile.fullName,
      doctor_name: profile.fullName,
      department: profile.department.trim() || session.department,
      email: profile.email.trim() || session.email,
      specialization: profile.specialization.trim() || session.specialization,
      qualification: profile.qualification.trim() || session.qualification,
      opdRoom: profile.opdRoomNumber.trim() || undefined,
      consultationFee: profile.consultationFee
        ? Number(profile.consultationFee)
        : undefined,
      fee: profile.consultationFee
        ? Number(profile.consultationFee)
        : session.fee,
    };
    setDoctorSession(nextSession);

    try {
      let resolvedDepartmentId = profile.departmentId;
      if (profile.department.trim()) {
        const { data: department, error: departmentError } = await supabase
          .from('departments')
          .select('id')
          .ilike('name', profile.department.trim())
          .limit(1)
          .maybeSingle();
        if (departmentError) throw departmentError;
        resolvedDepartmentId = department?.id ?? profile.departmentId;
      }

      const update = {
        department_id: resolvedDepartmentId,
        medical_license_number: profile.medicalLicenseNumber.trim() || null,
        specialization: profile.specialization.trim() || null,
        qualification: profile.qualification.trim() || null,
        experience_years: profile.experienceYears
          ? Number(profile.experienceYears)
          : null,
        consultation_fee: profile.consultationFee
          ? Number(profile.consultationFee)
          : null,
        opd_room_number: profile.opdRoomNumber.trim() || null,
        email: profile.email.trim() || null,
        phone: profile.phone.trim() || null,
      };
      const { data, error } = await supabase
        .from('hospital_members')
        .update(update)
        .eq('employee_id', profile.employeeId)
        .select('employee_id')
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('No matching hospital member was found.');

      let signatureMetadata: DigitalSignature = signature;
      if (signature.mode === 'image' && signature.imageDataUrl && signature.imageName) {
        try {
          const blob = await fetch(signature.imageDataUrl).then((response) => response.blob());
          const safeName = signature.imageName.replace(/[^a-zA-Z0-9._-]/g, '_');
          const path = `${profile.employeeId}/${Date.now()}-${safeName}`;
          const { error: uploadError } = await supabase.storage
            .from('doctor-signatures')
            .upload(path, blob, { contentType: blob.type, upsert: true });
          if (!uploadError) {
            const { data: publicData } = supabase.storage
              .from('doctor-signatures')
              .getPublicUrl(path);
            signatureMetadata = {
              ...signature,
              storagePath: path,
              storageUrl: publicData.publicUrl,
            };
            setSignature(signatureMetadata);
            writeSignature(signatureMetadata);
          }
        } catch {
          // The local preview remains the source of truth when storage is unavailable.
        }
      }

      const signatureUpdate =
        signatureMetadata.mode === 'typed'
          ? {
              signature_type: 'typed',
              signature_text: signatureMetadata.typedValue.trim() || null,
              signature_file_path: null,
              signature_file_url: null,
            }
          : {
              signature_type: 'image',
              signature_text: null,
              signature_file_path: signatureMetadata.storagePath ?? null,
              signature_file_url: signatureMetadata.storageUrl ?? null,
            };
      await supabase
        .from('hospital_members')
        .update(signatureUpdate)
        .eq('employee_id', profile.employeeId);

      setProfile((current) => ({ ...current, departmentId: resolvedDepartmentId }));
      setSource('database');
      setOffline(false);

      await handleSaveProfile({
        employee_id: profile.employeeId,
        full_name: profile.fullName,
        department: profile.department.trim(),
        specialization: profile.specialization.trim(),
        medical_license: profile.medicalLicenseNumber.trim(),
        email: profile.email.trim(),
        phone: profile.phone.trim(),
        qualification: profile.qualification.trim(),
        room_number: profile.opdRoomNumber.trim(),
        consultation_fee: profile.consultationFee,
      });
    } catch (error) {
      setSource('session');
      setOffline(true);
      toast.warning('Profile saved to this device', {
        description:
          error instanceof Error
            ? error.message
            : 'The hospital directory could not be updated.',
      });
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full rounded-2xl border border-white/80 bg-white/70 px-3 py-2.5 text-sm shadow-inner outline-none backdrop-blur transition focus:border-[#894A66] focus:ring-2 focus:ring-[#894A66]/15';

  return (
    <section className="min-h-full bg-[radial-gradient(circle_at_top_left,_#BDE2F5_0,_#F2F6FA_40%,_#F2F6FA_100%)] p-4 text-[#2C243B] sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className={`${glassPanel} flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7`}>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-gradient-to-br from-[#BDE2F5] to-[#A9C5E3] p-3 text-[#894A66] shadow-[5px_5px_12px_rgba(137,74,102,0.14),-4px_-4px_10px_white]">
              <Stethoscope className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Doctor profile</h1>
              <p className="mt-1 text-sm text-[#2C243B]/60">
                Clinical credentials and department settings.
              </p>
            </div>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#BDE2F5]/70 px-3 py-1.5 text-xs font-bold text-[#894A66]">
            <BadgeCheck className="h-4 w-4" />
            {source === 'database' ? 'Hospital directory' : 'Local session'}
          </span>
        </header>

        {offline && (
          <div className="flex items-center gap-2 rounded-2xl border border-[#93688E]/35 bg-[#BDE2F5]/45 px-4 py-3 text-sm text-[#2C243B]">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Hospital directory access is unavailable. Changes still update the active local session.
          </div>
        )}

        {loading ? (
          <div className={`${glassPanel} flex min-h-96 items-center justify-center`}>
            <Loader2 className="h-8 w-8 animate-spin text-[#894A66]" />
          </div>
        ) : (
          <form onSubmit={saveProfile} className="space-y-6">
            <div className={`${clayCard} p-5 sm:p-7`}>
              <h2 className="flex items-center gap-2 font-black">
                <UserRound className="h-5 w-5 text-[#93688E]" /> Identity
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-[#2C243B]/65">Doctor name</span>
                  <input value={profile.fullName} readOnly className={`${inputClass} cursor-not-allowed opacity-70`} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-[#2C243B]/65">Employee ID</span>
                  <input value={profile.employeeId} readOnly className={`${inputClass} cursor-not-allowed opacity-70`} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-[#2C243B]/65">Email</span>
                  <input type="email" value={profile.email} onChange={(event) => setField('email', event.target.value)} className={inputClass} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-[#2C243B]/65">Phone</span>
                  <input type="tel" value={profile.phone} onChange={(event) => setField('phone', event.target.value)} className={inputClass} />
                </label>
              </div>
            </div>

            <div className={`${clayCard} p-5 sm:p-7`}>
              <h2 className="flex items-center gap-2 font-black">
                <GraduationCap className="h-5 w-5 text-[#93688E]" /> Clinical credentials
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-[#2C243B]/65">Medical license number</span>
                  <input required value={profile.medicalLicenseNumber} onChange={(event) => setField('medicalLicenseNumber', event.target.value)} className={inputClass} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-[#2C243B]/65">Qualification</span>
                  <input value={profile.qualification} onChange={(event) => setField('qualification', event.target.value)} className={inputClass} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-[#2C243B]/65">Specialization</span>
                  <input value={profile.specialization} onChange={(event) => setField('specialization', event.target.value)} className={inputClass} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-[#2C243B]/65">Experience (years)</span>
                  <input min="0" type="number" value={profile.experienceYears} onChange={(event) => setField('experienceYears', event.target.value)} className={inputClass} />
                </label>
              </div>
            </div>

            <div className={`${clayCard} p-5 sm:p-7`}>
              <h2 className="flex items-center gap-2 font-black">
                <Building2 className="h-5 w-5 text-[#93688E]" /> Department settings
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <label className="block sm:col-span-1">
                  <span className="mb-1.5 block text-xs font-bold text-[#2C243B]/65">Department</span>
                  <input required value={profile.department} onChange={(event) => setField('department', event.target.value)} className={inputClass} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-[#2C243B]/65">OPD room</span>
                  <input value={profile.opdRoomNumber} onChange={(event) => setField('opdRoomNumber', event.target.value)} className={inputClass} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-[#2C243B]/65">Consultation fee</span>
                  <input min="0" type="number" value={profile.consultationFee} onChange={(event) => setField('consultationFee', event.target.value)} className={inputClass} />
                </label>
              </div>
            </div>

            <div className={`${clayCard} p-5 sm:p-7`}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="flex items-center gap-2 font-black">
                    <Signature className="h-5 w-5 text-[#93688E]" /> Digital signature
                  </h2>
                  <p className="mt-1 text-sm text-[#2C243B]/55">
                    Set a signature for prescriptions without changing your verified credentials.
                  </p>
                </div>
                <div className="inline-flex w-fit rounded-2xl border border-white bg-[#F2F6FA] p-1 shadow-inner">
                  {(['typed', 'image'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setSignature((current) => ({ ...current, mode }))}
                      className={`rounded-xl px-3 py-1.5 text-xs font-bold capitalize transition active:scale-95 ${
                        signature.mode === mode
                          ? 'bg-[#894A66] text-white shadow-sm'
                          : 'text-[#2C243B]/55'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-[1fr_300px]">
                <div>
                  {signature.mode === 'typed' ? (
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-bold text-[#2C243B]/65">
                        Typed signature
                      </span>
                      <div className="relative">
                        <PenLine className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#93688E]" />
                        <input
                          value={signature.typedValue}
                          onChange={(event) =>
                            setSignature((current) => ({
                              ...current,
                              typedValue: event.target.value,
                            }))
                          }
                          placeholder="Type your signature"
                          className={`${inputClass} pl-10`}
                        />
                      </div>
                    </label>
                  ) : (
                    <div>
                      <span className="mb-1.5 block text-xs font-bold text-[#2C243B]/65">
                        Signature image
                      </span>
                      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-[#9887B1] bg-[#BDE2F5]/25 px-4 py-5 text-sm font-bold text-[#894A66] transition active:scale-95">
                        <Upload className="h-4 w-4" /> Upload PNG, JPG or WEBP
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="sr-only"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (!file) return;
                            if (file.size > 2 * 1024 * 1024) {
                              toast.error('Signature image is too large', {
                                description: 'Choose an image smaller than 2 MB.',
                              });
                              event.target.value = '';
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = () =>
                              setSignature((current) => ({
                                ...current,
                                imageDataUrl: String(reader.result ?? ''),
                                imageName: file.name,
                                storagePath: undefined,
                                storageUrl: undefined,
                              }));
                            reader.onerror = () => toast.error('Could not read signature image');
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                      {signature.imageName && (
                        <div className="mt-2 flex items-center justify-between text-xs text-[#2C243B]/55">
                          <span className="flex min-w-0 items-center gap-1.5 truncate">
                            <ImageIcon className="h-3.5 w-3.5 shrink-0" /> {signature.imageName}
                          </span>
                          <button
                            type="button"
                            aria-label="Remove signature image"
                            onClick={() =>
                              setSignature((current) => ({
                                ...current,
                                imageDataUrl: '',
                                imageName: '',
                                storagePath: undefined,
                                storageUrl: undefined,
                              }))
                            }
                            className="rounded-full p-1 transition hover:bg-[#F2F6FA] active:scale-95"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex min-h-32 items-center justify-center rounded-2xl border border-white/80 bg-gradient-to-br from-white to-[#BDE2F5]/30 p-5 shadow-inner">
                  {signature.mode === 'typed' && signature.typedValue.trim() ? (
                    <p className="break-words text-center font-serif text-3xl italic text-[#894A66]">
                      {signature.typedValue}
                    </p>
                  ) : signature.mode === 'image' && signature.imageDataUrl ? (
                    <Image
                      src={signature.imageDataUrl}
                      alt="Digital signature preview"
                      width={280}
                      height={96}
                      unoptimized
                      className="max-h-24 max-w-full object-contain"
                    />
                  ) : (
                    <p className="text-center text-xs font-semibold text-[#2C243B]/40">
                      Signature preview
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#894A66] to-[#93688E] px-5 py-3 text-sm font-bold text-white shadow-[6px_6px_14px_rgba(137,74,102,0.28),-4px_-4px_10px_white] transition active:scale-95 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save profile
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
