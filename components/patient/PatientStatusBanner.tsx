import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, CheckCircle2, Clock, Info } from 'lucide-react';

export type PatientBannerVariant = 'success' | 'info' | 'warning';

const VARIANT_ICON: Record<PatientBannerVariant, LucideIcon> = {
  success: CheckCircle2,
  info: Info,
  warning: Clock,
};

const VARIANT_ICON_COLOR: Record<PatientBannerVariant, string> = {
  success: 'text-patient-success',
  info: 'text-patient-primary',
  warning: 'text-patient-warning',
};

type PatientStatusBannerProps = {
  message: string;
  variant?: PatientBannerVariant;
};

export function PatientStatusBanner({ message, variant = 'info' }: PatientStatusBannerProps) {
  const Icon = VARIANT_ICON[variant];
  return (
    <div
      role="status"
      className="flex items-start gap-2.5 rounded-xl border border-patient-card/80 bg-patient-card/50 px-4 py-2.5 text-sm font-medium text-patient-text"
    >
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${VARIANT_ICON_COLOR[variant]}`} aria-hidden />
      <p>{message}</p>
    </div>
  );
}

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
      ? 'text-patient-success'
      : tone === 'emergency'
        ? 'text-patient-emergency'
        : 'text-patient-text';

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border border-patient-lavender/40 bg-patient-lavender/15 px-4 py-2 text-xs font-semibold tracking-wide ${textClass}`}
    >
      <Icon className="h-4 w-4 shrink-0 text-patient-lavender" aria-hidden />
      <span>{label}</span>
    </div>
  );
}

export const patientVerifiedChipClass =
  'inline-flex items-center gap-1 rounded-full border border-patient-success/40 bg-patient-success/15 px-3 py-1 text-xs font-semibold text-patient-plum';

export const patientStatusChipClass =
  'inline-flex items-center gap-1 rounded-full border border-patient-lavender/40 bg-patient-card/40 px-3 py-1 text-xs font-semibold text-patient-text';

export const patientWarningBannerClass =
  'flex items-start gap-2.5 rounded-xl border border-patient-warning/40 bg-patient-warning/10 px-4 py-2.5 text-sm font-medium text-patient-text';

export const patientEmergencyBannerClass =
  'flex items-start gap-2.5 rounded-xl border border-patient-emergency/40 bg-patient-error/10 px-4 py-2.5 text-sm font-semibold text-patient-emergency';
