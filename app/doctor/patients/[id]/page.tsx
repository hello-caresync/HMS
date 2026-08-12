import PatientProfileWorkspace from '@/components/doctor/command-center/PatientProfileWorkspace';
import { createClient } from '@/lib/supabase/client';

export async function generateStaticParams() {
  try {
    const supabase = createClient();
    const { data: patients } = await supabase.from('patient_profiles').select('id');

    if (!patients || patients.length === 0) {
      return [{ id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' }];
    }

    return patients.map((patient: { id: string | number }) => ({
      id: String(patient.id),
    }));
  } catch (error) {
    console.warn('Fallback static params generated due to query error:', error);
    return [{ id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' }];
  }
}

export default async function DoctorPatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PatientProfileWorkspace patientId={id} />;
}
