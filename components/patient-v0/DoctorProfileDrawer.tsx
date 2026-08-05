'use client';

import Link from 'next/link';
import {
  Building2,
  CalendarDays,
  Clock,
  Languages,
  Loader2,
  MapPin,
  Star,
  Stethoscope,
  X,
} from 'lucide-react';

import { opdUi } from '@/lib/opd/design-tokens';
import { v0Ui } from '@/components/patient-v0/ui';
import { PATIENT_ROUTES } from '@/lib/patient/navigation';
import type { EcosystemDoctor } from '@/lib/ecosystem/types';

type Props = {
  doctor: EcosystemDoctor;
  onClose?: () => void;
  liveSource?: 'supabase' | 'local';
};

export function DoctorProfileDrawer({ doctor, onClose, liveSource }: Props) {
  return (
    <aside className={`${opdUi.card} relative h-fit overflow-hidden border-[#8E7692]/35 lg:sticky lg:top-24`}>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-lg p-1 text-[#8E7692] hover:bg-[#CEB2C0]/30 lg:hidden"
          aria-label="Close profile"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      <div className="border-b border-[#8E7692]/25 bg-[#482A41] px-5 py-4 text-white">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">Doctor Profile</p>
        {liveSource === 'supabase' && (
          <span className="mt-1 inline-block rounded-full bg-[#5E8B7E]/30 px-2 py-0.5 text-[10px] font-bold text-[#5E8B7E]">
            Live · Supabase
          </span>
        )}
      </div>

      <div className="p-5">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#572E54] text-2xl font-black text-white shadow-md">
            {doctor.photoInitials}
          </div>
          <h2 className="mt-3 text-lg font-black text-[#482A41]">{doctor.name}</h2>
          <p className="text-sm font-bold text-[#572E54]">{doctor.specialization}</p>
          <p className="mt-1 text-xs text-[#8E7692]">{doctor.department}</p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#D8A657]/25 px-2.5 py-0.5 text-xs font-bold text-[#482A41]">
              <Star className="h-3 w-3 fill-[#D8A657]" /> {doctor.rating} ({doctor.reviewCount})
            </span>
            {doctor.availableToday ? (
              <span className={opdUi.badgeOnTime}>Available today</span>
            ) : (
              <span className="rounded-full bg-[#8E7692]/20 px-2.5 py-0.5 text-xs font-bold text-[#8E7692]">
                Not available today
              </span>
            )}
          </div>
        </div>

        <dl className="mt-6 space-y-4 text-sm">
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-[#8E7692]">Experience</dt>
            <dd className="mt-0.5 font-semibold text-[#482A41]">{doctor.experience}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-[#8E7692]">
              <Languages className="h-3 w-3" /> Languages
            </dt>
            <dd className="mt-0.5 font-semibold text-[#482A41]">{doctor.languages.join(', ')}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-[#8E7692]">Consultation fee</dt>
            <dd className="mt-0.5 text-xl font-black text-[#572E54]">₹{doctor.consultationFee}</dd>
          </div>
          <div className="flex gap-4">
            <div>
              <dt className="flex items-center gap-1 text-xs font-bold uppercase text-[#8E7692]">
                <MapPin className="h-3 w-3" /> Room
              </dt>
              <dd className="mt-0.5 font-semibold">{doctor.roomNumber}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1 text-xs font-bold uppercase text-[#8E7692]">
                <Building2 className="h-3 w-3" /> Branch
              </dt>
              <dd className="mt-0.5 font-semibold">{doctor.branchId.replace('branch-', '').toUpperCase()}</dd>
            </div>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-[#8E7692]">About</dt>
            <dd className="mt-0.5 leading-relaxed text-[#482A41]/90">{doctor.bio}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-[#8E7692]">
              <Clock className="h-3 w-3" /> Today&apos;s slots
            </dt>
            <dd className="mt-2 flex flex-wrap gap-1">
              {doctor.slots.length > 0 ? (
                doctor.slots.map((s) => (
                  <span
                    key={s}
                    className="rounded-md border border-[#8E7692]/30 bg-[#CEB2C0]/25 px-2 py-0.5 text-xs font-bold text-[#482A41]"
                  >
                    {s}
                  </span>
                ))
              ) : (
                <span className="text-xs text-[#8E7692]">Check availability when booking</span>
              )}
            </dd>
          </div>
        </dl>

        <Link
          href={`${PATIENT_ROUTES.appointments}?book=${doctor.id}`}
          className={`${v0Ui.btnPrimary} mt-6 w-full`}
        >
          <Stethoscope className="h-4 w-4" /> Book with {doctor.name.split(' ').slice(-1)[0]}
        </Link>
      </div>
    </aside>
  );
}
