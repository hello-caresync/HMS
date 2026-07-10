'use client';

import { History } from 'lucide-react';

import { PAYMENT_LOG_STATUS_STYLES, type PaymentHistoryLog } from '../../../lib/finance';

type PaymentHistoryTableProps = {
  logs: PaymentHistoryLog[];
};

export default function PaymentHistoryTable({ logs }: PaymentHistoryTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b-2 border-slate-200 bg-slate-800 px-4 py-2.5 text-white">
        <History className="h-4 w-4" />
        <h2 className="text-sm font-black">Payment History · Active Shift</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-slate-200 bg-slate-100">
              <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-slate-950">
                Transaction Token
              </th>
              <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-slate-950">
                Invoice
              </th>
              <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-slate-950">
                Patient
              </th>
              <th className="px-3 py-2 text-right text-[10px] font-black uppercase text-slate-950">
                Amount
              </th>
              <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-slate-950">
                Methods
              </th>
              <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-slate-950">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, index) => (
              <tr
                key={log.transactionToken}
                className={`border-b-2 border-slate-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}
              >
                <td className="px-3 py-2 font-mono text-[10px] font-bold text-slate-900">
                  {log.transactionToken}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-slate-950">{log.invoiceRef}</td>
                <td className="px-3 py-2 text-xs font-bold text-slate-950">{log.patientName}</td>
                <td className="px-3 py-2 text-right font-mono text-xs font-bold tabular-nums">
                  ₹ {log.totalAmount.toLocaleString('en-IN')}
                </td>
                <td className="px-3 py-2 text-[10px] text-slate-950">{log.methodsSummary}</td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ring-1 ${PAYMENT_LOG_STATUS_STYLES[log.status]}`}
                  >
                    {log.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
