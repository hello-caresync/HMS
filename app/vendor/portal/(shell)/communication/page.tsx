import { redirect } from 'next/navigation';

import { VENDOR_PORTAL_ROUTES } from '@/lib/vendor/navigation';

export default function LegacyCommunicationRedirect() {
  redirect(VENDOR_PORTAL_ROUTES.dashboard);
}
