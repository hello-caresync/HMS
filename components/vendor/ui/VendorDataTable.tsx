'use client';

import React from 'react';

export interface Column<T> {
  key: string;
  header: string;
  className?: string;
  render?: (row: T) => React.ReactNode;
}

export interface VendorDataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyMessage?: string;
  dense?: boolean;
  loading?: boolean;
}

export function VendorDataTable<T>({
  columns,
  rows,
  rowKey,
  emptyMessage = 'No data available',
  dense,
  loading,
}: VendorDataTableProps<T>) {
  const safeRows = rows ?? [];

  if (loading) {
    return (
      <div className="animate-pulse rounded-xl border border-[#F4A261]/20 bg-white p-8">
        <div className="h-4 w-1/3 rounded bg-[#F4A261]/20" />
      </div>
    );
  }

  const cellPy = dense ? 'py-2' : 'py-3';

  return (
    <div className="w-full overflow-hidden rounded-xl border border-[#F4A261]/20 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[#F4A261]/20 bg-[#FFF7E8] text-[10px] font-bold uppercase tracking-wider text-[#2B2B2B]/70">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 font-semibold ${col.className ?? ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F4A261]/10 text-[#2B2B2B]">
            {safeRows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-xs text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              safeRows.map((row) => (
                <tr
                  key={rowKey(row)}
                  className="transition-colors hover:bg-[#FFF7E8]/50"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 ${cellPy} align-middle text-xs ${
                        col.className ?? ''
                      }`}
                    >
                      {col.render
                        ? col.render(row)
                        : (row as Record<string, any>)[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Export as default as well so both import styles work seamlessly
export default VendorDataTable;