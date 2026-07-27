'use client';

import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabaseClient';
import { DEFAULT_VENDOR_ID, SERVICE_PRIORITIES } from '@/lib/vendor-supabase/constants';
import type { ServiceTicketRow } from '@/lib/vendor-supabase/types';

type Toast = { type: 'success' | 'error'; message: string } | null;

type TicketForm = {
  equipment_name: string;
  issue_description: string;
  priority: ServiceTicketRow['priority'];
};

const emptyTicket: TicketForm = {
  equipment_name: '',
  issue_description: '',
  priority: 'MEDIUM',
};

function priorityClass(p: ServiceTicketRow['priority']) {
  switch (p) {
    case 'CRITICAL':
      return 'bg-red-600 text-white';
    case 'HIGH':
      return 'bg-orange-500 text-white';
    case 'MEDIUM':
      return 'bg-amber-400 text-amber-950';
    case 'LOW':
      return 'bg-slate-200 text-slate-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

function statusClass(s: ServiceTicketRow['status']) {
  switch (s) {
    case 'OPEN':
      return 'bg-sky-100 text-sky-800';
    case 'IN_PROGRESS':
      return 'bg-violet-100 text-violet-800';
    case 'RESOLVED':
      return 'bg-emerald-100 text-emerald-800';
    case 'CLOSED':
      return 'bg-slate-200 text-slate-700';
    default:
      return 'bg-slate-100';
  }
}

export default function ServiceRequestsPage() {
  const [tickets, setTickets] = useState<ServiceTicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<TicketForm>(emptyTicket);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast>(null);

  const showToast = (next: Toast) => {
    setToast(next);
    if (next) window.setTimeout(() => setToast(null), 4000);
  };

  const loadTickets = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('service_tickets')
      .select('*')
      .eq('vendor_id', DEFAULT_VENDOR_ID)
      .order('created_at', { ascending: false });

    if (error) {
      showToast({ type: 'error', message: error.message });
      setTickets([]);
    } else {
      setTickets((data as ServiceTicketRow[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase.from('service_tickets').insert([
      {
        vendor_id: DEFAULT_VENDOR_ID,
        equipment_name: form.equipment_name.trim(),
        issue_description: form.issue_description.trim(),
        priority: form.priority,
        status: 'OPEN',
      },
    ]);

    setSaving(false);

    if (error) {
      showToast({ type: 'error', message: error.message });
      return;
    }

    showToast({ type: 'success', message: 'Service ticket raised.' });
    setModalOpen(false);
    setForm(emptyTicket);
    await loadTickets();
  };

  const updateStatus = async (id: string, status: ServiceTicketRow['status']) => {
    setActionId(id);
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));

    const { error } = await supabase.from('service_tickets').update({ status }).eq('id', id);

    setActionId(null);

    if (error) {
      showToast({ type: 'error', message: error.message });
      await loadTickets();
      return;
    }

    showToast({ type: 'success', message: `Ticket updated to ${status}.` });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans dark:bg-slate-950">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Equipment Service Requests</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Biomedical & field service maintenance portal</p>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-teal-800"
          >
            Raise Service Ticket
          </button>
        </header>

        {toast ? (
          <div
            className={`rounded-lg border px-4 py-3 text-sm font-medium ${
              toast.type === 'success' ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-red-300 bg-red-50 text-red-800'
            }`}
          >
            {toast.message}
          </div>
        ) : null}

        {loading ? (
          <p className="text-sm text-slate-500">Loading tickets…</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {tickets.length === 0 ? (
              <p className="col-span-full rounded-xl border border-dashed p-10 text-center text-sm text-slate-500">No service tickets.</p>
            ) : (
              tickets.map((t) => (
                <article key={t.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${priorityClass(t.priority)}`}>
                      {t.priority}
                    </span>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${statusClass(t.status)}`}>
                      {t.status}
                    </span>
                  </div>
                  <h2 className="mt-2 font-bold text-slate-900 dark:text-white">{t.equipment_name}</h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t.issue_description}</p>
                  <p className="mt-2 text-[10px] text-slate-500">{t.created_at}</p>

                  {t.status === 'OPEN' ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={actionId === t.id}
                        onClick={() => void updateStatus(t.id, 'IN_PROGRESS')}
                        className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
                      >
                        Assign Technician
                      </button>
                      <button
                        type="button"
                        disabled={actionId === t.id}
                        onClick={() => void updateStatus(t.id, 'RESOLVED')}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
                      >
                        Mark Resolved
                      </button>
                    </div>
                  ) : null}

                  {t.status === 'IN_PROGRESS' ? (
                    <button
                      type="button"
                      disabled={actionId === t.id}
                      onClick={() => void updateStatus(t.id, 'RESOLVED')}
                      className="mt-4 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
                    >
                      Mark Resolved
                    </button>
                  ) : null}
                </article>
              ))
            )}
          </div>
        )}
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-lg font-black">Raise service ticket</h2>
            <form onSubmit={handleCreate} className="mt-4 space-y-3">
              <label className="block text-xs font-bold uppercase text-slate-500">
                Equipment name
                <input
                  required
                  value={form.equipment_name}
                  onChange={(e) => setForm((f) => ({ ...f, equipment_name: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
                />
              </label>
              <label className="block text-xs font-bold uppercase text-slate-500">
                Issue description
                <textarea
                  required
                  rows={3}
                  value={form.issue_description}
                  onChange={(e) => setForm((f) => ({ ...f, issue_description: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
                />
              </label>
              <label className="block text-xs font-bold uppercase text-slate-500">
                Priority
                <select
                  value={form.priority}
                  onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as ServiceTicketRow['priority'] }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
                >
                  {SERVICE_PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border px-4 py-2 text-sm font-bold">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
                  {saving ? 'Submitting…' : 'Submit ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
