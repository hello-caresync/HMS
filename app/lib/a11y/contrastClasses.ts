/**
 * ERP accessibility contrast tokens — enforce high-contrast, test-ready UI.
 * Use these constants instead of faint slate-300/400/500 on light canvases.
 */

/** Table header row (thead tr) */
export const ERP_TABLE_HEAD_ROW =
  'border-b-2 border-slate-200 bg-slate-100';

/** Table header cell */
export const ERP_TABLE_HEAD_CELL =
  'px-3 py-2 text-left text-[10px] font-black uppercase tracking-wider text-slate-950';

/** Core data cell — IDs, slots, locations, item names */
export const ERP_TABLE_DATA_PRIMARY =
  'text-sm font-bold text-slate-950';

export const ERP_TABLE_DATA_MONO =
  'font-mono text-xs font-black text-slate-950';

/** Secondary table metadata */
export const ERP_TABLE_DATA_SECONDARY =
  'text-xs font-medium text-slate-800';

/** Large KPI / metric numerals */
export const ERP_KPI_VALUE =
  'text-slate-950 font-black tabular-nums';

export const ERP_KPI_LABEL =
  'text-xs font-bold uppercase tracking-wider text-slate-800';

/** Search & form inputs on light backgrounds */
export const ERP_INPUT =
  'rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 placeholder:text-slate-500 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200';

export const ERP_SELECT = ERP_INPUT;

/** Status badge base — pair with color-specific bg/text/border */
export const ERP_BADGE_BASE =
  'inline-flex rounded-md border px-2 py-0.5 text-[10px] font-black uppercase';

/** Dark navigation canvas (sidebar, auth shell) */
export const ERP_NAV_MUTED = 'text-slate-200';
export const ERP_NAV_SECTION = 'text-[9px] font-bold uppercase tracking-[0.18em] text-slate-300';
