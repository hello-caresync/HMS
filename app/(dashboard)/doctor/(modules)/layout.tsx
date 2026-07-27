import type { ReactNode } from 'react';

/** Route group wrapper — URLs remain `/doctor/*` with no extra segment. */
export default function DoctorModulesLayout({ children }: { children: ReactNode }) {
  return children;
}
