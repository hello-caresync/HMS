import { createClient } from '@/lib/supabase/client';
import ConsultationWorkspaceClient from './ConsultationWorkspaceClient';

export async function generateStaticParams() {
  try {
    const supabase = createClient();
    const { data: appointments } = await supabase
      .from('appointments')
      .select('appointment_id')
      .limit(50);

    if (!appointments?.length) {
      return [{ appointmentId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' }];
    }

    return appointments.map((row: { appointment_id: string }) => ({
      appointmentId: String(row.appointment_id),
    }));
  } catch (error) {
    console.warn('Fallback static params for consultations due to query error:', error);
    return [{ appointmentId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' }];
  }
}

export default async function ConsultationPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const { appointmentId } = await params;
  return <ConsultationWorkspaceClient appointmentId={appointmentId} />;
}
