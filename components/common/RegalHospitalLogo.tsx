'use client';

import { REGAL_HOSPITAL_NODE_LABEL } from '@/lib/regal/brand';

import { HospitalLogo } from '@/components/common/Logo';

export type RegalHospitalLogoProps = {
  /** Tailwind height class, e.g. `h-7`, `h-9` */
  heightClass?: string;
  /** Tailwind width class — defaults to auto width with aspect preserved */
  widthClass?: string;
  /** Show HOSP-01 node badge beside the logo (off by default — logo is the brand mark) */
  showNodeBadge?: boolean;
  /** Optional subtitle under the node badge */
  subtitle?: string;
  className?: string;
  /** High-priority decode for above-the-fold auth shells */
  priority?: boolean;
  /** Wrap logo in a subtle framed container */
  framed?: boolean;
  /** Surface variant — `onDark` for teal / slate sidebars */
  variant?: 'default' | 'onDark';
};

const FRAME_CLASS = {
  default: 'rounded-xl border border-[#EFE7DE] bg-white p-2 shadow-xs',
  onDark: 'rounded-xl border border-white/15 bg-white p-2 shadow-lg shadow-black/20',
} as const;

export function RegalHospitalLogo({
  heightClass = 'h-8',
  widthClass = 'w-auto',
  showNodeBadge = false,
  subtitle,
  className = '',
  priority = true,
  framed = false,
  variant = 'default',
}: RegalHospitalLogoProps) {
  const image = (
    <HospitalLogo
      className={`${heightClass} ${widthClass} object-left`}
      priority={priority}
    />
  );

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {framed ? (
        <div className={`flex shrink-0 items-center justify-center ${FRAME_CLASS[variant]}`}>
          {image}
        </div>
      ) : (
        <div className="flex shrink-0 items-center justify-center">{image}</div>
      )}
      {showNodeBadge ? (
        <div className="hidden min-w-0 flex-col sm:flex">
          <span
            className={`font-mono text-[10px] font-bold uppercase tracking-widest ${
              variant === 'onDark' ? 'text-emerald-200/90' : 'text-[#0D9488]'
            }`}
          >
            {REGAL_HOSPITAL_NODE_LABEL}
          </span>
          {subtitle ? (
            <span className={`text-[10px] ${variant === 'onDark' ? 'text-white/60' : 'text-[#7D6354]'}`}>
              {subtitle}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** Compact logo mark — image only, no node badge. */
export function RegalHospitalLogoMark({
  heightClass = 'h-7',
  framed = true,
  className = '',
  priority = true,
  variant = 'default',
}: {
  heightClass?: string;
  framed?: boolean;
  className?: string;
  priority?: boolean;
  variant?: 'default' | 'onDark';
}) {
  return (
    <RegalHospitalLogo
      heightClass={heightClass}
      showNodeBadge={false}
      framed={framed}
      className={className}
      priority={priority}
      variant={variant}
    />
  );
}
