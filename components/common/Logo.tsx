import Image from 'next/image';
import Link from 'next/link';

import { REGAL_HOSPITAL_LOGO_SRC } from '@/lib/regal/brand';

export interface HospitalLogoProps {
  className?: string;
  href?: string;
  priority?: boolean;
}

export function HospitalLogo({
  className = 'h-9 w-auto',
  href,
  priority = false,
}: HospitalLogoProps) {
  const logoImage = (
    <Image
      src={REGAL_HOSPITAL_LOGO_SRC}
      alt="Regal Hospital Logo"
      width={260}
      height={80}
      priority={priority}
      className={`object-contain ${className}`}
    />
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center">
        {logoImage}
      </Link>
    );
  }

  return logoImage;
}
