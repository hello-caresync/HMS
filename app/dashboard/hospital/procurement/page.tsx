'use client';

import Link from 'next/link';
import { ArrowUpRight, Receipt } from 'lucide-react';

import { SupplyOrdersCommandCenter } from '@/components/hospital/SupplyOrdersCommandCenter';
import { readHospitalAppSession } from '@/lib/auth/ecosystem-sessions';
import { isHospitalUuid } from '@/lib/hospital/resolve-hospital-context';
import { HOSPITAL_TENANT_ID, REGAL_HOSPITAL_NAME } from '@/lib/regal/constants';

export default function HospitalProcurementPage() {
  const session = readHospitalAppSession();
  const hospitalId = isHospitalUuid(session?.hospital_id ?? '')
    ? session!.hospital_id!.trim()
    : session?.hospital_id?.trim() || HOSPITAL_TENANT_ID;
  const hospitalName = session?.hospital_name?.trim() || REGAL_HOSPITAL_NAME;

  return (
    <div className="min-h-screen space-y-4 bg-slate-50 p-6">
      <Link
        href="/dashboard/hospital/finance"
        className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100"
      >
        <Receipt className="h-4 w-4" />
        Open Vendor Payments &amp; Settlements
        <ArrowUpRight className="h-3.5 w-3.5" />
      </Link>

      <SupplyOrdersCommandCenter hospitalId={hospitalId} hospitalName={hospitalName} />
    </div>
  );
}
