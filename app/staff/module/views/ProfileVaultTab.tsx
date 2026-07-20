'use client';

import { useMemo, useState } from 'react';
import { Filter, Users } from 'lucide-react';

import EmployeeDetailDrawer from '../components/EmployeeDetailDrawer';
import { StaffPanel, StatusPill } from '../components/staffUi';
import { getEmployeeById, MOCK_EMPLOYEES, searchEmployees, type EmployeeRecord } from '../lib/staffMockData';
import type { SystemRole } from '../staffNav.types';

type ProfileVaultTabProps = {
  lookupQuery: string;
};

export default function ProfileVaultTab({ lookupQuery }: ProfileVaultTabProps) {
  const [dept, setDept] = useState('all');
  const [designation, setDesignation] = useState('all');
  const [manager, setManager] = useState('all');
  const [role, setRole] = useState<string>('all');
  const [drawerId, setDrawerId] = useState<string | null>(null);

  const departments = useMemo(() => [...new Set(MOCK_EMPLOYEES.map((e) => e.department))], []);
  const designations = useMemo(() => [...new Set(MOCK_EMPLOYEES.map((e) => e.designation))], []);
  const managers = useMemo(() => [...new Set(MOCK_EMPLOYEES.map((e) => e.reportingManager))], []);
  const roles: SystemRole[] = ['Admin', 'HR', 'Dept Head', 'IT', 'Employee Self-Service'];

  const filtered = useMemo(() => {
    let list = searchEmployees(lookupQuery);
    if (dept !== 'all') list = list.filter((e) => e.department === dept);
    if (designation !== 'all') list = list.filter((e) => e.designation === designation);
    if (manager !== 'all') list = list.filter((e) => e.reportingManager === manager);
    if (role !== 'all') list = list.filter((e) => e.role === role);
    return list;
  }, [lookupQuery, dept, designation, manager, role]);

  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-10">
      <aside className="xl:col-span-3">
        <StaffPanel title="Organizational Filters" icon={Filter} subtitle="Department · designation · manager · role">
          <div className="space-y-2">
            <FilterSelect label="Department" value={dept} onChange={setDept} options={departments} />
            <FilterSelect label="Designation" value={designation} onChange={setDesignation} options={designations} />
            <FilterSelect label="Reporting Manager" value={manager} onChange={setManager} options={managers} />
            <div>
              <label className="mb-1 block text-[9px] font-bold uppercase text-slate-400">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded border border-[#E2E8F0] px-2 py-1 text-[10px]">
                <option value="all">All Roles</option>
                {roles.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <p className="mt-3 border-t border-slate-100 pt-2 text-[10px] font-semibold text-[#2563EB]">{filtered.length} employees matched</p>
        </StaffPanel>
      </aside>

      <div className="xl:col-span-7">
        <StaffPanel title="Employee Profile Directory" icon={Users}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                  {['Code', 'Name', 'Designation', 'Department', 'Role', 'Status', 'Shift Today'].map((h) => (
                    <th key={h} className="px-2 py-2 text-[9px] font-bold uppercase text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp) => (
                  <EmployeeRow key={emp.id} employee={emp} onOpen={() => setDrawerId(emp.id)} />
                ))}
              </tbody>
            </table>
          </div>
        </StaffPanel>
      </div>

      {drawerId && getEmployeeById(drawerId) && (
        <EmployeeDetailDrawer employee={getEmployeeById(drawerId)!} onClose={() => setDrawerId(null)} />
      )}
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="mb-1 block text-[9px] font-bold uppercase text-slate-400">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded border border-[#E2E8F0] px-2 py-1 text-[10px]">
        <option value="all">All {label}s</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function EmployeeRow({ employee, onOpen }: { employee: EmployeeRecord; onOpen: () => void }) {
  return (
    <tr onClick={onOpen} onKeyDown={(e) => e.key === 'Enter' && onOpen()} tabIndex={0} role="button" className="cursor-pointer border-b border-slate-50 hover:bg-blue-50/40">
      <td className="px-2 py-1.5 font-mono text-[9px] font-semibold text-[#2563EB]">{employee.employeeCode}</td>
      <td className="px-2 py-1.5 text-[10px] font-semibold text-[#0F172A]">{employee.name}</td>
      <td className="px-2 py-1.5 text-[9px] text-slate-600">{employee.designation}</td>
      <td className="px-2 py-1.5 text-[10px] text-slate-600">{employee.department}</td>
      <td className="px-2 py-1.5 text-[9px] text-[#2563EB]">{employee.role}</td>
      <td className="px-2 py-1.5"><StatusPill status={employee.status} /></td>
      <td className="px-2 py-1.5 text-[9px] text-slate-500">{employee.shiftToday}</td>
    </tr>
  );
}
