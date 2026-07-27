/**
 * Nexora Doctor OS — Design System v1
 * Apple Health · Linear · Stripe · Epic clinical density
 */
export const os = {
  light: {
    bg: '#F5F5F7',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    muted: '#F0F0F3',
    border: 'rgba(0,0,0,0.06)',
    borderStrong: 'rgba(0,0,0,0.12)',
    text: '#1D1D1F',
    textSecondary: '#6E6E73',
    textTertiary: '#AEAEB2',
    accent: '#0071E3',
    accentSoft: 'rgba(0,113,227,0.08)',
    success: '#34C759',
    warning: '#FF9500',
    critical: '#FF3B30',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    glass: 'rgba(255,255,255,0.72)',
  },
  dark: {
    bg: '#0C0C0E',
    surface: '#1C1C1E',
    surfaceElevated: '#2C2C2E',
    muted: '#3A3A3C',
    border: 'rgba(255,255,255,0.08)',
    borderStrong: 'rgba(255,255,255,0.14)',
    text: '#F5F5F7',
    textSecondary: '#98989D',
    textTertiary: '#636366',
    accent: '#0A84FF',
    accentSoft: 'rgba(10,132,255,0.15)',
    success: '#30D158',
    warning: '#FF9F0A',
    critical: '#FF453A',
    gradient: 'linear-gradient(135deg, #5e60ce 0%, #6930c3 100%)',
    glass: 'rgba(28,28,30,0.85)',
  },
} as const;

export type OsTheme = 'light' | 'dark';

export const osNav = [
  { id: 'dashboard', label: 'Dashboard', href: '/doctor/dashboard', short: 'Home' },
  { id: 'care-center', label: 'Care Center', href: '/doctor/care-center', short: 'Care' },
  { id: 'patients', label: 'Patient Workspace', href: '/doctor/patients', short: 'Patients' },
  { id: 'clinical', label: 'Clinical Workspace', href: '/doctor/clinical', short: 'Clinical' },
  { id: 'orders', label: 'Orders', href: '/doctor/orders', short: 'Orders' },
  { id: 'communication', label: 'Communication', href: '/doctor/communication', short: 'Comms' },
  { id: 'insights', label: 'Insights', href: '/doctor/analytics', short: 'Insights' },
  { id: 'documents', label: 'Documents', href: '/doctor/documents', short: 'Docs' },
  { id: 'profile', label: 'Profile', href: '/doctor/settings', short: 'Profile' },
] as const;

export const osAliases: Record<string, string[]> = {
  '/doctor/dashboard': ['/doctor/dashboard', '/doctor/emergency', '/doctor/notifications', '/doctor/ai-assistant'],
  '/doctor/care-center': ['/doctor/care-center', '/doctor/opd', '/doctor/ipd', '/doctor/consultations', '/doctor/consultation'],
  '/doctor/patients': ['/doctor/patients', '/doctor/emr', '/doctor/emr-vault'],
  '/doctor/clinical': ['/doctor/clinical', '/doctor/prescriptions'],
  '/doctor/orders': ['/doctor/orders', '/doctor/lab', '/doctor/labs', '/doctor/radiology'],
  '/doctor/communication': ['/doctor/communication', '/doctor/messages', '/doctor/telemedicine', '/doctor/telehealth'],
  '/doctor/analytics': ['/doctor/analytics', '/doctor/schedule', '/doctor/calendar', '/doctor/scheduler'],
  '/doctor/documents': ['/doctor/documents'],
  '/doctor/settings': ['/doctor/settings'],
};

export function isOsNavActive(pathname: string, href: string) {
  const paths = osAliases[href] ?? [href];
  return paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
