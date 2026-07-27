import { redirect } from 'next/navigation';

export default function LegacyCareCenterRedirect() {
  redirect('/doctor/opd-consultation');
}
