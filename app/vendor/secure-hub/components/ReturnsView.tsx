'use client';

import React from 'react';

import { ReturnRequest } from '../types';
import {
  btnPrimaryClassName,
  cardClassName,
  EmptyState,
  ModuleTransition,
  PageHeader,
  StatusBadge,
} from './hubUi';

interface ReturnsProps {
  returnsList: ReturnRequest[];
  handleProcessReturn: (id: string) => void;
}

export default function ReturnsView({
  returnsList,
  handleProcessReturn,
}: ReturnsProps) {
  const returns = returnsList ?? [];

  return (
    <ModuleTransition moduleKey="returns">
      <PageHeader
        title="Returns & Replacements"
        description="Manage reverse logistics requests and replacement fulfillment from hospitals."
      />

      {returns.length === 0 ? (
        <EmptyState message="No return or replacement requests at this time." />
      ) : (
        <div className="grid gap-4">
          {returns.map((ret, index) => (
            <article
              key={ret?.id ?? `ret-row-${index}`}
              className={`${cardClassName} flex flex-col gap-4 transition-colors hover:border-slate-300 sm:flex-row sm:items-center sm:justify-between`}
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-slate-800">{ret?.id ?? '—'}</span>
                  {ret?.status && <StatusBadge label={ret.status} />}
                </div>
                <h3 className="text-sm font-semibold text-slate-900">
                  {ret?.itemName ?? 'Item Cargo Manifest'}{' '}
                  <span className="font-normal text-slate-800">
                    × {ret?.quantityToReturn ?? 0}
                  </span>
                </h3>
                <p className="text-xs text-slate-800">
                  {ret?.hospitalName ?? 'Unknown Hospital'} · PO {ret?.poReferenceId ?? '—'}
                </p>
                <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-900">
                  {ret?.reason ?? '—'}
                </p>
              </div>

              {ret?.status === 'Pending Pickup' && (
                <button
                  type="button"
                  onClick={() => ret?.id && handleProcessReturn(ret.id)}
                  className={`${btnPrimaryClassName} shrink-0`}
                >
                  Process replacement
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </ModuleTransition>
  );
}
