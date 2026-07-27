import { redirect } from 'next/navigation';

export default function LegacySurgeriesRedirect() {
  redirect('/doctor/surgery-management');
}
