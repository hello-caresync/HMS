'use client';

import type { LucideIcon } from 'lucide-react';
import { ccClasses } from '@/lib/doctor/command-center/theme';

export function KpiCard({
  label,
  value,
  icon: Icon,
  tone = 'default',
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: 'default' | 'success' | 'warning' | 'critical';
}) {
  const toneClass =
    tone === 'success'
      ? 'text-[#2E8B70]'
      : tone === 'warning'
        ? 'text-[#E9A23B]'
        : tone === 'critical'
          ? 'text-[#D9534F]'
          : 'text-[#20639B]';

  return (
    <div className={`p-5 ${ccClasses.card}`}>
      <div className="flex items-start justify-between">
        <Icon className={`h-5 w-5 ${toneClass}`} />
      </div>
      <p className="mt-4 text-xs font-bold uppercase tracking-wider text-[#5A7A94]">{label}</p>
      <p className={`mt-1 text-3xl font-black ${toneClass}`}>{value}</p>
    </div>
  );
}
