'use client';

import React from 'react';

import { VendorInvoice, RolePermissions } from '../types/procurement';
import {
  alertWarningClassName,
  bodyTextClassName,
  btnSuccessClassName,
  EmptyState,
  featureHeaderClassName,
  monoDataClassName,
  PageHeader,
  panelClassName,
  StatusBadge,
  workspaceClassName,
} from './hospitalUi';

type InvoiceAuditingViewProps = {
  invoices: VendorInvoice[];
  onVerifyThreeWayMatch: (invoiceId: string) => void;
  permissions: RolePermissions;
};

export default function InvoiceAuditingView({
  invoices,
  onVerifyThreeWayMatch,
  permissions,
}: InvoiceAuditingViewProps) {
  return (
    <div className={workspaceClassName}>
      <PageHeader
        overline="Finance verification"
        title="3-Way Verification Ledger Matrix"
        description="PO manifest · goods receipt · tax invoice settlement cross-check."
      />

      {!permissions.canApprovePayment && (
        <p className={alertWarningClassName}>
          Payment approval controls are locked for your role. View-only audit mode
          active.
        </p>
      )}

      {invoices.length === 0 ? (
        <EmptyState message="Awaiting uploaded billing invoices from vendor network..." />
      ) : (
        invoices.map((invoice) => (
          <article
            key={invoice.id}
            className={`${panelClassName} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}
          >
            <div className="space-y-1">
              <span className={`text-[10px] ${monoDataClassName}`}>
                {invoice.id}
              </span>
              <p className={featureHeaderClassName}>{invoice.vendorName}</p>
              <p className={bodyTextClassName}>
                Gross total:{' '}
                <span className="font-mono font-black text-[#A65E53]">
                  ₹{invoice.totalAmount.toLocaleString('en-IN')}
                </span>
              </p>
              <p className={`text-[10px] ${monoDataClassName} text-slate-800`}>
                PO {invoice.poReferenceId} · Match {invoice.matchingStatus}
              </p>
            </div>

            <div className="flex flex-col items-start gap-2 sm:items-end">
              <StatusBadge label={invoice.paymentStatus} />
              {invoice.status === 'Submitted' && permissions.canApprovePayment ? (
                <button
                  type="button"
                  onClick={() => onVerifyThreeWayMatch(invoice.id)}
                  className={btnSuccessClassName}
                >
                  Execute 3-Way Match Verification
                </button>
              ) : invoice.status === 'Paid' ? (
                <StatusBadge label="Paid" />
              ) : null}
            </div>
          </article>
        ))
      )}
    </div>
  );
}
