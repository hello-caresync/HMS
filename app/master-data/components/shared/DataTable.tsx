'use client';

import type { ReactNode } from 'react';

type DataTableProps = {
  columns: { key: string; header: string; className?: string }[];
  rows: Record<string, ReactNode>[];
  emptyMessage?: string;
};

export default function DataTable({ columns, rows, emptyMessage = 'No records found.' }: DataTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b-2 border-slate-200 bg-slate-100/80">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-3 py-2.5 text-[11px] font-black uppercase tracking-wider text-slate-800 ${col.className ?? ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-10 text-center text-sm text-slate-950">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={i}
                className="border-b border-slate-50 transition hover:bg-slate-50/60 last:border-0"
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-3 py-2.5 text-slate-900 ${col.className ?? ''}`}>
                    {row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
