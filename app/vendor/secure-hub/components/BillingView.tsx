'use client';

import React from 'react';

import { EnterprisePO, GeneratedInvoice, VendorUserRole } from '../types';
import {
  ModuleTransition,
  overlineClassName,
  PageHeader,
  sectionTitleClassName,
} from './hubUi';
import { computePoLineTotal } from '../utils/storageSafe';

interface BillingProps {
  purchaseOrders?: EnterprisePO[];
  invoices?: GeneratedInvoice[];
  currentRole: VendorUserRole;
  executeInvoiceGeneration: (po: EnterprisePO) => void;
}

const CANVAS = 'rounded-2xl bg-slate-50/50 p-5';

const PANEL =
  'overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-xs';

const TABLE_HEADER =
  'hidden gap-4 border-b-2 border-slate-200 bg-slate-50/80 p-4 font-mono text-[10px] font-black uppercase tracking-wider text-slate-800 md:grid md:grid-cols-5';

const TABLE_ROW =
  'grid grid-cols-1 items-center gap-3 border-b-2 border-slate-200/80 p-4 text-xs font-bold transition-colors last:border-b-0 hover:bg-slate-50/50 md:grid-cols-5 md:gap-4';

const BTN_COMPILE =
  'cursor-pointer rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white shadow-sm shadow-emerald-600/10 transition-all hover:bg-emerald-700';

const BADGE_BASE =
  'inline-block rounded-md border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider';

const METRIC_LABEL =
  'font-mono text-[10px] font-black uppercase tracking-wider text-slate-800';

function DocumentIconBadge() {
  return (
    <div
      className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border-2 border-slate-300 bg-white shadow-xs"
      aria-hidden
    >
      <svg
        className="h-5 w-5 text-slate-800"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    </div>
  );
}

function BillingEmptyState({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/40 p-12 text-center">
      <DocumentIconBadge />
      <p className="text-sm font-bold tracking-tight text-slate-900">{title}</p>
      <p className="mt-1 text-xs font-medium text-slate-800">{subtitle}</p>
    </div>
  );
}

function FinancialBadge({ status }: { status: string }) {
  const isPaid = status === 'Paid';
  return (
    <span
      className={`${BADGE_BASE} ${
        isPaid
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-amber-200 bg-amber-50 text-amber-700'
      }`}
    >
      {status}
    </span>
  );
}

function BalanceMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'amber' | 'emerald';
}) {
  const valueClass =
    tone === 'amber'
      ? 'ml-1.5 font-mono text-sm font-black text-amber-600'
      : 'ml-1.5 font-mono text-sm font-black text-emerald-600';

  return (
    <div className="inline-flex items-baseline">
      <span className={METRIC_LABEL}>{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}

function formatInr(value: number): string {
  return `₹${(Number(value) || 0).toLocaleString('en-IN')}`;
}

export default function BillingView({
  purchaseOrders = [],
  invoices = [],
  currentRole,
  executeInvoiceGeneration,
}: BillingProps) {
  const orders = purchaseOrders ?? [];
  const invoiceRows = invoices ?? [];

  if (currentRole === 'LOGISTICS_STAFF') {
    return (
      <ModuleTransition moduleKey="billing-blocked">
        <div className={CANVAS}>
          <BillingEmptyState
            title="Billing desk restricted"
            subtitle="Logistics roles cannot access the tax invoicing module. Contact an administrator."
          />
        </div>
      </ModuleTransition>
    );
  }

  const billableOrders = orders.filter((po) => po?.status === 'Delivered');

  const totalOutstanding = invoiceRows
    .filter((inv) => inv?.status !== 'Paid')
    .reduce((sum, inv) => sum + (Number(inv?.totalAmount) || 0), 0);

  const totalSettled = invoiceRows
    .filter((inv) => inv?.status === 'Paid')
    .reduce((sum, inv) => sum + (Number(inv?.totalAmount) || 0), 0);

  return (
    <ModuleTransition moduleKey="billing">
      <PageHeader
        title="Tax Invoicing Desk"
        description="Enterprise GST compilation queue and corporate settlement ledger."
      />

      <section className={`${CANVAS} space-y-4`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className={overlineClassName}>Compile queue</p>
            <h3 className={sectionTitleClassName}>
              Delivered orders awaiting invoice
            </h3>
          </div>
          <p className="font-mono text-xs font-black text-slate-800">
            {billableOrders.length} record(s) · 12% GST baseline
          </p>
        </div>

        {billableOrders.length === 0 ? (
          <BillingEmptyState
            title="No delivered orders ready"
            subtitle="Orders must reach Delivered status before GST invoice compilation."
          />
        ) : (
          <div className={PANEL}>
            <div className={TABLE_HEADER}>
              <span>PO reference</span>
              <span>Hospital entity</span>
              <span>Line value</span>
              <span>GST gross</span>
              <span className="text-right">Action</span>
            </div>
            {billableOrders.map((po, index) => {
              const base =
                po?.items?.reduce(
                  (sum, item) =>
                    sum +
                    (Number(item?.quantityRequested) || 0) *
                      (Number(item?.unitPrice) || 0),
                  0,
                ) ?? computePoLineTotal(po);
              const gst = base * 0.12;
              const gross = base + gst;
              const lineLabel = po?.items?.[0]?.name ?? 'Item Cargo Manifest';
              const alreadyInvoiced = invoiceRows.some(
                (inv) => inv?.poReferenceId === po?.id,
              );

              return (
                <div key={po?.id ?? `bill-po-${index}`} className={TABLE_ROW}>
                  <div>
                    <p className="font-mono text-[10px] font-black uppercase tracking-wider text-slate-800 md:hidden">
                      PO reference
                    </p>
                    <p className="font-mono font-black text-slate-900">
                      {po?.id ?? '—'}
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] font-black uppercase tracking-wider text-slate-800 md:hidden">
                      Hospital entity
                    </p>
                    <p className="font-black text-slate-800">
                      {po?.hospitalName ?? 'Unknown Hospital'}
                    </p>
                    <p className="mt-0.5 truncate text-[10px] font-bold text-slate-800">
                      {lineLabel}
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] font-black uppercase tracking-wider text-slate-800 md:hidden">
                      Line value
                    </p>
                    <p className="font-mono font-black text-slate-900">
                      {formatInr(base)}
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] font-black uppercase tracking-wider text-slate-800 md:hidden">
                      GST gross
                    </p>
                    <p className="font-mono font-black text-slate-900">
                      {formatInr(gross)}
                    </p>
                    <p className="font-mono text-[10px] font-black text-slate-800">
                      +{formatInr(gst)} GST
                    </p>
                  </div>
                  <div className="md:text-right">
                    {alreadyInvoiced ? (
                      <span
                        className={`${BADGE_BASE} border-emerald-200 bg-emerald-50 text-emerald-700`}
                      >
                        Compiled
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => executeInvoiceGeneration(po)}
                        className={BTN_COMPILE}
                      >
                        ⚡ Auto-Compile GST Invoice
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className={`${CANVAS} mt-6 space-y-4`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className={overlineClassName}>Corporate ledger</p>
            <h3 className={sectionTitleClassName}>Generated invoices</h3>
          </div>
          <div className="flex flex-wrap items-baseline gap-5 rounded-xl border border-slate-200/60 bg-white px-4 py-3 shadow-xs">
            <BalanceMetric
              label="Outstanding"
              value={formatInr(totalOutstanding)}
              tone="amber"
            />
            <BalanceMetric
              label="Settled"
              value={formatInr(totalSettled)}
              tone="emerald"
            />
          </div>
        </div>

        {invoiceRows.length === 0 ? (
          <BillingEmptyState
            title="No invoices generated yet"
            subtitle="Compiled GST invoices will appear in the corporate ledger below."
          />
        ) : (
          <div className={PANEL}>
            <div className={TABLE_HEADER}>
              <span>Invoice token</span>
              <span>Hospital entity</span>
              <span>PO reference</span>
              <span>Gross total</span>
              <span className="text-right">Settlement</span>
            </div>
            {invoiceRows.map((inv, index) => {
              const status = inv?.status ?? 'Submitted';
              const isPaid = status === 'Paid';

              return (
                <div key={inv?.id ?? `inv-row-${index}`} className={TABLE_ROW}>
                  <div>
                    <p className="font-mono text-[10px] font-black uppercase tracking-wider text-slate-800 md:hidden">
                      Invoice token
                    </p>
                    <p className="font-mono font-black text-slate-900">
                      {inv?.id ?? '—'}
                    </p>
                    <p className="font-mono text-[10px] font-black text-slate-800">
                      {inv?.dateCreated ?? '—'}
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] font-black uppercase tracking-wider text-slate-800 md:hidden">
                      Hospital entity
                    </p>
                    <p className="font-black text-slate-800">
                      {inv?.hospitalName ?? 'Unknown Hospital'}
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] font-black uppercase tracking-wider text-slate-800 md:hidden">
                      PO reference
                    </p>
                    <p className="font-mono font-black text-slate-900">
                      {inv?.poReferenceId ?? '—'}
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] font-black uppercase tracking-wider text-slate-800 md:hidden">
                      Gross total
                    </p>
                    <p className="font-mono font-black text-slate-900">
                      {formatInr(Number(inv?.totalAmount) || 0)}
                    </p>
                    <p className="font-mono text-[10px] font-black text-slate-800">
                      BASE {formatInr(Number(inv?.baseAmount) || 0)}
                    </p>
                  </div>
                  <div className="md:text-right">
                    <FinancialBadge status={isPaid ? 'Paid' : 'Submitted'} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </ModuleTransition>
  );
}
