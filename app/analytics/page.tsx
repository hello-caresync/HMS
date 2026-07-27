'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Download, Sparkles } from 'lucide-react';

import { supabase } from '@/lib/supabaseClient';
import { DEFAULT_VENDOR_ID, FORECAST_CATEGORIES, FORECAST_HORIZONS } from '@/lib/vendor-supabase/constants';
import type { InvoiceRow, ProductRow, PurchaseOrderRow, VendorProfileRow } from '@/lib/vendor-supabase/types';

type Toast = { type: 'success' | 'error'; message: string } | null;

function formatMoney(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [orders, setOrders] = useState<PurchaseOrderRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [vendor, setVendor] = useState<VendorProfileRow | null>(null);
  const [toast, setToast] = useState<Toast>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [inv, po, prod, vend] = await Promise.all([
      supabase.from('invoices').select('id, total_amount, status, vendor_id').eq('vendor_id', DEFAULT_VENDOR_ID),
      supabase.from('purchase_orders').select('id, status, vendor_id, total_amount').eq('vendor_id', DEFAULT_VENDOR_ID),
      supabase.from('products').select('id, category, available_stock, name, vendor_id').eq('vendor_id', DEFAULT_VENDOR_ID),
      supabase.from('vendors').select('id, compliance_status, performance_rating, on_time_delivery_pct').eq('id', DEFAULT_VENDOR_ID).maybeSingle(),
    ]);

    if (!inv.error) setInvoices((inv.data as InvoiceRow[]) ?? []);
    if (!po.error) setOrders((po.data as PurchaseOrderRow[]) ?? []);
    if (!prod.error) setProducts((prod.data as ProductRow[]) ?? []);
    if (!vend.error && vend.data) setVendor(vend.data as VendorProfileRow);

    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const kpis = useMemo(() => {
    const paidLike = invoices.filter((i) => ['PAID', 'APPROVED'].includes(i.status.toUpperCase()));
    const outstanding = invoices.filter((i) => ['SUBMITTED', 'PENDING', 'OVERDUE'].includes(i.status.toUpperCase()));

    const totalRevenue = paidLike.reduce((s, i) => s + Number(i.total_amount), 0);
    const outstandingReceivables = outstanding.reduce((s, i) => s + Number(i.total_amount), 0);

    const totalPo = orders.length;
    const completed = orders.filter((o) => o.status === 'COMPLETED').length;
    const fulfillmentRate = totalPo > 0 ? Math.round((completed / totalPo) * 100) : 0;

    const rating =
      vendor?.performance_rating ??
      Math.min(5, Math.round(((vendor?.on_time_delivery_pct ?? fulfillmentRate) / 20) * 10) / 10);

    return { totalRevenue, outstandingReceivables, fulfillmentRate, rating };
  }, [invoices, orders, vendor]);

  const forecastChart = useMemo(() => {
    const stockByCategory: Record<string, number> = {};
    for (const cat of FORECAST_CATEGORIES) stockByCategory[cat] = 0;
    for (const p of products) {
      const key = FORECAST_CATEGORIES.includes(p.category as (typeof FORECAST_CATEGORIES)[number])
        ? p.category
        : 'Medicine';
      stockByCategory[key] = (stockByCategory[key] ?? 0) + Number(p.available_stock);
    }

    const poVolume = orders.reduce((s, o) => s + Number(o.total_amount), 0) / 1000;

    return FORECAST_HORIZONS.map((days) => ({
      horizon: `${days}d`,
      Medicine: Math.round(stockByCategory.Medicine * 0.4 + poVolume * (days / 30) * 0.5),
      Surgical: Math.round(stockByCategory.Surgical * 0.35 + poVolume * (days / 45) * 0.4),
      Equipment: Math.round(stockByCategory.Equipment * 0.25 + poVolume * (days / 60) * 0.3),
    }));
  }, [products, orders]);

  const aiTags = useMemo(() => {
    const tags: string[] = [];
    const lowStock = products.filter((p) => Number(p.available_stock) < 100 && p.category === 'Medicine');
    if (lowStock.length > 0) {
      tags.push(
        `Stock Alert: Increase ${lowStock[0]?.name ?? 'medicine SKU'} inventory by 20% before next month.`,
      );
    }
    if (kpis.fulfillmentRate < 90) {
      tags.push('Fulfillment Alert: Expedite open POs to protect hospital SLA score.');
    }
    if (kpis.outstandingReceivables > kpis.totalRevenue * 0.3) {
      tags.push('Collections: Follow up on SUBMITTED invoices older than 15 days.');
    }
    if (tags.length === 0) {
      tags.push('Demand stable · maintain current replenishment cadence across categories.');
    }
    return tags;
  }, [products, kpis]);

  const handleExport = () => {
    const rows: string[][] = [
      ['Metric', 'Value'],
      ['Total Revenue', String(kpis.totalRevenue)],
      ['Outstanding Receivables', String(kpis.outstandingReceivables)],
      ['Order Fulfillment Rate %', String(kpis.fulfillmentRate)],
      ['Vendor Performance Rating', String(kpis.rating)],
      [],
      ['Forecast Horizon', 'Medicine', 'Surgical', 'Equipment'],
      ...forecastChart.map((r) => [r.horizon, String(r.Medicine), String(r.Surgical), String(r.Equipment)]),
    ];
    downloadCsv(`nexora-vendor-analytics-${Date.now()}.csv`, rows);
    setToast({ type: 'success', message: 'Analytics CSV downloaded.' });
    window.setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans dark:bg-slate-950">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Executive Analytics</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Aggregated PO, invoice, product & vendor insights</p>
          </div>
          <button
            type="button"
            onClick={handleExport}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-60"
          >
            <Download className="h-4 w-4" aria-hidden />
            Export Analytics Report (CSV)
          </button>
        </header>

        {toast ? (
          <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
            {toast.message}
          </div>
        ) : null}

        {loading ? (
          <p className="text-sm text-slate-500">Loading analytics…</p>
        ) : (
          <>
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
                <p className="text-[10px] font-bold uppercase text-slate-500">Total revenue</p>
                <p className="mt-2 text-2xl font-black tabular-nums">{formatMoney(kpis.totalRevenue)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
                <p className="text-[10px] font-bold uppercase text-slate-500">Outstanding receivables</p>
                <p className="mt-2 text-2xl font-black tabular-nums text-amber-700">{formatMoney(kpis.outstandingReceivables)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
                <p className="text-[10px] font-bold uppercase text-slate-500">Order fulfillment rate</p>
                <p className="mt-2 text-2xl font-black tabular-nums text-teal-700">{kpis.fulfillmentRate}%</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
                <p className="text-[10px] font-bold uppercase text-slate-500">Vendor performance</p>
                <p className="mt-2 text-2xl font-black tabular-nums">{kpis.rating} / 5</p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-full bg-teal-600" style={{ width: `${Math.min(100, (kpis.rating / 5) * 100)}%` }} />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-500">AI demand forecast (30 / 60 / 90 days)</h2>
              <div className="mt-4 h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={forecastChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="horizon" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Medicine" fill="#0d9488" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Surgical" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Equipment" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <ul className="mt-6 space-y-2">
                {aiTags.map((tag) => (
                  <li
                    key={tag}
                    className="flex items-start gap-2 rounded-lg border border-teal-500/20 bg-teal-500/5 px-3 py-2 text-sm text-slate-800 dark:text-slate-200"
                  >
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden />
                    {tag}
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
