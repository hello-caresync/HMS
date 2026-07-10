'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { SEED_ASSETS, SEED_TICKETS } from '../lib/seedAssets';
import type {
  AssetMetrics,
  AssetTab,
  AssetToast,
  FaultUrgency,
  MaintenanceTicket,
  MedicalAsset,
} from '../types';
import { computeAssetMetrics, generateTicketId, rollCalibrationDate } from '../types';

type AssetsContextValue = {
  activeTab: AssetTab;
  setActiveTab: (tab: AssetTab) => void;
  assets: MedicalAsset[];
  tickets: MaintenanceTicket[];
  metrics: AssetMetrics;
  toasts: AssetToast[];
  reportFault: (
    assetId: string,
    urgency: FaultUrgency,
    description: string,
  ) => { success: boolean; error?: string };
  logCalibrationSuccess: (
    assetId: string,
    technicianRef: string,
  ) => { success: boolean; error?: string };
  dismissToast: (id: string) => void;
  calibrationLedger: MedicalAsset[];
};

const AssetsContext = createContext<AssetsContextValue | null>(null);

function pushToast(prev: AssetToast[], message: string, type: AssetToast['type']): AssetToast[] {
  return [{ id: `ast-toast-${Date.now()}`, message, type }, ...prev].slice(0, 4);
}

export function AssetsProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<AssetTab>('master');
  const [assets, setAssets] = useState<MedicalAsset[]>(SEED_ASSETS);
  const [tickets, setTickets] = useState<MaintenanceTicket[]>(SEED_TICKETS);
  const [toasts, setToasts] = useState<AssetToast[]>([]);

  const metrics = useMemo(() => computeAssetMetrics(assets, tickets), [assets, tickets]);

  const calibrationLedger = useMemo(
    () =>
      [...assets].sort(
        (a, b) =>
          new Date(a.nextCalibrationDate).getTime() - new Date(b.nextCalibrationDate).getTime(),
      ),
    [assets],
  );

  const reportFault = useCallback(
    (assetId: string, urgency: FaultUrgency, description: string) => {
      if (!description.trim()) return { success: false, error: 'Problem description is required' };

      const asset = assets.find((a) => a.id === assetId);
      if (!asset) return { success: false, error: 'Asset not found' };

      const ticket: MaintenanceTicket = {
        id: generateTicketId(),
        assetId,
        assetName: asset.name,
        urgency,
        description: description.trim(),
        reportedAt: new Date().toISOString(),
        status: 'Open',
      };

      setTickets((prev) => [ticket, ...prev]);

      if (urgency === 'Critical Breakdown') {
        setAssets((prev) =>
          prev.map((a) =>
            a.id === assetId ? { ...a, status: 'Under Repair' as const } : a,
          ),
        );
        setToasts((prev) =>
          pushToast(
            prev,
            `[Biomedical Engineering] Critical breakdown — ${asset.name} (${asset.assetId}) flagged Under Repair`,
            'alert',
          ),
        );
      } else if (urgency === 'High') {
        setToasts((prev) =>
          pushToast(prev, `High-priority fault logged for ${asset.name}`, 'info'),
        );
      }

      return { success: true };
    },
    [assets],
  );

  const logCalibrationSuccess = useCallback(
    (assetId: string, technicianRef: string) => {
      if (!technicianRef.trim()) {
        return { success: false, error: 'Technician signature or validation reference required' };
      }

      const asset = assets.find((a) => a.id === assetId);
      if (!asset) return { success: false, error: 'Asset not found' };

      const today = new Date().toISOString().slice(0, 10);
      const nextCal = rollCalibrationDate(today, 6);

      setAssets((prev) =>
        prev.map((a) =>
          a.id === assetId
            ? {
                ...a,
                lastServiceDate: today,
                nextCalibrationDate: nextCal,
                status: 'Operational' as const,
              }
            : a,
        ),
      );

      setTickets((prev) =>
        prev.map((t) =>
          t.assetId === assetId && t.status === 'Open'
            ? { ...t, status: 'Resolved' as const }
            : t,
        ),
      );

      setToasts((prev) =>
        pushToast(
          prev,
          `Calibration logged · ${asset.name} · Ref ${technicianRef.trim()} · Next due ${nextCal}`,
          'success',
        ),
      );

      return { success: true };
    },
    [assets],
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      activeTab,
      setActiveTab,
      assets,
      tickets,
      metrics,
      toasts,
      reportFault,
      logCalibrationSuccess,
      dismissToast,
      calibrationLedger,
    }),
    [
      activeTab,
      assets,
      tickets,
      metrics,
      toasts,
      reportFault,
      logCalibrationSuccess,
      dismissToast,
      calibrationLedger,
    ],
  );

  return <AssetsContext.Provider value={value}>{children}</AssetsContext.Provider>;
}

export function useAssets(): AssetsContextValue {
  const ctx = useContext(AssetsContext);
  if (!ctx) throw new Error('useAssets must be used within AssetsProvider');
  return ctx;
}
