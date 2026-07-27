import Link from 'next/link';

import { renderHospitalModule } from '../_lib/renderModulePage';

export default function HospitalPatientsPage() {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link
          href="/hospital/patients/register"
          className="rounded-xl bg-[#00758C] px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white hover:bg-[#008588]"
        >
          Open registration desk
        </Link>
      </div>
      {renderHospitalModule('patients')}
    </div>
  );
}
