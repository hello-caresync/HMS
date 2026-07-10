'use client';

import { useState } from 'react';

import { SUPPLY_CATEGORIES } from '../../lib/seedData';
import type { SupplyCategory, VendorMaster } from '../../types';
import { FormField, inputClass, selectClass } from '../shared/FormField';

type VendorFormProps = {
  initial?: Omit<VendorMaster, 'id'>;
  onSubmit: (payload: Omit<VendorMaster, 'id'>) => void;
  onCancel: () => void;
  submitLabel?: string;
};

export default function VendorForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = 'Save Vendor',
}: VendorFormProps) {
  const [vendorName, setVendorName] = useState(initial?.vendorName ?? '');
  const [contactPerson, setContactPerson] = useState(initial?.contactPerson ?? '');
  const [taxId, setTaxId] = useState(initial?.taxId ?? '');
  const [supplyCategory, setSupplyCategory] = useState<SupplyCategory>(
    initial?.supplyCategory ?? 'Pharmaceuticals',
  );
  const [active, setActive] = useState(initial?.active ?? true);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!vendorName.trim() || taxId.trim().length < 15) return;
        onSubmit({
          vendorName: vendorName.trim(),
          contactPerson: contactPerson.trim(),
          taxId: taxId.trim().toUpperCase(),
          supplyCategory,
          active,
        });
      }}
    >
      <FormField label="Company Name" htmlFor="vnd-name" required>
        <input
          id="vnd-name"
          value={vendorName}
          onChange={(e) => setVendorName(e.target.value)}
          className={inputClass}
          placeholder="Legal entity name"
          required
        />
      </FormField>
      <FormField label="Contact Person" htmlFor="vnd-contact">
        <input
          id="vnd-contact"
          value={contactPerson}
          onChange={(e) => setContactPerson(e.target.value)}
          className={inputClass}
          placeholder="Primary liaison"
        />
      </FormField>
      <FormField label="GSTIN" htmlFor="vnd-gstin" required hint="15-character GST identification number">
        <input
          id="vnd-gstin"
          value={taxId}
          onChange={(e) => setTaxId(e.target.value.toUpperCase().slice(0, 15))}
          className={`${inputClass} font-mono uppercase`}
          placeholder="29AABCM1234F1Z5"
          minLength={15}
          maxLength={15}
          required
        />
      </FormField>
      <FormField label="Supply Category" htmlFor="vnd-category" required>
        <select
          id="vnd-category"
          value={supplyCategory}
          onChange={(e) => setSupplyCategory(e.target.value as SupplyCategory)}
          className={selectClass}
          required
        >
          {SUPPLY_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Status" htmlFor="vnd-status">
        <select
          id="vnd-status"
          value={active ? 'active' : 'inactive'}
          onChange={(e) => setActive(e.target.value === 'active')}
          className={selectClass}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </FormField>

      <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
        <button type="button" onClick={onCancel} className="rounded-lg px-3 py-1.5 text-xs text-slate-800 hover:bg-slate-100">
          Cancel
        </button>
        <button type="submit" className="rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
