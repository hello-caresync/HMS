'use client';

import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';

import { supabase } from '@/lib/supabaseClient';
import { DEFAULT_VENDOR_ID, PRODUCT_CATEGORIES } from '@/lib/vendor-supabase/constants';
import type { NewProductInput, ProductRow } from '@/lib/vendor-supabase/types';

type Toast = { type: 'success' | 'error'; message: string } | null;

type ModalMode = 'add' | 'edit' | 'view' | null;

const emptyForm: NewProductInput = {
  sku: '',
  name: '',
  category: 'Medicine',
  unit_price: 0,
  available_stock: 0,
  unit_of_measure: 'units',
};

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(
    value,
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [activeProduct, setActiveProduct] = useState<ProductRow | null>(null);
  const [form, setForm] = useState<NewProductInput>(emptyForm);
  const [toast, setToast] = useState<Toast>(null);

  const showToast = useCallback((next: Toast) => {
    setToast(next);
    if (next) window.setTimeout(() => setToast(null), 4500);
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('vendor_id', DEFAULT_VENDOR_ID)
      .order('created_at', { ascending: false });

    if (error) {
      showToast({ type: 'error', message: error.message });
      setProducts([]);
    } else {
      setProducts((data as ProductRow[]) ?? []);
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const openAdd = () => {
    setForm(emptyForm);
    setActiveProduct(null);
    setModalMode('add');
  };

  const openView = (product: ProductRow) => {
    setActiveProduct(product);
    setModalMode('view');
  };

  const openEdit = (product: ProductRow) => {
    setActiveProduct(product);
    setForm({
      sku: product.sku,
      name: product.name,
      category: product.category,
      unit_price: Number(product.unit_price),
      available_stock: Number(product.available_stock),
      unit_of_measure: product.unit_of_measure,
    });
    setModalMode('edit');
  };

  const closeModal = () => {
    if (saving) return;
    setModalMode(null);
    setActiveProduct(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      sku: form.sku.trim(),
      name: form.name.trim(),
      category: form.category,
      unit_price: form.unit_price,
      available_stock: form.available_stock,
      unit_of_measure: form.unit_of_measure.trim(),
    };

    if (modalMode === 'add') {
      const { error } = await supabase.from('products').insert([{ vendor_id: DEFAULT_VENDOR_ID, ...payload }]);
      setSaving(false);
      if (error) {
        showToast({ type: 'error', message: error.message });
        return;
      }
      showToast({ type: 'success', message: 'Product added successfully.' });
    } else if (modalMode === 'edit' && activeProduct) {
      const { error } = await supabase.from('products').update(payload).eq('id', activeProduct.id);
      setSaving(false);
      if (error) {
        showToast({ type: 'error', message: error.message });
        return;
      }
      showToast({ type: 'success', message: 'Product updated successfully.' });
    } else {
      setSaving(false);
      return;
    }

    closeModal();
    await loadProducts();
  };

  const handleDelete = async (product: ProductRow) => {
    const confirmed = window.confirm(`Delete product ${product.sku}? This cannot be undone.`);
    if (!confirmed) return;

    setDeletingId(product.id);
    const { error } = await supabase.from('products').delete().eq('id', product.id);
    setDeletingId(null);

    if (error) {
      showToast({ type: 'error', message: error.message });
      return;
    }

    setProducts((prev) => prev.filter((p) => p.id !== product.id));
    showToast({ type: 'success', message: 'Product removed from catalog.' });
  };

  const toggleStockAvailability = async (product: ProductRow) => {
    const nextStock = Number(product.available_stock) > 0 ? 0 : 1;
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, available_stock: nextStock } : p)),
    );

    const { error } = await supabase
      .from('products')
      .update({ available_stock: nextStock })
      .eq('id', product.id);

    if (error) {
      showToast({ type: 'error', message: error.message });
      await loadProducts();
      return;
    }

    showToast({
      type: 'success',
      message: nextStock > 0 ? 'Product marked in stock.' : 'Product marked unavailable.',
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black">Product Catalog</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Live Supabase catalog · vendor {DEFAULT_VENDOR_ID.slice(0, 8)}…</p>
          </div>
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-teal-800"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add Product
          </button>
        </header>

        {toast ? (
          <div
            role="status"
            className={`rounded-lg border px-4 py-3 text-sm font-medium ${
              toast.type === 'success'
                ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                : 'border-red-300 bg-red-50 text-red-800'
            }`}
          >
            {toast.message}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          {loading ? (
            <p className="p-8 text-center text-sm text-slate-500">Loading products…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:bg-slate-800/80">
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Stock</th>
                    <th className="px-4 py-3">UOM</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                        No products yet. Add your first SKU.
                      </td>
                    </tr>
                  ) : (
                    products.map((p) => (
                      <tr key={p.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                        <td className="px-4 py-3 font-mono text-xs font-bold">{p.sku}</td>
                        <td className="px-4 py-3 font-semibold">{p.name}</td>
                        <td className="px-4 py-3">{p.category}</td>
                        <td className="px-4 py-3 tabular-nums">{formatMoney(Number(p.unit_price))}</td>
                        <td className="px-4 py-3 tabular-nums">{p.available_stock}</td>
                        <td className="px-4 py-3">{p.unit_of_measure}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => openView(p)}
                              className="text-xs font-bold text-teal-700 hover:underline dark:text-teal-400"
                            >
                              View
                            </button>
                            <button
                              type="button"
                              onClick={() => openEdit(p)}
                              className="inline-flex items-center gap-0.5 text-xs font-bold text-slate-700 hover:underline dark:text-slate-300"
                            >
                              <Pencil className="h-3 w-3" aria-hidden />
                              Edit
                            </button>
                            <button
                              type="button"
                              disabled={deletingId === p.id}
                              onClick={() => void handleDelete(p)}
                              className="inline-flex items-center gap-0.5 text-xs font-bold text-red-600 hover:underline disabled:opacity-50"
                            >
                              <Trash2 className="h-3 w-3" aria-hidden />
                              {deletingId === p.id ? 'Deleting…' : 'Delete'}
                            </button>
                            <button
                              type="button"
                              onClick={() => void toggleStockAvailability(p)}
                              className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-bold dark:border-slate-600"
                            >
                              {Number(p.available_stock) > 0 ? 'Mark unavailable' : 'Mark in stock'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modalMode === 'view' && activeProduct ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-lg font-black">Product details</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">SKU</dt>
                <dd className="font-mono font-bold">{activeProduct.sku}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Name</dt>
                <dd className="font-semibold">{activeProduct.name}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Category</dt>
                <dd>{activeProduct.category}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Unit price</dt>
                <dd>{formatMoney(Number(activeProduct.unit_price))}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Stock</dt>
                <dd>{activeProduct.available_stock}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">UOM</dt>
                <dd>{activeProduct.unit_of_measure}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Created</dt>
                <dd className="text-xs">{activeProduct.created_at}</dd>
              </div>
            </dl>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={closeModal} className="rounded-lg border px-4 py-2 text-sm font-bold">
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  openEdit(activeProduct);
                }}
                className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-bold text-white"
              >
                Edit product
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {modalMode === 'add' || modalMode === 'edit' ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900"
          >
            <h2 className="text-lg font-black">{modalMode === 'add' ? 'Add New Product' : 'Edit Product'}</h2>
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <label className="block text-xs font-bold uppercase text-slate-500">
                SKU
                <input
                  required
                  value={form.sku}
                  onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
                />
              </label>
              <label className="block text-xs font-bold uppercase text-slate-500">
                Product Name
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
                />
              </label>
              <label className="block text-xs font-bold uppercase text-slate-500">
                Category
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
                >
                  {PRODUCT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-bold uppercase text-slate-500">
                  Unit Price
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    required
                    value={form.unit_price || ''}
                    onChange={(e) => setForm((f) => ({ ...f, unit_price: Number(e.target.value) }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
                  />
                </label>
                <label className="block text-xs font-bold uppercase text-slate-500">
                  Available Stock
                  <input
                    type="number"
                    min={0}
                    required
                    value={form.available_stock || ''}
                    onChange={(e) => setForm((f) => ({ ...f, available_stock: Number(e.target.value) }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
                  />
                </label>
              </div>
              <label className="block text-xs font-bold uppercase text-slate-500">
                Unit of Measure
                <input
                  required
                  placeholder="boxes, units, packs…"
                  value={form.unit_of_measure}
                  onChange={(e) => setForm((f) => ({ ...f, unit_of_measure: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
                />
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeModal} disabled={saving} className="rounded-lg border px-4 py-2 text-sm font-bold">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                >
                  {saving ? 'Saving…' : modalMode === 'add' ? 'Save Product' : 'Update Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
