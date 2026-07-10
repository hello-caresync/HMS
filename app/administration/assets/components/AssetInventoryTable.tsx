'use client';

import { Wrench } from 'lucide-react';

import { EQUIPMENT_STATUS_STYLES, type MedicalAssetRecord } from '../../../lib/administration';

type AssetInventoryTableProps = {
  assets: MedicalAssetRecord[];
  onLogMaintenance: (asset: MedicalAssetRecord) => void;
};

export default function AssetInventoryTable({
  assets,
  onLogMaintenance,
}: AssetInventoryTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-slate-200 bg-slate-800 text-white">
              <th className="px-3 py-2 text-left text-[10px] font-black uppercase">Equipment</th>
              <th className="px-3 py-2 text-left text-[10px] font-black uppercase">Room Locator</th>
              <th className="px-3 py-2 text-left text-[10px] font-black uppercase">Status</th>
              <th className="px-3 py-2 text-left text-[10px] font-black uppercase">Warranty Exp.</th>
              <th className="px-3 py-2 text-left text-[10px] font-black uppercase">AMC Provider</th>
              <th className="px-3 py-2 text-right text-[10px] font-black uppercase">Action</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset, index) => (
              <tr
                key={asset.assetId}
                className={`border-b-2 border-slate-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}
              >
                <td className="px-3 py-2">
                  <p className="text-xs font-bold text-slate-900">{asset.equipmentName}</p>
                  <p className="font-mono text-[10px] text-slate-800">{asset.assetId}</p>
                </td>
                <td className="px-3 py-2 text-xs text-slate-950">{asset.roomLocator}</td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ring-1 ${EQUIPMENT_STATUS_STYLES[asset.status]}`}
                  >
                    {asset.status}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-[10px] text-slate-900">
                  {asset.warrantyExpiration}
                </td>
                <td className="px-3 py-2">
                  <p className="text-xs font-medium text-slate-800">{asset.amcProvider}</p>
                  <p className="text-[10px] text-slate-800">{asset.amcContact}</p>
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => onLogMaintenance(asset)}
                    className="inline-flex items-center gap-1 rounded border border-amber-400 bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-900 hover:bg-amber-100"
                  >
                    <Wrench className="h-3 w-3" />
                    Log Maintenance Request
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
