'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

import { APP_ROUTES } from '../../../lib/routes';
import { EnterprisePO, POExtendedStatus, POInboxFilter } from '../types';
import {
  btnLogisticsClassName,
  btnOutlineClassName,
  btnPrimaryClassName,
  cardClassName,
  EmptyState,
  FilterBar,
  ModuleTransition,
  nestedPanelClassName,
  overlineClassName,
  PageHeader,
  sectionTitleClassName,
  StatusBadge,
} from './hubUi';
import { getPrimaryLineItem } from '../utils/storageSafe';

interface POInboxProps {
  purchaseOrders: EnterprisePO[];
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  poStatusFilter: POInboxFilter;
  setPoStatusFilter: (val: POInboxFilter) => void;
  updatePOStatus: (poId: string, nextStatus: POExtendedStatus) => void;
}

const FILTER_OPTIONS: { value: POInboxFilter; label: string }[] = [
  { value: 'ALL', label: 'All contracts' },
  { value: 'New', label: 'New' },
  { value: 'Accepted', label: 'Accepted' },
];

function isInboxManifest(status: string | undefined): boolean {
  return status === 'New' || status === 'Accepted';
}

export default function POInboxView({
  purchaseOrders,
  searchQuery,
  setSearchQuery,
  poStatusFilter,
  setPoStatusFilter,
  updatePOStatus,
}: POInboxProps) {
  const router = useRouter();
  const orders = purchaseOrders ?? [];

  const inboxOrders = orders.filter((po) => isInboxManifest(po?.status));

  const filteredPOs = inboxOrders.filter((po) => {
    if (!po) return false;
    const matchesFilter =
      poStatusFilter === 'ALL' || po.status === poStatusFilter;
    const query = searchQuery.toLowerCase();
    const hospitalName = po.hospitalName?.toLowerCase() ?? '';
    const poId = po.id?.toLowerCase() ?? '';
    return matchesFilter && (hospitalName.includes(query) || poId.includes(query));
  });

  const openDetailCorridor = (id: string) => {
    router.push(`${APP_ROUTES.vendorSecureHubPoInbox}?poId=${encodeURIComponent(id)}`);
  };

  return (
    <ModuleTransition moduleKey="po_inbox">
      <PageHeader
        title="Purchase Order Contracts Inbox"
        description="Review incoming hospital manifests in New or Accepted status. Accept terms or route accepted contracts to fulfillment."
      />

      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search hospital or PO reference..."
        filterValue={poStatusFilter}
        onFilterChange={(value) => setPoStatusFilter(value as POInboxFilter)}
        filterOptions={FILTER_OPTIONS}
      />

      {filteredPOs.length === 0 ? (
        <EmptyState message="No incoming contracts match your current filters." />
      ) : (
        <div className="grid gap-4">
          {filteredPOs.map((po, index) => {
            const primaryItem = getPrimaryLineItem(po);
            const isNew = po.status === 'New';
            const isAccepted = po.status === 'Accepted';

            return (
              <article
                key={po.id ?? `inbox-row-${index}`}
                className={`${cardClassName} space-y-4`}
              >
                <div className="flex flex-col gap-3 border-b-2 border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className={overlineClassName}>Contract manifest</p>
                    <p className="font-mono text-xs font-black text-slate-950">
                      {po.id ?? '—'}
                    </p>
                    <h3 className={`${sectionTitleClassName} mt-1`}>
                      {po.hospitalName ?? 'Unknown Hospital'}
                    </h3>
                  </div>
                  {po.status && <StatusBadge label={po.status} />}
                </div>

                <div className={`${nestedPanelClassName} grid gap-4 sm:grid-cols-2`}>
                  <div>
                    <p className={overlineClassName}>Line item</p>
                    <p className="mt-1 text-sm font-black text-slate-800">
                      {primaryItem.name || 'Item Cargo Manifest'}
                    </p>
                    <p className="mt-0.5 font-mono text-xs font-black text-slate-800">
                      QTY {(primaryItem.quantityRequested ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className={overlineClassName}>Delivery terms</p>
                    <p className="mt-1 text-sm text-slate-900">
                      {po.deliveryLocation ?? '—'}
                    </p>
                    <p className="mt-0.5 font-mono text-[11px] font-black text-slate-800">
                      NET {po.creditTermsDays ?? 30} · {po.expectedDeliveryDate ?? '—'}
                    </p>
                  </div>
                </div>

                {isNew && (
                  <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
                    <button
                      type="button"
                      onClick={() => po.id && openDetailCorridor(po.id)}
                      className={btnOutlineClassName}
                    >
                      Inspect Contract Detail →
                    </button>
                    <button
                      type="button"
                      onClick={() => po.id && updatePOStatus(po.id, 'Rejected')}
                      className={btnOutlineClassName}
                    >
                      ✕ Decline Contract
                    </button>
                    <button
                      type="button"
                      onClick={() => po.id && updatePOStatus(po.id, 'Accepted')}
                      className={btnPrimaryClassName}
                    >
                      ✓ Accept PO Terms
                    </button>
                  </div>
                )}

                {isAccepted && (
                  <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
                    <button
                      type="button"
                      onClick={() => po.id && openDetailCorridor(po.id)}
                      className={btnOutlineClassName}
                    >
                      Inspect Contract Detail →
                    </button>
                    <button
                      type="button"
                      onClick={() => po.id && updatePOStatus(po.id, 'Processing')}
                      className={btnLogisticsClassName}
                    >
                      🏗️ Route to Fulfillment Floor →
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </ModuleTransition>
  );
}
