import { redirect } from 'next/navigation';

export default function LegacyCommunicationRedirect() {
  redirect('/doctor/notifications');
}
