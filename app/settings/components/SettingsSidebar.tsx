'use client';

import {
  Bell,
  Building2,
  ClipboardList,
  IndianRupee,
  Layers,
  Package,
  Shield,
  Stethoscope,
} from 'lucide-react';

import { useSettings } from '../context/SettingsProvider';
import type { SettingsCategory, SettingsPanel } from '../types';
import { PANEL_LABELS } from '../types';

type NavGroup = {
  category: SettingsCategory;
  label: string;
  icon: typeof Building2;
  panels: SettingsPanel[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    category: 'organization',
    label: 'Organization',
    icon: Building2,
    panels: ['hospital-profile', 'departments'],
  },
  {
    category: 'financials',
    label: 'Financials',
    icon: IndianRupee,
    panels: ['taxes', 'services', 'packages', 'insurance'],
  },
  {
    category: 'security',
    label: 'Security',
    icon: Shield,
    panels: ['roles-permissions', 'notifications', 'audit-logs'],
  },
];

const PANEL_ICONS: Partial<Record<SettingsPanel, typeof Building2>> = {
  'hospital-profile': Building2,
  departments: Layers,
  taxes: IndianRupee,
  services: Stethoscope,
  packages: Package,
  insurance: ClipboardList,
  'roles-permissions': Shield,
  notifications: Bell,
  'audit-logs': ClipboardList,
};

export default function SettingsSidebar() {
  const { activePanel, setActivePanel } = useSettings();

  return (
    <nav className="flex flex-col gap-3 p-2">
      {NAV_GROUPS.map(({ category, label, icon: GroupIcon, panels }) => (
        <div key={category}>
          <div className="mb-1 flex items-center gap-1.5 px-2">
            <GroupIcon className="h-3 w-3 text-slate-800" />
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-800">{label}</p>
          </div>
          <div className="flex flex-col gap-0.5">
            {panels.map((panel) => {
              const active = activePanel === panel;
              const Icon = PANEL_ICONS[panel] ?? Building2;
              return (
                <button
                  key={panel}
                  type="button"
                  onClick={() => setActivePanel(panel)}
                  className={`flex items-center gap-2 rounded-md border px-2.5 py-2 text-left text-[11px] font-semibold transition ${
                    active
                      ? 'border-slate-700 bg-slate-800 text-white'
                      : 'border-transparent text-slate-800 hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Icon
                    className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-slate-900' : 'text-slate-800'}`}
                  />
                  <span className="truncate">{PANEL_LABELS[panel]}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
