'use client';

import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';

import { useSettings } from '../context/SettingsProvider';
import type { TaxStructure } from '../types';

export default function TaxConfigPanel() {
  const { taxes, toggleTaxActive, addTax, updateTax, deleteTax } = useSettings();
  const [newName, setNewName] = useState('');
  const [newRate, setNewRate] = useState('12');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRate, setEditRate] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function startEdit(tax: TaxStructure) {
    setEditingId(tax.id);
    setEditName(tax.name);
    setEditRate(String(tax.ratePercent));
    setConfirmDeleteId(null);
  }

  function saveEdit(id: string) {
    const rate = parseFloat(editRate);
    if (!editName.trim() || Number.isNaN(rate)) return;
    updateTax(id, editName, rate);
    setEditingId(null);
  }

  function handleAdd() {
    const rate = parseFloat(newRate);
    if (!newName.trim() || Number.isNaN(rate)) return;
    addTax(newName, rate);
    setNewName('');
    setNewRate('12');
  }

  return (
    <div className="space-y-3">
      <div className="rounded border border-slate-200 bg-white shadow-sm">
        <div className="border-b-2 border-slate-200 px-3 py-2">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-800">Tax Master</p>
          <p className="text-[11px] font-bold text-slate-900">Active Tax Structures</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-[11px]">
            <thead>
              <tr className="border-b-2 border-slate-200 bg-slate-100 text-left">
                <th className="px-3 py-2 font-black uppercase tracking-wider text-slate-950">
                  Tax Name
                </th>
                <th className="px-3 py-2 font-black uppercase tracking-wider text-slate-950">
                  Rate
                </th>
                <th className="px-3 py-2 font-black uppercase tracking-wider text-slate-950">
                  Status
                </th>
                <th className="px-3 py-2 text-right font-black uppercase tracking-wider text-slate-950">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {taxes.map((tax, i) => (
                <tr
                  key={tax.id}
                  className={`border-b-2 border-slate-200 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}
                >
                  <td className="px-3 py-2">
                    {editingId === tax.id ? (
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full rounded border border-slate-300 px-2 py-1 text-[11px]"
                      />
                    ) : (
                      <span className="font-semibold text-slate-800">{tax.name}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono tabular-nums text-slate-900">
                    {editingId === tax.id ? (
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={editRate}
                        onChange={(e) => setEditRate(e.target.value)}
                        className="w-20 rounded border border-slate-300 px-2 py-1 text-[11px]"
                      />
                    ) : (
                      `${tax.ratePercent}%`
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => toggleTaxActive(tax.id)}
                      className={`relative h-5 w-9 rounded-full transition ${
                        tax.active ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                      aria-label={`Toggle ${tax.name}`}
                    >
                      <span
                        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${
                          tax.active ? 'left-4' : 'left-0.5'
                        }`}
                      />
                    </button>
                    <span
                      className={`ml-2 text-[9px] font-bold ${tax.active ? 'text-emerald-700' : 'text-slate-800'}`}
                    >
                      {tax.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      {editingId === tax.id ? (
                        <>
                          <button
                            type="button"
                            onClick={() => saveEdit(tax.id)}
                            className="rounded bg-slate-800 px-2 py-1 text-[9px] font-bold text-white"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="rounded border border-slate-300 px-2 py-1 text-[9px] font-bold text-slate-800"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => startEdit(tax)}
                            className="rounded p-1 text-slate-800 hover:bg-slate-100"
                            aria-label="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          {confirmDeleteId === tax.id ? (
                            <button
                              type="button"
                              onClick={() => {
                                deleteTax(tax.id);
                                setConfirmDeleteId(null);
                              }}
                              className="rounded bg-rose-600 px-2 py-1 text-[9px] font-bold text-white"
                            >
                              Confirm
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(tax.id)}
                              className="rounded p-1 text-rose-500 hover:bg-rose-50"
                              aria-label="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-end gap-2 border-t border-slate-200 bg-slate-50 px-3 py-2.5">
          <div className="flex-1 min-w-[140px]">
            <label className="text-[9px] font-bold uppercase text-slate-800">New Tax Name</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. GST @ 28%"
              className="mt-0.5 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-[11px]"
            />
          </div>
          <div className="w-24">
            <label className="text-[9px] font-bold uppercase text-slate-800">Rate %</label>
            <input
              type="number"
              min={0}
              max={100}
              value={newRate}
              onChange={(e) => setNewRate(e.target.value)}
              className="mt-0.5 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-[11px]"
            />
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!newName.trim()}
            className="inline-flex items-center gap-1 rounded-md bg-slate-800 px-3 py-1.5 text-[10px] font-bold text-white disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Tax
          </button>
        </div>
      </div>
    </div>
  );
}
