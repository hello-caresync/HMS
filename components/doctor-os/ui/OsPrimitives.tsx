'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

import { useOsColors } from '@/lib/doctor-os/store';

export function OsPage({ children, className = '' }: { children: ReactNode; className?: string }) {
  const c = useOsColors();
  return (
    <div className={`min-h-full ${className}`} style={{ backgroundColor: c.bg, color: c.text }}>
      {children}
    </div>
  );
}

export function OsGlass({
  children,
  className = '',
  hover,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}) {
  const c = useOsColors();
  const Comp = hover || onClick ? motion.div : motion.div;
  return (
    <Comp
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      whileHover={hover || onClick ? { y: -2, transition: { duration: 0.2 } } : undefined}
      className={`rounded-2xl border backdrop-blur-xl ${className}`}
      style={{
        backgroundColor: c.glass,
        borderColor: c.border,
        boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
      }}
    >
      {children}
    </Comp>
  );
}

export function OsWidget({
  title,
  subtitle,
  action,
  children,
  span = 1,
  accent,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  span?: 1 | 2 | 3 | 4;
  accent?: 'default' | 'live' | 'critical' | 'ai';
}) {
  const c = useOsColors();
  const accentBorder =
    accent === 'live' ? c.success : accent === 'critical' ? c.critical : accent === 'ai' ? '#8B5CF6' : 'transparent';

  return (
    <OsGlass
      className={`col-span-1 flex flex-col overflow-hidden ${span === 2 ? 'md:col-span-2' : ''} ${span === 3 ? 'md:col-span-3' : ''} ${span === 4 ? 'md:col-span-4' : ''}`}
      hover
    >
      <div
        className="flex items-start justify-between gap-2 border-b px-4 py-3"
        style={{ borderColor: c.border, borderLeftWidth: accent ? 3 : 0, borderLeftColor: accentBorder }}
      >
        <div>
          <h3 className="text-[13px] font-semibold tracking-[-0.01em]">{title}</h3>
          {subtitle && <p className="mt-0.5 text-[11px]" style={{ color: c.textSecondary }}>{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="flex-1 p-4">{children}</div>
    </OsGlass>
  );
}

export function OsBtn({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  href,
  disabled,
  className = '',
}: {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'critical';
  size?: 'sm' | 'md';
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  className?: string;
}) {
  const c = useOsColors();
  const pad = size === 'sm' ? 'px-3 py-1.5 text-[12px]' : 'px-4 py-2 text-[13px]';
  const base = `inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all ${pad} ${className}`;

  const styles: Record<string, React.CSSProperties> = {
    primary: { backgroundColor: c.accent, color: '#fff' },
    secondary: { backgroundColor: c.muted, color: c.text, border: `1px solid ${c.border}` },
    ghost: { backgroundColor: 'transparent', color: c.textSecondary },
    critical: { backgroundColor: c.critical, color: '#fff' },
  };

  if (href) {
    return (
      <a href={href} className={base} style={styles[variant]}>
        {children}
      </a>
    );
  }

  return (
    <button type="button" disabled={disabled} onClick={onClick} className={`${base} disabled:opacity-50`} style={styles[variant]}>
      {children}
    </button>
  );
}

export function OsRing({ value, max, label, color }: { value: number; max: number; label: string; color?: string }) {
  const c = useOsColors();
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const stroke = color ?? c.accent;
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="72" height="72" className="-rotate-90">
        <circle cx="36" cy="36" r={r} fill="none" stroke={c.muted} strokeWidth="6" />
        <motion.circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <span className="text-[18px] font-bold tabular-nums" style={{ color: c.text }}>{value}</span>
      <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: c.textSecondary }}>{label}</span>
    </div>
  );
}

export function OsCounter({ value, suffix = '' }: { value: number | string; suffix?: string }) {
  const c = useOsColors();
  return (
    <motion.span
      key={String(value)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-[28px] font-bold tabular-nums tracking-[-0.03em]"
      style={{ color: c.text }}
    >
      {value}{suffix}
    </motion.span>
  );
}

export function OsTimeline({ items }: { items: { time: string; title: string; meta?: string; dot?: string }[] }) {
  const c = useOsColors();
  return (
    <ul className="space-y-0">
      {items.map((item, i) => (
        <li key={i} className="relative flex gap-3 pb-4 last:pb-0">
          {i < items.length - 1 && (
            <span className="absolute left-[5px] top-3 h-full w-px" style={{ backgroundColor: c.border }} />
          )}
          <span
            className="relative z-10 mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: item.dot ?? c.accent }}
          />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium tabular-nums" style={{ color: c.textTertiary ?? c.textSecondary }}>{item.time}</p>
            <p className="text-[13px] font-semibold">{item.title}</p>
            {item.meta && <p className="text-[11px]" style={{ color: c.textSecondary }}>{item.meta}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function OsSkeleton({ className = 'h-24' }: { className?: string }) {
  const c = useOsColors();
  return (
    <div
      className={`animate-pulse rounded-2xl ${className}`}
      style={{ backgroundColor: c.muted }}
    />
  );
}

export function OsEmpty({ title, description, icon: Icon }: { title: string; description: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }> }) {
  const c = useOsColors();
  return (
    <div className="flex flex-col items-center py-8 text-center">
      <span className="rounded-2xl p-3" style={{ backgroundColor: c.muted, color: c.textSecondary }}>
        <Icon className="h-6 w-6" style={{ color: c.textSecondary }} />
      </span>
      <p className="mt-3 text-[14px] font-semibold">{title}</p>
      <p className="mt-1 max-w-xs text-[12px]" style={{ color: c.textSecondary }}>{description}</p>
    </div>
  );
}

export function OsBadge({
  children,
  tone = 'default',
}: {
  children: ReactNode;
  tone?: 'default' | 'success' | 'warning' | 'critical' | 'info';
}) {
  const c = useOsColors();
  const tones: Record<string, React.CSSProperties> = {
    default: { backgroundColor: c.muted, color: c.textSecondary },
    success: { backgroundColor: `${c.success}20`, color: c.success },
    warning: { backgroundColor: `${c.warning}20`, color: c.warning },
    critical: { backgroundColor: `${c.critical}20`, color: c.critical },
    info: { backgroundColor: c.accentSoft, color: c.accent },
  };
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide" style={tones[tone]}>
      {children}
    </span>
  );
}

export function OsSegment({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  const c = useOsColors();
  return (
    <div className="inline-flex rounded-xl p-1" style={{ backgroundColor: c.muted }}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className="rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all"
          style={
            value === o.id
              ? { backgroundColor: c.surface, color: c.text, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
              : { color: c.textSecondary }
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
