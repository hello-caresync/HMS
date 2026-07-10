'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import {
  DIMENSION_SUMMARIES,
  GENERIC_REPORT_ROWS,
  SEED_AUDIT_LOGS,
  SEED_REVENUE_ROWS,
  SEED_REVENUE_TREND,
} from '../lib/seedReports';
import type {
  AuditLogEntry,
  DimensionSummary,
  ExportFormat,
  GenericReportRow,
  ReportDimension,
  ReportsToast,
  RevenueReportRow,
  RevenueTrendPoint,
} from '../types';

type ReportsContextValue = {
  activeDimension: ReportDimension;
  setActiveDimension: (dimension: ReportDimension) => void;
  summaries: DimensionSummary[];
  revenueRows: RevenueReportRow[];
  revenueTrend: RevenueTrendPoint[];
  auditLogs: AuditLogEntry[];
  genericRows: GenericReportRow[];
  toasts: ReportsToast[];
  exportReport: (format: ExportFormat) => void;
  dismissToast: (id: string) => void;
};

const ReportsContext = createContext<ReportsContextValue | null>(null);

function pushToast(prev: ReportsToast[], message: string): ReportsToast[] {
  return [{ id: `rpt-toast-${Date.now()}`, message, type: 'success' as const }, ...prev].slice(0, 4);
}

export function ReportsProvider({ children }: { children: React.ReactNode }) {
  const [activeDimension, setActiveDimension] = useState<ReportDimension>('revenue');
  const [toasts, setToasts] = useState<ReportsToast[]>([]);

  const summaries = useMemo(
    () => DIMENSION_SUMMARIES[activeDimension],
    [activeDimension],
  );

  const genericRows = useMemo(() => {
    if (activeDimension === 'revenue' || activeDimension === 'audit') return [];
    return GENERIC_REPORT_ROWS[activeDimension];
  }, [activeDimension]);

  const exportReport = useCallback(
    (format: ExportFormat) => {
      const dimensionLabel =
        activeDimension.charAt(0).toUpperCase() + activeDimension.slice(1);
      const payloadId = `NXR-${Date.now().toString(36).toUpperCase()}`;
      const ext = format === 'pdf' ? 'PDF' : 'CSV';

      setToasts((prev) =>
        pushToast(
          prev,
          `Encrypted, signed ${ext} report payload [${payloadId}] for ${dimensionLabel} Reports generated and dispatched to local download manager queue.`,
        ),
      );
    },
    [activeDimension],
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(
    (): ReportsContextValue => ({
      activeDimension,
      setActiveDimension,
      summaries,
      revenueRows: SEED_REVENUE_ROWS,
      revenueTrend: SEED_REVENUE_TREND,
      auditLogs: SEED_AUDIT_LOGS,
      genericRows,
      toasts,
      exportReport,
      dismissToast,
    }),
    [
      activeDimension,
      summaries,
      genericRows,
      toasts,
      exportReport,
      dismissToast,
    ],
  );

  return <ReportsContext.Provider value={value}>{children}</ReportsContext.Provider>;
}

export function useReports() {
  const ctx = useContext(ReportsContext);
  if (!ctx) throw new Error('useReports must be used within ReportsProvider');
  return ctx;
}
