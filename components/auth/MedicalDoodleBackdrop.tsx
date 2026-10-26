import type { CSSProperties, ReactNode } from 'react';

type DoodleTint = 'navy' | 'cyan' | 'teal' | 'violet' | 'rose' | 'gold';

const TINT_COLOR: Record<DoodleTint, string> = {
  navy: '#0f3a6b',
  cyan: '#7dd3fc',
  teal: '#5eead4',
  violet: '#d8b4fe',
  rose: '#fda4af',
  gold: '#fde68a',
};

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden>
      {children}
    </svg>
  );
}

function StethoscopeDoodle() {
  return (
    <Svg>
      <path {...stroke} d="M18 12v16a14 14 0 0 0 28 0V12" />
      <circle {...stroke} cx="18" cy="12" r="5" />
      <circle {...stroke} cx="46" cy="12" r="5" />
      <path {...stroke} d="M32 42v6a8 8 0 0 0 8 8h2" />
      <circle {...stroke} cx="46" cy="56" r="5" />
    </Svg>
  );
}

function HeartPulseDoodle() {
  return (
    <Svg>
      <path
        {...stroke}
        d="M32 54s-18-12-22-22c-3-8 3-16 11-16 5 0 8 3 11 8 3-5 6-8 11-8 8 0 14 8 11 16-4 10-22 22-22 22z"
      />
      <path {...stroke} d="M12 32h10l4-8 6 16 4-8h16" />
    </Svg>
  );
}

function AmbulanceDoodle() {
  return (
    <Svg>
      <path {...stroke} d="M6 38h36l14-12H44l-6-8H14v20" />
      <circle {...stroke} cx="18" cy="48" r="6" />
      <circle {...stroke} cx="44" cy="48" r="6" />
      <path {...stroke} d="M28 20v12M22 26h12" />
      <path {...stroke} d="M50 26l8 2v8" />
    </Svg>
  );
}

function SyringeDoodle() {
  return (
    <Svg>
      <path {...stroke} d="M18 46l22-22" />
      <path {...stroke} d="M36 20l8 8" />
      <rect {...stroke} x="12" y="42" width="10" height="10" rx="2" transform="rotate(-45 17 47)" />
      <path {...stroke} d="M42 16l6 6M46 12l6 6" />
      <path {...stroke} d="M16 50l-6 6" />
    </Svg>
  );
}

function ThermometerDoodle() {
  return (
    <Svg>
      <path {...stroke} d="M28 8h8v32a10 10 0 1 1-8 0z" />
      <path {...stroke} d="M32 18v22" />
      <circle {...stroke} cx="32" cy="48" r="6" />
    </Svg>
  );
}

function CapsuleDoodle() {
  return (
    <Svg>
      <path {...stroke} d="M20 40l20-20a10 10 0 0 1 14 14L34 54A10 10 0 0 1 20 40z" />
      <path {...stroke} d="M26 34l14-14" />
    </Svg>
  );
}

function MedkitDoodle() {
  return (
    <Svg>
      <rect {...stroke} x="10" y="22" width="44" height="32" rx="6" />
      <path {...stroke} d="M24 22v-6h16v6" />
      <path {...stroke} d="M32 30v16M24 38h16" />
    </Svg>
  );
}

function ClipboardDoodle() {
  return (
    <Svg>
      <rect {...stroke} x="16" y="12" width="32" height="44" rx="4" />
      <rect {...stroke} x="24" y="8" width="16" height="8" rx="2" />
      <path {...stroke} d="M24 28h16M24 36h16M24 44h10" />
    </Svg>
  );
}

function BandageDoodle() {
  return (
    <Svg>
      <path {...stroke} d="M12 28c0-6 6-12 12-12h16c6 0 12 6 12 12s-6 12-12 12H24c-6 0-12-6-12-12z" />
      <path {...stroke} d="M28 20v16M36 20v16" />
      <circle cx="32" cy="28" r="1.6" fill="currentColor" />
      <circle cx="32" cy="34" r="1.6" fill="currentColor" />
    </Svg>
  );
}

function IvBagDoodle() {
  return (
    <Svg>
      <path {...stroke} d="M24 10h16v6l6 8v24a6 6 0 0 1-6 6H24a6 6 0 0 1-6-6V24l6-8z" />
      <path {...stroke} d="M32 16v8M28 48v10M32 58h8" />
    </Svg>
  );
}

function MonitorDoodle() {
  return (
    <Svg>
      <rect {...stroke} x="8" y="12" width="48" height="32" rx="4" />
      <path {...stroke} d="M16 28h8l4-8 6 16 4-8h10" />
      <path {...stroke} d="M28 44v8h8v-8" />
    </Svg>
  );
}

function OxygenDoodle() {
  return (
    <Svg>
      <rect {...stroke} x="22" y="16" width="20" height="38" rx="8" />
      <path {...stroke} d="M28 16V8h8v8M32 26v16" />
      <path {...stroke} d="M26 10h12" />
    </Svg>
  );
}

