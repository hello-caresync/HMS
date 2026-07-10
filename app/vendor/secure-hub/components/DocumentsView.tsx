'use client';

import React from 'react';

import { ComplianceDoc } from '../types';
import {
  btnAccentClassName,
  cardClassName,
  ModuleTransition,
  PageHeader,
  StatusBadge,
} from './hubUi';

interface DocumentsProps {
  documents: ComplianceDoc[];
  triggerToast: (msg: string) => void;
}

export default function DocumentsView({
  documents,
  triggerToast,
}: DocumentsProps) {
  const docs = documents ?? [];

  return (
    <ModuleTransition moduleKey="documents">
      <PageHeader
        title="Document & Compliance"
        description="Manage regulatory certificates, licenses, and audit-ready compliance records."
        action={
          <button
            type="button"
            onClick={() => triggerToast('License secure link upload verified.')}
            className={btnAccentClassName}
          >
            Upload certificate
          </button>
        }
      />

      <div className="grid gap-3">
        {docs.map((doc, index) => (
          <article
            key={doc?.id ?? `doc-row-${index}`}
            className={`${cardClassName} flex flex-col gap-3 transition-colors hover:border-slate-300 sm:flex-row sm:items-center sm:justify-between`}
          >
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-800">
                {doc.type} · {doc.id}
              </p>
              <h3 className="mt-1 text-sm font-semibold text-slate-900">
                {doc.name}
              </h3>
              {doc.expiryDate && (
                <p className="mt-1 text-xs text-slate-800">
                  Expires {doc.expiryDate}
                </p>
              )}
            </div>
            <StatusBadge label={doc.status} />
          </article>
        ))}
      </div>
    </ModuleTransition>
  );
}
