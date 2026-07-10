'use client';

import React from 'react';

import { EnterprisePO, POExtendedStatus } from '../types';
import {
  btnLogisticsClassName,
  btnOutlineClassName,
  btnPrimaryClassName,
  btnSuccessClassName,
  cardClassName,
  CardAccentBar,
  EmptyState,
  inputClassName,
  KpiCard,
  ModuleTransition,
  nestedPanelClassName,
  overlineClassName,
  PageHeader,
  sectionTitleClassName,
  StatusBadge,
} from './hubUi';
import { getPrimaryLineItem } from '../utils/storageSafe';

interface LogisticsProps {
  purchaseOrders: EnterprisePO[];
  trackingInput: string;
  setTrackingInput: (val: string) => void;
  podReceiver: string;
  setPodReceiver: (val: string) => void;
  podQty: string;
  setPodQty: (val: string) => void;
  updatePOStatus: (poId: string, nextStatus: POExtendedStatus) => void;
  registerPODDelivery: (poId: string) => void;
}

const PIPELINE_STAGES: POExtendedStatus[] = [
  'Accepted',
  'Processing',
  'Packed',
  'Dispatched',
  'In Transit',
  'Delivered',
];

const WAREHOUSE_STATUSES: POExtendedStatus[] = ['Accepted', 'Processing', 'Packed'];
const TRANSIT_STATUSES: POExtendedStatus[] = ['Dispatched', 'In Transit'];

function stageIndex(status: POExtendedStatus): number {
  return PIPELINE_STAGES.indexOf(status);
}

function isPipelineRecord(status: string | undefined): boolean {
  if (!status || status === 'New' || status === 'Rejected') return false;
  return PIPELINE_STAGES.includes(status as POExtendedStatus);
}

