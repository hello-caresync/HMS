import { redirect } from 'next/navigation';

export default function LegacyEmergencyRedirect() {
  redirect('/doctor/emergency-cases');
}
