'use client';

import { useMemo, useState } from 'react';
import { Check, FlaskConical, Pill, Plus, Scan, Search, Trash2 } from 'lucide-react';

import { useConsultation } from '../context/ConsultationProvider';
import { MEDICINE_CATALOG } from '../lib/seedConsultation';
import { CLINICAL } from '../lib/theme';
import {
  DOSAGE_OPTIONS,
  DURATION_OPTIONS,
  FREQUENCY_OPTIONS,
  LAB_ORDERS,
  RADIOLOGY_ORDERS,
} from '../types';

export default function OrdersPrescriptionPanel() {
  const {
    encounter,
    addPrescription,
    removePrescription,
    toggleLabOrder,
    toggleRadiologyOrder,
    isLocked,
  } = useConsultation();

  const [search, setSearch] = useState('');
  const [selectedMedId, setSelectedMedId] = useState('');
  const [dosage, setDosage] = useState(DOSAGE_OPTIONS[1]);
  const [frequency, setFrequency] = useState(FREQUENCY_OPTIONS[1]);
  const [duration, setDuration] = useState(DURATION_OPTIONS[2]);
  const [showDropdown, setShowDropdown] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return MEDICINE_CATALOG.slice(0, 6);
    return MEDICINE_CATALOG.filter(
      (m) => m.label.toLowerCase().includes(q) || m.genericName.toLowerCase().includes(q),
    ).slice(0, 8);
  }, [search]);

  const handleAddRx = () => {
    const med = MEDICINE_CATALOG.find((m) => m.id === selectedMedId);
    if (!med) return;
    addPrescription({
      medicineId: med.id,
      drugName: med.label,
      dosage,
      frequency,
      duration,
    });
    setSearch('');
    setSelectedMedId('');
    setShowDropdown(false);
  };

  return (
    <div className="space-y-3">
      {/* Prescription builder */}
      <section
        className="rounded-xl border"
        style={{ borderColor: CLINICAL.border, backgroundColor: CLINICAL.panel }}
      >
        <header
          className="flex items-center justify-between border-b px-3 py-2"
          style={{ borderColor: CLINICAL.borderLight }}
        >
          <h3 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider" style={{ color: CLINICAL.mint }}>
            <Pill className="h-3.5 w-3.5" />
            Prescription Lines
          </h3>
          <span className="font-mono text-[10px]" style={{ color: CLINICAL.textSubtle }}>
            {encounter.prescriptions.length} active
          </span>
        </header>

        {!isLocked && (
          <div className="border-b p-3" style={{ borderColor: CLINICAL.borderLight }}>
            <div className="relative mb-2">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: CLINICAL.textSubtle }} />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowDropdown(true);
                  setSelectedMedId('');
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Drug name search…"
                className="w-full rounded-lg border py-2 pl-8 pr-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#5ebda8]/40"
                style={{ borderColor: CLINICAL.border, color: CLINICAL.charcoal }}
              />
              {showDropdown && filtered.length > 0 && (
                <ul className="absolute z-10 mt-1 max-h-32 w-full overflow-y-auto rounded-lg border bg-white shadow-lg" style={{ borderColor: CLINICAL.border }}>
                  {filtered.map((m) => (
                    <li key={m.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMedId(m.id);
                          setSearch(m.label);
                          setShowDropdown(false);
                        }}
                        className="w-full px-3 py-2 text-left text-xs hover:bg-[#edf8f3]"
                        style={{ color: CLINICAL.charcoal }}
                      >
                        {m.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <select value={dosage} onChange={(e) => setDosage(e.target.value)} className="rounded-lg border px-2 py-1.5 text-[11px]" style={{ borderColor: CLINICAL.border }}>
                {DOSAGE_OPTIONS.map((d) => <option key={d}>{d}</option>)}
              </select>
              <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="rounded-lg border px-2 py-1.5 text-[11px]" style={{ borderColor: CLINICAL.border }}>
                {FREQUENCY_OPTIONS.map((f) => <option key={f}>{f}</option>)}
              </select>
              <select value={duration} onChange={(e) => setDuration(e.target.value)} className="rounded-lg border px-2 py-1.5 text-[11px]" style={{ borderColor: CLINICAL.border }}>
                {DURATION_OPTIONS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
            <button
              type="button"
              onClick={handleAddRx}
              disabled={!selectedMedId}
              className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg py-2 text-[11px] font-bold text-white disabled:opacity-40"
              style={{ backgroundColor: CLINICAL.mint }}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Medication Row
            </button>
          </div>
        )}

        {encounter.prescriptions.length === 0 ? (
          <p className="px-3 py-6 text-center text-[11px]" style={{ color: CLINICAL.textSubtle }}>
            No medications prescribed
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-[11px]">
              <thead>
                <tr className="border-b text-[9px] font-black uppercase tracking-wider" style={{ borderColor: CLINICAL.borderLight, color: CLINICAL.textSubtle }}>
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Drug Name</th>
                  <th className="px-3 py-2">Dosage</th>
                  <th className="px-3 py-2">Frequency</th>
                  <th className="px-3 py-2">Duration</th>
                  {!isLocked && <th className="px-3 py-2" />}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: CLINICAL.borderLight }}>
                {encounter.prescriptions.map((rx, idx) => (
                  <tr key={rx.id} className="hover:bg-[#fafcfb]">
                    <td className="px-3 py-2 font-mono font-bold" style={{ color: CLINICAL.textSubtle }}>{idx + 1}</td>
                    <td className="px-3 py-2 font-bold" style={{ color: CLINICAL.charcoal }}>{rx.drugName}</td>
                    <td className="px-3 py-2">{rx.dosage}</td>
                    <td className="px-3 py-2">{rx.frequency}</td>
                    <td className="px-3 py-2">{rx.duration}</td>
                    {!isLocked && (
                      <td className="px-3 py-2">
                        <button type="button" onClick={() => removePrescription(rx.id)} className="rounded p-1 text-slate-800 hover:text-rose-600">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Lab + Radiology dispatch */}
      <section
        className="rounded-xl border p-3"
        style={{ borderColor: CLINICAL.border, backgroundColor: CLINICAL.panel }}
      >
        <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider" style={{ color: CLINICAL.mint }}>
          Order Dispatch
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 flex items-center gap-1 text-[10px] font-bold uppercase text-sky-700">
              <FlaskConical className="h-3 w-3" />
              Lab Orders
            </p>
            <div className="flex flex-wrap gap-1.5">
              {LAB_ORDERS.map(({ code, label }) => {
                const active = encounter.labOrders.includes(code);
                return (
                  <button
                    key={code}
                    type="button"
                    disabled={isLocked}
                    onClick={() => toggleLabOrder(code)}
                    className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold transition disabled:opacity-50 ${
                      active
                        ? 'border-sky-400 bg-sky-600 text-white'
                        : 'border-slate-200 bg-white text-slate-800 hover:border-sky-200 hover:bg-sky-50'
                    }`}
                  >
                    {active && <Check className="h-3 w-3" />}
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <p className="mb-2 flex items-center gap-1 text-[10px] font-bold uppercase text-violet-700">
              <Scan className="h-3 w-3" />
              Radiology Imaging
            </p>
            <div className="flex flex-wrap gap-1.5">
              {RADIOLOGY_ORDERS.map(({ code, label }) => {
                const active = encounter.radiologyOrders.includes(code);
                return (
                  <button
                    key={code}
                    type="button"
                    disabled={isLocked}
                    onClick={() => toggleRadiologyOrder(code)}
                    className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold transition disabled:opacity-50 ${
                      active
                        ? 'border-violet-400 bg-violet-600 text-white'
                        : 'border-slate-200 bg-white text-slate-800 hover:border-violet-200 hover:bg-violet-50'
                    }`}
                  >
                    {active && <Check className="h-3 w-3" />}
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
