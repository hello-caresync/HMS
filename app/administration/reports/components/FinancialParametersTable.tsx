'use client';

import type { DepartmentFinancialRow, ReportDepartmentFilter } from '../../../lib/administration';

type FinancialParametersTableProps = {
  rows: DepartmentFinancialRow[];
  departmentFilter: ReportDepartmentFilter;
};

export default function FinancialParametersTable({
  rows,
  departmentFilter,
}: FinancialParametersTableProps) {
  const totals = rows.reduce(
    (acc, r) => ({
      revenue: acc.revenue + r.revenue,
      expenses: acc.expenses + r.expenses,
      transactions: acc.transactions + r.transactionCount,
    }),
    { revenue: 0, expenses: 0, transactions: 0 },
  );

  return (
    <div className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
      <div className="border-b-2 border-slate-200 bg-slate-50 px-4 py-2.5">
        <h2 className="text-sm font-black text-slate-900">Financial Parameters</h2>
        <p className="text-[10px] text-slate-800">Filter: {departmentFilter}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-slate-200 bg-slate-800 text-white">
              <th className="px-3 py-2 text-left text-[10px] font-black uppercase">Department</th>
              <th className="px-3 py-2 text-right text-[10px] font-black uppercase">Revenue (₹)</th>
              <th className="px-3 py-2 text-right text-[10px] font-black uppercase">Expenses (₹)</th>
              <th className="px-3 py-2 text-right text-[10px] font-black uppercase">Net Margin %</th>
              <th className="px-3 py-2 text-right text-[10px] font-black uppercase">Transactions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.department}
                className={`border-b-2 border-slate-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}
              >
                <td className="px-3 py-2 text-xs font-bold text-slate-900">{row.department}</td>
                <td className="px-3 py-2 text-right font-mono text-xs tabular-nums">
                  {row.revenue.toLocaleString('en-IN')}
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs tabular-nums text-slate-950">
                  {row.expenses.toLocaleString('en-IN')}
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs font-bold tabular-nums text-emerald-700">
                  {row.netMargin.toFixed(1)}%
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs tabular-nums">
                  {row.transactionCount.toLocaleString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-300 bg-slate-100 font-bold">
              <td className="px-3 py-2 text-xs">Totals</td>
              <td className="px-3 py-2 text-right font-mono text-xs tabular-nums">
                ₹ {totals.revenue.toLocaleString('en-IN')}
              </td>
              <td className="px-3 py-2 text-right font-mono text-xs tabular-nums">
                ₹ {totals.expenses.toLocaleString('en-IN')}
              </td>
              <td className="px-3 py-2 text-right font-mono text-xs tabular-nums">—</td>
              <td className="px-3 py-2 text-right font-mono text-xs tabular-nums">
                {totals.transactions.toLocaleString('en-IN')}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
