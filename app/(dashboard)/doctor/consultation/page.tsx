import { redirect } from 'next/navigation';

export default function LegacyConsultationRedirect() {
  redirect('/doctor/opd-consultation');
}
