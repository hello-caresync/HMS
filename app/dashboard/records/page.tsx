'use client';

import { RecordsPharmacyCommandCenter } from '@/components/hospital/RecordsPharmacyCommandCenter';
import { readHospitalAppSession } from '@/lib/auth/ecosystem-sessions';
import { HOSPITAL_TENANT_ID } from '@/lib/regal/constants';

export default function DashboardRecordsPage() {
  const session = readHospitalAppSession();
  const hospitalId = session?.hospital_id || HOSPITAL_TENANT_ID;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <RecordsPharmacyCommandCenter
        hospitalId={hospitalId}
        hospitalName={session?.hospital_name || 'Regal Hospital'}
      />
    </div>
  );
}
