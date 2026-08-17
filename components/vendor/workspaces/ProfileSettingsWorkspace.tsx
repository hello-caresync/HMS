'use client';

import { useCallback, useEffect, useState } from 'react';
import { Save } from 'lucide-react';

import { VendorFeedbackBanner, useVendorFeedback } from '@/components/vendor/ui/useVendorFeedback';
import { VendorModuleHeader } from '@/components/vendor/ui/VendorModuleHeader';
import { vendorFieldClass, vendorLabelClass } from '@/components/vendor/ui/VendorModal';
import { vendorClasses } from '@/lib/vendor/theme';
import {
  VENDOR_ID,
  loadVendorProfile,
  saveVendorProfile,
  type VendorProfile,
} from '@/lib/vendor/v0/portal-service';

type ProfileForm = {
  company_name: string;
  gstin: string;
  email: string;
  phone: string;
};

const emptyForm: ProfileForm = {
  company_name: '',
  gstin: '',
  email: '',
  phone: '',
};

/** V0 editable vendor profile backed by the shared vendors table. */
function ProfileSettingsWorkspace() {
  const { feedback, showSuccess, showError } = useVendorFeedback();
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await loadVendorProfile();
      setLoadError(result.error ?? null);

      const profile: VendorProfile | null = result.profile;
      if (profile) {
        setForm({
          company_name: profile.company_name,
          gstin: profile.gstin ?? '',
          email: profile.email ?? '',
          phone: profile.phone ?? '',
        });
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

  const handleSave = async () => {
    if (!form.company_name.trim()) {
      showError('Company name is required.');
      return;
    }

    setSaving(true);
    const result = await saveVendorProfile({
      company_name: form.company_name,
      gstin: form.gstin,
      email: form.email,
      phone: form.phone,
    });
    setSaving(false);

    if (!result.ok) {
      showError(result.error ?? 'Could not save profile.');
      return;
    }

    showSuccess('Vendor profile saved successfully.');
    await load();
  };

  return (
    <div className="space-y-6">
      <VendorModuleHeader
        title="Profile & Settings"
        description={`Editable vendor identity · ${VENDOR_ID}`}
        actions={
          <button
            type="button"
            disabled={loading || saving}
            onClick={() => void handleSave()}
            className={vendorClasses.btnPrimary}
          >
            <Save className="h-4 w-4" aria-hidden />
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        }
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
        <section className={`${vendorClasses.card} max-w-2xl space-y-4 p-5`}>
          <h2 className="text-sm font-black text-vendor-charcoal">Vendor profile</h2>

          <label className={vendorLabelClass}>
            Company name
            <input
              required
              value={form.company_name}
              onChange={(event) => setForm({ ...form, company_name: event.target.value })}
              className={vendorFieldClass}
              placeholder="MedSupply Dispatch Pvt Ltd"
            />
          </label>

          <label className={vendorLabelClass}>
            GSTIN
            <input
              value={form.gstin}
              onChange={(event) => setForm({ ...form, gstin: event.target.value })}
              className={vendorFieldClass}
              placeholder="29AABCU9603R1ZM"
            />
          </label>

          <label className={vendorLabelClass}>
            Contact email
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              className={vendorFieldClass}
              placeholder="dispatch@medsupply.in"
            />
          </label>

          <label className={vendorLabelClass}>
            Contact phone
            <input
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
              className={vendorFieldClass}
              placeholder="+91 98450 11223"
            />
          </label>

          <p className="text-xs font-medium text-vendor-muted">
            Updates are written to <span className="font-mono">vendors</span> and shared with the
            Hospital App procurement desk.
          </p>
        </section>
      )}
    </div>
  );
}

export default ProfileSettingsWorkspace;
export { ProfileSettingsWorkspace };
