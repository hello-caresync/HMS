'use client';

import { Suspense } from 'react';
import { usePathname } from 'next/navigation';

import ConsultationWorkspaceClient from './[appointmentId]/ConsultationWorkspaceClient';

/** Parse appointment UUID from URL (Cloudflare SPA rewrite fallback). */
function resolveAppointmentIdFromPath(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  const consultationsIdx = segments.indexOf('consultations');
  if (consultationsIdx === -1) return 'default';

  const candidate = segments[consultationsIdx + 1];
  if (!candidate || candidate === 'index.html') return 'default';
  return candidate;
}

function ConsultationWorkspace() {
  const pathname = usePathname();
  const appointmentId = resolveAppointmentIdFromPath(pathname);

  return <ConsultationWorkspaceClient appointmentIdOverride={appointmentId} />;
}

export default function DoctorConsultationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-semibold text-sm">
          Loading Consultation Workspace...
        </div>
      }
    >
      <ConsultationWorkspace />
    </Suspense>
  );
}
