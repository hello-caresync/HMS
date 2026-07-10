'use client';

import {
  Activity,
  ClipboardList,
  FlaskConical,
  IndianRupee,
  Package,
  ShoppingCart,
  Stethoscope,
  UserCog,
  Users,
} from 'lucide-react';

import { useReports } from '../context/ReportsProvider';
import type { ReportDimension } from '../types';
import { DIMENSION_LABELS } from '../types';

const DIMENSIONS: {
  id: ReportDimension;
  icon: typeof Users;
}[] = [
  { id: 'patient', icon: Users },
  { id: 'revenue', icon: IndianRupee },
  { id: 'inventory', icon: Package },
  { id: 'purchase', icon: ShoppingCart },
  { id: 'doctor', icon: Stethoscope },
  { id: 'lab', icon: FlaskConical },
  { id: 'hr', icon: UserCog },
  { id: 'audit', icon: Activity },
];

export default function ReportDimensionNav() {
  const { activeDimension, setActiveDimension } = useReports();

  return (
    <nav className="flex flex-col gap-0.5 p-2">
      <p className="px-2 pb-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-800">
        Report Dimensions
      </p>
      {DIMENSIONS.map(({ id, icon: Icon }) => {
        const active = activeDimension === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setActiveDimension(id)}
            className={`flex items-center gap-2 rounded-md border px-2.5 py-2 text-left text-[11px] font-semibold transition ${
              active
                ? 'border-indigo-500 bg-indigo-600 text-white shadow-sm'
                : 'border-transparent text-slate-800 hover:border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Icon className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-indigo-100' : 'text-slate-800'}`} />
            <span className="truncate">{DIMENSION_LABELS[id]}</span>
            {active && (
              <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
