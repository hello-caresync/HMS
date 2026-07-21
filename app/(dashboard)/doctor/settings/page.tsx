'use client';

import { DoctorModuleShell, DigitalSignaturePad } from '@/components/doctor/doctor-ui';
import { MOCK_DOCTOR } from '@/lib/doctor/mock-data';

export default function DoctorSettingsPage() {
  return (
    <DoctorModuleShell title="Profile & Settings" subtitle="Bio · fees · signature · notifications · security logs">
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-black uppercase text-[#00758C]">Professional profile</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="font-bold text-slate-500">Name</dt>
              <dd>{MOCK_DOCTOR.name}</dd>
            </div>
            <div>
              <dt className="font-bold text-slate-500">Specialization</dt>
              <dd>{MOCK_DOCTOR.specialization}</dd>
            </div>
            <div>
              <dt className="font-bold text-slate-500">Consultation fee</dt>
              <dd>₹1,200 · follow-up ₹800</dd>
            </div>
          </dl>
        </section>
        <section className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-black uppercase text-[#00758C]">Digital signature</h3>
          <div className="mt-3">
            <DigitalSignaturePad onApply={() => undefined} />
          </div>
        </section>
      </div>
    </DoctorModuleShell>
  );
}
