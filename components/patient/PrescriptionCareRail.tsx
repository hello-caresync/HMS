'use client';

import { CalendarClock, Clock, MapPin, Phone, Pill } from 'lucide-react';

import type { NormalizedPrescription, PrescriptionMedicineItem } from '@/lib/patient/prescriptions-feed';

type PrescriptionCareRailProps = {
  prescriptions: NormalizedPrescription[];
  activeRx: NormalizedPrescription | null;
};

function collectActiveMedicines(prescriptions: NormalizedPrescription[]): PrescriptionMedicineItem[] {
  const seen = new Set<string>();
  const items: PrescriptionMedicineItem[] = [];

  for (const rx of prescriptions) {
    const list = rx.medicines.length > 0 ? rx.medicines : rx.medications;
    for (const med of list) {
      const key = med.name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      items.push(med);
    }
  }

  return items.slice(0, 6);
}

export function PrescriptionCareRail({ prescriptions, activeRx }: PrescriptionCareRailProps) {
  const activeMeds = collectActiveMedicines(prescriptions);

  return (
    <aside className="space-y-4">
      <div className="rounded-xl border border-[#EADBCE] bg-white p-5 shadow-xs">
        <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-600">
          <Pill className="h-4 w-4 text-[#8C5A3C]" aria-hidden />
          Active Medications
        </h3>
        {activeMeds.length === 0 ? (
          <p className="text-xs text-[#7C5C48]">No active medication courses on file.</p>
        ) : (
          <ul className="space-y-2">
            {activeMeds.map((med) => (
              <li
                key={med.name}
                className="flex items-start justify-between gap-2 rounded-lg border border-[#EADBCE]/60 bg-[#FAF6F0] px-3 py-2"
              >
                <span className="text-xs font-semibold text-[#2B1810]">{med.name}</span>
                <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-[#8C5A3C]">
                  {med.frequency || 'As directed'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-[#EADBCE] bg-white p-5 shadow-xs">
        <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-600">
          <MapPin className="h-4 w-4 text-[#8C5A3C]" aria-hidden />
          Hospital Pharmacy Desk
        </h3>
        <p className="text-xs font-bold text-[#2B1810]">Dispensary Counter 2</p>
        <p className="mt-0.5 text-[11px] text-[#7C5C48]">Ground Floor · HOSP-01 (Bengaluru)</p>
        <div className="mt-3 space-y-1.5 text-[11px] text-[#7C5C48]">
          <p className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-[#8C5A3C]" />
            Mon–Sat · 8:00 AM – 8:00 PM
          </p>
          <p className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-[#8C5A3C]" />
            +91 98450 12345 (Ext. 204)
          </p>
        </div>
        <span className="mt-3 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
          Walk-in dispensing open
        </span>
      </div>

      <div className="rounded-xl border border-[#E6CCB2] bg-[#FAF6F0] p-5 shadow-xs">
        <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#8C5A3C]">
          <CalendarClock className="h-4 w-4" aria-hidden />
          Clinician Follow-Up
        </h3>
        {activeRx?.follow_up_date ? (
          <>
            <p className="text-sm font-bold text-[#2B1810]">Next review: {activeRx.follow_up_date}</p>
            <p className="mt-1 text-[11px] text-[#7C5C48]">
              Attend follow-up with {activeRx.doctor_name || 'your consulting physician'} to renew
              prescriptions if required.
            </p>
          </>
        ) : (
          <p className="text-xs text-[#7C5C48]">
            No follow-up date scheduled. Book a review consult when your medication course ends.
          </p>
        )}
      </div>
    </aside>
  );
}

export default PrescriptionCareRail;
