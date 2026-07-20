import { redirect } from 'next/navigation';

import { APP_ROUTES } from './lib/routes';

/** Hospital operations entry — route all root visitors to the command dashboard. */
export default function HomePage() {
  redirect(APP_ROUTES.hospitalDashboard);
}
