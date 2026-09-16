import type { ReactNode } from 'react';

import { patientCanvasClass } from '@/lib/patient/theme';

type PatientAmbientCanvasProps = {
  children: ReactNode;
  className?: string;
};

/** Warm linen page canvas with soft latte gradient orbs. */
export function PatientAmbientCanvas({ children, className = '' }: PatientAmbientCanvasProps) {
  const isViewportShell = className.includes('h-screen');
  const canvasClass = isViewportShell
    ? 'h-full w-full bg-[#FAF6F0] text-[#2B1810] antialiased selection:bg-[#8C5A3C] selection:text-white'
    : patientCanvasClass;

  return (
    <div className={`${canvasClass} ${className}`.trim()}>
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-[#F5EFE6]/80 blur-[100px]" />
        <div className="absolute -bottom-32 -left-32 h-[420px] w-[420px] rounded-full bg-[#DDB892]/20 blur-[110px]" />
      </div>
      {children}
    </div>
  );
}
