'use client';

import React, { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';

import { supabase } from '@/lib/supabase';

const HOSPITAL_ADMIN_DEPARTMENT = 'HOSPITAL ADMINISTRATION';

export type OnboardHospitalResult = {
  hospitalId: string;
  hospitalCode: string;
  hospitalName: string;
  adminName: string;
  adminEmail: string;
  passcode: string;
  staffRecordId: string;
};

type OnboardHospitalModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: (result: OnboardHospitalResult) => void;
  defaultHospitalCode?: string;
};

export function OnboardHospitalModal({
  open,
  onClose,
  onSuccess,
  defaultHospitalCode = 'HOSP-02',
}: OnboardHospitalModalProps) {
  const [hospitalCode, setHospitalCode] = useState(defaultHospitalCode);
  const [hospitalName, setHospitalName] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
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
      hospitalName
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
      const code = hospitalCode.trim().toUpperCase();
      const name = hospitalName.trim();
      const location = city.trim();
      const fullName = adminName.trim();
      const email = adminEmail.trim().toLowerCase();
      const passcode = adminPasscode.trim();

      if (!code || !name || !location || !fullName || !email || !passcode) {
        throw new Error('All hospital and admin fields are required.');
      }

      const { data: hosp, error: hospitalError } = await supabase
        .from('hospitals')
        .insert({
          name,
          hospital_code: code,
          city: location,
          status: 'Active',
          is_active: true,
        })
        .select('id, hospital_code, name')
        .single();

      if (hospitalError) {
        if (/duplicate|unique|already exists/i.test(hospitalError.message)) {
          throw new Error(`Hospital code ${code} is already registered.`);
        }
        throw hospitalError;
      }

      const staffIdCode = `${code}-ADM01`;

      const { data: adminRow, error: adminError } = await supabase
        .from('hospital_staff')
        .insert({
          hospital_id: hosp.id,
          hospital_code: code,
          staff_id_code: staffIdCode,
          employee_id: staffIdCode,
          full_name: fullName,
          email,
          passcode_key: passcode,
          role: 'Admin',
          department: HOSPITAL_ADMIN_DEPARTMENT,
          is_active: true,
        })
        .select('id')
        .single();

      if (adminError) {
        await supabase.from('hospitals').delete().eq('id', hosp.id);
        if (/duplicate|unique|already exists/i.test(adminError.message)) {
          throw new Error('That admin email is already assigned to another credential.');
        }
        throw adminError;
      }

      toast.success(`${name} onboarded with Hospital Admin credentials.`);

      onSuccess({
        hospitalId: String(hosp.id),
        hospitalCode: code,
        hospitalName: name,
        adminName: fullName,
        adminEmail: email,
        passcode,
        staffRecordId: String(adminRow.id),
      });

      setHospitalName('');
      setAdminName('');
      setAdminEmail('');
      setAdminPasscode('');
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to onboard hospital.';
      setError(message);
      toast.error(message);
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
              Creates the hospital tenant and provisions the initial Hospital Admin in{' '}
              <code className="font-mono text-[10px]">public.hospital_staff</code>.
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
          <div>
            <label className="text-[11px] font-bold uppercase text-slate-500">Hospital Name</label>
            <input
              value={hospitalName}
              onChange={(e) => setHospitalName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
              placeholder="e.g. Regal Hospital"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold uppercase text-slate-500">Hospital Code</label>
              <input
                value={hospitalCode}
                onChange={(e) => setHospitalCode(e.target.value.toUpperCase())}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs"
                placeholder="HOSP-01"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase text-slate-500">City / Location</label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                placeholder="Bengaluru"
                required
              />
            </div>
          </div>

          <div className="rounded-xl border border-purple-100 bg-purple-50/40 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-purple-700">
              Initial Hospital Admin
            </p>
            <p className="mt-0.5 text-[11px] text-slate-600">
              This is the only credential created at onboarding. Departmental staff are added later
              from the Hospital App.
            </p>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase text-slate-500">Admin Full Name</label>
            <input
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
              placeholder="e.g. Kavya S"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase text-slate-500">Admin Email</label>
            <input
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
              placeholder="kavyaregaladmin@gmail.com"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase text-slate-500">Security Passcode</label>
            <div className="mt-1 flex gap-2">
              <input
                type="text"
                value={adminPasscode}
                onChange={(e) => setAdminPasscode(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs"
                placeholder="REGAL#KAVYA@2026"
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
