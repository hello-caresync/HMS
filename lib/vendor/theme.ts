/** Nexora Vendor App — Purple Harmony B2B commerce design tokens */

export const VENDOR_BRAND = {
  name: 'NEXORA VENDOR',
  tagline: 'B2B Commerce & Supplier Relationship Management',
  primary: '#6A38A0',
  secondary: '#A36FDB',
  lilac: '#CEAEF2',
  surface: '#DCC2F9',
  surfaceAlt: '#D7B6F9',
  cream: '#FAF7FE',
  canvasMid: '#F3EBFC',
  canvasDeep: '#EDE3FA',
  card: '#FFFFFF',
  charcoal: '#2E1053',
  charcoalAlt: '#3B1466',
  success: '#2A9D8F',
  warning: '#D8A657',
  danger: '#E76F51',
  emergency: '#E76F51',
  muted: '#684594',
  sidebar: '#3B1466',
} as const;

export const vendorClasses = {
  canvas: 'text-vendor-charcoal',
  card: 'rounded-2xl border border-[#dcc2f9]/70 bg-vendor-card text-vendor-charcoal shadow-sm',
  cardMuted: 'rounded-2xl border border-[#dcc2f9]/70 bg-vendor-cream/80 p-4',
  heading: 'text-2xl font-black text-vendor-charcoal',
  subheading: 'text-sm font-medium text-vendor-muted',
  btnPrimary:
    'inline-flex items-center justify-center gap-2 rounded-xl bg-vendor-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-vendor-secondary disabled:opacity-60',
  btnSecondary:
    'inline-flex items-center justify-center gap-2 rounded-xl bg-vendor-secondary px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-vendor-primary disabled:opacity-60',
  btnGhost:
    'inline-flex items-center justify-center gap-2 rounded-xl border border-[#dcc2f9]/70 bg-white px-4 py-2.5 text-sm font-bold text-vendor-charcoal hover:bg-vendor-accent/20',
  btnDanger:
    'inline-flex items-center justify-center gap-2 rounded-xl bg-vendor-danger px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:opacity-95',
  navShell: 'bg-vendor-sidebar text-white',
  navActive: 'bg-vendor-primary font-semibold text-white shadow-md',
  navIdle: 'text-white/85 hover:bg-white/10 hover:text-white',
  topBar: 'border-b border-[#dcc2f9]/70 bg-vendor-card/95',
  tabActive:
    'rounded-full bg-vendor-primary px-3 py-1.5 text-xs font-bold text-white shadow-sm',
  tabIdle:
    'rounded-full border border-[#dcc2f9]/70 bg-vendor-accent/25 px-3 py-1.5 text-xs font-bold text-vendor-charcoal hover:bg-vendor-accent/40',
  input:
    'mt-1 w-full rounded-lg border border-[#dcc2f9]/70 bg-white px-3 py-2 text-sm text-vendor-charcoal placeholder:text-vendor-muted/70 focus:border-vendor-primary focus:outline-none focus:ring-2 focus:ring-vendor-primary/30',
  label: 'block text-[10px] font-bold uppercase tracking-wide text-vendor-muted',
  tableWrap:
    'overflow-hidden rounded-2xl border border-[#dcc2f9]/70 bg-vendor-card shadow-sm',
} as const;
