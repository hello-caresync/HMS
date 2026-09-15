'use client';

import React, { useState } from 'react';
import { Sparkles, X } from 'lucide-react';

import { upsertHospitalUserCredential, type HospitalUserCredential } from '@/lib/auth/hospitalAuth';
import { validatePhoneField } from '@/lib/hospital/indian-patient';
import { supabase } from '@/lib/supabase';
import { PhoneNumberInput } from '@/components/ui/PhoneNumberInput';
import { toast } from 'sonner';

export type OnboardHospitalResult = {
  hospitalId: string;
  hospitalName: string;
  credential: HospitalUserCredential;
  passcode: string;
};

type OnboardHospitalModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: (result: OnboardHospitalResult) => void;
  defaultHospitalId?: string;
};

export function OnboardHospitalModal({
  open,
  onClose,
  onSuccess,
  defaultHospitalId = 'HOSP-04',
}: OnboardHospitalModalProps) {
  const [newHospId, setNewHospId] = useState(defaultHospitalId);
  const [newHospName, setNewHospName] = useState('');
  const [newHospCity, setNewHospCity] = useState('Bengaluru');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminPasscode, setAdminPasscode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const generateDeterministicAdminPasscode = () => {
    if (!adminName.trim()) {
      setError('Please enter Admin Full Name before generating a passcode.');
      return;
    }
    setError(null);

    const cleanHosp =
      newHospName
        .replace(/hospital|super|speciality|clinic|care|institute|center/gi, '')
        .trim()
        .split(/\s+/)[0]
        ?.toUpperCase() || 'HOSP';

    const trimmedName = adminName.trim();
    const nameParts = trimmedName.replace(/^(Dr\.|Mr\.|Mrs\.|Ms\.)\s+/i, '').split(/\s+/);
    const firstInit = nameParts[0]?.charAt(0).toUpperCase() || 'A';
    const lastInit = (
      nameParts.length > 1 ? nameParts[nameParts.length - 1].charAt(0) : 'X'
    ).toUpperCase();
    const initials = `${firstInit}${lastInit}`;
    const nameLength = trimmedName.length || 8;

    setAdminPasscode(`${cleanHosp}#2026@${initials}${nameLength}`);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const hospitalId = newHospId.trim().toUpperCase();
      const hospitalName = newHospName.trim();
      const passcode = adminPasscode.trim();

      if (!hospitalName || !adminName.trim() || !adminEmail.trim() || !passcode) {
        throw new Error('Hospital name, admin name, email, and passcode are required.');
      }

      const phoneCheck = validatePhoneField(adminPhone, true);
      if (!phoneCheck.ok) {
        toast.error(phoneCheck.message);
        throw new Error(phoneCheck.message);
      }

      const { error: hospErr } = await supabase.from('hospitals').upsert({
        id: hospitalId,
        name: hospitalName,
        city: newHospCity.trim(),
        status: 'Active',
        setup_completed: false,
      });

      if (hospErr) {
        await supabase.from('hospital_tenants').upsert(
          {
            hospital_id: hospitalId,
            hospital_name: hospitalName,
            city: newHospCity.trim(),
            setup_completed: false,
          },
          { onConflict: 'hospital_id' },
        );
      } else {
        await supabase.from('hospital_tenants').upsert(
          {
            hospital_id: hospitalId,
            hospital_name: hospitalName,
            city: newHospCity.trim(),
            setup_completed: false,
          },
          { onConflict: 'hospital_id' },
        );
      }

      const credentialResult = await upsertHospitalUserCredential(supabase, {
        hospital_id: hospitalId,
        hospital_name: hospitalName,
        employee_id: `${hospitalId}-ADM01`,
        email: adminEmail.trim(),
        full_name: adminName.trim(),
        role: 'admin',
        department: 'Hospital Administration',
        passcode,
        phone: phoneCheck.phone ?? undefined,
        portal_access: '/dashboard/staff-credentials',
      });

      if (!credentialResult.ok || !credentialResult.credential) {
        throw new Error(credentialResult.error ?? 'Failed to save hospital admin credential.');
      }

      onSuccess({
        hospitalId,
        hospitalName,
        credential: credentialResult.credential,
        passcode,
      });

      setNewHospName('');
      setAdminName('');
      setAdminEmail('');
      setAdminPasscode('');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to onboard hospital.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-900">Onboard New Hospital</h2>
            <p className="mt-1 text-xs text-slate-500">
              Creates the hospital tenant and writes the initial admin credential to{' '}
              <code className="font-mono text-[10px]">hospital_user_credentials</code>.
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold uppercase text-slate-500">Hospital ID</label>
              <input
                value={newHospId}
                onChange={(e) => setNewHospId(e.target.value.toUpperCase())}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase text-slate-500">City</label>
              <input
                value={newHospCity}
                onChange={(e) => setNewHospCity(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase text-slate-500">Hospital Name</label>
            <input
              value={newHospName}
              onChange={(e) => setNewHospName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase text-slate-500">Admin Full Name</label>
            <input
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold uppercase text-slate-500">Admin Email</label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase text-slate-500">Admin Phone</label>
              <PhoneNumberInput
                required
                value={adminPhone}
                onChange={setAdminPhone}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase text-slate-500">Admin Passcode</label>
            <div className="mt-1 flex gap-2">
              <input
                type="text"
                value={adminPasscode}
                onChange={(e) => setAdminPasscode(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs"
                required
              />
              <button
                type="button"
                onClick={generateDeterministicAdminPasscode}
                className="inline-flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50 px-3 text-[10px] font-bold text-purple-700"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Generate
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-purple-600 px-4 py-1.5 text-xs font-bold text-white disabled:opacity-60"
            >
              {submitting ? 'Provisioning…' : 'Create Hospital & Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
