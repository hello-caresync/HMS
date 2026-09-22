import { NextResponse } from 'next/server';

import { isSuperAdminAuthorizedRequest } from '@/lib/super-admin/api-auth';
import {
  createSuperAdminServiceClient,
  purgeHospitalTenant,
} from '@/lib/super-admin/teardown';

type RouteContext = {
  params: Promise<{ hospitalId: string }>;
};

export async function DELETE(req: Request, context: RouteContext) {
  if (!isSuperAdminAuthorizedRequest(req)) {
    return NextResponse.json(
      { success: false, error: 'Super Admin authorization required.' },
      { status: 403 },
    );
  }

  const { hospitalId } = await context.params;
  const tenantKey = decodeURIComponent(String(hospitalId ?? '').trim());
  if (!tenantKey) {
    return NextResponse.json(
      { success: false, error: 'Hospital tenant id or code is required.' },
      { status: 400 },
    );
  }

  const supabase = createSuperAdminServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { success: false, error: 'Supabase teardown service is not configured.' },
      { status: 503 },
    );
  }

  const result = await purgeHospitalTenant(supabase, tenantKey);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    hospital_id: result.hospital_id ?? tenantKey,
    hospital_code: result.hospital_code,
    deleted: result.deleted,
  });
}
