import { redirect } from 'next/navigation';

export default function LegacySchedulerRedirect() {
  redirect('/doctor/schedule');
}
