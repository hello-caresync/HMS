'use client';

import { useAssets } from '../context/AssetsProvider';
import { AMC_STYLES, STATUS_STYLES, isCalibrationDueWithinDays } from '../types';

export default function EquipmentMasterTable() {
  const { assets } = useAssets();
  const now = new Date();

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b-2 border-slate-200 bg-slate-50/80 px-3 py-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
          Equipment Master Registry
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-[11px]">
          <thead>
            <tr className="border-b-2 border-slate-200 bg-[#0a0e14] text-[10px] uppercase tracking-wider text-slate-800">
              <th className="px-3 py-2 text-left font-black">Asset Name</th>
              <th className="px-3 py-2 text-left font-black">Asset ID</th>
              <th className="px-3 py-2 text-left font-black">Department</th>
              <th className="px-3 py-2 text-left font-black">AMC</th>
              <th className="px-3 py-2 text-left font-black">Next Calibration</th>
              <th className="px-3 py-2 text-left font-black">Status</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => {
              const calDueSoon = isCalibrationDueWithinDays(asset.nextCalibrationDate, 7, now);
              const broken = asset.status === 'Under Repair';

              return (
                <tr
                  key={asset.id}
                  className={`border-b border-slate-50 hover:bg-slate-50/60 ${
                    broken ? 'bg-rose-50/50' : calDueSoon ? 'bg-amber-50/30' : ''
                  }`}
                >
                  <td className="px-3 py-2 font-bold text-slate-900">{asset.name}</td>
                  <td className="px-3 py-2 font-mono text-[10px] text-slate-950">{asset.assetId}</td>
                  <td className="px-3 py-2 text-slate-950">{asset.department}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${AMC_STYLES[asset.amcStatus]}`}
                    >
                      {asset.amcStatus}
                    </span>
                  </td>
                  <td
                    className={`px-3 py-2 font-mono text-[10px] ${
                      calDueSoon ? 'font-bold text-amber-700' : 'text-slate-800'
                    }`}
                  >
                    {asset.nextCalibrationDate}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${STATUS_STYLES[asset.status]}`}
                    >
                      {asset.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
