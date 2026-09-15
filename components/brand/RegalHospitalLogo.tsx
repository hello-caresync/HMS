import Image from 'next/image';

import { REGAL_HOSPITAL_LOGO_SRC, REGAL_HOSPITAL_NODE_LABEL } from '@/lib/regal/brand';

type RegalHospitalLogoProps = {
  /** Tailwind height class for the logo image, e.g. h-7, h-8 */
  heightClass?: string;
  /** Show HOSP-01 node badge beside the logo */
  showNodeBadge?: boolean;
  /** Optional subtitle under the node badge */
  subtitle?: string;
  className?: string;
};

export function RegalHospitalLogo({
  heightClass = 'h-8',
  showNodeBadge = false,
  subtitle,
  className = '',
}: RegalHospitalLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex items-center justify-center rounded-xl border border-gray-100 bg-white p-2 shadow-xs dark:border-zinc-700 dark:bg-zinc-800">
        <Image
          src={REGAL_HOSPITAL_LOGO_SRC}
          alt="Regal Hospital"
          width={140}
          height={45}
          priority
          className={`${heightClass} w-auto object-contain`}
        />
      </div>
      {showNodeBadge ? (
        <div className="hidden flex-col sm:flex">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400">
            {REGAL_HOSPITAL_NODE_LABEL}
          </span>
          {subtitle ? <span className="text-[10px] text-slate-500">{subtitle}</span> : null}
        </div>
      ) : null}
    </div>
  );
}

/** Compact logo mark without node badge — for dark sidebars and tight headers. */
export function RegalHospitalLogoMark({
  heightClass = 'h-7',
  framed = true,
  className = '',
}: {
  heightClass?: string;
  framed?: boolean;
  className?: string;
}) {
  const image = (
    <Image
      src={REGAL_HOSPITAL_LOGO_SRC}
      alt="Regal Hospital"
      width={140}
      height={45}
      priority
      className={`${heightClass} w-auto object-contain`}
    />
  );

  if (!framed) {
    return <div className={className}>{image}</div>;
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white px-2 shadow-sm ${className}`}
    >
      {image}
    </div>
  );
}
