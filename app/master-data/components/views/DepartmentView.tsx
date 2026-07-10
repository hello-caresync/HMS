'use client';

import { useState } from 'react';
import { Layers, Plus } from 'lucide-react';

import { useMasterData } from '../../context/MasterDataProvider';
import { FormField, inputClass } from '../shared/FormField';
import DataTable from '../shared/DataTable';
import StatusBadge from '../shared/StatusBadge';

export default function DepartmentView() {
  const { data, addDepartment } = useMasterData();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <Layers className="h-4 w-4 text-primary" />
            Departments
          </h2>
          <p className="text-xs text-slate-800">{data.departments.length} clinical departments</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Department
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <FormField label="Department Name" htmlFor="dept-name" required>
            <input
              id="dept-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              placeholder="e.g. Neurology"
            />
          </FormField>
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg px-3 py-1.5 text-xs text-slate-800 hover:bg-slate-100">
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (!name.trim()) return;
                addDepartment({ name: name.trim() });
                setName('');
                setShowForm(false);
              }}
              className="rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover"
            >
              Save
            </button>
          </div>
        </div>
      )}

      <DataTable
        columns={[
          { key: 'id', header: 'ID', className: 'font-mono text-[11px] text-slate-800 w-32' },
          { key: 'name', header: 'Department Name' },
        ]}
        rows={data.departments.map((d) => ({
          id: d.id,
          name: <StatusBadge label={d.name} tone="info" />,
        }))}
      />
    </div>
  );
}
