/** Whether demo seed / fallback data should be shown */
export function isDemoMode(): boolean {
  if (typeof process !== 'undefined') {
    if (process.env.NEXT_PUBLIC_USE_DEMO_SEED === 'true') return true;
    if (process.env.NEXT_PUBLIC_USE_DEMO_SEED === 'false') return false;
    return process.env.NODE_ENV === 'development';
  }
  return false;
}
