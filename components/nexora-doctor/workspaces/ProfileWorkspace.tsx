'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';

import { ui } from '@/components/nexora-doctor/ui/primitives';
import { SectionHeader } from '@/components/nexora-doctor/ui/shared';
import { useDoctorAuth } from '@/lib/doctor/auth/DoctorAuthProvider';
import { useDoctorClinicalStore } from '@/lib/nexora-doctor/store';

export function ProfileWorkspace() {
  const { session, signOut } = useDoctorAuth();
  const profile = useDoctorClinicalStore((s) => s.profile);
  const updateProfile = useDoctorClinicalStore((s) => s.updateProfile);
  const notificationPrefs = useDoctorClinicalStore((s) => s.notificationPrefs);
  const setNotificationPrefs = useDoctorClinicalStore((s) => s.setNotificationPrefs);
  const router = useRouter();

  const handleLogout = () => {
    signOut();
    useDoctorClinicalStore.getState().reset();
    toast.success('Signed out');
    router.push('/doctor/auth/login');
  };

  if (!profile) {
    return (
      <div className={ui.page}>
        <p className="text-[#2C3531]/60">Loading profile…</p>
      </div>
    );
  }

  return (
    <div className={ui.page}>
      <div className="mb-8">
        <h1 className={ui.pageTitle}>Profile</h1>
        <p className={ui.pageSubtitle}>Doctor account & availability</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={ui.card}>
          <SectionHeader title="Doctor Information" />
          <div className="space-y-4">
            <Field label="Full Name" value={profile.fullName} onChange={(v) => updateProfile({ fullName: v })} />
            <Field label="Email" value={profile.email} onChange={(v) => updateProfile({ email: v })} />
            <Field label="Phone" value={profile.phone} onChange={(v) => updateProfile({ phone: v })} />
            <Field label="Registration ID" value={profile.licenseNumber} readOnly />
            <Field
              label="Specialization"
              value={profile.specialization}
              onChange={(v) => updateProfile({ specialization: v })}
            />
            <div>
              <label className="text-xs font-medium text-[#2C3531]/60">Department</label>
              <p className="mt-1 text-sm font-medium">{profile.department}</p>
            </div>
          </div>
        </section>

        <section className={ui.card}>
          <SectionHeader title="Availability" />
          <div className="mb-4">
            <label className="text-xs font-medium text-[#2C3531]/60">Status</label>
            <select
              value={profile.availability}
              onChange={(e) =>
                updateProfile({ availability: e.target.value as typeof profile.availability })
              }
              className={`${ui.select} mt-1 w-full`}
            >
              <option value="available">Available</option>
              <option value="busy">Busy</option>
              <option value="off-duty">Off Duty</option>
            </select>
          </div>
          <SectionHeader title="Working Days & Hours" />
          <ul className="space-y-2">
            {profile.workingHours.map((wh) => (
              <li
                key={wh.day}
                className="flex justify-between rounded-lg bg-[#F4F6F0] px-3 py-2 text-sm"
              >
                <span className="font-medium">{wh.day}</span>
                <span className="text-[#2C3531]/70">
                  {wh.start} – {wh.end}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className={ui.card}>
          <SectionHeader title="Notification Toggles" />
          <div className="space-y-3">
            {(['email', 'push', 'sms'] as const).map((key) => (
              <label
                key={key}
                className="flex items-center justify-between rounded-lg bg-[#F4F6F0] px-3 py-2.5"
              >
                <span className="text-sm capitalize">{key} notifications</span>
                <input
                  type="checkbox"
                  checked={notificationPrefs[key]}
                  onChange={(e) => setNotificationPrefs({ [key]: e.target.checked })}
                  className="h-4 w-4 accent-[#7A9A8B]"
                />
              </label>
            ))}
          </div>
        </section>

        <section className={ui.card}>
          <SectionHeader title="Account" />
          <p className="mb-4 text-sm text-[#2C3531]/70">Signed in as {session?.email}</p>
          <p className="mb-4 text-sm text-[#2C3531]/70">{profile.hospital}</p>
          <button type="button" onClick={handleLogout} className={ui.btnDanger}>
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </section>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  readOnly,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-[#2C3531]/60">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        readOnly={readOnly}
        className={`${ui.input} mt-1 ${readOnly ? 'bg-[#F4F6F0]' : ''}`}
      />
    </div>
  );
}
