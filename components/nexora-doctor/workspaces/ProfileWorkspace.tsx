'use client';

import { useRouter } from 'next/navigation';
import { LogOut, Moon, Sun } from 'lucide-react';
import { toast } from 'sonner';

import { ui } from '@/components/nexora-doctor/ui/primitives';
import { SectionHeader } from '@/components/nexora-doctor/ui/shared';
import { useDoctorAuth } from '@/lib/doctor/auth/DoctorAuthProvider';
import { useDoctorClinicalStore } from '@/lib/nexora-doctor/store';

export function ProfileWorkspace() {
  const { session, signOut } = useDoctorAuth();
  const profile = useDoctorClinicalStore((s) => s.profile);
  const updateProfile = useDoctorClinicalStore((s) => s.updateProfile);
  const theme = useDoctorClinicalStore((s) => s.theme);
  const setTheme = useDoctorClinicalStore((s) => s.setTheme);
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
        <p className="text-slate-500">Loading profile…</p>
      </div>
    );
  }

  return (
    <div className={ui.page}>
      <div className="mb-8">
        <h1 className={ui.pageTitle}>Profile</h1>
        <p className={ui.pageSubtitle}>Manage your account and preferences</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={ui.card}>
          <SectionHeader title="Doctor Information" />
          <div className="space-y-4">
            <Field label="Full Name" value={profile.fullName} onChange={(v) => updateProfile({ fullName: v })} />
            <Field label="Email" value={profile.email} onChange={(v) => updateProfile({ email: v })} />
            <Field label="Phone" value={profile.phone} onChange={(v) => updateProfile({ phone: v })} />
            <Field label="License Number" value={profile.licenseNumber} readOnly />
          </div>
        </section>

        <section className={ui.card}>
          <SectionHeader title="Hospital & Department" />
          <div className="space-y-3 text-sm">
            <p><span className="text-slate-500">Hospital:</span> {profile.hospital}</p>
            <p><span className="text-slate-500">Department:</span> {profile.department}</p>
            <Field label="Specialization" value={profile.specialization} onChange={(v) => updateProfile({ specialization: v })} />
            <div>
              <label className="text-xs font-medium text-slate-500">Availability</label>
              <select
                value={profile.availability}
                onChange={(e) => updateProfile({ availability: e.target.value as typeof profile.availability })}
                className={`${ui.select} mt-1 w-full`}
              >
                <option value="available">Available</option>
                <option value="busy">Busy</option>
                <option value="off-duty">Off Duty</option>
              </select>
            </div>
          </div>
        </section>

        <section className={ui.card}>
          <SectionHeader title="Working Hours" />
          <ul className="space-y-2">
            {profile.workingHours.map((wh) => (
              <li key={wh.day} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <span className="font-medium text-slate-800">{wh.day}</span>
                <span className="text-slate-600">{wh.start} – {wh.end}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className={ui.card}>
          <SectionHeader title="Notifications" />
          <div className="space-y-3">
            {(['email', 'push', 'sms'] as const).map((key) => (
              <label key={key} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
                <span className="text-sm capitalize text-slate-700">{key} notifications</span>
                <input
                  type="checkbox"
                  checked={notificationPrefs[key]}
                  onChange={(e) => setNotificationPrefs({ [key]: e.target.checked })}
                  className="h-4 w-4 accent-teal-700"
                />
              </label>
            ))}
          </div>
        </section>

        <section className={ui.card}>
          <SectionHeader title="Theme" />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setTheme('light'); toast.success('Light theme'); }}
              className={`${ui.btnSecondary} ${theme === 'light' ? 'ring-2 ring-teal-500' : ''}`}
            >
              <Sun className="h-4 w-4" /> Light
            </button>
            <button
              type="button"
              onClick={() => { setTheme('dark'); toast.success('Dark theme saved'); }}
              className={`${ui.btnSecondary} ${theme === 'dark' ? 'ring-2 ring-teal-500' : ''}`}
            >
              <Moon className="h-4 w-4" /> Dark
            </button>
          </div>
        </section>

        <section className={ui.card}>
          <SectionHeader title="Security" />
          <p className="mb-4 text-sm text-slate-600">Signed in as {session?.email}</p>
          <button type="button" onClick={() => toast.success('Password reset link sent')} className={ui.btnSecondary}>
            Change Password
          </button>
        </section>
      </div>

      <div className="mt-8">
        <button type="button" onClick={handleLogout} className={ui.btnDanger}>
          <LogOut className="h-4 w-4" /> Logout
        </button>
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
      <label className="text-xs font-medium text-slate-500">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        readOnly={readOnly}
        className={`${ui.input} mt-1 ${readOnly ? 'bg-slate-50' : ''}`}
      />
    </div>
  );
}
