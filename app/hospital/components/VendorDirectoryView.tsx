'use client';

import React from 'react';

import { VendorProfile, RolePermissions } from '../types/procurement';
import {
  alertWarningClassName,
  bodyTextClassName,
  featureHeaderClassName,
  monoDataClassName,
  overlineClassName,
  PageHeader,
  panelClassName,
  StatusBadge,
  workspaceClassName,
} from './hospitalUi';

type VendorDirectoryViewProps = {
  vendors: VendorProfile[];
  permissions: RolePermissions;
};

export default function VendorDirectoryView({
  vendors,
  permissions,
}: VendorDirectoryViewProps) {
  if (!permissions.canManageVendors) {
    return (
      <div className={workspaceClassName}>
        <p className={alertWarningClassName}>
          Read-only vendor registry. Contact Procurement to modify supplier records.
        </p>
      </div>
    );
  }

  return (
    <div className={workspaceClassName}>
      <PageHeader
        overline="Supplier network"
        title="Authorized Vendor Directory"
        description="GSTIN verification, wholesale licenses, and trade category mapping."
      />

      {vendors.map((vendor) => (
        <article key={vendor.id} className={`${panelClassName} space-y-4`}>
          <div className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-slate-200 pb-4">
            <div>
              <span className={overlineClassName}>Registered entity</span>
              <h4 className={featureHeaderClassName}>{vendor.companyName}</h4>
              <p className={`mt-1 text-[11px] ${monoDataClassName} text-slate-800`}>
                GSTIN: {vendor.gstin}
              </p>
            </div>
            <StatusBadge label={vendor.status} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <p className={bodyTextClassName}>
              License:{' '}
              <span className={monoDataClassName}>{vendor.licenseNumber}</span>
            </p>
            <p className={bodyTextClassName}>
              Agreement expiry:{' '}
              <span className={monoDataClassName}>{vendor.tradeAgreementExpiry}</span>
            </p>
            <p className={bodyTextClassName}>
              Contact:{' '}
              <span className={monoDataClassName}>{vendor.contactEmail}</span>
            </p>
            <p className={bodyTextClassName}>
              Outstanding:{' '}
              <span className="font-mono font-black text-rose-600">
                ₹{vendor.outstandingDues.toLocaleString('en-IN')}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-3">
            {vendor.category.map((cat) => (
              <StatusBadge key={cat} label={cat} />
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}
