'use client';

import { VendorPaymentsSection } from '@/components/hospital/VendorPaymentsSection';
import { readHospitalAppSession } from '@/lib/auth/ecosystem-sessions';
import { HOSPITAL_TENANT_ID, REGAL_HOSPITAL_NAME } from '@/lib/regal/constants';

export default function HospitalFinancePage() {
  const session = readHospitalAppSession();
  const hospitalId = session?.hospital_id?.trim() || HOSPITAL_TENANT_ID;
  const hospitalName = session?.hospital_name?.trim() || REGAL_HOSPITAL_NAME;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <VendorPaymentsSection hospitalId={hospitalId} hospitalName={hospitalName} />
    </div>
  );
}
