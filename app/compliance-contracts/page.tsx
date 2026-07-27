'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Download, ExternalLink, FileText, ShieldCheck, Upload } from 'lucide-react';

import { supabase } from '@/lib/supabaseClient';
import {
  COMPLIANCE_UPLOAD_DOC_TYPES,
  DEFAULT_VENDOR_ID,
  REQUIRED_COMPLIANCE_DOC_TYPES,
} from '@/lib/vendor-supabase/constants';
import type { ComplianceDocStatus, ComplianceDocumentRow, VendorContractRow, VendorProfileRow } from '@/lib/vendor-supabase/types';

type Toast = { type: 'success' | 'error'; message: string } | null;

type UploadForm = {
  document_type: string;
  registration_number: string;
  expiry_date: string;
  file_url: string;
};

const emptyUpload: UploadForm = {
  document_type: 'Drug License',
  registration_number: '',
  expiry_date: '',
  file_url: '',
};

function complianceBadgeClass(status: ComplianceDocStatus) {
  switch (status) {
    case 'VERIFIED':
      return 'bg-emerald-100 text-emerald-800';
    case 'PENDING_REVIEW':
      return 'bg-amber-100 text-amber-900';
    case 'EXPIRED':
      return 'bg-red-100 text-red-800';
    case 'ACTION_REQUIRED':
      return 'bg-orange-100 text-orange-900';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function deriveStatus(doc: ComplianceDocumentRow | null): ComplianceDocStatus {
  if (!doc || !doc.id || doc.id.startsWith('placeholder-')) return 'ACTION_REQUIRED';
  if (doc.status === 'EXPIRED') return 'EXPIRED';
  const days = daysUntil(doc.expiry_date);
  if (days !== null && days < 0) return 'EXPIRED';
  return doc.status;
}

export default function ComplianceContractsPage() {
  const [documents, setDocuments] = useState<ComplianceDocumentRow[]>([]);
  const [contracts, setContracts] = useState<VendorContractRow[]>([]);
  const [vendor, setVendor] = useState<VendorProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [termsContract, setTermsContract] = useState<VendorContractRow | null>(null);
  const [uploadForm, setUploadForm] = useState<UploadForm>(emptyUpload);
  const [saving, setSaving] = useState(false);
  const [actionDocId, setActionDocId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast>(null);

  const showToast = useCallback((next: Toast) => {
    setToast(next);
    if (next) window.setTimeout(() => setToast(null), 4500);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);

    const [docsRes, contractsRes, vendorRes] = await Promise.all([
      supabase
        .from('compliance_documents')
        .select('*')
        .eq('vendor_id', DEFAULT_VENDOR_ID)
        .order('created_at', { ascending: false }),
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

    if (docsRes.error) showToast({ type: 'error', message: docsRes.error.message });
    else setDocuments((docsRes.data as ComplianceDocumentRow[]) ?? []);

    if (contractsRes.error) showToast({ type: 'error', message: contractsRes.error.message });
    else setContracts((contractsRes.data as VendorContractRow[]) ?? []);

    if (!vendorRes.error && vendorRes.data) setVendor(vendorRes.data as VendorProfileRow);

    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const docGrid = useMemo(() => {
    return REQUIRED_COMPLIANCE_DOC_TYPES.map((docType) => {
      const match = documents.find((d) => d.document_type === docType);
      return { docType, record: match ?? null };
    });
  }, [documents]);

  const expiringSoon = useMemo(() => {
    return documents.filter((d) => {
      const days = daysUntil(d.expiry_date);
      return days !== null && days >= 0 && days <= 30;
    });
  }, [documents]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase.from('compliance_documents').insert([
      {
        vendor_id: DEFAULT_VENDOR_ID,
        document_type: uploadForm.document_type,
        registration_number: uploadForm.registration_number.trim() || null,
        expiry_date: uploadForm.expiry_date || null,
        file_url: uploadForm.file_url.trim(),
        status: 'PENDING_REVIEW',
      },
    ]);

    setSaving(false);

    if (error) {
      showToast({ type: 'error', message: error.message });
      return;
    }

    showToast({ type: 'success', message: 'Document submitted for verification.' });
    setUploadOpen(false);
    setUploadForm(emptyUpload);
    await loadAll();
  };

  const markDocumentVerified = async (doc: ComplianceDocumentRow) => {
    setActionDocId(doc.id);
    setDocuments((prev) => prev.map((d) => (d.id === doc.id ? { ...d, status: 'VERIFIED' } : d)));

    const { error } = await supabase.from('compliance_documents').update({ status: 'VERIFIED' }).eq('id', doc.id);

    setActionDocId(null);

    if (error) {
      showToast({ type: 'error', message: error.message });
      await loadAll();
      return;
    }

    showToast({ type: 'success', message: `${doc.document_type} marked VERIFIED.` });
    await loadAll();
  };

  const syncVendorCompliance = async () => {
    setSaving(true);
    const verifiedCount = documents.filter((d) => d.status === 'VERIFIED').length;
    const nextStatus = verifiedCount >= 3 ? 'COMPLIANT' : 'ACTION_REQUIRED';

    const { error } = await supabase
      .from('vendors')
      .update({ compliance_status: nextStatus })
      .eq('id', DEFAULT_VENDOR_ID);

    setSaving(false);

    if (error) {
      showToast({ type: 'error', message: error.message });
      return;
    }

    setVendor((v) => (v ? { ...v, compliance_status: nextStatus } : v));
    showToast({ type: 'success', message: `Vendor compliance status updated to ${nextStatus}.` });
  };

  const handleDownloadPdf = async (contract: VendorContractRow) => {
    if (!contract.pdf_url) {
      showToast({ type: 'error', message: 'No pdf_url on this contract row.' });
      return;
    }
    window.open(contract.pdf_url, '_blank', 'noopener,noreferrer');
  };

  const handleViewTerms = async (contract: VendorContractRow) => {
    setTermsContract(contract);
    const { data, error } = await supabase.from('vendor_contracts').select('*').eq('id', contract.id).single();
    if (error) {
      showToast({ type: 'error', message: error.message });
      return;
    }
    setTermsContract(data as VendorContractRow);
  };

  const acknowledgeContract = async (contract: VendorContractRow) => {
    setActionDocId(contract.id);
    const { error } = await supabase.from('vendor_contracts').update({ status: 'Active' }).eq('id', contract.id);
    setActionDocId(null);

    if (error) {
      showToast({ type: 'error', message: error.message });
      return;
    }

    setContracts((prev) => prev.map((c) => (c.id === contract.id ? { ...c, status: 'Active' } : c)));
    showToast({ type: 'success', message: 'Contract acknowledged and set Active.' });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans dark:bg-slate-950">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Compliance & Contracts Vault</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Vendor verification: {vendor?.compliance_status ?? '—'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => void syncVendorCompliance()}
              className="inline-flex items-center gap-2 rounded-xl border border-teal-600 px-4 py-2.5 text-sm font-bold text-teal-800 disabled:opacity-60 dark:text-teal-300"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden />
              {saving ? 'Syncing…' : 'Sync compliance score'}
            </button>
            <button
              type="button"
              onClick={() => setUploadOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-teal-800"
            >
              <Upload className="h-4 w-4" aria-hidden />
              Upload Document
            </button>
          </div>
        </header>

        {toast ? (
          <div
            className={`rounded-lg border px-4 py-3 text-sm font-medium ${
              toast.type === 'success' ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-red-300 bg-red-50 text-red-800'
            }`}
          >
            {toast.message}
          </div>
        ) : null}

        {expiringSoon.length > 0 ? (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-amber-400/50 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          >
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <div>
              <p className="font-bold">Expiry alert · renew within 30 days</p>
              <ul className="mt-1 list-inside list-disc text-xs">
                {expiringSoon.map((d) => (
                  <li key={d.id}>
                    {d.document_type} expires {d.expiry_date} ({daysUntil(d.expiry_date)} days)
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}

        <section>
          <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-slate-500">Compliance document center</h2>
          {loading ? (
            <p className="text-sm text-slate-500">Loading documents…</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {docGrid.map(({ docType, record }) => {
                const status = deriveStatus(record);
                return (
                  <article
                    key={docType}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-teal-600" aria-hidden />
                        <h3 className="font-bold">{docType}</h3>
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${complianceBadgeClass(status)}`}>
                        {status}
                      </span>
                    </div>
                    {record?.registration_number ? (
                      <p className="mt-2 text-xs text-slate-600">Reg: {record.registration_number}</p>
                    ) : null}
                    {record?.expiry_date ? <p className="text-xs text-slate-500">Expiry: {record.expiry_date}</p> : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {record?.file_url ? (
                        <a
                          href={record.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-teal-700"
                        >
                          Open file <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : null}
                      {record && record.status === 'PENDING_REVIEW' ? (
                        <button
                          type="button"
                          disabled={actionDocId === record.id}
                          onClick={() => void markDocumentVerified(record)}
                          className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[10px] font-bold text-white disabled:opacity-60"
                        >
                          {actionDocId === record.id ? 'Saving…' : 'Mark verified'}
                        </button>
                      ) : null}
                      {!record ? (
                        <button
                          type="button"
                          onClick={() => {
                            setUploadForm({ ...emptyUpload, document_type: docType });
                            setUploadOpen(true);
                          }}
                          className="rounded-lg border border-teal-600 px-2.5 py-1 text-[10px] font-bold text-teal-800"
                        >
                          Upload required doc
                        </button>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-slate-500">Contracts & SLA vault</h2>
          {loading ? null : contracts.length === 0 ? (
            <p className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-500">No contracts on file.</p>
          ) : (
            <ul className="space-y-4">
              {contracts.map((c) => (
                <li key={c.id} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-bold">{c.title}</p>
                      <p className="text-sm text-slate-600">{c.hospital_name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {c.effective_date} → {c.expiry_date}
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-bold uppercase text-emerald-800">
                      {c.status}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void handleDownloadPdf(c)}
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white"
                    >
                      <Download className="h-3.5 w-3.5" aria-hidden />
                      Download Contract PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleViewTerms(c)}
                      className="rounded-lg border border-teal-600 px-3 py-1.5 text-xs font-bold text-teal-800"
                    >
                      View Terms
                    </button>
                    {c.status === 'Expiring' ? (
                      <button
                        type="button"
                        disabled={actionDocId === c.id}
                        onClick={() => void acknowledgeContract(c)}
                        className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
                      >
                        {actionDocId === c.id ? 'Saving…' : 'Acknowledge renewal'}
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {uploadOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-xl dark:bg-slate-900">
            <h2 className="text-lg font-black">Upload compliance document</h2>
            <form onSubmit={handleUpload} className="mt-4 space-y-3">
              <label className="block text-xs font-bold uppercase text-slate-500">
                Document type
                <select
                  value={uploadForm.document_type}
                  onChange={(e) => setUploadForm((f) => ({ ...f, document_type: e.target.value }))}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                >
                  {COMPLIANCE_UPLOAD_DOC_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-bold uppercase text-slate-500">
                Registration number
                <input
                  value={uploadForm.registration_number}
                  onChange={(e) => setUploadForm((f) => ({ ...f, registration_number: e.target.value }))}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-xs font-bold uppercase text-slate-500">
                Expiry date
                <input
                  type="date"
                  value={uploadForm.expiry_date}
                  onChange={(e) => setUploadForm((f) => ({ ...f, expiry_date: e.target.value }))}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-xs font-bold uppercase text-slate-500">
                File URL
                <input
                  type="url"
                  required
                  value={uploadForm.file_url}
                  onChange={(e) => setUploadForm((f) => ({ ...f, file_url: e.target.value }))}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                />
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setUploadOpen(false)} disabled={saving} className="rounded-lg border px-4 py-2 text-sm font-bold">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
                  {saving ? 'Uploading…' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {termsContract ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl border bg-white p-6 shadow-xl dark:bg-slate-900">
            <h2 className="text-lg font-black">Contract terms</h2>
            <p className="mt-1 text-sm font-semibold">{termsContract.title}</p>
            <p className="text-xs text-slate-500">{termsContract.hospital_name}</p>
            {termsContract.terms_url ? (
              <a href={termsContract.terms_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-bold text-teal-700">
                Open full terms URL →
              </a>
            ) : (
              <p className="mt-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                SLA: on-time delivery ≥ 95%, recall notification within 24h, cold-chain maintenance per hospital SOP.
                Pricing locked per annexure for contract period {termsContract.effective_date} to {termsContract.expiry_date}.
              </p>
            )}
            <button type="button" onClick={() => setTermsContract(null)} className="mt-6 rounded-lg border px-4 py-2 text-sm font-bold">
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
