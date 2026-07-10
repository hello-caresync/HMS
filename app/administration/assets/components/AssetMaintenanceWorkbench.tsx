'use client';

import { useCallback, useState } from 'react';
import { Cpu, Wrench } from 'lucide-react';

import {
  SEED_MEDICAL_ASSETS,
  generateMaintenanceTicketId,
  type MedicalAssetRecord,
} from '../../../lib/administration';
import AssetInventoryTable from './AssetInventoryTable';
import MaintenanceRequestSheet from './MaintenanceRequestSheet';

export default function AssetMaintenanceWorkbench() {
  const [assets, setAssets] = useState<MedicalAssetRecord[]>(SEED_MEDICAL_ASSETS);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<MedicalAssetRecord | null>(null);
  const [lastTicket, setLastTicket] = useState<string | null>(null);

  const openMaintenance = useCallback((asset: MedicalAssetRecord) => {
    setSelectedAsset(asset);
    setSheetOpen(true);
  }, []);

  const handleSubmitMaintenance = useCallback(
    (description: string) => {
      if (!selectedAsset) return;
      const ticketId = generateMaintenanceTicketId();
      setAssets((prev) =>
        prev.map((a) =>
          a.assetId === selectedAsset.assetId
            ? { ...a, status: 'Under Repair' as const }
            : a,
        ),
      );
      setLastTicket(`${ticketId} · ${selectedAsset.equipmentName}`);
      setSheetOpen(false);
      setSelectedAsset(null);
      window.setTimeout(() => setLastTicket(null), 6000);
    },
    [selectedAsset],
  );

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <header className="border-b-2 border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <Cpu className="h-5 w-5 text-sky-700" />
          <div>
            <h1 className="text-lg font-black text-slate-900">Medical Equipment &amp; AMC Ledger</h1>
            <p className="text-xs text-slate-800">
              Phase 7 · Module 21 · Hardware inventory &amp; maintenance tracking
            </p>
          </div>
        </div>
      </header>

      {lastTicket && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          <Wrench className="h-4 w-4" />
          Maintenance request logged: {lastTicket}
        </div>
      )}

      <AssetInventoryTable assets={assets} onLogMaintenance={openMaintenance} />

      <MaintenanceRequestSheet
        open={sheetOpen}
        asset={selectedAsset}
        onClose={() => {
          setSheetOpen(false);
          setSelectedAsset(null);
        }}
        onSubmit={handleSubmitMaintenance}
      />
    </div>
  );
}
