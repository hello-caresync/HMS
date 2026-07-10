import { redirect } from 'next/navigation';

import { APP_ROUTES } from '../../lib/routes';

/** Legacy/incorrect URL guard — `/vendor/hospital` is not a valid app route. */
export default function VendorHospitalLegacyRedirect() {
  redirect(APP_ROUTES.hospital);
}
