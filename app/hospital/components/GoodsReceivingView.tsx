'use client';

import React from 'react';

import { PurchaseOrder, RolePermissions } from '../types/procurement';
import {
  alertWarningClassName,
  bodyTextClassName,
  btnSuccessClassName,
  EmptyState,
  featureHeaderClassName,
  monoDataClassName,
  nestedPanelClassName,
  PageHeader,
  panelClassName,
  StatusBadge,
  workspaceClassName,
} from './hospitalUi';

type GoodsReceivingViewProps = {
  purchaseOrders: PurchaseOrder[];
  onConfirmReceipt: (poId: string) => void;
  permissions: RolePermissions;
};

export default function GoodsReceivingView({
  purchaseOrders,
  onConfirmReceipt,
  permissions,
}: GoodsReceivingViewProps) {
  const inboundOrders = purchaseOrders.filter(
    (po) =>
      po.status === 'Dispatched' ||
      po.status === 'In Transit' ||
      po.status === 'Delivered' ||
      po.status === 'Accepted',
  );

  if (!permissions.canReceiveGoods) {
    return (
      <div className={workspaceClassName}>
        <p className={alertWarningClassName}>
          Inbound drop verification requires Store Manager or Procurement credentials.
        </p>
      </div>
    );
  }

  return (
    <div className={workspaceClassName}>
      <PageHeader
        overline="Inbound logistics"
        title="Inbound Goods Receiving Dock"
        description="Verify delivered quantities against open PO manifests."
      />

      {inboundOrders.length === 0 ? (
        <EmptyState message="No inbound shipments awaiting dock verification." />
      ) : (
        inboundOrders.map((po) => (
          <article key={po.id} className={`${panelClassName} space-y-4`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className={`text-xs ${monoDataClassName}`}>{po.id}</span>
                <h4 className={`${featureHeaderClassName} mt-1`}>{po.vendorName}</h4>
                <p className={bodyTextClassName}>Drop: {po.deliveryLocation}</p>
              </div>
              <StatusBadge label={po.status} />
            </div>

            <div className={`${nestedPanelClassName} space-y-2`}>
              {po.items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap justify-between gap-2 text-xs font-semibold text-slate-900"
                >
                  <span>{item.name}</span>
                  <span className={monoDataClassName}>
                    Req {item.quantityRequested.toLocaleString('en-IN')} · Rcv{' '}
                    {(item.quantityReceived ?? 0).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            {(po.status === 'Dispatched' || po.status === 'In Transit') && (
              <button
                type="button"
                onClick={() => onConfirmReceipt(po.id)}
                className={btnSuccessClassName}
              >
                ✓ Confirm Dock Receipt
              </button>
            )}
          </article>
        ))
      )}
    </div>
  );
}
