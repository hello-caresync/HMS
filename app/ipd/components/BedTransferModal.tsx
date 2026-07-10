'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, ArrowRightLeft, Snowflake, Zap } from 'lucide-react';

import Sheet from '../../master-data/components/shared/Sheet';
import { formatCurrency } from '../../master-data/lib/seedData';
import { useIPD } from '../context/IPDProvider';
import type { IPDBed } from '../types';

type BedTransferModalProps = {
  fromBed: IPDBed | null;
  open: boolean;
  onClose: () => void;
};

export default function BedTransferModal({ fromBed, open, onClose }: BedTransferModalProps) {
  const { wards, beds, getAdmissionForBed, transferBed } = useIPD();
  const [targetBedId, setTargetBedId] = useState('');
  const [transferTimestamp, setTransferTimestamp] = useState(() =>
    new Date().toISOString().slice(0, 16),
  );
  const [error, setError] = useState<string | null>(null);

  const admission = fromBed ? getAdmissionForBed(fromBed.id) : undefined;
  const fromWard = fromBed ? wards.find((w) => w.id === fromBed.wardId) : undefined;

  const vacantTargets = useMemo(() => {
    if (!fromBed) return [];
    return beds.filter((b) => b.status === 'Available' && b.id !== fromBed.id);
  }, [beds, fromBed]);

  const targetBed = beds.find((b) => b.id === targetBedId);
  const targetWard = targetBed ? wards.find((w) => w.id === targetBed.wardId) : undefined;

  const handleClose = () => {
    setTargetBedId('');
    setError(null);
    onClose();
  };

  const handleSubmit = () => {
    if (!fromBed || !targetBedId) {
      setError('Select a target bed');
      return;
    }
    const ts = new Date(transferTimestamp).toISOString();
    const result = transferBed(fromBed.id, targetBedId, ts);
    if (!result.success) {
      setError(result.error ?? 'Transfer failed');
      return;
    }
    handleClose();
  };

  if (!fromBed || !admission) return null;

  return (
    <Sheet
      open={open}
      title="Ward Transfer / Room Upgrade"
      description={`${admission.patientName} · ${fromBed.bedLabel}`}
      onClose={handleClose}
      width="lg"
    >
      <div className="space-y-3">
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-[10px] font-bold uppercase text-slate-800">Current Bed</p>
          <p className="text-sm font-bold text-slate-900">
            {fromBed.bedLabel} — {fromWard?.name}
          </p>
          <p className="font-mono text-[10px] text-slate-800">
            Rate: {formatCurrency(fromWard?.dailyRate ?? 0)}/day
          </p>
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase text-slate-800">
            Target Ward / Bed
          </label>
          <select
            value={targetBedId}
            onChange={(e) => {
              setTargetBedId(e.target.value);
              setError(null);
            }}
            className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">Select vacant bed…</option>
            {vacantTargets.map((b) => {
              const w = wards.find((wd) => wd.id === b.wardId);
              return (
                <option key={b.id} value={b.id}>
                  {w?.name} · {b.bedLabel} ({formatCurrency(w?.dailyRate ?? 0)}/day)
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase text-slate-800">
            Transfer Timestamp
          </label>
          <input
            type="datetime-local"
            value={transferTimestamp}
            onChange={(e) => setTransferTimestamp(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {targetWard && fromWard && (
          <div className="overflow-hidden rounded-lg border border-slate-800 bg-[#0a0e14] p-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-800">
              Room Charge Rate Indicator
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-md border border-slate-700 bg-slate-900/80 px-2 py-2">
                <p className="flex items-center gap-1 text-[9px] font-bold uppercase text-slate-800">
                  <Snowflake className="h-3 w-3 text-sky-400" />
                  Old rate frozen
                </p>
                <p className="text-xs font-bold text-slate-200">{fromWard.name}</p>
                <p className="font-mono text-[10px] text-sky-400">
                  {formatCurrency(fromWard.dailyRate)}/day · ends at transfer
                </p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-slate-800" />
              <div className="flex-1 rounded-md border border-emerald-800/50 bg-emerald-950/40 px-2 py-2">
                <p className="flex items-center gap-1 text-[9px] font-bold uppercase text-emerald-500">
                  <Zap className="h-3 w-3" />
                  New rate active
                </p>
                <p className="text-xs font-bold text-emerald-100">{targetWard.name}</p>
                <p className="font-mono text-[10px] text-emerald-400">
                  {formatCurrency(targetWard.dailyRate)}/day · from transfer
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1.5 text-xs text-rose-700">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700"
        >
          <ArrowRightLeft className="h-4 w-4" />
          Confirm Transfer
        </button>
      </div>
    </Sheet>
  );
}
