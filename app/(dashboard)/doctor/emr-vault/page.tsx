import { redirect } from 'next/navigation';

export default function LegacyEmrVaultRedirect() {
  redirect('/doctor/emr');
}
