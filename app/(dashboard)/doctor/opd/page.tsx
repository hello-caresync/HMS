import { redirect } from 'next/navigation';

export default function LegacyOpdRedirect() {
  redirect('/doctor/opd-consultation');
}
