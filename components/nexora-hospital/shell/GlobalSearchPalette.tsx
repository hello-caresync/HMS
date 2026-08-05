'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';

import { searchGlobal, type GlobalSearchResult } from '@/lib/shared/services/search/global-search.service';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useHospitalStore } from '@/lib/nexora-hospital/store';

const GROUP_LABELS: Record<GlobalSearchResult['group'], string> = {
  patients: 'Patients',
  doctors: 'Doctors',
  invoices: 'Invoices',
  appointments: 'Appointments',
  medicines: 'Medicines',
};

export function GlobalSearchPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const patients = useHospitalStore((s) => s.patients);
  const staff = useHospitalStore((s) => s.staff);
  const invoices = useHospitalStore((s) => s.invoices);
  const appointments = useHospitalStore((s) => s.appointments);
  const inventory = useHospitalStore((s) => s.inventory);

  const local = useMemo(
    () => ({ patients, staff, invoices, appointments, inventory }),
    [patients, staff, invoices, appointments, inventory],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      void (async () => {
        if (!query.trim()) {
          setResults([]);
          return;
        }
        setLoading(true);
        const supabase = getSupabaseBrowserClient();
        const hits = await searchGlobal(supabase, query, local);
        setResults(hits);
        setLoading(false);
      })();
    }, 200);
    return () => clearTimeout(t);
  }, [query, open, local]);

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  if (!open) return null;

  const grouped = results.reduce<Record<string, GlobalSearchResult[]>>((acc, r) => {
    (acc[r.group] ??= []).push(r);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 p-4 pt-[12vh] backdrop-blur-sm">
      <button type="button" className="absolute inset-0" aria-label="Close search" onClick={() => setOpen(false)} />
      <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-[#B2EBF2] bg-white shadow-2xl">
        <div className="flex items-center gap-2 border-b border-[#B2EBF2] px-4 py-3">
          <Search className="h-5 w-5 text-[#007B8A]" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patients, doctors, invoices, appointments, medicines…"
            className="flex-1 bg-transparent text-base font-medium text-[#0A2E36] outline-none placeholder:text-[#4A6B72]/60"
          />
          <kbd className="hidden rounded border border-[#B2EBF2] px-2 py-0.5 text-xs text-[#005F6B] sm:inline">Esc</kbd>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close">
            <X className="h-4 w-4 text-[#005F6B]" />
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {loading && <p className="p-4 text-sm text-[#005F6B]">Searching…</p>}
          {!loading && query && results.length === 0 && (
            <p className="p-4 text-sm text-[#005F6B]">No results for &ldquo;{query}&rdquo;</p>
          )}
          {!loading &&
            Object.entries(grouped).map(([group, items]) => (
              <div key={group} className="mb-2">
                <p className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#007B8A]">
                  {GROUP_LABELS[group as GlobalSearchResult['group']]}
                </p>
                <ul>
                  {items.map((item) => (
                    <li key={`${item.group}-${item.id}`}>
                      <button
                        type="button"
                        className="flex w-full flex-col rounded-xl px-3 py-2 text-left hover:bg-[#E0F7FA]"
                        onClick={() => navigate(item.href)}
                      >
                        <span className="text-sm font-bold text-[#0A2E36]">{item.title}</span>
                        <span className="text-xs text-[#005F6B]">{item.subtitle}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          {!query && (
            <p className="p-4 text-sm text-[#005F6B]">
              Type to search across the hospital database. Press <kbd className="rounded border px-1">Ctrl+K</kbd> anytime.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function openGlobalSearch() {
  window.dispatchEvent(new CustomEvent('nexora:open-search'));
}
