'use client';

import Link from 'next/link';
import { CalendarClock, ClipboardList, Headphones, MapPin, Phone } from 'lucide-react';

type PrescriptionGuidanceRailProps = {
  showPendingTips?: boolean;
};

const PREP_TIPS = [
  'Keep previous medical reports or test slips handy.',
  'Note down any ongoing allergy or daily medication history.',
  'Arrive 10 minutes prior to your allocated slot for vitals screening.',
];

const DISPATCH_TIPS = [
  'Your digital prescription is ready for print or download.',
  'Collect medicines from the hospital pharmacy with your token slip.',
  'Follow the clinician advice until your next review visit.',
];

export function PrescriptionGuidanceRail({
  showPendingTips = true,
}: PrescriptionGuidanceRailProps) {
  const tips = showPendingTips ? PREP_TIPS : DISPATCH_TIPS;
  const prepareTitle = showPendingTips
    ? 'What to Prepare for Your Visit'
    : 'After Your Consultation';

  return (
    <aside className="space-y-4">
      <div className="rounded-2xl border border-sky-100 bg-white/90 p-6 shadow-sm backdrop-blur-sm">
        <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
          <ClipboardList className="h-4 w-4 text-sky-700" aria-hidden />
          {prepareTitle}
        </h3>
        <ul className="space-y-2.5 text-xs leading-relaxed text-slate-700">
          {tips.map((tip) => (
            <li key={tip} className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" aria-hidden />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-sky-100 bg-white/90 p-6 shadow-sm backdrop-blur-sm">
        <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
          <MapPin className="h-4 w-4 text-sky-700" aria-hidden />
          Hospital Assistance &amp; OPD Desk
        </h3>
        <div className="space-y-2 text-xs text-slate-700">
          <p>
            <span className="font-semibold text-slate-900">Facility:</span> Ground Floor, Desk 02
          </p>
          <p className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-sky-700" aria-hidden />
            +91 98450 12345 (Ext. 204)
          </p>
          <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
            Desk Operational · No token delays
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50/80 to-white p-6 shadow-sm">
        <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
          <CalendarClock className="h-4 w-4 text-sky-700" aria-hidden />
          Need to Reschedule?
        </h3>
        <p className="mb-4 text-xs leading-relaxed text-slate-600">
          Update your visit slot or review upcoming OPD bookings from your appointments workspace.
        </p>
        <Link
          href="/patient/appointments"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-xs font-semibold text-sky-800 transition hover:border-sky-300 hover:bg-sky-50"
        >
          <Headphones className="h-3.5 w-3.5" aria-hidden />
          Manage Appointment
        </Link>
      </div>
    </aside>
  );
}

export default PrescriptionGuidanceRail;
