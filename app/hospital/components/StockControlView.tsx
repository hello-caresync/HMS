'use client';

import React from 'react';

import { StockItem, RolePermissions } from '../types/procurement';
import {
  alertWarningClassName,
  bodyTextClassName,
  btnPrimaryClassName,
  featureHeaderClassName,
  monoDataClassName,
  overlineClassName,
  PageHeader,
  panelClassName,
  StatusBadge,
  workspaceClassName,
} from './hospitalUi';

type StockControlViewProps = {
  stockItems: StockItem[];
  onDraftAutoPO: (sku: string) => void;
  permissions: RolePermissions;
};

export default function StockControlView({
  stockItems,
  onDraftAutoPO,
  permissions,
}: StockControlViewProps) {
  if (!permissions.canManageStock) {
    return (
      <div className={workspaceClassName}>
        <p className={alertWarningClassName}>
          Inventory threshold controls require Store Manager or Procurement access.
        </p>
      </div>
    );
  }

  return (
    <div className={workspaceClassName}>
      <PageHeader
        overline="Inventory ops"
        title="Inventory Threshold Control Tower"
        description="Low-stock flags with automated PO drafting recommendations."
      />

      {stockItems.map((item) => {
        const isLow = item.currentLevel <= item.reorderThreshold;
        const fillPercent = Math.min(
          100,
          Math.round((item.currentLevel / (item.reorderThreshold * 3)) * 100),
        );

        return (
          <article key={item.sku} className={`${panelClassName} space-y-4`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className={`text-[10px] ${monoDataClassName} text-slate-800`}>
                  {item.sku}
                </span>
                <h4 className={`${featureHeaderClassName} mt-0.5`}>{item.name}</h4>
                <p className={bodyTextClassName}>{item.department}</p>
              </div>
              <StatusBadge label={isLow ? 'Low Stock Flag' : 'Stable Buffer'} />
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all ${isLow ? 'bg-rose-400' : 'bg-[#D48D82]'}`}
                style={{ width: `${fillPercent}%` }}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3">
              <div>
                <p className={`${monoDataClassName} text-lg text-slate-900`}>
                  {item.currentLevel.toLocaleString('en-IN')}{' '}
                  <span className="text-sm font-bold text-slate-800">units left</span>
                </p>
                <p className={`${bodyTextClassName} mt-1`}>
                  Reorder threshold{' '}
                  <span className={monoDataClassName}>
                    {item.reorderThreshold.toLocaleString('en-IN')}
                  </span>{' '}
                  {item.unit}
                </p>
              </div>
              {isLow && (
                <button
                  type="button"
                  onClick={() => onDraftAutoPO(item.sku)}
                  className={btnPrimaryClassName}
                >
                  Auto-Draft PO
                </button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
