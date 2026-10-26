'use client';

import { motion } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  Brain,
  Building2,
  Check,
  Globe2,
  LockKeyhole,
  ShieldCheck,
  Stethoscope,
  TrendingUp,
  UsersRound,
} from 'lucide-react';

import { useCountUp } from '../useCountUp';

const STATS = [
  { key: 'hospitals', value: 24, label: 'HOSPITALS', sub: 'Across network', icon: Building2, accent: 'text-[#3B82F6]', glow: 'shadow-[0_0_16px_rgba(59,130,246,0.3)]' },
  { key: 'doctors', value: 184, label: 'DOCTORS', sub: 'Active today', icon: Stethoscope, accent: 'text-[#8B5CF6]', glow: 'shadow-[0_0_16px_rgba(139,92,246,0.3)]' },
  { key: 'patients', value: 12420, label: 'PATIENTS', sub: 'Across all hospitals', icon: UsersRound, accent: 'text-[#22D3EE]', glow: 'shadow-[0_0_16px_rgba(34,211,238,0.25)]' },
] as const;

const WIDGETS = [
  { id: 'opd', icon: Activity, label: 'OPD QUEUE', value: '42', sub: 'Patients Waiting', trail: ArrowRight, delay: 0 },
  { id: 'ai', icon: Brain, label: 'AI ENGINE', value: '98.7%', sub: 'Accuracy', trail: TrendingUp, delay: 0.15 },
  { id: 'sec', icon: ShieldCheck, label: 'SECURITY', value: 'Protected', sub: 'System Safe', trail: Check, delay: 0.3 },
] as const;

const NETWORK_LINES = [
  [18, 42, 38, 28], [38, 28, 58, 52], [58, 52, 78, 34], [58, 52, 62, 68],
];
const NETWORK_NODES = [
  { x: 18, y: 42 }, { x: 38, y: 28 }, { x: 58, y: 52 }, { x: 78, y: 34 }, { x: 62, y: 68 },
];

const easeOut = [0.22, 1, 0.36, 1] as const;

function StatCard({ stat, index, reducedMotion }: { stat: (typeof STATS)[number]; index: number; reducedMotion: boolean }) {
  const count = useCountUp(stat.value, 1200 + index * 200, !reducedMotion);
  const Icon = stat.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.65 + index * 0.08, duration: 0.55, ease: easeOut }}
      className="rounded-xl border border-white/10 bg-white/[0.055] p-[clamp(0.6rem,1.2vh,0.85rem)] backdrop-blur-sm"
    >
      <div className={`mb-1.5 inline-flex rounded-lg bg-white/5 p-1.5 ${stat.glow}`}>
        <Icon className={`h-3.5 w-3.5 ${stat.accent}`} aria-hidden="true" />
      </div>
      <p className="text-[clamp(1rem,1.8vw,1.25rem)] font-black text-[#F8FAFC]">{count.toLocaleString()}</p>
      <p className="text-[9px] font-bold tracking-[0.14em] text-[#94A3B8]">{stat.label}</p>
      <p className="text-[9px] text-[#64748B]">{stat.sub}</p>
    </motion.div>
  );
}

