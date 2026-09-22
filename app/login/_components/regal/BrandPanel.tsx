'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Activity, Building2, Network, Users } from 'lucide-react';

import { HospitalLogo } from '@/components/common/Logo';

import { useCountUp } from '../useCountUp';

const FLOATING_STATS = [
  {
    id: 'ops',
    icon: Building2,
    label: 'Hospital Operations',
    value: 98.6,
    suffix: '%',
    sub: 'Operational Health',
    className: 'top-[14%] right-[6%]',
    delay: 0,
    isPercent: true,
  },
  {
    id: 'patients',
    icon: Users,
    label: 'Active Patients',
    value: 1284,
    suffix: '',
    sub: 'Real-time monitoring',
    className: 'bottom-[32%] left-[5%]',
    delay: 0.8,
    isPercent: false,
  },
  {
    id: 'network',
    icon: Network,
    label: 'Clinical Network',
    value: 0,
    display: '24 / 7',
    sub: 'Connected care',
    className: 'bottom-[16%] right-[8%]',
    delay: 1.6,
    isPercent: false,
  },
] as const;

function HealthcareVisualization({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <motion.div
        className="absolute -left-16 top-1/4 h-56 w-56 rounded-full bg-[#0EA5A4]/15 blur-[70px]"
        animate={reducedMotion ? undefined : { x: [0, 18, 0], y: [0, 10, 0] }}
        transition={reducedMotion ? undefined : { duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-1/4 right-0 h-48 w-48 rounded-full bg-[#38BDF8]/12 blur-[60px]"
        animate={reducedMotion ? undefined : { x: [0, -12, 0] }}
        transition={reducedMotion ? undefined : { duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(56,189,248,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(56,189,248,0.06) 1px, transparent 1px)',
          backgroundSize: '3rem 3rem',
          maskImage: 'radial-gradient(ellipse 80% 70% at 40% 50%, #000 50%, transparent 100%)',
        }}
      />

      <svg className="absolute left-1/2 top-1/2 h-[min(42vh,320px)] w-[min(42vh,320px)] -translate-x-1/2 -translate-y-1/2 opacity-[0.08]" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="78" fill="none" stroke="#38BDF8" strokeWidth="0.5" />
        <circle cx="100" cy="100" r="52" fill="none" stroke="#0EA5A4" strokeWidth="0.5" />
        <path d="M100 28 L100 172 M28 100 L172 100" stroke="#0EA5A4" strokeWidth="0.5" opacity="0.6" />
      </svg>

      <div className="absolute bottom-[clamp(4rem,18vh,8rem)] left-[clamp(1rem,4vw,2.5rem)] right-[clamp(1rem,4vw,2.5rem)]">
        <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 backdrop-blur-sm">
          <div className="relative h-[clamp(2.5rem,5vh,3.5rem)] overflow-hidden">
            <motion.div
              className="absolute inset-y-0 flex w-[200%] items-center"
              animate={reducedMotion ? undefined : { x: ['0%', '-50%'] }}
              transition={reducedMotion ? undefined : { duration: 8, repeat: Infinity, ease: 'linear' }}
            >
              {[0, 1].map((seg) => (
                <svg key={seg} className="h-full w-1/2 shrink-0" viewBox="0 0 500 50" fill="none">
                  <path
                    d="M 0 25 L 120 25 L 130 10 L 140 40 L 150 5 L 160 35 L 170 25 L 280 25 L 290 10 L 300 40 L 310 5 L 320 35 L 330 25 L 500 25"
                    stroke="#0EA5A4"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    className="opacity-70 drop-shadow-[0_0_4px_rgba(14,165,164,0.4)]"
                  />
                </svg>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      {[
        { x: '22%', y: '38%' }, { x: '48%', y: '52%' }, { x: '68%', y: '40%' }, { x: '36%', y: '62%' },
      ].map((node, i) => (
        <motion.span
          key={i}
          className="absolute h-1.5 w-1.5 rounded-full bg-[#38BDF8]"
          style={{ left: node.x, top: node.y, opacity: 0.5 }}
          animate={reducedMotion ? undefined : { opacity: [0.3, 0.8, 0.3], scale: [1, 1.2, 1] }}
          transition={reducedMotion ? undefined : { duration: 3 + i * 0.4, repeat: Infinity }}
        />
      ))}
    </div>
  );
}

function FloatingStatCard({
  stat,
  reducedMotion,
}: {
  stat: (typeof FLOATING_STATS)[number];
  reducedMotion: boolean;
}) {
  const Icon = stat.icon;
  const animatedValue = useCountUp(stat.isPercent ? Math.round(stat.value * 10) : stat.value, 1400, !reducedMotion && stat.id !== 'network');
  const displayValue =
    stat.id === 'network'
      ? stat.display
      : stat.isPercent
        ? `${(animatedValue / 10).toFixed(1)}${stat.suffix}`
        : animatedValue.toLocaleString();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 + stat.delay, duration: 0.5 }}
      className={`absolute hidden md:block ${stat.className}`}
    >
      <motion.div
        animate={reducedMotion ? undefined : { y: [0, -6, 0] }}
        transition={reducedMotion ? undefined : { duration: 5 + stat.delay, repeat: Infinity, ease: 'easeInOut' }}
        className="w-[clamp(9rem,14vw,11rem)] rounded-xl border border-white/10 bg-white/[0.06] p-3 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-md"
      >
        <div className="mb-1.5 flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 text-[#0EA5A4]" aria-hidden="true" />
          <span className="text-[9px] font-semibold tracking-wide text-white/60">{stat.label}</span>
        </div>
        <p className="text-lg font-bold text-white">{displayValue}</p>
        <p className="mt-0.5 text-[9px] text-[#38BDF8]/80">{stat.sub}</p>
      </motion.div>
    </motion.div>
  );
}

export default function BrandPanel({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <section
      className="relative hidden min-h-0 overflow-hidden lg:flex lg:w-[58%]"
      style={{ background: 'linear-gradient(160deg, #07111F 0%, #0D1B2A 100%)' }}
      aria-label="Regal Hospital brand experience"
    >
      <HealthcareVisualization reducedMotion={reducedMotion} />

      {FLOATING_STATS.map((stat) => (
        <FloatingStatCard key={stat.id} stat={stat} reducedMotion={reducedMotion} />
      ))}

      <div className="relative z-10 flex min-h-0 flex-1 flex-col justify-between p-[clamp(1rem,2.5vh,2rem)] pl-[clamp(1.25rem,3vw,2.5rem)]">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <HospitalLogo className="h-10 w-auto sm:h-12" priority />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.55 }}
          className="max-w-md"
        >
          <h1 className="text-[clamp(1.35rem,2.2vw,2rem)] font-semibold leading-snug text-white">
            Intelligent Healthcare.
            <br />
            <span className="bg-gradient-to-r from-[#0EA5A4] to-[#38BDF8] bg-clip-text text-transparent">
              Connected Care.
            </span>
          </h1>
          <p className="mt-[clamp(0.5rem,1.5vh,1rem)] text-[clamp(0.75rem,1.1vw,0.875rem)] leading-relaxed text-white/55">
            One secure command center for managing patients, clinicians, operations and hospital performance.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex items-center gap-2 text-[10px] text-white/40"
        >
          <Activity className="h-3 w-3 text-[#0EA5A4]" aria-hidden="true" />
          <span>Hospital Intelligence Network</span>
        </motion.div>
      </div>
    </section>
  );
}
