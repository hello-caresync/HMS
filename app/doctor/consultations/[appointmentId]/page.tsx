import { createClient } from '@/lib/supabase/client';

import ConsultationWorkspaceClient from './ConsultationWorkspaceClient';

/**
 * Cloudflare static export: pre-render known appointment IDs at build time.
 * Unknown IDs still resolve client-side via ConsultationWorkspaceClient.
 */
export async function generateStaticParams() {
  try {
    const supabase = createClient();
    const { data: appointments } = await supabase
      .from('appointments')
      .select('appointment_id, id')
      .limit(100);

    if (appointments?.length) {
      return appointments.map((row: { appointment_id?: string; id?: string }) => ({
        appointmentId: String(row.appointment_id ?? row.id ?? 'default'),
      }));
    }
  } catch (error) {
    console.warn('Fallback static params for consultation workspace:', error);
  }

  return [{ appointmentId: 'default' }, { appointmentId: 'apt_demo' }];
}

export default function ConsultationWorkspacePage() {
  return <ConsultationWorkspaceClient />;
}