function PipelineStepper({ status }: { status: POExtendedStatus }) {
  const current = stageIndex(status);

  return (
    <div className="flex flex-wrap items-center gap-1">
      {PIPELINE_STAGES.map((stage, index) => {
        const isComplete = current > index;
        const isCurrent = current === index;

        return (
          <React.Fragment key={stage}>
            <span
              className={`rounded-md border px-2 py-1 text-[9px] font-black uppercase tracking-wider ${
                isComplete
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : isCurrent
                    ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 bg-white text-slate-800'
              }`}
            >
              {stage}
            </span>
            {index < PIPELINE_STAGES.length - 1 && (
              <span className="text-slate-900">→</span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function LogisticsView({
  purchaseOrders,
  trackingInput,
  setTrackingInput,
  podReceiver,
  setPodReceiver,
  podQty,
  setPodQty,
  updatePOStatus,
  registerPODDelivery,
}: LogisticsProps) {
  const orders = purchaseOrders ?? [];

  const pipelineOrders = orders.filter((po) => isPipelineRecord(po?.status));
  const activeOrders = pipelineOrders.filter((po) => po?.status !== 'Delivered');

  const warehouseCount = pipelineOrders.filter((po) =>
    WAREHOUSE_STATUSES.includes(po?.status as POExtendedStatus),
  ).length;
  const inTransitCount = pipelineOrders.filter((po) =>
    TRANSIT_STATUSES.includes(po?.status as POExtendedStatus),
  ).length;
  const deliveredCount = pipelineOrders.filter((po) => po?.status === 'Delivered').length;

  return (
    <ModuleTransition moduleKey="logistics">
      <PageHeader
        title="Fulfillment Pipeline Tracking"
        description="Advance active warehouse and shipping records through dispatch and proof-of-delivery."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          label="Warehouse lane"
          value={warehouseCount}
          hint="Accepted · Processing · Packed"
          accent="indigo"
        />
        <KpiCard
          label="In transit"
          value={inTransitCount}
          hint="Dispatched · En route"
          accent="amber"
        />
        <KpiCard
          label="Delivered"
          value={deliveredCount}
          hint="POD confirmed"
          accent="emerald"
        />
      </div>

      {activeOrders.length === 0 ? (
        <EmptyState message="No active fulfillment records in the pipeline." />
      ) : (
        <div className="grid gap-4">
          {activeOrders.map((po, index) => {
            const primaryItem = getPrimaryLineItem(po);
            const status = po?.status as POExtendedStatus;

            return (
              <article
                key={po?.id ?? `logistics-row-${index}`}
                className={`${cardClassName} space-y-4 pl-6`}
              >
                <CardAccentBar color="indigo" />

                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className={overlineClassName}>Fulfillment record</p>
                    <p className="font-mono text-xs font-black text-slate-950">
                      {po?.id ?? '—'}
                    </p>
                    <h3 className={`${sectionTitleClassName} mt-1`}>
                      {po?.hospitalName ?? 'Unknown Hospital'}
                    </h3>
                  </div>
                  {status && <StatusBadge label={status} />}
                </div>

                <div className={`${nestedPanelClassName} grid gap-3 sm:grid-cols-2`}>
                  <div>
                    <p className={overlineClassName}>Cargo</p>
                    <p className="mt-1 text-sm font-black text-slate-800">
                      {primaryItem?.name || 'Item Cargo Manifest'}
                    </p>
                    <p className="font-mono text-xs font-black text-slate-800">
                      QTY {(primaryItem?.quantityRequested ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className={overlineClassName}>Drop node</p>
                    <p className="mt-1 text-sm text-slate-900">
                      {po?.deliveryLocation ?? '—'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className={overlineClassName}>Milestone tracker</p>
                  <PipelineStepper status={status} />
                </div>

                <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
                  {status === 'Accepted' && (
                    <button
                      type="button"
                      onClick={() => po?.id && updatePOStatus(po.id, 'Processing')}
                      className={btnLogisticsClassName}
                    >
                      Move to Processing
                    </button>
                  )}
                  {status === 'Processing' && (
                    <button
                      type="button"
                      onClick={() => po?.id && updatePOStatus(po.id, 'Packed')}
                      className={btnLogisticsClassName}
                    >
                      Tag as Packed
                    </button>
                  )}
                  {status === 'Packed' && (
                    <div className="flex w-full flex-col gap-2 lg:max-w-xl lg:flex-row">
                      <input
                        type="text"
                        placeholder="Courier tracking ID"
                        value={trackingInput}
                        onChange={(event) => setTrackingInput(event.target.value)}
                        className={inputClassName}
                      />
                      <button
                        type="button"
                        onClick={() => po?.id && updatePOStatus(po.id, 'Dispatched')}
                        className={`${btnPrimaryClassName} shrink-0`}
                      >
                        🚀 GPRS Dispatch Hook
                      </button>
                    </div>
                  )}
                  {status === 'Dispatched' && (
                    <button
                      type="button"
                      onClick={() => po?.id && updatePOStatus(po.id, 'In Transit')}
                      className={btnPrimaryClassName}
                    >
                      Advance to In-Transit
                    </button>
                  )}
                  {po?.courierTrackingId && (
                    <span className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800">
                      Tracking ·{' '}
                      <span className="ml-1 font-mono font-black text-slate-900">
                        {po.courierTrackingId}
                      </span>
                    </span>
                  )}
                </div>

                {status === 'In Transit' && (
                  <div className={`${nestedPanelClassName} max-w-md space-y-3`}>
                    <p className={overlineClassName}>Proof of delivery [POD]</p>
                    <input
                      type="text"
                      placeholder="Receiver signature / full name"
                      value={podReceiver}
                      onChange={(event) => setPodReceiver(event.target.value)}
                      className={inputClassName}
                    />
                    <input
                      type="number"
                      placeholder="Quantity delivered"
                      value={podQty}
                      onChange={(event) => setPodQty(event.target.value)}
                      className={inputClassName}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPodReceiver('');
                          setPodQty('');
                        }}
                        className={btnOutlineClassName}
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={() => po?.id && registerPODDelivery(po.id)}
                        className={`${btnSuccessClassName} flex-1`}
                      >
                        Finalize POD Drop
                      </button>
                    </div>
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
