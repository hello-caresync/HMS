'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { useDoctorAuth } from '@/lib/doctor/auth/DoctorAuthProvider';
import { OsBtn, OsPage, OsWidget } from '@/components/doctor-os/ui/OsPrimitives';
import { useDoctorProfile, useUpdateDoctorProfile } from '@/lib/doctor/hooks/useClinicalQueries';
import { useDoctorOsStore, useOsColors } from '@/lib/doctor-os/store';

export default function DoctorOsProfile() {
  const c = useOsColors();
  const { session } = useDoctorAuth();
  const theme = useDoctorOsStore((s) => s.theme);
  const toggleTheme = useDoctorOsStore((s) => s.toggleTheme);
  const { data, isLoading } = useDoctorProfile();
  const updateProfile = useUpdateDoctorProfile();
  const profile = data?.profile;

  const [specialization, setSpecialization] = useState('');
  const [fees, setFees] = useState('');

  useEffect(() => {
    if (profile) {
      setSpecialization(profile.specialization);
      setFees(String(profile.consultationFees));
    }
  }, [profile]);

  const saveProfile = () => {
    updateProfile.mutate(
      {
        specialization,
        consultationFees: Number(fees) || undefined,
      },
      {
        onSuccess: () => toast.success('Profile updated'),
        onError: (e) => toast.error(e.message),
      },
    );
  };

  return (
    <OsPage>
      <div className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: c.accent }}>Profile</p>
        <h1 className="text-[24px] font-bold">Settings & preferences</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: c.accent }} />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <OsWidget title="Professional profile">
            <p className="font-bold">{profile?.fullName ?? session?.fullName}</p>
            <label className="mt-3 block text-[12px] font-medium" style={{ color: c.textSecondary }}>
              Specialization
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2 text-[13px]"
                style={{ borderColor: c.border }}
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
              />
            </label>
            <label className="mt-2 block text-[12px] font-medium" style={{ color: c.textSecondary }}>
              Consultation fee (₹)
              <input
                type="number"
                className="mt-1 w-full rounded-lg border px-3 py-2 text-[13px]"
                style={{ borderColor: c.border }}
                value={fees}
                onChange={(e) => setFees(e.target.value)}
              />
            </label>
            <p className="mt-2 text-[12px]" style={{ color: c.textSecondary }}>
              License {profile?.licenseNumber ?? session?.licenseNumber}
            </p>
            <OsBtn size="sm" className="mt-3" onClick={saveProfile} disabled={updateProfile.isPending}>
              Save profile
            </OsBtn>
          </OsWidget>

          <OsWidget title="Hospital">
            <p className="font-semibold">{profile?.hospital.name ?? 'Nexora Hospital'}</p>
            <p className="text-[12px]" style={{ color: c.textSecondary }}>{profile?.hospital.code}</p>
          </OsWidget>

          <OsWidget title="Availability">
            <div className="space-y-1 text-[13px]" style={{ color: c.textSecondary }}>
              {profile?.workingHours &&
                Object.entries(profile.workingHours as Record<string, string>).map(([day, hours]) => (
                  <p key={day}>
                    <span className="font-medium capitalize">{day}</span>: {hours}
                  </p>
                ))}
            </div>
            <OsBtn href="/doctor/schedule" variant="ghost" size="sm" className="mt-2 !px-0">
              Manage schedule →
            </OsBtn>
          </OsWidget>

          <OsWidget title="Appearance">
            <p className="mb-2 text-[13px]">
              Theme: <strong>{theme}</strong>
            </p>
            <OsBtn variant="secondary" size="sm" onClick={toggleTheme}>
              Toggle light / dark
            </OsBtn>
          </OsWidget>

          <OsWidget title="Security">
            <p className="text-[13px]" style={{ color: c.textSecondary }}>
              JWT session · {session?.accessToken ? 'Token authenticated' : 'Header fallback'}
            </p>
            <p className="mt-1 text-[12px]" style={{ color: c.textSecondary }}>{profile?.email}</p>
          </OsWidget>

          <OsWidget title="Notifications">
            <p className="text-[13px]" style={{ color: c.textSecondary }}>
              Critical labs · ER · OT · patient messages
            </p>
          </OsWidget>
        </div>
      )}
    </OsPage>
  );
}
