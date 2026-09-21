import { redirect } from 'next/navigation';

/** Legacy route — canonical patient auth lives at /patient/login */
export default function LegacyPatientAuthLoginPage() {
  redirect('/patient/login');
}
