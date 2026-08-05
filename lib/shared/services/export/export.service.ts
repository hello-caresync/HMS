/** Export utilities — CSV, print, and PDF-ready data */

export type ExportColumn<T> = { key: keyof T | string; header: string; format?: (row: T) => string };

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportToCsv<T extends Record<string, unknown>>(
  rows: T[],
  columns: ExportColumn<T>[],
  filename: string,
): void {
  const header = columns.map((c) => escapeCsv(c.header)).join(',');
  const body = rows
    .map((row) =>
      columns
        .map((col) => {
          const raw = col.format
            ? col.format(row)
            : String(row[col.key as keyof T] ?? '');
          return escapeCsv(raw);
        })
        .join(','),
    )
    .join('\n');
  const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function printHtml(title: string, htmlBody: string): void {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`
    <!DOCTYPE html><html><head><title>${title}</title>
    <style>body{font-family:system-ui;padding:24px;color:#0A2E36}table{width:100%;border-collapse:collapse}
    th,td{border:1px solid #B2EBF2;padding:8px;text-align:left}th{background:#E0F7FA}</style>
    </head><body><h1>${title}</h1>${htmlBody}</body></html>`);
  win.document.close();
  win.focus();
  win.print();
}

export function tableHtml<T extends Record<string, unknown>>(
  rows: T[],
  columns: ExportColumn<T>[],
): string {
  const th = columns.map((c) => `<th>${c.header}</th>`).join('');
  const trs = rows
    .map(
      (row) =>
        `<tr>${columns
          .map((col) => {
            const val = col.format ? col.format(row) : String(row[col.key as keyof T] ?? '');
            return `<td>${val}</td>`;
          })
          .join('')}</tr>`,
    )
    .join('');
  return `<table><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table>`;
}

/** Excel-compatible TSV export */
export function exportToExcel<T extends Record<string, unknown>>(
  rows: T[],
  columns: ExportColumn<T>[],
  filename: string,
): void {
  exportToCsv(rows, columns, filename.replace(/\.xlsx?$/i, '') + '.xls');
}
