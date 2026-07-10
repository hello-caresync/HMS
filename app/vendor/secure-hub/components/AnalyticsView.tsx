'use client';

import React from 'react';

import { KpiCard, ModuleTransition, PageHeader } from './hubUi';

interface AnalyticsProps {
  totalPaidRevenue: number;
  totalBilledAmount: number;
}

export default function AnalyticsView({
  totalPaidRevenue,
  totalBilledAmount,
}: AnalyticsProps) {
  const outstanding = totalBilledAmount - totalPaidRevenue;

  return (
    <ModuleTransition moduleKey="analytics">
      <PageHeader
        title="Financial Health Analytics"
        description="High-level revenue metrics synced from your invoicing and settlement ledger."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          label="Cleared revenue"
          value={`₹${totalPaidRevenue.toLocaleString('en-IN')}`}
          hint="Paid invoices"
          accent="emerald"
        />
        <KpiCard
          label="Total billed"
          value={`₹${totalBilledAmount.toLocaleString('en-IN')}`}
          hint="All generated invoices"
          accent="blue"
        />
        <KpiCard
          label="Outstanding"
          value={`₹${outstanding.toLocaleString('en-IN')}`}
          hint="Awaiting settlement"
          accent="amber"
        />
      </div>
    </ModuleTransition>
  );
}
