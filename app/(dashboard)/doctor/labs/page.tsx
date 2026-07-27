import { redirect } from 'next/navigation';

export default function LegacyLabsRedirect() {
  redirect('/doctor/lab-orders');
}
