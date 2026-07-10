'use client';

import { Plus, Search } from 'lucide-react';

type MasterToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  recordCount: number;
  recordLabel?: string;
  onAdd: () => void;
  addLabel?: string;
};

export default function MasterToolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search records…',
  recordCount,
  recordLabel = 'records',
  onAdd,
  addLabel = 'Add New Record',
}: MasterToolbarProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative min-w-0 flex-1 sm:max-w-xs">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-800" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder:text-slate-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[11px] tabular-nums text-slate-800">
          {recordCount} {recordLabel}
        </span>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-primary-hover"
        >
          <Plus className="h-3.5 w-3.5" />
          {addLabel}
        </button>
      </div>
    </div>
  );
}

export function RowActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <button
        type="button"
        onClick={onEdit}
        className="rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary hover:bg-primary-muted"
      >
        Edit
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-rose-600 hover:bg-rose-50"
      >
        Delete
      </button>
    </div>
  );
}

export function filterByQuery<T>(
  items: T[],
  query: string,
  getSearchableText: (item: T) => string,
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => getSearchableText(item).toLowerCase().includes(q));
}
