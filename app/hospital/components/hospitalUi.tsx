'use client';

import React from 'react';

/** Premium blush workspace canvas */
export const hubCanvasClassName = 'bg-[#FDF4F2]';

/** Studio canvas — independently scrollable workspace frame */
export const workspaceClassName =
  'space-y-8 animate-fadeIn text-slate-900 pb-24 h-full overflow-y-auto';

/** Structural panel — crisp white elevated cards */
export const panelClassName =
  'bg-white border border-slate-200/60 rounded-2xl p-6 shadow-xs transition-all hover:shadow-sm';

export const nestedPanelClassName =
  'bg-white border border-slate-200/60 rounded-xl p-4 shadow-xs';

/** Overline accent — blush rose mono headers */
export const overlineClassName =
  'text-xs font-semibold uppercase tracking-wider text-[#A65E53] font-mono block mb-1';

export const featureHeaderClassName =
  'text-lg font-semibold text-slate-800 tracking-tight';

export const monoDataClassName = 'font-mono font-bold text-slate-900';

export const bodyTextClassName = 'text-base text-slate-800';

export const chatCanvasClassName =
  'bg-white/70 border border-slate-200/60 rounded-xl p-5 space-y-4 max-h-[380px] overflow-y-auto';

export const chatSentClassName =
  'bg-[#D48D82] text-white rounded-2xl rounded-tr-none p-3 shadow-md shadow-[#D48D82]/10 text-sm font-semibold max-w-md ml-auto';

export const chatReceivedClassName =
  'bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-none p-3 shadow-3xs text-base font-medium max-w-md mr-auto';

export const chatInputClassName =
  'border border-slate-200 rounded-xl px-4 py-3 text-base font-medium bg-white text-slate-900 focus:outline-none focus:border-[#D48D82] focus:ring-1 focus:ring-[#D48D82] shadow-3xs w-full transition-all';

export const inputClassName =
  'border border-slate-200 rounded-xl px-4 py-3 text-base font-medium bg-white text-slate-900 focus:outline-none focus:border-[#D48D82] focus:ring-1 focus:ring-[#D48D82] shadow-3xs w-full placeholder:text-slate-800 transition-all';

export const selectClassName =
  'border border-slate-200 rounded-xl px-4 py-3 text-base font-medium bg-white text-slate-900 focus:outline-none focus:border-[#D48D82] focus:ring-1 focus:ring-[#D48D82] shadow-3xs w-full cursor-pointer transition-all';

export const alertInfoClassName =
  'bg-[#FCEEEB] border border-[#F5D5CF] text-[#A65E53] rounded-xl p-4 text-base font-medium';

export const alertWarningClassName =
  'bg-[#FCEEEB] border border-[#F5D5CF] text-[#A65E53] rounded-xl p-4 text-base font-medium';

export const statusBadgeBase =
  'px-2.5 py-0.5 text-xs uppercase font-semibold tracking-wider rounded-md border';

/** Soft rose-pink silk tags (SENT, ACCEPTED, etc.) */
export const statusBadgeSilkClassName =
  'inline-flex items-center bg-[#FCEEEB] text-[#A65E53] border border-[#F5D5CF] rounded-lg px-3 py-1 font-mono font-semibold text-xs tracking-wider uppercase';

export const btnPrimaryClassName =
  'inline-flex items-center justify-center bg-[#D48D82] hover:bg-[#C57E73] text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-md shadow-[#D48D82]/10 transition-all cursor-pointer uppercase tracking-wider active:scale-[0.98]';

export const btnSuccessClassName =
  'inline-flex items-center justify-center bg-[#D48D82] hover:bg-[#C57E73] text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-md shadow-[#D48D82]/10 transition-all cursor-pointer uppercase tracking-wider active:scale-[0.98]';

export const btnOutlineClassName =
  'inline-flex items-center justify-center bg-white border border-slate-200 text-slate-800 hover:bg-[#FCEEEB] font-semibold text-sm px-4 py-2.5 rounded-xl shadow-3xs transition-all cursor-pointer active:scale-[0.98]';

const SILK_BADGE_STATUSES = new Set([
  'New',
  'Created',
  'Sent',
  'Accepted',
  'Processing',
  'Packed',
  'Delivered',
  'Active',
  'Disbursed',
  'Info',
  'Stable Buffer',
  'Paid',
]);

const STATUS_STYLES: Record<string, string> = {
  Dispatched: 'bg-[#FCEEEB] text-[#A65E53] border-[#F5D5CF]',
  'In Transit': 'bg-[#FCEEEB] text-[#A65E53] border-[#F5D5CF]',
  Closed: 'bg-slate-100 text-slate-900 border-slate-200',
  Suspended: 'bg-rose-50 text-rose-700 border-rose-200',
  Pending: 'bg-[#FCEEEB] text-[#A65E53] border-[#F5D5CF]',
  'Expiring Soon': 'bg-[#FCEEEB] text-[#A65E53] border-[#F5D5CF]',
  Critical: 'bg-rose-50 text-rose-700 border-rose-200',
  Warning: 'bg-[#FCEEEB] text-[#A65E53] border-[#F5D5CF]',
  'Low Stock Flag': 'bg-rose-50 text-rose-700 border-rose-200',
};

export function statusBadgeClass(label: string): string {
  if (SILK_BADGE_STATUSES.has(label)) {
    return statusBadgeSilkClassName;
  }
  const style = STATUS_STYLES[label];
  if (style) {
    return `${statusBadgeBase} ${style}`;
  }
  return `${statusBadgeBase} bg-slate-50 text-slate-800 border-slate-200`;
}

export function StatusBadge({ label }: { label: string }) {
  return <span className={statusBadgeClass(label)}>{label}</span>;
}

export function PageHeader({
  overline,
  title,
  description,
  action,
}: {
  overline?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={`${panelClassName} flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between`}>
      <div>
        {overline && <span className={overlineClassName}>{overline}</span>}
        <h3 className={featureHeaderClassName}>{title}</h3>
        {description && (
          <p className={`mt-1 ${bodyTextClassName} text-slate-800`}>{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className={`${panelClassName} py-12 text-center`}>
      <p className="text-base font-medium text-slate-800">{message}</p>
    </div>
  );
}
