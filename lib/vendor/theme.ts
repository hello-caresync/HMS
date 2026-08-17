/** Nexora Vendor App — B2B golden commerce design tokens */

export const VENDOR_BRAND = {
  name: 'NEXORA VENDOR',
  tagline: 'B2B Commerce & Supplier Relationship Management',
  primary: '#FFB703',
  secondary: '#F77F00',
  cream: '#FFF7E8',
  card: '#FFFFFF',
  accent: '#F4A261',
  charcoal: '#2B2B2B',
  success: '#2A9D8F',
  warning: '#D8A657',
  danger: '#E76F51',
  emergency: '#E76F51',
  muted: '#6B6B6B',
  sidebar: '#1E1E1E',
} as const;

export const vendorClasses = {
  canvas: 'bg-vendor-cream text-vendor-charcoal',
  card: 'rounded-2xl border border-vendor-accent/20 bg-vendor-card text-vendor-charcoal shadow-sm',
  cardMuted: 'rounded-2xl border border-vendor-accent/20 bg-vendor-cream/80 p-4',
  heading: 'text-2xl font-black text-vendor-charcoal',
  subheading: 'text-sm font-medium text-vendor-muted',
  btnPrimary:
    'inline-flex items-center justify-center gap-2 rounded-xl bg-vendor-primary px-4 py-2.5 text-sm font-bold text-vendor-charcoal shadow-sm transition hover:bg-vendor-secondary hover:text-white disabled:opacity-60',
  btnSecondary:
    'inline-flex items-center justify-center gap-2 rounded-xl bg-vendor-accent px-4 py-2.5 text-sm font-bold text-vendor-charcoal shadow-sm transition hover:bg-vendor-secondary hover:text-white disabled:opacity-60',
  btnGhost:
    'inline-flex items-center justify-center gap-2 rounded-xl border border-vendor-accent/30 bg-white px-4 py-2.5 text-sm font-bold text-vendor-charcoal hover:bg-vendor-cream',
  btnDanger:
    'inline-flex items-center justify-center gap-2 rounded-xl bg-vendor-danger px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:opacity-95',
  navShell: 'bg-vendor-sidebar text-white',
  navActive: 'bg-vendor-primary font-semibold text-vendor-charcoal shadow-md',
  navIdle: 'text-white/85 hover:bg-white/10 hover:text-white',
  topBar: 'border-b border-vendor-accent/25 bg-vendor-card',
  tabActive: 'rounded-full bg-vendor-primary px-3 py-1.5 text-xs font-bold text-vendor-charcoal shadow-sm',
  tabIdle:
    'rounded-full border border-vendor-accent/20 bg-vendor-accent/15 px-3 py-1.5 text-xs font-bold text-vendor-charcoal hover:bg-vendor-accent/25',
  input:
    'mt-1 w-full rounded-lg border border-vendor-accent/25 bg-white px-3 py-2 text-sm text-vendor-charcoal placeholder:text-vendor-muted/70 focus:border-vendor-primary focus:outline-none focus:ring-2 focus:ring-vendor-primary/30',
  label: 'block text-[10px] font-bold uppercase tracking-wide text-vendor-muted',
  tableWrap: 'overflow-hidden rounded-2xl border border-vendor-accent/20 bg-vendor-card shadow-sm',
} as const;