export default function CommandCenterPanel({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <section
      className="relative hidden min-h-0 overflow-hidden lg:flex lg:w-[55%]"
      style={{
        background:
          'radial-gradient(circle at 70% 20%, rgba(59,130,246,0.25), transparent 35%), linear-gradient(135deg, #050816, #0A1028)',
      }}
      aria-label="NEXORA command center"
    >
      <motion.div
        className="pointer-events-none absolute -left-24 top-16 h-64 w-64 rounded-full bg-[#3B82F6]/20 blur-[90px]"
        animate={reducedMotion ? undefined : { x: [0, 20, 0], y: [0, 12, 0] }}
        transition={reducedMotion ? undefined : { duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden="true"
      />
      <motion.div
        className="pointer-events-none absolute bottom-20 left-1/3 h-56 w-56 rounded-full bg-[#8B5CF6]/15 blur-[80px]"
        animate={reducedMotion ? undefined : { scale: [1, 1.06, 1] }}
        transition={reducedMotion ? undefined : { duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-28 bg-gradient-to-r from-transparent via-[#3B82F6]/15 to-[#8B5CF6]/10 blur-2xl" aria-hidden="true" />

      <motion.div
        className="pointer-events-none absolute -right-6 top-1/4 opacity-[0.06]"
        animate={reducedMotion ? undefined : { rotate: [0, 4, 0], y: [0, -8, 0] }}
        transition={reducedMotion ? undefined : { duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden="true"
      >
        <svg width="160" height="160" viewBox="0 0 180 180" fill="none">
          <path d="M90 12 L150 42 V88 C150 128 122 152 90 168 C58 152 30 128 30 88 V42 Z" stroke="#22D3EE" strokeWidth="2" />
          <path d="M90 48 V120 M66 72 H114" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </motion.div>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col p-[clamp(0.85rem,2vh,1.75rem)] pl-[clamp(1rem,2.5vw,2.25rem)]">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5, ease: easeOut }} className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/10">
            <Activity className="h-4 w-4 text-white" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-black tracking-[0.14em] text-white">NEXORA</p>
            <p className="text-[9px] font-semibold tracking-[0.28em] text-[#22D3EE]">HEALTHCARE OS</p>
          </div>
        </motion.div>

        <div className="flex min-h-0 flex-1 flex-col justify-center py-[clamp(0.25rem,1vh,0.75rem)]">
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5, ease: easeOut }} className="text-[10px] font-bold tracking-[0.24em] text-[#94A3B8]">
            WELCOME TO NEXORA
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.48, duration: 0.55, ease: easeOut }} className="mt-1 text-[clamp(1.5rem,2.4vw,2.25rem)] font-black leading-[0.95] text-white">
            ADMIN
            <br />
            <span className="bg-gradient-to-r from-[#22D3EE] via-[#3B82F6] to-[#8B5CF6] bg-clip-text text-transparent">COMMAND CENTER</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.5, ease: easeOut }} className="mt-2 max-w-sm text-[clamp(0.7rem,1vw,0.8125rem)] leading-relaxed text-[#94A3B8]">
            One intelligent platform to manage, monitor and optimize your entire healthcare ecosystem.
          </motion.p>

          <div className="mt-[clamp(0.5rem,1.5vh,1rem)] grid grid-cols-3 gap-2">
            {STATS.map((s, i) => (
              <StatCard key={s.key} stat={s} index={i} reducedMotion={reducedMotion} />
            ))}
          </div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.55, ease: easeOut }} className="mt-2 rounded-xl border border-white/10 bg-white/[0.04] p-2.5">
            <div className="mb-1.5 flex items-center justify-between text-[9px] font-bold tracking-[0.12em] text-[#94A3B8]">
              <span>LIVE SYSTEM SIGNAL</span>
              <span className="font-mono text-[#10B981]">72 BPM ●</span>
            </div>
            <div
              className="relative h-[clamp(2.5rem,4.5vh,3rem)] overflow-hidden rounded-lg border border-white/5"
              style={{
                backgroundImage: 'linear-gradient(to right,rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(to bottom,rgba(255,255,255,0.04) 1px,transparent 1px)',
                backgroundSize: '16px 16px',
                backgroundColor: 'rgba(5,8,22,0.5)',
              }}
            >
              <motion.div className="absolute inset-y-0 flex w-[200%] items-center" animate={reducedMotion ? undefined : { x: ['0%', '-50%'] }} transition={reducedMotion ? undefined : { duration: 4.2, repeat: Infinity, ease: 'linear' }}>
                {[0, 1].map((seg) => (
                  <svg key={seg} className="h-full w-1/2 shrink-0" viewBox="0 0 500 50" fill="none" aria-hidden="true">
                    <path d="M 0 25 L 120 25 L 130 10 L 140 40 L 150 5 L 160 35 L 170 25 L 280 25 L 290 10 L 300 40 L 310 5 L 320 35 L 330 25 L 500 25" stroke="#22D3EE" strokeWidth="1.75" strokeLinecap="round" className="drop-shadow-[0_0_5px_rgba(34,211,238,0.45)]" />
                  </svg>
                ))}
              </motion.div>
              {!reducedMotion && (
                <motion.div className="absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#22D3EE] shadow-[0_0_10px_rgba(34,211,238,0.8)]" animate={{ left: ['6%', '94%'] }} transition={{ duration: 4.2, repeat: Infinity, ease: 'linear' }} />
              )}
            </div>
          </motion.div>

          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {WIDGETS.map((w, i) => {
              const Icon = w.icon;
              const Trail = w.trail;
              return (
                <motion.div
                  key={w.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 + w.delay, duration: 0.5, ease: easeOut }}
                  whileHover={reducedMotion ? undefined : { y: -2 }}
                  className="rounded-lg border border-white/10 bg-white/[0.045] p-2"
                >
                  <motion.div animate={reducedMotion ? undefined : { y: [0, -6, 0] }} transition={reducedMotion ? undefined : { duration: 5 + i, repeat: Infinity, ease: 'easeInOut', delay: w.delay }}>
                    <div className="flex items-center justify-between">
                      <Icon className="h-3 w-3 text-[#3B82F6]" aria-hidden="true" />
                      <Trail className="h-2.5 w-2.5 text-[#64748B]" aria-hidden="true" />
                    </div>
                    <p className="mt-1 text-[8px] font-bold tracking-[0.1em] text-[#94A3B8]">{w.label}</p>
                    <p className="text-xs font-bold text-white">{w.value}</p>
                    <p className="text-[8px] text-[#64748B]">{w.sub}</p>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="flex items-end justify-between gap-3">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 0.5 }} className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[9px] text-[#94A3B8] xl:flex">
            <LockKeyhole className="h-3 w-3 text-[#10B981]" aria-hidden="true" />
            <div>
              <p className="font-semibold text-[#10B981]">Encrypted Connection</p>
              <p>256-bit SSL secured</p>
            </div>
          </motion.div>

          <div className="hidden opacity-50 xl:block" aria-hidden="true">
            <p className="mb-1 flex items-center gap-1 text-[8px] font-bold tracking-[0.14em] text-[#94A3B8]">
              <Globe2 className="h-2.5 w-2.5" /> GLOBAL NETWORK
            </p>
            <svg width="140" height="48" viewBox="0 0 220 80">
              {NETWORK_LINES.map(([x1, y1, x2, y2], i) => (
                <line key={i} x1={x1 * 2.2} y1={y1} x2={x2 * 2.2} y2={y2} stroke="rgba(59,130,246,0.25)" strokeWidth="1" />
              ))}
              {NETWORK_NODES.map((n, i) => (
                <g key={i}>
                  {!reducedMotion && (
                    <motion.circle
                      cx={n.x * 2.2}
                      cy={n.y}
                      r="5"
                      fill="#22D3EE"
                      initial={{ opacity: 0.15, scale: 0.6 }}
                      animate={{ opacity: [0.15, 0.35, 0.15], scale: [0.6, 1, 0.6] }}
                      transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.2 }}
                    />
                  )}
                  <circle cx={n.x * 2.2} cy={n.y} r="2.5" fill="#22D3EE" opacity="0.7" />
                </g>
              ))}
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
