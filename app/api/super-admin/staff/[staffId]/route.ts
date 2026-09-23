export const runtime = 'edge';

import { NextResponse } from 'next/server';

import { isSuperAdminAuthorizedRequest } from '@/lib/super-admin/api-auth';
import {
  createSuperAdminServiceClient,
  purgeHospitalStaffMember,
} from '@/lib/super-admin/teardown';

type RouteContext = {
  params: Promise<{ staffId: string }>;
};

export async function DELETE(req: Request, context: RouteContext) {
  if (!isSuperAdminAuthorizedRequest(req)) {
    return NextResponse.json(
      { success: false, error: 'Super Admin authorization required.' },
      { status: 403 },
    );
  }

  const { staffId } = await context.params;
  const id = String(staffId ?? '').trim();
  if (!id) {
    return NextResponse.json({ success: false, error: 'Staff id is required.' }, { status: 400 });
  }

  const supabase = createSuperAdminServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { success: false, error: 'Supabase teardown service is not configured.' },
      { status: 503 },
    );
  }

  const result = await purgeHospitalStaffMember(supabase, id);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    staff_id: result.staff_id ?? id,
    deleted: result.deleted,
  });
}
