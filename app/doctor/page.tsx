import { redirect } from 'next/navigation';

export default function DoctorPortalIndexPage() {
  redirect('/doctor/dashboard');
}
