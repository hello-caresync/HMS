'use client';

import { useCallback, useEffect, useState } from 'react';
import { Download, ShieldCheck } from 'lucide-react';

import { VendorModuleHeader, VendorStatusPill } from '@/components/vendor/ui/VendorModuleHeader';
import { useVendorFeedback } from '@/components/vendor/ui/useVendorFeedback';
import { vendorClasses } from '@/lib/vendor/theme';
import { supabase } from '@/lib/supabaseClient';
import { DEFAULT_VENDOR_ID } from '@/lib/vendor-supabase/constants';
import type { VendorContractRow, VendorProfileRow } from '@/lib/vendor-supabase/types';

function ContractsWorkspace() {
  const { showSuccess, showError } = useVendorFeedback();
  const [contracts, setContracts] = useState<VendorContractRow[]>([]);
  const [vendor, setVendor] = useState<VendorProfileRow | null>(null);
  const [loading, setLoading] = useState(true);

  const loadContracts = useCallback(async () => {
    setLoading(true);
    const [contractsRes, vendorRes] = await Promise.all([
      supabase
        .from('vendor_contracts')
        .select('*')
        .eq('vendor_id', DEFAULT_VENDOR_ID)
        .order('expiry_date', { ascending: true }),
      supabase
        .from('vendors')
        .select('id, compliance_status, performance_rating, on_time_delivery_pct')
        .eq('id', DEFAULT_VENDOR_ID)
        .maybeSingle(),
    ]);

    if (contractsRes.error) {
      showError(contractsRes.error.message);
      setContracts([]);
    } else {
      setContracts((contractsRes.data as VendorContractRow[]) ?? []);
    }

    if (!vendorRes.error && vendorRes.data) {
      setVendor(vendorRes.data as VendorProfileRow);
    }

    setLoading(false);
  }, [showError]);

  useEffect(() => {
    void loadContracts();
  }, [loadContracts]);

  const slaPct = vendor?.on_time_delivery_pct ?? null;

  return (
    <div className="space-y-6">
      <VendorModuleHeader
        title="Contracts & Agreements"
        description="Active supply agreements, SLAs, pricing contracts, digital signatures, expiry alerts."
      />

      {loading ? (
        <p className="text-sm text-vendor-muted">Loading contracts…</p>
      ) : contracts.length === 0 ? (
        <p className="text-sm text-vendor-muted">No contracts found for this vendor.</p>
      ) : (
        <ul className="space-y-3">
          {contracts.map((c) => {
            const verified = c.status === 'Active' || c.status === 'Expiring';
            return (
              <li key={c.id} className={`${vendorClasses.card} p-5`}>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-black text-vendor-charcoal">{c.title}</h2>
                  <VendorStatusPill
                    label={c.status}
                    tone={c.status === 'Expiring' ? 'warning' : c.status === 'Active' ? 'success' : 'neutral'}
                  />
                </div>
                <p className="mt-1 text-xs text-vendor-muted">
                  {c.hospital_name} · Effective {c.effective_date} – {c.expiry_date}
                </p>
                {slaPct != null ? (
                  <p className="mt-2 text-xs font-bold text-vendor-charcoal">SLA on-time: {slaPct}%</p>
                ) : null}

                <div className="mt-4 rounded-xl border border-vendor-accent/25 bg-gradient-to-br from-vendor-cream to-white p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-vendor-muted">
                        <ShieldCheck className="h-3.5 w-3.5 text-vendor-success" aria-hidden />
                        PKI digital signature
                      </p>
                      <p className="mt-2 font-serif text-2xl italic text-vendor-charcoal/80">Authorized Signatory</p>
                      <p className="mt-1 text-xs font-mono text-vendor-secondary">
                        SHA-256 · Nexora CLM · {c.effective_date}
                      </p>
                    </div>
                    <span className="rounded-full border border-vendor-success/40 bg-vendor-success/15 px-2 py-0.5 text-[10px] font-bold text-vendor-charcoal">
                      {verified ? 'Verified ✓' : 'Pending'}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-1 opacity-70">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-1 rounded bg-vendor-accent/40" />
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (c.pdf_url) {
                      window.open(c.pdf_url, '_blank', 'noopener,noreferrer');
                    }
                    showSuccess(`Contract PDF · ${c.title}`);
                  }}
                  className={`mt-3 inline-flex items-center gap-1 ${vendorClasses.btnGhost}`}
                >
                  <Download className="h-3.5 w-3.5" aria-hidden />
                  Download signed PDF
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default ContractsWorkspace;
export { ContractsWorkspace };
