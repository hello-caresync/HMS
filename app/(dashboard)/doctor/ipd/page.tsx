import { redirect } from 'next/navigation';

export default function LegacyIpdRedirect() {
  redirect('/doctor/ipd-management');
}
