'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowRight } from 'lucide-react';

import { PATIENT_ROUTES } from '@/lib/patient/navigation';
import { patientClasses } from '@/lib/patient/theme';

type ProfileCompletionGateProps = {
  missingFields: string[];
  title?: string;
  description?: string;
  className?: string;
  compact?: boolean;
};

export function ProfileCompletionGate({
  missingFields,
  title = 'Complete your profile to book OPD visits',
  description = 'Clinical booking and SmartQ token generation require verified demographics, contact details, and emergency information.',
  className = '',
  compact = false,
}: ProfileCompletionGateProps) {
  return (
    <div
      className={`rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950 ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden />
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-sm font-bold">{title}</p>
            {!compact ? (
              <p className="mt-1 text-xs font-medium leading-relaxed text-amber-900/90">
                {description}
              </p>
            ) : null}
          </div>

          {missingFields.length > 0 ? (
            <ul className="list-inside list-disc space-y-0.5 text-xs font-semibold text-amber-900">
              {missingFields.map((field) => (
                <li key={field}>{field}</li>
              ))}
            </ul>
          ) : null}

          <Link
            href={PATIENT_ROUTES.profile}
            className={`inline-flex items-center gap-1.5 ${patientClasses.btnPrimary}`}
          >
            Complete Profile
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}
