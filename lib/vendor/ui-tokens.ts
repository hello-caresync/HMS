import { vendorClasses } from '@/lib/vendor/theme';

/** Shared Tailwind strings for vendor workspaces */
export const vendorUi = {
  ...vendorClasses,
  page: 'space-y-6 text-base',
  icon: 'text-vendor-secondary',
  iconPrimary: 'text-vendor-primary',
  link: 'font-bold text-vendor-secondary hover:underline',
  progressTrack: 'h-2 overflow-hidden rounded-full bg-vendor-accent/25',
  progressFill: 'h-full rounded-full bg-vendor-primary transition-all',
  scannerFrame:
    'flex h-40 items-center justify-center rounded-xl border border-dashed border-vendor-accent/40 bg-vendor-charcoal text-vendor-primary',
  kpiGrid: 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5',
} as const;

export const vendorFieldClass = vendorClasses.input;
export const vendorLabelClass = vendorClasses.label;
