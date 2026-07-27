import { redirect } from 'next/navigation';

export default function LegacyRadiologyRedirect() {
  redirect('/doctor/radiology-orders');
}
