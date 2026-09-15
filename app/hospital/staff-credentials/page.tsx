import { redirect } from 'next/navigation';

/** Alias route — canonical staff credentials console lives under /dashboard/staff-credentials */
export default function HospitalStaffCredentialsAliasPage() {
  redirect('/dashboard/staff-credentials');
}
