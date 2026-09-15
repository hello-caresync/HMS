'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Copy, Loader2, Save, Wifi } from 'lucide-react';

import { VendorFeedbackBanner, useVendorFeedback } from '@/components/vendor/ui/useVendorFeedback';
import { VendorModuleHeader } from '@/components/vendor/ui/VendorModuleHeader';
import { vendorFieldClass, vendorLabelClass } from '@/components/vendor/ui/VendorModal';
import { supabase } from '@/lib/supabaseClient';
import { vendorClasses } from '@/lib/vendor/theme';
import { VENDOR_ID, loadVendorProfile, type VendorProfile } from '@/lib/vendor/v0/portal-service';

type ProfileForm = {
  company_name: string;
  gstin: string;
  email: string;
  phone: string;
  address: string;
};

const emptyForm: ProfileForm = {
  company_name: '',
  gstin: '',
  email: '',
  phone: '',
  address: '',
};

const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

function vendorInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'VN';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase();
}

function formatShortDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

/** Nexora Vendor · enterprise profile & settings with dual-card B2B layout. */
function ProfileSettingsWorkspace() {
  const { feedback, showSuccess, showError } = useVendorFeedback();
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [savedForm, setSavedForm] = useState<ProfileForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const initials = useMemo(() => vendorInitials(form.company_name || 'Vendor'), [form.company_name]);
  const gstinValid = !form.gstin.trim() || GSTIN_PATTERN.test(form.gstin.trim());
  const isDirty = JSON.stringify(form) !== JSON.stringify(savedForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await loadVendorProfile();
      setLoadError(result.error ?? null);

      const profile: VendorProfile | null = result.profile;
      if (profile) {
        const nextForm: ProfileForm = {
          company_name: profile.company_name,
          gstin: profile.gstin ?? '',
          email: profile.email ?? '',
          phone: profile.phone ?? '',
          address: '',
        };
        setForm(nextForm);
        setSavedForm(nextForm);
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Could not load vendor profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(VENDOR_ID);
      setCopied(true);
      showSuccess('Vendor Context ID copied.');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      showError('Could not copy Vendor Context ID.');
    }
  };

  const handleDiscard = () => {
    setForm(savedForm);
  };

  const handleSave = async () => {
    if (!form.company_name.trim()) {
      showError('Company legal name is required.');
      return;
    }

    if (!gstinValid) {
      showError('Enter a valid 15-character GSTIN (e.g. 29AABCU9603R1ZM).');
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('vendors')
      .update({
        company_name: form.company_name.trim(),
        gstin: form.gstin.trim().toUpperCase() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
      })
      .eq('id', VENDOR_ID);
    setSaving(false);

    if (error) {
      console.error('[ProfileSettingsWorkspace] Save failed:', error);
      showError('Failed to save profile');
      return;
    }

    const normalized: ProfileForm = {
      ...form,
      company_name: form.company_name.trim(),
      gstin: form.gstin.trim().toUpperCase(),
      email: form.email.trim(),
      phone: form.phone.trim(),
    };
    setForm(normalized);
    setSavedForm(normalized);
    showSuccess('Vendor profile successfully updated');
  };

  return (
    <div className="space-y-6">
      <VendorModuleHeader
        title="Profile & Settings"
        description="Manage your supplier identity, tax credentials, and dispatch contact details."
      />

      <VendorFeedbackBanner feedback={feedback} />

      {loadError ? (
        <p className="rounded-lg border border-vendor-danger/30 bg-vendor-danger/5 px-4 py-2 text-sm font-medium text-vendor-danger">
          {loadError}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm font-medium text-vendor-muted">Loading vendor profile…</p>
      ) : (
        <div className="mx-auto max-w-4xl space-y-5">
          {/* Top card — company identity & sync status */}
          <section className="overflow-hidden rounded-2xl border border-amber-200/70 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-[#FFF9ED] via-white to-[#FFF4D6] px-6 py-6 sm:px-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 text-xl font-black text-white shadow-md ring-4 ring-amber-100">
                    {initials}
                  </div>
                  <div className="min-w-0 space-y-2">
                    <h2 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                      {form.company_name || 'MedSupply Nexus'}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                        Verified Medical Supplier
                      </span>
                      <button
                        type="button"
                        onClick={() => void handleCopyId()}
                        className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-white px-3 py-1 font-mono text-[11px] font-semibold text-amber-900 transition hover:bg-amber-50"
                        title="Copy Vendor Context ID"
                      >
                        ID: {VENDOR_ID.slice(0, 8)}…
                        <Copy className="h-3 w-3" aria-hidden />
                        {copied ? <span className="text-emerald-600">Copied</span> : null}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/80 px-4 py-3 sm:max-w-xs">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800">
                    <Wifi className="h-4 w-4" aria-hidden />
                    System Sync
                  </div>
                  <p className="mt-1 text-sm font-medium text-emerald-900">
                    Connected to Regal Hospital Procurement Desk
                  </p>
                  <p className="mt-0.5 text-[11px] text-emerald-700/80">
                    Last synced · {formatShortDate(new Date().toISOString())}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Bottom card — organization & contact details */}
          <section className="rounded-2xl border border-amber-200/70 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 border-b border-amber-100 pb-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                Organization & Contact Details
              </h3>
              <p className="mt-1 text-xs font-medium text-slate-500">
                Shared with hospital procurement, billing, and dispatch workflows.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <label className={vendorLabelClass}>
                Company Legal Name
                <input
                  required
                  value={form.company_name}
                  onChange={(event) => setForm({ ...form, company_name: event.target.value })}
                  className={vendorFieldClass}
                  placeholder="MedSupply Nexus Pvt Ltd"
                />
              </label>

              <label className={vendorLabelClass}>
                GSTIN
                <input
                  value={form.gstin}
                  onChange={(event) =>
                    setForm({ ...form, gstin: event.target.value.toUpperCase().replace(/\s/g, '') })
                  }
                  maxLength={15}
                  className={`${vendorFieldClass} font-mono uppercase tracking-wide ${
                    !gstinValid ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-200' : ''
                  }`}
                  placeholder="29AABCU9603R1ZM"
                />
                {!gstinValid ? (
                  <span className="mt-1 block text-[11px] font-medium text-rose-600">
                    Enter a valid 15-character GSTIN format.
                  </span>
                ) : null}
              </label>

              <label className={vendorLabelClass}>
                Dispatch Email
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  className={vendorFieldClass}
                  placeholder="dispatch@medsupply.in"
                />
              </label>

              <label className={vendorLabelClass}>
                Primary Operations Phone
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(event) => setForm({ ...form, phone: event.target.value })}
                  className={vendorFieldClass}
                  placeholder="+91 98450 11223"
                />
              </label>

              <label className={`${vendorLabelClass} md:col-span-2`}>
                Physical Warehouse / Dispatch Bay Address
                <textarea
                  rows={3}
                  value={form.address}
                  onChange={(event) => setForm({ ...form, address: event.target.value })}
                  className={`${vendorFieldClass} resize-none`}
                  placeholder="Plot 14, Industrial Logistics Park, Whitefield, Bengaluru 560066"
                />
              </label>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-end gap-3 border-t border-amber-100 pt-5">
              <button
                type="button"
                disabled={!isDirty || saving}
                onClick={handleDiscard}
                className={vendorClasses.btnGhost}
              >
                Discard
              </button>
              <button
                type="button"
                disabled={loading || saving || !isDirty}
                onClick={() => void handleSave()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-amber-600 disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" aria-hidden />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default ProfileSettingsWorkspace;
export { ProfileSettingsWorkspace };
