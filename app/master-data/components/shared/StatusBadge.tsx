type StatusBadgeProps = {
  label: string;
  tone?: 'success' | 'warning' | 'danger' | 'neutral' | 'info';
};

const TONE_CLASSES: Record<NonNullable<StatusBadgeProps['tone']>, string> = {
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-700 ring-amber-200',
  danger: 'bg-rose-50 text-rose-700 ring-rose-200',
  neutral: 'bg-slate-100 text-slate-800 ring-slate-200',
  info: 'bg-sky-50 text-sky-700 ring-sky-200',
};

export default function StatusBadge({ label, tone = 'neutral' }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset ${TONE_CLASSES[tone]}`}
    >
      {label}
    </span>
  );
}
