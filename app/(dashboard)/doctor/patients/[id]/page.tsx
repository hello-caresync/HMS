import { PatientDetailWorkspace } from '@/components/nexora-doctor/workspaces/PatientDetailWorkspace';
import { SEED_PATIENTS } from '@/lib/nexora-doctor/seed-data';

export function generateStaticParams() {
  return SEED_PATIENTS.map((p) => ({ id: p.id }));
}

export default function DoctorPatientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <PatientDetailWorkspace patientId={params.id} />;
}
