import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, CheckCircle2, Clock, Info } from 'lucide-react';

export type PatientBannerVariant = 'success' | 'info' | 'warning';

const VARIANT_ICON: Record<PatientBannerVariant, LucideIcon> = {
  success: CheckCircle2,
  info: Info,
  warning: Clock,
};

const VARIANT_ICON_COLOR: Record<PatientBannerVariant, string> = {
  success: 'text-[#15803d]',
  info: 'text-[#f47c8c]',
  warning: 'text-[#8c2b39]',
};

type PatientStatusBannerProps = {
  message: string;
  variant?: PatientBannerVariant;
};

/** Light rose toast / action notice bar for patient modules. */
export function PatientStatusBanner({ message, variant = 'info' }: PatientStatusBannerProps) {
  const Icon = VARIANT_ICON[variant];
  return (
    <div
      role="status"
      className="flex items-start gap-2.5 rounded-xl border border-[#f0d8dc] bg-[#fde8eb]/70 px-4 py-2.5 text-sm font-medium text-[#8c2b39]"
    >
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${VARIANT_ICON_COLOR[variant]}`} aria-hidden />
      <p className="text-[#374151]">{message}</p>
    </div>
  );
}

/** Header row status pill (verified = green text, emergency = deep rose). */
export function PatientHeaderBadge({
  label,
  tone = 'default',
  icon: Icon = CheckCircle2,
}: {
  label: string;
  tone?: 'verified' | 'emergency' | 'default';
  icon?: LucideIcon;
}) {
  const textClass =
    tone === 'verified'
      ? 'text-[#15803d]'
      : tone === 'emergency'
        ? 'text-[#8c2b39]'
        : 'text-[#8c2b39]';

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border border-[#f47c8c]/40 bg-[#fde8eb] px-4 py-2 text-xs font-semibold tracking-wide ${textClass}`}
    >
      <Icon className="h-4 w-4 shrink-0 text-[#f47c8c]" aria-hidden />
      <span>{label}</span>
    </div>
  );
}

export const patientVerifiedChipClass =
  'inline-flex items-center gap-1 rounded-full border border-[#f47c8c]/40 bg-[#fde8eb] px-3 py-1 text-xs font-semibold tracking-wide text-[#15803d]';

export const patientStatusChipClass =
  'inline-flex items-center gap-1 rounded-full border border-[#f47c8c]/40 bg-[#fde8eb] px-3 py-1 text-xs font-semibold tracking-wide text-[#8c2b39]';

export const patientWarningBannerClass =
  'flex items-start gap-2.5 rounded-xl border border-[#f0d8dc] bg-[#fde8eb]/70 px-4 py-2.5 text-sm font-medium';
