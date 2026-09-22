import { redirect } from 'next/navigation';

/** Canonical desk workspace lives at `/dashboard` — avoid nested hospital layout shell. */
export default function HospitalDashboardRedirectPage() {
  redirect('/dashboard');
}
