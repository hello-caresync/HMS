'use client';

import { Fingerprint, ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { VendorModuleHeader } from '@/components/vendor/ui/VendorModuleHeader';
import { useVendorFeedback } from '@/components/vendor/ui/useVendorFeedback';
import { vendorClasses } from '@/lib/vendor/theme';
import { supabase } from '@/lib/supabaseClient';
import { DEFAULT_VENDOR_ID } from '@/lib/vendor-supabase/constants';
import type { VendorProfileRow } from '@/lib/vendor-supabase/types';
import { useVendorAppStore } from '@/lib/vendor/store/vendor-app-store';

type DeviceSession = {
  id: string;
  name: string;
  lastActive: string;
  current: boolean;
};

type VendorSettingsRow = VendorProfileRow & {
  name?: string | null;
  legal_name?: string | null;
  contact_email?: string | null;
};

function SettingsWorkspace() {
  const { showSuccess, showError } = useVendorFeedback();
  const mfaEnabled = useVendorAppStore((s) => s.mfaEnabled);
  const biometricEnabled = useVendorAppStore((s) => s.biometricEnabled);
  const setMfa = useVendorAppStore((s) => s.setMfaEnabled);
  const setBiometric = useVendorAppStore((s) => s.setBiometricEnabled);
  const [vendor, setVendor] = useState<VendorSettingsRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<DeviceSession[]>([]);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('vendors')
      .select('id, name, legal_name, contact_email, compliance_status, performance_rating, on_time_delivery_pct')
      .eq('id', DEFAULT_VENDOR_ID)
      .maybeSingle();

    if (error) {
      showError(error.message);
      setVendor(null);
    } else {
      setVendor((data as VendorSettingsRow) ?? null);
      const label = (data as VendorSettingsRow | null)?.name ?? 'Vendor portal';
      setSessions([
        {
          id: 'current-browser',
          name: `${label} · this browser`,
          lastActive: 'Active now',
          current: true,
        },
      ]);
    }
    setLoading(false);
  }, [showError]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const revokeSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    showSuccess('Device session revoked.');
  };

  const displayName = vendor?.legal_name ?? vendor?.name ?? 'MedSupply Nexus';

  return (
    <div className="space-y-6">
      <VendorModuleHeader
        title="Profile & Settings"
        description="MFA, biometric auth, device sessions, notification preferences, digital signature profile."
      />

      {loading ? (
        <p className="text-sm text-vendor-muted">Loading vendor profile…</p>
      ) : vendor ? (
        <section className={`${vendorClasses.card} p-5`}>
          <h2 className="text-sm font-black text-vendor-charcoal">Vendor profile</h2>
          <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[10px] font-bold uppercase text-vendor-muted">Legal name</dt>
              <dd className="font-bold">{displayName}</dd>
            </div>
            {vendor.contact_email ? (
              <div>
                <dt className="text-[10px] font-bold uppercase text-vendor-muted">Contact</dt>
                <dd>{vendor.contact_email}</dd>
              </div>
            ) : null}
            {vendor.compliance_status ? (
              <div>
                <dt className="text-[10px] font-bold uppercase text-vendor-muted">Compliance</dt>
                <dd>{vendor.compliance_status}</dd>
              </div>
            ) : null}
            {vendor.performance_rating != null ? (
              <div>
                <dt className="text-[10px] font-bold uppercase text-vendor-muted">Performance</dt>
                <dd>{vendor.performance_rating}/5</dd>
              </div>
            ) : null}
          </dl>
        </section>
      ) : null}

      <section className={`${vendorClasses.card} p-5`}>
        <h2 className="flex items-center gap-2 text-sm font-black text-vendor-charcoal">
          <ShieldCheck className="h-4 w-4 text-vendor-secondary" aria-hidden />
          Security
        </h2>
        <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={mfaEnabled}
            onChange={(e) => {
              setMfa(e.target.checked);
              showSuccess(e.target.checked ? 'MFA (TOTP) enabled.' : 'MFA disabled.');
            }}
          />
          Multi-factor authentication (TOTP)
        </label>
        <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={biometricEnabled}
            onChange={(e) => {
              setBiometric(e.target.checked);
              showSuccess(e.target.checked ? 'Biometric unlock enabled.' : 'Biometric unlock disabled.');
            }}
          />
          <Fingerprint className="h-4 w-4" aria-hidden />
          Biometric unlock
        </label>
      </section>

      <section className={`${vendorClasses.card} p-5`}>
        <h2 className="text-sm font-black text-vendor-charcoal">Device & session management</h2>
        <ul className="mt-3 space-y-2">
          {sessions.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-vendor-accent/15 px-3 py-2 text-sm"
            >
              <span>{s.name}</span>
              <span className="text-xs text-vendor-muted">{s.lastActive}</span>
              {s.current ? (
                <span className="text-[10px] font-bold text-vendor-secondary">This device</span>
              ) : (
                <button
                  type="button"
                  onClick={() => revokeSession(s.id)}
                  className="text-[10px] font-bold text-vendor-danger hover:underline"
                >
                  Revoke
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className={`${vendorClasses.card} border-dashed p-5`}>
        <p className="text-sm font-bold text-vendor-charcoal">Digital signature profile</p>
        <p className="mt-1 text-xs text-vendor-muted">PKI-backed signing for contracts</p>
        <div className="mt-3 flex h-20 items-center justify-center rounded-lg border border-vendor-accent/25 bg-vendor-cream font-serif text-xl italic text-vendor-charcoal/70">
          {displayName} · Authorized
        </div>
      </section>
    </div>
  );
}

/** Alias for spec / routing clarity */
const ProfileSettingsWorkspace = SettingsWorkspace;

export default SettingsWorkspace;
export { SettingsWorkspace, ProfileSettingsWorkspace };
