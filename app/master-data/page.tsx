import { redirect } from 'next/navigation';

import { APP_ROUTES } from '../lib/routes';

/** Legacy path — forwards to /admin/master-data */
export default function LegacyMasterDataRedirect() {
  redirect(APP_ROUTES.masterData);
}
