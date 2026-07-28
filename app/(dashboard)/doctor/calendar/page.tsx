import { redirect } from 'next/navigation';

export default function LegacyDoctorRedirect() {
  redirect('/doctor/schedule');
}
