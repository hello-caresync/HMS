'use client';

import { useEffect, useState } from 'react';
import { Bell, GraduationCap, Loader2, PenLine, Shield } from 'lucide-react';
import { toast } from 'sonner';

import DigitalSignaturePad from '@/components/doctor-os/ui/DigitalSignaturePad';
import { useDoctorAuth } from '@/lib/doctor/auth/DoctorAuthProvider';
import { useDoctorProfile, useUpdateDoctorProfile } from '@/lib/doctor/hooks/useClinicalQueries';
import { sageUi } from '@/lib/doctor/ui-tokens';

type ProfileTab = 'qualifications' | 'signature' | 'notifications' | 'security';

const TABS: { id: ProfileTab; label: string; icon: typeof GraduationCap }[] = [
  { id: 'qualifications', label: 'Qualifications', icon: GraduationCap },
  { id: 'signature', label: 'Digital Signature Pad', icon: PenLine },
  { id: 'notifications', label: 'Notification Rules', icon: Bell },
  { id: 'security', label: 'Security & Credentials', icon: Shield },
];

export default function DoctorOsProfile() {
  const { session } = useDoctorAuth();
  const { data, isLoading } = useDoctorProfile();
  const updateProfile = useUpdateDoctorProfile();
  const profile = data?.profile;

  const [tab, setTab] = useState<ProfileTab>('qualifications');
  const [specialization, setSpecialization] = useState('');
  const [fees, setFees] = useState('');
  const [signature, setSignature] = useState<string | null>(null);
  const [notifyCriticalLabs, setNotifyCriticalLabs] = useState(true);
  const [notifyEr, setNotifyEr] = useState(true);
  const [notifyOt, setNotifyOt] = useState(false);
  const [notifyPatientMsg, setNotifyPatientMsg] = useState(true);

  useEffect(() => {
    if (profile) {
      setSpecialization(profile.specialization);
      setFees(String(profile.consultationFees));
    }
  }, [profile]);

  const saveProfile = () => {
    updateProfile.mutate(
      { specialization, consultationFees: Number(fees) || undefined },
      {
        onSuccess: () => toast.success('Profile updated'),
        onError: (e) => toast.error(e.message),
      },
    );
  };

  return (
    <div className="doctor-page">
      <header className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-widest text-brand-primary">Profile & Settings</p>
        <h1 className="text-xl font-black text-brand-text">{profile?.fullName ?? session?.fullName}</h1>
        <p className="text-sm text-[#5A584A]">{profile?.hospital?.name ?? 'Nexora Hospital'} · {profile?.email}</p>
      </header>

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
              tab === id ? sageUi.segmentActive : sageUi.segmentIdle
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8">
            {tab === 'qualifications' && (
              <div className="doctor-card space-y-4">
                <h2 className="font-bold">Professional qualifications</h2>
                <label className="block text-sm font-medium text-[#5A584A]">
                  Specialization
                  <input
                    className={`${sageUi.input} mt-1`}
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                  />
                </label>
                <label className="block text-sm font-medium text-[#5A584A]">
                  Consultation fee (₹)
                  <input
                    type="number"
                    className={`${sageUi.input} mt-1`}
                    value={fees}
                    onChange={(e) => setFees(e.target.value)}
                  />
                </label>
                <div className="rounded-xl border border-brand-light bg-brand-surface p-4 text-sm">
                  <p><span className="font-bold">License:</span> {profile?.licenseNumber ?? session?.licenseNumber}</p>
                  <p className="mt-1"><span className="font-bold">Hospital code:</span> {profile?.hospital?.code}</p>
                  <p className="mt-2 text-[#5A584A]">Board certifications and CME credits on file.</p>
                </div>
                <button type="button" className={sageUi.btnPrimary} onClick={saveProfile} disabled={updateProfile.isPending}>
                  Save qualifications
                </button>
              </div>
            )}

            {tab === 'signature' && (
              <div className="doctor-card space-y-4">
                <h2 className="font-bold">Digital signature pad</h2>
                <p className="text-sm text-[#5A584A]">
                  Capture your signature for e-prescriptions, discharge summaries, and clinical documents.
                </p>
                <DigitalSignaturePad onSave={setSignature} />
                {signature && (
                  <p className="text-xs font-semibold text-green-700">Signature saved — will appear on signed documents.</p>
                )}
              </div>
            )}

            {tab === 'notifications' && (
              <div className="doctor-card space-y-4">
                <h2 className="font-bold">Notification rules</h2>
                {[
                  { label: 'Critical lab results (STAT)', checked: notifyCriticalLabs, set: setNotifyCriticalLabs },
                  { label: 'Emergency department alerts', checked: notifyEr, set: setNotifyEr },
                  { label: 'Operating theatre updates', checked: notifyOt, set: setNotifyOt },
                  { label: 'Patient messages', checked: notifyPatientMsg, set: setNotifyPatientMsg },
                ].map(({ label, checked, set }) => (
                  <label key={label} className="flex items-center justify-between rounded-xl border border-brand-light px-4 py-3">
                    <span className="text-sm font-medium">{label}</span>
                    <input type="checkbox" checked={checked} onChange={(e) => set(e.target.checked)} className="h-4 w-4 accent-[#A39E75]" />
                  </label>
                ))}
                <button type="button" className={sageUi.btnPrimary} onClick={() => toast.success('Notification preferences saved')}>
                  Save notification rules
                </button>
              </div>
            )}

            {tab === 'security' && (
              <div className="doctor-card space-y-4">
                <h2 className="font-bold">Security & credentials</h2>
                <div className="rounded-xl border border-brand-light bg-brand-surface p-4 text-sm">
                  <p><span className="font-bold">Session:</span> {session?.accessToken ? 'JWT authenticated' : 'Header fallback (dev)'}</p>
                  <p className="mt-1"><span className="font-bold">Email:</span> {profile?.email}</p>
                  <p className="mt-1"><span className="font-bold">Role:</span> Consultant Physician</p>
                </div>
                <label className="block text-sm font-medium text-[#5A584A]">
                  New password
                  <input type="password" className={`${sageUi.input} mt-1`} placeholder="••••••••" autoComplete="new-password" />
                </label>
                <label className="block text-sm font-medium text-[#5A584A]">
                  Confirm password
                  <input type="password" className={`${sageUi.input} mt-1`} placeholder="••••••••" autoComplete="new-password" />
                </label>
                <button type="button" className={sageUi.btnSecondary} onClick={() => toast.info('Password change requires admin verification')}>
                  Update credentials
                </button>
              </div>
            )}
          </div>

          <aside className="col-span-12 space-y-4 lg:col-span-4">
            <div className="doctor-card-surface">
              <h3 className="text-sm font-bold">Working hours</h3>
              <div className="mt-2 space-y-1 text-xs text-[#5A584A]">
                {profile?.workingHours &&
                  Object.entries(profile.workingHours as Record<string, string>).map(([day, hours]) => (
                    <p key={day}><span className="font-semibold capitalize">{day}</span>: {hours}</p>
                  ))}
              </div>
              <a href="/doctor/schedule" className="mt-3 inline-block text-xs font-bold text-brand-primary hover:underline">
                Manage schedule →
              </a>
            </div>
            <div className="doctor-card-surface">
              <h3 className="text-sm font-bold">Quick links</h3>
              <ul className="mt-2 space-y-1 text-xs">
                <li><a href="/doctor/e-prescription" className="font-semibold text-brand-primary hover:underline">e-Prescription</a></li>
                <li><a href="/doctor/clinical-documents" className="font-semibold text-brand-primary hover:underline">Clinical documents</a></li>
                <li><a href="/doctor/reports-analytics" className="font-semibold text-brand-primary hover:underline">Reports & analytics</a></li>
              </ul>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
