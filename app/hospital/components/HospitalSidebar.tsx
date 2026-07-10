'use client';

import React from 'react';
import Link from 'next/link';

import { APP_ROUTES } from '../../lib/routes';
import { HospitalActiveModule } from '../types/procurement';

export type HospitalNavItem = {
  id: HospitalActiveModule;
  label: string;
};

type HospitalSidebarProps = {
  navItems: HospitalNavItem[];
  activeModule: HospitalActiveModule;
  onModuleChange: (module: HospitalActiveModule) => void;
};

const INACTIVE_NAV =
  'w-full text-left px-4 py-3 flex items-center text-slate-200 hover:text-[#E0A89F] hover:bg-slate-800/50 transition-all font-semibold text-xs rounded-xl cursor-pointer';

const ACTIVE_NAV =
  'w-full text-left px-4 py-3 flex items-center bg-[#E0A89F] text-slate-950 font-black shadow-sm shadow-[#E0A89F]/20 rounded-xl cursor-pointer';

export default function HospitalSidebar({
  navItems,
  activeModule,
  onModuleChange,
}: HospitalSidebarProps) {
  return (
    <aside className="hidden h-full w-64 shrink-0 flex-col overflow-y-auto border-r border-slate-800 bg-[#0F172A] custom-scrollbar md:flex">
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const isActive = activeModule === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onModuleChange(item.id)}
              className={isActive ? ACTIVE_NAV : INACTIVE_NAV}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="shrink-0 space-y-2 border-t border-slate-800 p-4">
        <Link
          href={APP_ROUTES.vendorSecureHub}
          className="flex w-full items-center justify-center rounded-xl border border-slate-700/80 bg-slate-800/40 px-3 py-2.5 text-xs font-semibold text-slate-200 transition-all hover:bg-slate-800/50 hover:text-[#E0A89F]"
        >
          Open vendor supply portal
        </Link>
        <Link
          href={APP_ROUTES.vendorGateway}
          className="flex w-full items-center justify-center rounded-xl border border-slate-800 bg-transparent px-3 py-2.5 text-xs font-medium text-slate-200 transition-all hover:bg-slate-800/40 hover:text-white"
        >
          Supplier gateway
        </Link>
        <p className="text-center font-mono text-[10px] font-black text-slate-200">
          node · curasync-hospital
        </p>
      </div>
    </aside>
  );
}
