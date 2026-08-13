import { createClient } from '@/lib/supabase/client';

import ConsultationWorkspaceClient from './ConsultationWorkspaceClient';

export async function generateStaticParams() {
  try {
    const supabase = createClient();
    const { data: appointments } = await supabase
      .from('appointments')
      .select('appointment_id')
      .limit(50);

    if (appointments?.length) {
      return appointments.map((row: { appointment_id: string }) => ({
        appointmentId: String(row.appointment_id),
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
