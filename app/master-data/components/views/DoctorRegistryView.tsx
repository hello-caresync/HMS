'use client';

import { useMemo, useState } from 'react';
import { Stethoscope } from 'lucide-react';

import { useMasterData } from '../../context/MasterDataProvider';
import { formatOpdSummary } from '../../lib/seedData';
import type { Doctor } from '../../types';
import { createDefaultOpdTimings } from '../../types';
import { DoctorForm } from '../forms/DoctorForm';
import DataTable from '../shared/DataTable';
import MasterToolbar, { filterByQuery, RowActions } from '../shared/MasterToolbar';
import Sheet from '../shared/Sheet';
import StatusBadge from '../shared/StatusBadge';

type SheetMode = { type: 'add' } | { type: 'edit'; doctor: Doctor } | null;

export default function DoctorRegistryView() {
  const { data, addDoctor, updateDoctor, removeDoctor, getDepartmentName } = useMasterData();
  const [search, setSearch] = useState('');
  const [sheet, setSheet] = useState<SheetMode>(null);

  const filtered = useMemo(
    () =>
      filterByQuery(
        data.doctors,
        search,
        (d) => `${d.name} ${d.specialization} ${getDepartmentName(d.departmentId)}`,
      ),
    [data.doctors, search, getDepartmentName],
  );

  const closeSheet = () => setSheet(null);

  return (
    <div className="space-y-3">
      <div>
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Stethoscope className="h-4 w-4 text-primary" />
          Doctor Directory
        </h2>
        <p className="text-[11px] text-slate-800">Physician roster linked to department master</p>
      </div>

      <MasterToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search name, specialization, department…"
        recordCount={filtered.length}
        recordLabel="doctors"
        onAdd={() => setSheet({ type: 'add' })}
        addLabel="Add Doctor"
      />

      <DataTable
        columns={[
          { key: 'name', header: 'Name' },
          { key: 'specialization', header: 'Specialization' },
          { key: 'department', header: 'Department' },
          { key: 'opd', header: 'OPD Timings' },
          { key: 'action', header: 'Action', className: 'text-right w-28' },
        ]}
        rows={filtered.map((doc) => ({
          name: <span className="font-medium text-slate-900">{doc.name}</span>,
          specialization: <span className="text-xs text-slate-800">{doc.specialization}</span>,
          department: <StatusBadge label={getDepartmentName(doc.departmentId)} tone="info" />,
          opd: (
            <span className="font-mono text-[11px] text-slate-800">
              {formatOpdSummary(doc.opdTimings)}
            </span>
          ),
          action: (
            <RowActions
              onEdit={() => setSheet({ type: 'edit', doctor: doc })}
              onDelete={() => {
                if (confirm(`Remove ${doc.name} from registry?`)) removeDoctor(doc.id);
              }}
            />
          ),
        }))}
        emptyMessage={search ? 'No doctors match your search.' : 'No doctors registered yet.'}
      />

      <Sheet
        open={sheet !== null}
        title={sheet?.type === 'edit' ? 'Edit Doctor' : 'Add New Doctor'}
        description="Department options are loaded from the Department master."
        onClose={closeSheet}
        width="xl"
      >
        {sheet && (
          <DoctorForm
            key={sheet.type === 'edit' ? sheet.doctor.id : 'new'}
            departments={data.departments}
            initial={
              sheet.type === 'edit'
                ? {
                    name: sheet.doctor.name,
                    specialization: sheet.doctor.specialization,
                    departmentId: sheet.doctor.departmentId,
                    opdTimings: sheet.doctor.opdTimings,
                  }
                : {
                    name: '',
                    specialization: '',
                    departmentId: data.departments[0]?.id ?? '',
                    opdTimings: createDefaultOpdTimings(),
                  }
            }
            onSubmit={(payload) => {
              if (sheet.type === 'edit') updateDoctor(sheet.doctor.id, payload);
              else addDoctor(payload);
              closeSheet();
            }}
            onCancel={closeSheet}
            submitLabel={sheet.type === 'edit' ? 'Update Doctor' : 'Save Doctor'}
          />
        )}
      </Sheet>
    </div>
  );
}
