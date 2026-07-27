import { redirect } from 'next/navigation';

export default function LegacyTelehealthRedirect() {
  redirect('/doctor/telemedicine');
}
