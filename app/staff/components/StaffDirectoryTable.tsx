'use client';

import { ROLE_LABELS } from '../../lib/auth/hospital/permissions';
import { useStaffManagement } from '../context/StaffManagementProvider';
import StatusToggle from './StatusToggle';

export default function StaffDirectoryTable() {
  const { filteredEmployees, toggleEmployeeActive } = useStaffManagement();

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-slate-200 bg-slate-100/90">
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-950">
                Employee ID
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-950">
                Full Name
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-950">
                Department
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-950">
                Job Role
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-950">
                Contract
              </th>
              <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-wider text-slate-950">
                Active
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map((emp, index) => (
              <tr
                key={emp.employeeId}
                className={`border-b-2 border-slate-200 transition hover:bg-sky-50/40 ${
                  index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                }`}
              >
                <td className="px-4 py-3">
                  <span className="font-mono text-xs font-bold text-slate-800">
                    {emp.employeeId}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">{emp.personal.fullName}</p>
                  <p className="text-[11px] text-slate-800">{emp.personal.email}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex rounded-md border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-800">
                    {emp.department}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs font-semibold text-slate-900">
                    {ROLE_LABELS[emp.roleCode]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      emp.contractStatus === 'active'
                        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                        : emp.contractStatus === 'on_leave'
                          ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                          : 'bg-slate-100 text-slate-800 ring-1 ring-slate-200'
                    }`}
                  >
                    {emp.contractStatus.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <StatusToggle
                      active={emp.isActive}
                      onToggle={() => toggleEmployeeActive(emp.employeeId)}
                      label={`Toggle ${emp.personal.fullName}`}
                    />
                    <span className="w-8 text-[10px] font-bold uppercase text-slate-800">
                      {emp.isActive ? 'On' : 'Off'}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredEmployees.length === 0 && (
        <div className="px-4 py-12 text-center text-sm text-slate-800">
          No staff profiles match your search criteria.
        </div>
      )}
    </div>
  );
}
