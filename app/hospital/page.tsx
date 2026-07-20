import { redirect } from 'next/navigation';

import { APP_ROUTES } from '../lib/routes';

/** Hospital module index — forward to the command dashboard only from this exact route. */
export default function HospitalIndexPage() {
  redirect(APP_ROUTES.hospitalDashboard);
}
