'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

import { createClient, getSupabaseConfigStatus } from '@/lib/supabase/client';
import {
  HOSPITAL_DELETION_CONFIRM_ERROR,
  HOSPITAL_DELETION_CONFIRM_HINT,
  isHospitalDeletionConfirmed,
} from '@/lib/super-admin/hospital-deletion-confirm';
import type { SuperAdminHospitalTenant } from '@/lib/super-admin/hospital-tenants';
import { formatHospitalTenantBadge } from '@/lib/super-admin/hospital-tenants';
import { purgeHospitalTenant, resolveHospitalRecord } from '@/lib/super-admin/teardown';

type DeleteHospitalTenantModalProps = {
  hospital: SuperAdminHospitalTenant | null;
  open: boolean;
  onClose: () => void;
  onPurged: () => void | Promise<void>;
};

export function DeleteHospitalTenantModal({
  hospital,
  open,
  onClose,
  onPurged,
}: DeleteHospitalTenantModalProps) {
  const [confirmationInput, setConfirmationInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPurging, setIsPurging] = useState(false);

  useEffect(() => {
    if (!open) {
      setConfirmationInput('');
      setError(null);
      setIsPurging(false);
    }
  }, [open, hospital?.id]);

  if (!open || !hospital) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const isMatch = isHospitalDeletionConfirmed(confirmationInput, hospital);
    if (!isMatch) {
      setError(HOSPITAL_DELETION_CONFIRM_ERROR);
      return;
    }

    setIsPurging(true);
    try {
      const config = getSupabaseConfigStatus();
      if (!config.ok) {
        throw new Error(config.reason);
      }

      const supabase = createClient();
      const targetId = hospital.id?.trim() || '';
      const targetCode = hospital.hospital_code?.trim() || '';

      const { hospital: resolvedTenant, error: resolveError } = await resolveHospitalRecord(
        supabase,
        {
          id: targetId || targetCode,
          hospital_code: targetCode || targetId,
        },
      );

      if (resolveError || !resolvedTenant) {
        setError(resolveError || 'Hospital tenant record could not be resolved.');
        return;
      }

      const result = await purgeHospitalTenant(supabase, resolvedTenant.id, {
        hospital_code: resolvedTenant.hospital_code,
      });

      if (!result.ok) {
        throw new Error(result.error || 'Could not purge hospital tenant.');
      }

      toast.success(`${hospital.name} and all scoped records were permanently purged.`);
      onClose();
      await onPurged();
      window.location.href = '/super-vault-access';
    } catch (err) {
      console.error('Purge error:', err);
      const message =
        err instanceof Error
          ? err.message
          : 'Purge operation failed. Check Supabase connection and permissions.';
      setError(message);
      toast.error(message);
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div
        className="w-full max-w-lg rounded-3xl border border-rose-200 bg-white p-6 shadow-2xl sm:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="purge-hospital-title"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 id="purge-hospital-title" className="text-lg font-black text-slate-900">
                Permanently Purge Hospital
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                This removes <span className="font-semibold text-slate-700">{hospital.name}</span>{' '}
                ({formatHospitalTenantBadge(hospital)}) and all associated staff, appointments, billing,
                and patient records. This cannot be undone.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPurging}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="hospital-purge-confirmation"
              className="block text-[11px] font-bold uppercase tracking-wider text-slate-600"
            >
              Confirmation
            </label>
            <input
              id="hospital-purge-confirmation"
              type="text"
              value={confirmationInput}
              onChange={(event) => {
                setConfirmationInput(event.target.value);
                if (error) setError(null);
              }}
              placeholder="DELETE"
              autoComplete="off"
              disabled={isPurging}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-rose-500 focus:bg-white focus:ring-2 focus:ring-rose-500/20 disabled:opacity-60"
            />
            <p className="text-[11px] font-medium text-slate-500">{HOSPITAL_DELETION_CONFIRM_HINT}</p>
          </div>

          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isPurging}
              className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-xs font-bold uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPurging || !confirmationInput.trim()}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-700 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-rose-800 disabled:opacity-60"
            >
              {isPurging ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Purging…
                </>
              ) : (
                'Purge Hospital'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
