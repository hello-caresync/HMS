'use client';

import { useState } from 'react';
import { ClipboardList, Plus } from 'lucide-react';

import { useMasterData } from '../../context/MasterDataProvider';
import { formatCurrency, SERVICE_NAMES } from '../../lib/seedData';
import type { ServiceCategory } from '../../types';
import { FormField, inputClass, selectClass } from '../shared/FormField';
import DataTable from '../shared/DataTable';
import StatusBadge from '../shared/StatusBadge';

export default function ServiceCatalogView() {
  const { data, addService } = useMasterData();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState<ServiceCategory>('Consultation');
  const [basePrice, setBasePrice] = useState('');

  const handleAdd = () => {
    const price = Number(basePrice);
    if (Number.isNaN(price) || price < 0) return;
    addService({ name, basePrice: price });
    setBasePrice('');
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <ClipboardList className="h-4 w-4 text-primary" />
            Service Catalog
          </h2>
          <p className="text-xs text-slate-800">{data.services.length} billable service types</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Service
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <h3 className="mb-3 text-sm font-semibold text-slate-800">New Service Tariff</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Service Name" htmlFor="svc-name" required>
              <select
                id="svc-name"
                value={name}
                onChange={(e) => setName(e.target.value as ServiceCategory)}
                className={selectClass}
              >
                {SERVICE_NAMES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Base Price (₹)" htmlFor="svc-price" required>
              <input
                id="svc-price"
                type="number"
                min="0"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                className={inputClass}
                placeholder="800"
              />
            </FormField>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdd}
              className="rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover"
            >
              Save Service
            </button>
          </div>
        </div>
      )}

      <DataTable
        columns={[
          { key: 'id', header: 'ID', className: 'font-mono text-[11px] text-slate-800 w-24' },
          { key: 'name', header: 'Service' },
          { key: 'price', header: 'Base Price' },
        ]}
        rows={data.services.map((svc) => ({
          id: svc.id,
          name: <StatusBadge label={svc.name} tone="info" />,
          price: <span className="font-semibold tabular-nums">{formatCurrency(svc.basePrice)}</span>,
        }))}
      />
    </div>
  );
}
