import { redirect } from 'next/navigation';

export default function LegacyConsultationsRedirect() {
  redirect('/doctor/consultation');
}
