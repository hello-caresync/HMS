'use client';

import { Search, UserPlus } from 'lucide-react';

import { useStaffManagement } from '../context/StaffManagementProvider';
import CreateStaffDrawer from './CreateStaffDrawer';
import StaffDirectoryTable from './StaffDirectoryTable';

export default function StaffDirectoryWorkspace() {
  const { searchQuery, setSearchQuery, openCreateDrawer, employees, filteredEmployees } =
    useStaffManagement();

  const activeCount = employees.filter((e) => e.isActive).length;

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
            Total Profiles
          </p>
          <p className="mt-1 text-2xl font-black text-slate-950">{employees.length}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-3 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
            Active Staff
          </p>
          <p className="mt-1 text-2xl font-black text-emerald-800">{activeCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
            Filtered View
          </p>
          <p className="mt-1 text-2xl font-black text-slate-950">{filteredEmployees.length}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="relative min-w-[240px] flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-800" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, name, department, role…"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-sky-600 focus:bg-white focus:ring-2 focus:ring-sky-100"
          />
        </div>

        <button
          type="button"
          onClick={openCreateDrawer}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-900"
        >
          <UserPlus className="h-4 w-4" />
          Create New Staff Member
        </button>
      </div>

      <StaffDirectoryTable />
      <CreateStaffDrawer />
    </div>
  );
}
