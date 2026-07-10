'use client';

import { useState } from 'react';
import { CheckCircle2, ClipboardCheck } from 'lucide-react';

import { useAssets } from '../context/AssetsProvider';
import { AMC_STYLES, STATUS_STYLES } from '../types';

export default function CalibrationLedger() {
  const { calibrationLedger, logCalibrationSuccess } = useAssets();
  const [activeAssetId, setActiveAssetId] = useState<string | null>(null);
  const [techRef, setTechRef] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLog = (assetId: string) => {
    const result = logCalibrationSuccess(assetId, techRef);
    if (!result.success) {
      setError(result.error ?? 'Failed');
      return;
    }
    setActiveAssetId(null);
    setTechRef('');
    setError(null);
  };

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b-2 border-slate-200 bg-[#0a0e14] px-3 py-2">
        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-800">
          <ClipboardCheck className="h-3.5 w-3.5" />
          Calibration & AMC Compliance Ledger
        </p>
        <p className="text-xs font-bold text-white">Biomedical engineering tracker</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-[11px]">
          <thead>
            <tr className="border-b-2 border-slate-200 bg-slate-100/80 text-[10px] uppercase tracking-wider text-slate-800">
              <th className="px-3 py-2 text-left font-black">Equipment</th>
              <th className="px-3 py-2 text-left font-black">Vendor / Mfr</th>
              <th className="px-3 py-2 text-left font-black">Last Service</th>
              <th className="px-3 py-2 text-left font-black">AMC Renewal</th>
              <th className="px-3 py-2 text-left font-black">Next Cal.</th>
              <th className="px-3 py-2 text-left font-black">Status</th>
              <th className="px-3 py-2 text-right font-black">Action</th>
            </tr>
          </thead>
          <tbody>
            {calibrationLedger.map((asset) => (
              <tr key={asset.id} className="border-b border-slate-50 hover:bg-slate-100/60">
                <td className="px-3 py-2">
                  <p className="font-medium text-slate-900">{asset.name}</p>
                  <p className="font-mono text-[9px] text-slate-800">{asset.assetId}</p>
                </td>
                <td className="px-3 py-2 text-slate-950">{asset.manufacturer}</td>
                <td className="px-3 py-2 font-mono text-[10px] text-slate-950">
                  {asset.lastServiceDate}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${AMC_STYLES[asset.amcStatus]}`}
                  >
                    {asset.amcRenewalDeadline}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-[10px] font-bold text-amber-700">
                  {asset.nextCalibrationDate}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${STATUS_STYLES[asset.status]}`}
                  >
                    {asset.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-right">
                  {activeAssetId === asset.id ? (
                    <div className="inline-flex flex-col items-end gap-1">
                      <input
                        type="text"
                        value={techRef}
                        onChange={(e) => {
                          setTechRef(e.target.value);
                          setError(null);
                        }}
                        placeholder="Tech signature / ref"
                        className="w-36 rounded border border-slate-200 px-2 py-1 text-[10px] focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                      />
                      {error && <p className="text-[9px] text-rose-600">{error}</p>}
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveAssetId(null);
                            setTechRef('');
                            setError(null);
                          }}
                          className="rounded border border-slate-200 px-2 py-0.5 text-[9px] font-semibold text-slate-800"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleLog(asset.id)}
                          className="inline-flex items-center gap-0.5 rounded bg-emerald-600 px-2 py-0.5 text-[9px] font-bold text-white hover:bg-emerald-700"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Confirm
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveAssetId(asset.id);
                        setTechRef('');
                        setError(null);
                      }}
                      className="rounded bg-slate-800 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-slate-700"
                    >
                      Log Calibration Success
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
