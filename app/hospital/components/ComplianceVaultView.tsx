'use client';

import React from 'react';

import { ComplianceDocument, RolePermissions } from '../types/procurement';
import {
  alertWarningClassName,
  bodyTextClassName,
  featureHeaderClassName,
  monoDataClassName,
  PageHeader,
  panelClassName,
  StatusBadge,
  workspaceClassName,
} from './hospitalUi';

type ComplianceVaultViewProps = {
  documents: ComplianceDocument[];
  permissions: RolePermissions;
};

export default function ComplianceVaultView({
  documents,
  permissions,
}: ComplianceVaultViewProps) {
  if (!permissions.canViewCompliance) {
    return (
      <div className={workspaceClassName}>
        <p className={alertWarningClassName}>
          Compliance vault access denied for Department Staff requisition accounts.
        </p>
      </div>
    );
  }

  return (
    <div className={workspaceClassName}>
      <PageHeader
        overline="Regulatory archive"
        title="Digital Compliance Vault"
        description="Vendor contracts, trade agreements, and regulatory certificates."
      />

      {documents.map((doc) => (
        <article key={doc.id} className={`${panelClassName} space-y-3`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <span className={`text-xs ${monoDataClassName} text-slate-800`}>
                {doc.id}
              </span>
              <h4 className={`${featureHeaderClassName} mt-0.5`}>{doc.title}</h4>
              <p className={bodyTextClassName}>
                {doc.vendorName} · {doc.documentType}
              </p>
            </div>
            <StatusBadge label={doc.status} />
          </div>
          <p className={bodyTextClassName}>
            Expiry: <span className={monoDataClassName}>{doc.expiryDate}</span>
          </p>
        </article>
      ))}
    </div>
  );
}
