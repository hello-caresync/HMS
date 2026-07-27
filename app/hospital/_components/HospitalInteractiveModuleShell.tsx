'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { Loader2, Plus, Search, X } from 'lucide-react';

import type { HospitalModuleConfig } from '../_config/moduleRegistry';
import { getPrimaryActionLabel, parseMetricValue } from '../_lib/hospitalModuleMockData';
import {
  adjustPharmacyStock,
  completeModuleRecord,
  dischargeAdmission,
  fetchModuleRecords,
  insertModuleRecord,
  recordInvoicePayment,
  resolveTableForModule,
} from '../_lib/hospital-db.service';
import type { HospitalUiRecord } from '../_lib/hospital-db.types';
import { HospitalToastBanner, useHospitalToast } from './HospitalFeedback';

type TabId = 'overview' | 'records' | 'actions';

type NewRecordForm = {
  subject: string;
  department: string;
  reference: string;
  amount: string;
  phone: string;
  doctorName: string;
  bedNumber: string;
};

const emptyForm: NewRecordForm = {
  subject: '',
  department: '',
  reference: '',
  amount: '',
  phone: '',
  doctorName: '',
  bedNumber: '',
};

type HospitalInteractiveModuleShellProps = HospitalModuleConfig;

export default function HospitalInteractiveModuleShell(config: HospitalInteractiveModuleShellProps) {
  const { title, description, layer, features, metrics, id } = config;
  const { toast, showSuccess, showError } = useHospitalToast();
  const [isPending, startTransition] = useTransition();

  const [tab, setTab] = useState<TabId>('overview');
  const [records, setRecords] = useState<HospitalUiRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<NewRecordForm>(emptyForm);
  const [liveMetrics, setLiveMetrics] = useState(metrics ?? []);

  const primaryAction = getPrimaryActionLabel(id);
  const entityTable = resolveTableForModule(id);
  const isAdmissionTable = entityTable === 'admissions';
  const isBillingTable = entityTable === 'billing_invoices';
  const isPatientTable = entityTable === 'patients';
  const isPharmacyTable = entityTable === 'pharmacy_inventory';
  const isStaffTable = entityTable === 'staff';

  const reloadRecords = useCallback(async () => {
    setRecordsLoading(true);
    try {
      const { data, error } = await fetchModuleRecords(id, search);
      if (error) {
        showError(error);
        setRecords([]);
      } else {
        setRecords(data);
      }
    } catch (e) {
      showError(e instanceof Error ? e.message : 'Failed to load records');
      setRecords([]);
    }
    setRecordsLoading(false);
  }, [id, search, showError]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void reloadRecords();
    }, 280);
    return () => window.clearTimeout(handle);
  }, [reloadRecords]);

  const filteredRecords = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter(
      (r) =>
        r.reference.toLowerCase().includes(q) ||
        r.subject.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q),
    );
  }, [records, search]);

  const openCreateModal = () => {
    setForm({
      ...emptyForm,
      department: features[0] ?? 'General',
      reference: `${id.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`,
    });
    setModalOpen(true);
  };

  const bumpMetrics = () => {
    if (liveMetrics.length === 0) return;
    setLiveMetrics((prev) =>
      prev.map((m, i) => {
        if (i === 0) {
          const base = parseMetricValue(m.value);
          return { ...m, value: String(base + 1) };
        }
        return m;
      }),
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim()) {
      showError('Subject / patient name is required.');
      return;
    }

    startTransition(() => {
      void (async () => {
        const { error } = await insertModuleRecord({
          moduleId: id,
          subject: form.subject.trim(),
          department: form.department.trim() || 'General',
          reference: form.reference.trim() || `REF-${Date.now()}`,
          amount: form.amount.trim(),
          phone: form.phone.trim() || undefined,
          doctorName: form.doctorName.trim() || undefined,
          bedNumber: form.bedNumber.trim() || undefined,
        });

        if (error) {
          showError(error);
          return;
        }

        bumpMetrics();
        setModalOpen(false);
        setForm(emptyForm);
        setTab('records');
        showSuccess(`${primaryAction} saved to Supabase.`);
        await reloadRecords();
      })();
    });
  };

  const markComplete = (recordId: string) => {
    startTransition(() => {
      void (async () => {
        const { error } = await completeModuleRecord(id, recordId);
        if (error) {
          showError(error);
          return;
        }
        showSuccess('Record updated in Supabase.');
        await reloadRecords();
      })();
    });
  };

  const runDischarge = (recordId: string) => {
    startTransition(() => {
      void (async () => {
        const { error } = await dischargeAdmission(recordId);
        if (error) {
          showError(error);
          return;
        }
        showSuccess('Patient discharged · status updated in Supabase.');
        await reloadRecords();
      })();
    });
  };

  const runRecordPayment = (record: HospitalUiRecord) => {
    startTransition(() => {
      void (async () => {
        const { error } = await recordInvoicePayment(record.id);
        if (error) {
          showError(error);
          return;
        }
        showSuccess(`Payment recorded for ${record.reference}.`);
        await reloadRecords();
      })();
    });
  };

  const runStockAdjust = (recordId: string, delta: number) => {
    startTransition(() => {
      void (async () => {
        const { error } = await adjustPharmacyStock(recordId, delta);
        if (error) {
          showError(error);
          return;
        }
        showSuccess(delta > 0 ? 'Stock increased.' : 'Stock adjusted.');
        await reloadRecords();
      })();
    });
  };

  return (
    <div className="w-full">
      <HospitalToastBanner toast={toast} />

      <header className="mb-6 flex flex-col gap-4 border-b border-slate-200/60 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="inline-block rounded-full bg-[#00A481]/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-[#00A481]">
            {layer}
          </span>
          <h1 className="mt-3 text-2xl font-bold text-[#00758C] sm:text-3xl">{title}</h1>
          <p className="mt-2 max-w-3xl text-base leading-relaxed text-slate-600">{description}</p>
        </div>
        <button
          type="button"
          disabled={isPending}
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-[#00758C] px-4 py-2.5 text-sm font-semibold uppercase tracking-wide text-white shadow-sm hover:bg-[#008588] disabled:opacity-60"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
          {primaryAction}
        </button>
      </header>

      <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-200" role="tablist">
        {(
          [
            ['overview', 'Overview'],
            ['records', 'Live records'],
            ['actions', 'Quick actions'],
          ] as const
        ).map(([tid, label]) => (
          <button
            key={tid}
            type="button"
            role="tab"
            aria-selected={tab === tid}
            onClick={() => setTab(tid)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold uppercase tracking-wider transition-colors ${
              tab === tid ? 'border-[#00758C] text-[#00758C]' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {liveMetrics.length > 0 ? (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {liveMetrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-xl border border-slate-200/60 border-t-4 border-t-[#00A481] bg-white p-4 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{metric.label}</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-[#00758C]">{metric.value}</p>
            </div>
          ))}
        </div>
      ) : null}

      {tab === 'overview' ? (
        <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
          <p className="mb-4 text-lg font-semibold text-[#008588]">Module capabilities</p>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {features.map((feature) => (
              <li key={feature}>
                <button
                  type="button"
                  onClick={() => showSuccess(`Opened workflow: ${feature}`)}
                  className="flex w-full items-center gap-2 rounded-lg border border-slate-200/60 bg-slate-50/50 px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:border-[#00A481]/40 hover:bg-[#00A481]/5"
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#5EC283]" aria-hidden />
                  {feature}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {tab === 'records' ? (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reference, subject, department…"
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-base focus:border-[#008588] focus:outline-none focus:ring-2 focus:ring-[#008588]/20"
            />
          </div>
          {recordsLoading ? (
            <p className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Loading from Supabase…
            </p>
          ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
            <table className="w-full text-left">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-sm font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Department</th>
                  {isBillingTable ? <th className="px-4 py-3">Amount</th> : null}
                  {isPharmacyTable ? <th className="px-4 py-3">Stock</th> : null}
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={isBillingTable || isPharmacyTable ? 7 : 6} className="px-4 py-8 text-center text-base text-slate-500">
                      No records match your search.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-2.5 font-mono text-base font-semibold text-[#008588]">{row.reference}</td>
                      <td className="px-4 py-2.5 text-base font-semibold text-slate-900">{row.subject}</td>
                      <td className="px-4 py-2.5 text-base text-slate-600">{row.department}</td>
                      {isBillingTable ? (
                        <td className="px-4 py-2.5 text-base font-medium text-slate-700">{row.amount ?? '—'}</td>
                      ) : null}
                      {isPharmacyTable ? (
                        <td className="px-4 py-2.5 text-base font-medium text-slate-700">{row.amount ?? '—'}</td>
                      ) : null}
                      <td className="px-4 py-2.5">
                        <span className="rounded-md border border-[#00A481]/30 bg-[#00A481]/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-[#00758C]">
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-500">{row.updatedAt}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-wrap gap-2">
                          {isAdmissionTable && row.status !== 'Discharged' ? (
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => runDischarge(row.id)}
                              className="text-sm font-semibold text-[#00758C] hover:underline disabled:opacity-50"
                            >
                              {isPending ? 'Processing…' : 'Discharge'}
                            </button>
                          ) : null}
                          {isBillingTable && row.status !== 'Paid' ? (
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => runRecordPayment(row)}
                              className="text-sm font-semibold text-[#00758C] hover:underline disabled:opacity-50"
                            >
                              {isPending ? 'Processing…' : 'Record payment'}
                            </button>
                          ) : null}
                          {isPharmacyTable ? (
                            <>
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => runStockAdjust(row.id, 1)}
                                className="text-sm font-semibold text-[#00758C] hover:underline disabled:opacity-50"
                              >
                                + Stock
                              </button>
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => runStockAdjust(row.id, -1)}
                                className="text-sm font-semibold text-rose-600 hover:underline disabled:opacity-50"
                              >
                                − Stock
                              </button>
                            </>
                          ) : null}
                          {!isAdmissionTable &&
                          !isBillingTable &&
                          !isPharmacyTable &&
                          !isPatientTable &&
                          !isStaffTable &&
                          row.status !== 'Completed' ? (
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => markComplete(row.id)}
                              className="text-sm font-semibold text-[#00758C] hover:underline disabled:opacity-50"
                            >
                              {isPending ? 'Saving…' : 'Complete'}
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          )}
        </div>
      ) : null}

      {tab === 'actions' ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-xl border border-[#00758C]/30 bg-[#00758C]/5 p-4 text-left hover:bg-[#00758C]/10"
          >
            <p className="text-sm font-semibold uppercase text-[#00758C]">{primaryAction}</p>
            <p className="mt-1 text-base text-slate-600">Opens intake form with validation and success feedback.</p>
          </button>
          <button
            type="button"
            onClick={() => {
              startTransition(() => {
                showSuccess(`Exported ${records.length} rows from ${title}.`);
              });
            }}
            className="rounded-xl border border-slate-200 p-4 text-left hover:bg-slate-50"
          >
            <p className="text-sm font-semibold uppercase text-slate-700">Export ledger</p>
            <p className="mt-1 text-base text-slate-600">Download current module snapshot (mock).</p>
          </button>
        </div>
      ) : null}

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-slate-900/40" aria-label="Close" onClick={() => setModalOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-xl font-bold text-[#00758C]">{primaryAction}</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <label className="block text-sm font-medium text-slate-700">
                {isPharmacyTable ? 'Item name' : 'Subject / patient'}
                <input
                  required
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-base"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                {isPharmacyTable ? 'Category' : isAdmissionTable ? 'Ward / unit' : 'Department / service'}
                <input
                  value={form.department}
                  onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-base"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                {isPharmacyTable ? 'SKU' : isStaffTable ? 'Role / title' : 'Reference ID / UHID'}
                <input
                  value={form.reference}
                  onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-base"
                />
              </label>
              {isPatientTable && id === 'patients' ? (
                <label className="block text-sm font-medium text-slate-700">
                  Phone
                  <input
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-base"
                    placeholder="+91…"
                  />
                </label>
              ) : null}
              {isAdmissionTable ? (
                <>
                  <label className="block text-sm font-medium text-slate-700">
                    Attending doctor
                    <input
                      value={form.doctorName}
                      onChange={(e) => setForm((f) => ({ ...f, doctorName: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-base"
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Bed allocation
                    <input
                      value={form.bedNumber}
                      onChange={(e) => setForm((f) => ({ ...f, bedNumber: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-base"
                      placeholder="e.g. B-204"
                    />
                  </label>
                </>
              ) : null}
              {isBillingTable || isPharmacyTable ? (
                <label className="block text-sm font-medium text-slate-700">
                  {isPharmacyTable ? 'Quantity in stock' : 'Amount (INR, excl. GST)'}
                  <input
                    type="number"
                    min={0}
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-base"
                  />
                </label>
              ) : null}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border px-4 py-2 text-sm font-semibold">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#00758C] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {isPending ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
