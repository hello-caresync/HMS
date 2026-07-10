'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Lock,
  LogIn,
  UserRound,
  Wallet,
} from 'lucide-react';

import { formatCurrency } from '../../master-data/lib/seedData';
import { usePayments } from '../context/PaymentsProvider';

export default function ShiftControlPanel() {
  const { shift, expectedCash, openShift, closeShift } = usePayments();
  const [openingFloat, setOpeningFloat] = useState('5000');
  const [actualCash, setActualCash] = useState('');
  const [openError, setOpenError] = useState<string | null>(null);
  const [closeError, setCloseError] = useState<string | null>(null);
  const [showClosing, setShowClosing] = useState(false);

  const isActive = shift.status === 'Active';
  const actualNum = parseFloat(actualCash) || 0;
  const discrepancy =
    isActive && actualCash !== ''
      ? Math.round((actualNum - expectedCash) * 100) / 100
      : null;
  const hasMismatch = discrepancy !== null && Math.abs(discrepancy) > 0.01;

  const handleOpenShift = () => {
    const float = parseFloat(openingFloat) || 0;
    const result = openShift(float);
    if (!result.success) setOpenError(result.error ?? 'Failed to open shift');
    else {
      setOpenError(null);
      setShowClosing(false);
      setActualCash('');
    }
  };

  const handleCloseShift = () => {
    const result = closeShift(actualNum);
    if (!result.success) setCloseError(result.error ?? 'Failed to close shift');
    else {
      setCloseError(null);
      setShowClosing(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Shift status card */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b-2 border-slate-200 bg-[#0a0e14] px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
            Shift Control Panel
          </p>
          <p className="text-sm font-bold text-white">Cashier Operations</p>
        </div>

        <div className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-800">
                <UserRound className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-900">{shift.cashierName}</p>
                <p className="text-[10px] text-slate-800">Counter T-04 · OPD Billing</p>
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${
                isActive
                  ? 'bg-emerald-100 text-emerald-800 ring-emerald-200'
                  : 'bg-slate-100 text-slate-800 ring-slate-200'
              }`}
            >
              {isActive ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <Lock className="h-3 w-3" />
              )}
              {shift.status}
            </span>
          </div>

          {isActive && shift.loginTimestamp && (
            <p className="mt-2 flex items-center gap-1 text-[10px] text-slate-800">
              <Clock className="h-3 w-3" />
              Logged in{' '}
              <span className="font-mono font-semibold text-slate-900">
                {new Date(shift.loginTimestamp).toLocaleString('en-IN')}
              </span>
            </p>
          )}

          {isActive && shift.openingFloat != null && (
            <p className="mt-1 flex items-center gap-1 text-[10px] text-slate-800">
              <Wallet className="h-3 w-3" />
              Opening float{' '}
              <span className="font-mono font-semibold text-slate-900">
                {formatCurrency(shift.openingFloat)}
              </span>
            </p>
          )}

          {!isActive && shift.closedAt && (
            <div className="mt-2 rounded-md border-2 border-slate-200 bg-slate-50 px-2 py-1.5 text-[10px]">
              <p className="text-slate-800">
                Last closed {new Date(shift.closedAt).toLocaleString('en-IN')}
              </p>
              {shift.closingDiscrepancy != null && shift.closingDiscrepancy !== 0 && (
                <p className="font-semibold text-rose-600">
                  Discrepancy recorded: {formatCurrency(shift.closingDiscrepancy)}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Shift opening wizard */}
      {!isActive && (
        <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-3">
          <p className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
            <LogIn className="h-3.5 w-3.5" />
            Shift Opening
          </p>
          <p className="mt-0.5 text-[10px] text-indigo-700">
            Step 1 — Enter starting counter float before accepting payments.
          </p>
          <label className="mt-2 block text-[10px] font-bold uppercase tracking-wider text-slate-800">
            Opening Cash Balance (₹)
          </label>
          <input
            type="number"
            min={0}
            step={100}
            value={openingFloat}
            onChange={(e) => {
              setOpeningFloat(e.target.value);
              setOpenError(null);
            }}
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-sm tabular-nums focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            placeholder="5000"
          />
          {openError && (
            <p className="mt-1.5 text-[10px] font-medium text-rose-600">{openError}</p>
          )}
          <button
            type="button"
            onClick={handleOpenShift}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700"
          >
            <LogIn className="h-3.5 w-3.5" />
            Open Shift & Load Ledger
          </button>
        </div>
      )}

      {/* Shift closing & reconciliation */}
      {isActive && (
        <div className="overflow-hidden rounded-lg border border-slate-800 bg-[#0a0e14] shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
              Shift Closing & Reconciliation
            </p>
            <button
              type="button"
              onClick={() => setShowClosing((v) => !v)}
              className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300"
            >
              {showClosing ? 'Collapse' : 'Expand'}
            </button>
          </div>

          {(showClosing || actualCash !== '') && (
            <div className="space-y-2 p-3">
              <div className="rounded-md border border-slate-700 bg-slate-900/60 px-2.5 py-2">
                <p className="text-[10px] uppercase tracking-wider text-slate-800">
                  Total System Expected Cash
                </p>
                <p className="font-mono text-lg font-bold tabular-nums text-emerald-400">
                  {formatCurrency(expectedCash)}
                </p>
                <p className="text-[9px] text-slate-800">
                  Opening float + net settled cash − cash refunds
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-800">
                  Actual Drawer Cash Count
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={actualCash}
                  onChange={(e) => {
                    setActualCash(e.target.value);
                    setCloseError(null);
                  }}
                  className="mt-1 w-full rounded-md border border-slate-600 bg-slate-900 px-2.5 py-1.5 font-mono text-sm tabular-nums text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  placeholder="Enter physical count"
                />
              </div>

              {discrepancy !== null && actualCash !== '' && (
                <div
                  className={`flex items-center justify-between rounded-md px-2.5 py-2 ${
                    hasMismatch
                      ? 'border border-rose-500/50 bg-rose-950/40'
                      : 'border border-emerald-500/30 bg-emerald-950/30'
                  }`}
                >
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-800">
                    {hasMismatch && <AlertTriangle className="h-3 w-3 text-rose-400" />}
                    Discrepancy
                  </span>
                  <span
                    className={`font-mono text-sm font-bold tabular-nums ${
                      hasMismatch ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {discrepancy >= 0 ? '+' : ''}
                    {formatCurrency(discrepancy)}
                  </span>
                </div>
              )}

              {closeError && (
                <p className="text-[10px] font-medium text-rose-400">{closeError}</p>
              )}

              <button
                type="button"
                onClick={handleCloseShift}
                disabled={actualCash === ''}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700 disabled:opacity-40"
              >
                <Lock className="h-3.5 w-3.5" />
                Close Shift & Finalize Reconciliation
              </button>
            </div>
          )}

          {!showClosing && actualCash === '' && (
            <p className="px-3 pb-3 text-[10px] text-slate-800">
              Expand to reconcile drawer cash against system expected balance.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
