'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { useState } from 'react';

import { useAuth } from '../../context/AuthProvider';
import {
  ERP_MODULE_COUNT,
  ERP_NAV_SECTIONS,
  isNavActive,
} from '../../lib/erpNavigation';

export default function ErpSidebar() {
  const pathname = usePathname();
  const { session, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`flex shrink-0 flex-col border-r border-slate-700/50 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-200 transition-[width] duration-200 ${
        collapsed ? 'w-[68px]' : 'w-[248px]'
      }`}
    >
      <div className="flex h-14 items-center gap-2.5 border-b border-slate-700/60 px-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-600 text-white shadow-sm">
          <Building2 className="h-4 w-4" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-xs font-black tracking-tight text-white">
              Nexora ERP
            </p>
            <p className="truncate text-[10px] text-slate-200">
              Back-Office · {ERP_MODULE_COUNT} modules
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="ml-auto rounded-md p-1.5 text-slate-200 hover:bg-slate-800 hover:text-white"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="custom-scrollbar flex-1 overflow-y-auto px-2 py-3">
        {ERP_NAV_SECTIONS.map((section) => (
          <div key={section.id} className="mb-4">
            {!collapsed && (
              <p className="mb-1.5 px-2 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-200">
                {section.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isNavActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed ? item.label : item.description}
                      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition ${
                        active
                          ? 'bg-sky-600 text-white shadow-sm'
                          : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                          active ? 'bg-white' : 'bg-slate-600'
                        }`}
                      />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {!collapsed && session && (
        <div className="border-t border-slate-700/60 p-3">
          <p className="truncate text-xs font-bold text-white">{session.displayName}</p>
          <p className="truncate text-[10px] text-slate-200">{session.department}</p>
          <button
            type="button"
            onClick={() => logout()}
            className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-600 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-200 hover:bg-slate-800"
          >
            <LogOut className="h-3 w-3" />
            Sign Out
          </button>
        </div>
      )}
    </aside>
  );
}
