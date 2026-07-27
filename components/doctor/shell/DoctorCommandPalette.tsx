'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

import { useDoctorShell } from '@/components/doctor/shell/DoctorShellContext';
import { COMMAND_PALETTE_ITEMS } from '@/lib/doctor/command-palette-data';

export default function DoctorCommandPalette() {
  const { commandOpen, setCommandOpen, setAiOpen, setNotifOpen } = useDoctorShell();
  const router = useRouter();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COMMAND_PALETTE_ITEMS;
    return COMMAND_PALETTE_ITEMS.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.keywords?.some((k) => k.includes(q)) ||
        item.group.toLowerCase().includes(q),
    );
  }, [query]);

  const groups = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const item of filtered) {
      const list = map.get(item.group) ?? [];
      list.push(item);
      map.set(item.group, list);
    }
    return map;
  }, [filtered]);

  const run = (item: (typeof COMMAND_PALETTE_ITEMS)[number]) => {
    setCommandOpen(false);
    setQuery('');
    if (item.action === 'ai') {
      setAiOpen(true);
      return;
    }
    if (item.action === 'notifications') {
      setNotifOpen(true);
      return;
    }
    if (item.href) router.push(item.href);
  };

  if (!commandOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-[#2B2A22]/40 p-4 pt-[12vh] backdrop-blur-sm">
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-[#C7C39E]/60 bg-[#FAFAF5]/95 shadow-2xl backdrop-blur-xl"
        role="dialog"
        aria-label="Command palette"
      >
        <div className="flex items-center gap-3 border-b border-[#E6E3C5] px-4 py-3">
          <Search className="h-5 w-5 text-[#A39E75]" aria-hidden />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patients, modules, clinical actions…"
            className="flex-1 bg-transparent text-sm text-[#2B2A22] placeholder:text-[#5C5A4E]/70 focus:outline-none"
          />
          <kbd className="rounded-md border border-[#E6E3C5] bg-[#F7F6E8] px-2 py-0.5 text-[10px] font-bold text-[#5C5A4E]">
            ESC
          </kbd>
        </div>
        <div className="custom-scrollbar max-h-[min(420px,60vh)] overflow-y-auto p-2">
          {filtered.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-[#5C5A4E]">No matching commands</p>
          )}
          {[...groups.entries()].map(([group, items]) => (
            <div key={group} className="mb-2">
              <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#5C5A4E]">{group}</p>
              <ul>
                {items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => run(item)}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-[#E6E3C5]/50"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E6E3C5]/60 text-[#A39E75]">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-[#2B2A22]">{item.label}</span>
                          {item.description && (
                            <span className="block truncate text-xs text-[#5C5A4E]">{item.description}</span>
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-[#E6E3C5] px-4 py-2 text-[10px] text-[#5C5A4E]">
          <span className="font-semibold">⌘K</span> command palette · Navigate without leaving workflow
        </div>
      </div>
      <button
        type="button"
        className="fixed inset-0 -z-10"
        aria-label="Close command palette"
        onClick={() => setCommandOpen(false)}
      />
    </div>
  );
}