function PillsDoodle() {
  return (
    <Svg>
      <rect {...stroke} x="12" y="18" width="40" height="28" rx="6" />
      <circle {...stroke} cx="24" cy="32" r="5" />
      <circle {...stroke} cx="40" cy="32" r="5" />
      <path {...stroke} d="M24 32h16" />
    </Svg>
  );
}

function ScissorsDoodle() {
  return (
    <Svg>
      <circle {...stroke} cx="16" cy="20" r="7" />
      <circle {...stroke} cx="16" cy="44" r="7" />
      <path {...stroke} d="M22 24l30 20M22 40L52 20" />
    </Svg>
  );
}

function GlovesDoodle() {
  return (
    <Svg>
      <path
        {...stroke}
        d="M22 54V28c0-4 4-8 8-8h4l2-10c1-3 6-3 7 0l1 10 4-8c1-3 6-2 6 2v8l3-4c2-3 7-1 6 3v27a10 10 0 0 1-10 10H32a10 10 0 0 1-10-10z"
      />
    </Svg>
  );
}

const DOODLES = [
  StethoscopeDoodle,
  HeartPulseDoodle,
  AmbulanceDoodle,
  SyringeDoodle,
  ThermometerDoodle,
  CapsuleDoodle,
  MedkitDoodle,
  ClipboardDoodle,
  BandageDoodle,
  IvBagDoodle,
  MonitorDoodle,
  OxygenDoodle,
  PillsDoodle,
  ScissorsDoodle,
  GlovesDoodle,
];

type ScatterSpot = {
  icon: number;
  left: string;
  top: string;
  size: number;
  rotate: number;
  opacity: number;
};

/** Fixed layout so doodles don't jump on re-render. */
const SPOTS: ScatterSpot[] = [
  { icon: 0, left: '3%', top: '8%', size: 58, rotate: -18, opacity: 0.55 },
  { icon: 1, left: '88%', top: '6%', size: 64, rotate: 14, opacity: 0.5 },
  { icon: 2, left: '74%', top: '18%', size: 72, rotate: -8, opacity: 0.45 },
  { icon: 3, left: '12%', top: '22%', size: 50, rotate: 22, opacity: 0.5 },
  { icon: 4, left: '42%', top: '4%', size: 46, rotate: -12, opacity: 0.4 },
  { icon: 5, left: '58%', top: '10%', size: 42, rotate: 28, opacity: 0.45 },
  { icon: 6, left: '6%', top: '48%', size: 62, rotate: 8, opacity: 0.48 },
  { icon: 7, left: '90%', top: '42%', size: 54, rotate: -16, opacity: 0.5 },
  { icon: 8, left: '28%', top: '12%', size: 44, rotate: -24, opacity: 0.42 },
  { icon: 9, left: '82%', top: '62%', size: 58, rotate: 12, opacity: 0.46 },
  { icon: 10, left: '2%', top: '72%', size: 68, rotate: -6, opacity: 0.44 },
  { icon: 11, left: '18%', top: '78%', size: 56, rotate: 16, opacity: 0.5 },
  { icon: 12, left: '48%', top: '82%', size: 48, rotate: -10, opacity: 0.4 },
  { icon: 13, left: '70%', top: '78%', size: 52, rotate: 20, opacity: 0.46 },
  { icon: 14, left: '86%', top: '82%', size: 60, rotate: -14, opacity: 0.48 },
  { icon: 1, left: '38%', top: '70%', size: 40, rotate: 32, opacity: 0.35 },
  { icon: 0, left: '62%', top: '58%', size: 46, rotate: -22, opacity: 0.38 },
  { icon: 3, left: '50%', top: '20%', size: 38, rotate: 10, opacity: 0.34 },
  { icon: 5, left: '22%', top: '58%', size: 36, rotate: -30, opacity: 0.4 },
  { icon: 2, left: '8%', top: '32%', size: 44, rotate: 6, opacity: 0.36 },
  { icon: 7, left: '78%', top: '32%', size: 40, rotate: -20, opacity: 0.38 },
  { icon: 8, left: '34%', top: '86%', size: 42, rotate: 18, opacity: 0.36 },
  { icon: 11, left: '94%', top: '24%', size: 36, rotate: 24, opacity: 0.4 },
  { icon: 6, left: '94%', top: '70%', size: 42, rotate: -8, opacity: 0.34 },
];

export function MedicalDoodleBackdrop({
  tint,
  intensity = 0.7,
}: {
  tint: DoodleTint;
  intensity?: number;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
      {SPOTS.map((spot, index) => {
        const Icon = DOODLES[spot.icon % DOODLES.length];
        const style: CSSProperties = {
          left: spot.left,
          top: spot.top,
          width: spot.size,
          height: spot.size,
          color: TINT_COLOR[tint],
          opacity: spot.opacity * intensity,
          transform: `translate(-50%, -50%) rotate(${spot.rotate}deg)`,
        };
        return (
          <span key={`${spot.left}-${spot.top}-${index}`} className="absolute" style={style}>
            <Icon />
          </span>
        );
      })}
    </div>
  );
}
