'use client';

import { useState } from 'react';
import {
  Banknote,
  CreditCard,
  Printer,
  RotateCcw,
  Smartphone,
} from 'lucide-react';

import { formatCurrency } from '../../master-data/lib/seedData';
import { usePayments } from '../context/PaymentsProvider';
import type { LedgerTransaction } from '../types';
import { MODE_BADGE_STYLES, STATUS_BADGE_STYLES } from '../types';
import ReceiptVoucherModal from './ReceiptVoucherModal';
import RefundModal from './RefundModal';

export default function CollectionLedger() {
  const { shift, transactions, counters } = usePayments();
  const [receiptTx, setReceiptTx] = useState<LedgerTransaction | null>(null);
  const [refundTx, setRefundTx] = useState<LedgerTransaction | null>(null);

  const isActive = shift.status === 'Active';

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {/* Counter grid */}
        <div className="border-b-2 border-slate-200 bg-slate-50/80 px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
            Daily Collection Ledger
          </p>
          {!isActive && (
            <p className="text-[10px] text-amber-600">Open a shift to view live transaction feed</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-px bg-slate-100 sm:grid-cols-4">
          <CounterCell
            label="Cash Collected"
            value={formatCurrency(counters.cashCollected)}
            icon={Banknote}
            iconColor="text-amber-700"
          />
          <CounterCell
            label="UPI / Digital"
            value={formatCurrency(counters.upiSuccesses)}
            icon={Smartphone}
            iconColor="text-sky-700"
          />
          <CounterCell
            label="Card Payments"
            value={formatCurrency(counters.cardPayments)}
            icon={CreditCard}
            iconColor="text-violet-700"
          />
          <CounterCell
            label="Total Refunds"
            value={formatCurrency(counters.totalRefunds)}
            icon={RotateCcw}
            iconColor="text-rose-700"
          />
        </div>

        {/* Transaction feed */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-[11px]">
            <thead>
              <tr className="border-b-2 border-slate-200 bg-[#0a0e14] text-[10px] uppercase tracking-wider text-slate-800">
                <th className="px-3 py-2 font-black">Transaction ID</th>
                <th className="px-3 py-2 font-black">UHID</th>
                <th className="px-3 py-2 font-black">Patient</th>
                <th className="px-3 py-2 font-black">Mode</th>
                <th className="px-3 py-2 text-right font-black">Amount</th>
                <th className="px-3 py-2 font-black">Status</th>
                <th className="px-3 py-2 text-right font-black">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!isActive || transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-12 text-center text-slate-950">
                    {!isActive
                      ? 'No active shift — open shift to load transaction feed'
                      : 'No transactions recorded'}
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-slate-50 hover:bg-slate-100/60">
                    <td className="px-3 py-2 font-mono text-[10px] text-slate-950">{tx.id}</td>
                    <td className="px-3 py-2 font-mono text-[10px] text-slate-950">{tx.uhid}</td>
                    <td className="px-3 py-2 font-bold text-slate-900">{tx.patientName}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${MODE_BADGE_STYLES[tx.mode]}`}
                      >
                        {tx.mode}
                      </span>
                    </td>
                    <td
                      className={`px-3 py-2 text-right font-mono font-semibold tabular-nums ${
                        tx.status === 'Refunded' ? 'text-rose-600 line-through' : 'text-slate-900'
                      }`}
                    >
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${STATUS_BADGE_STYLES[tx.status]}`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setReceiptTx(tx)}
                          className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-800 hover:bg-slate-50"
                        >
                          <Printer className="h-3 w-3" />
                          Receipt
                        </button>
                        {tx.status === 'Settled' && (
                          <button
                            type="button"
                            onClick={() => setRefundTx(tx)}
                            className="inline-flex items-center gap-1 rounded border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-semibold text-rose-700 hover:bg-rose-100"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Refund
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ReceiptVoucherModal transaction={receiptTx} onClose={() => setReceiptTx(null)} />
      <RefundModal transaction={refundTx} onClose={() => setRefundTx(null)} />
    </>
  );
}

function CounterCell({
  label,
  value,
  icon: Icon,
  iconColor,
}: {
  label: string;
  value: string;
  icon: typeof Banknote;
  iconColor: string;
}) {
  return (
    <div className="bg-white px-3 py-2.5">
      <div className="flex items-center justify-between gap-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800">{label}</p>
        <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
      </div>
      <p className={`mt-1 font-mono text-base font-bold tabular-nums ${iconColor}`}>{value}</p>
    </div>
  );
}
