'use client';

import { Calculator } from 'lucide-react';
import { useMemo, useState } from 'react';

import { calculatePriceWithGst, GST_OPTIONS, MEDICINE_UNITS } from '../../lib/seedData';
import type { GstPercentage, MedicineMaster, MedicineUnit } from '../../types';
import { FormField, FormSection, inputClass, selectClass } from '../shared/FormField';

type MedicineFormProps = {
  vendors: { id: string; vendorName: string; active: boolean }[];
  initial?: Omit<MedicineMaster, 'id'>;
  onSubmit: (payload: Omit<MedicineMaster, 'id'>) => void;
  onCancel: () => void;
  submitLabel?: string;
};

export default function MedicineForm({
  vendors,
  initial,
  onSubmit,
  onCancel,
  submitLabel = 'Save Medicine',
}: MedicineFormProps) {
  const [genericName, setGenericName] = useState(initial?.genericName ?? '');
  const [brandName, setBrandName] = useState(initial?.brandName ?? '');
  const [hsnCode, setHsnCode] = useState(initial?.hsnCode ?? '');
  const [gstPercentage, setGstPercentage] = useState<GstPercentage>(initial?.gstPercentage ?? 12);
  const [unit, setUnit] = useState<MedicineUnit>(initial?.unit ?? 'Strip');
  const [basePrice, setBasePrice] = useState(
    initial?.mrp ? String(Math.round((initial.mrp / (1 + initial.gstPercentage / 100)) * 100) / 100) : '',
  );
  const [vendorId, setVendorId] = useState(initial?.vendorId ?? vendors.find((v) => v.active)?.id ?? '');

  const activeVendors = vendors.filter((v) => v.active);

  const parsedBase = Number(basePrice);
  const gstAmount = useMemo(() => {
    if (Number.isNaN(parsedBase) || parsedBase <= 0) return 0;
    return Math.round(parsedBase * (gstPercentage / 100) * 100) / 100;
  }, [parsedBase, gstPercentage]);

  const finalPrice = useMemo(
    () => calculatePriceWithGst(parsedBase, gstPercentage),
    [parsedBase, gstPercentage],
  );

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (
          !genericName.trim() ||
          !brandName.trim() ||
          !hsnCode.trim() ||
          !vendorId ||
          Number.isNaN(parsedBase) ||
          parsedBase <= 0
        ) {
          return;
        }
        onSubmit({
          genericName: genericName.trim(),
          brandName: brandName.trim(),
          hsnCode: hsnCode.trim(),
          gstPercentage,
          unit,
          mrp: finalPrice,
          vendorId,
        });
      }}
    >
      <FormSection title="Product Identity">
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Brand Name" htmlFor="med-brand" required>
            <input
              id="med-brand"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className={inputClass}
              placeholder="e.g. Dolo 650"
              required
            />
          </FormField>
          <FormField label="Generic Name" htmlFor="med-generic" required>
            <input
              id="med-generic"
              value={genericName}
              onChange={(e) => setGenericName(e.target.value)}
              className={inputClass}
              placeholder="e.g. Paracetamol"
              required
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection title="Tax & Billing">
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="HSN Code" htmlFor="med-hsn" required hint="4–8 digit code">
            <input
              id="med-hsn"
              value={hsnCode}
              onChange={(e) => setHsnCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
              className={`${inputClass} font-mono`}
              placeholder="30049061"
              required
            />
          </FormField>
          <FormField label="GST %" htmlFor="med-gst" required>
            <select
              id="med-gst"
              value={gstPercentage}
              onChange={(e) => setGstPercentage(Number(e.target.value) as GstPercentage)}
              className={selectClass}
              required
            >
              {GST_OPTIONS.map((rate) => (
                <option key={rate} value={rate}>
                  {rate}%
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Unit Type" htmlFor="med-unit" required>
            <select
              id="med-unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value as MedicineUnit)}
              className={selectClass}
              required
            >
              {MEDICINE_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        {/* GST Calculator */}
        <div className="mt-3 rounded-lg border border-primary/20 bg-primary-muted/40 p-3">
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
            <Calculator className="h-3.5 w-3.5" />
            Price Calculator
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <FormField label="Base Price (ex-GST) ₹" htmlFor="med-base" required>
              <input
                id="med-base"
                type="number"
                min="0"
                step="0.01"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                className={`${inputClass} tabular-nums`}
                placeholder="100.00"
                required
              />
            </FormField>
            <div className="rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-800">GST Amount</p>
              <p className="mt-0.5 text-sm font-semibold tabular-nums text-slate-900">
                ₹{gstAmount.toFixed(2)}
              </p>
            </div>
            <div className="rounded-lg bg-primary px-3 py-2 text-white">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-white/80">Final MRP</p>
              <p className="mt-0.5 text-sm font-bold tabular-nums">₹{finalPrice.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </FormSection>

      <FormSection title="Vendor Linkage">
        <FormField label="Preferred Vendor" htmlFor="med-vendor" required>
          <select
            id="med-vendor"
            value={vendorId}
            onChange={(e) => setVendorId(e.target.value)}
            className={selectClass}
            required
          >
            <option value="">Select vendor…</option>
            {activeVendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.vendorName}
              </option>
            ))}
          </select>
        </FormField>
      </FormSection>

      <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
