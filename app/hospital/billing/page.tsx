import { redirect } from 'next/navigation';

/** Standalone billing desk deprecated — settlement lives in /dashboard?tab=billing */
export default function HospitalBillingRedirectPage() {
  redirect('/dashboard?tab=billing');
}
