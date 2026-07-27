import { redirect } from 'next/navigation';

export default function LegacyPrescriptionsRedirect() {
  redirect('/doctor/e-prescription');
}
