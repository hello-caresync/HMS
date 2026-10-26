'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import {
  Activity,
  Crosshair,
  HeartPulse,
  Move,
  Orbit,
  Pill,
  Radio,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Syringe,
} from 'lucide-react';

type AuthLoginShellProps = {
  title: string;
  subtitle: string;
  activeGlow: string;
  activeTagColor: string;
  activeTitle: string;
  children: ReactNode;
};

type FloatingParticle = {
  id: number;
  Icon: ComponentType<{ className?: string; style?: CSSProperties }>;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  glow: string;
};

const INITIAL_PARTICLES: FloatingParticle[] = [
  {
    id: 1,
    Icon: Stethoscope,
    x: 15,
    y: 20,
    vx: 0.04,
    vy: 0.03,
    size: 28,
    color: 'text-emerald-400',
    glow: 'rgba(52, 211, 153, 0.4)',
  },
  {
    id: 2,
    Icon: HeartPulse,
    x: 80,
    y: 15,
    vx: -0.03,
    vy: 0.05,
    size: 30,
    color: 'text-rose-400',
    glow: 'rgba(251, 113, 133, 0.4)',
  },
  {
    id: 3,
    Icon: Syringe,
    x: 12,
    y: 75,
    vx: 0.05,
    vy: -0.04,
    size: 26,
    color: 'text-cyan-400',
    glow: 'rgba(34, 211, 238, 0.4)',
  },
  {
    id: 4,
    Icon: Pill,
    x: 85,
    y: 80,
    vx: -0.04,
    vy: -0.03,
    size: 28,
    color: 'text-fuchsia-400',
    glow: 'rgba(232, 121, 249, 0.4)',
  },
  {
    id: 5,
    Icon: Sparkles,
    x: 50,
    y: 10,
    vx: -0.05,
    vy: 0.02,
    size: 22,
    color: 'text-amber-400',
    glow: 'rgba(251, 191, 36, 0.4)',
  },
  {
    id: 6,
    Icon: ShieldAlert,
    x: 88,
    y: 48,
    vx: -0.03,
    vy: -0.04,
    size: 24,
    color: 'text-orange-400',
    glow: 'rgba(251, 146, 60, 0.4)',
  },
  {
    id: 7,
    Icon: Orbit,
    x: 10,
    y: 45,
    vx: 0.04,
    vy: 0.03,
    size: 26,
    color: 'text-teal-400',
    glow: 'rgba(45, 212, 191, 0.4)',
  },
  {
    id: 8,
    Icon: Activity,
    x: 70,
    y: 88,
    vx: -0.04,
    vy: 0.02,
    size: 24,
    color: 'text-indigo-400',
    glow: 'rgba(129, 140, 248, 0.4)',
  },
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export default function AuthLoginShell({
  title,
  subtitle,
  activeGlow,
  activeTagColor,
  activeTitle,
  children,
}: AuthLoginShellProps) {
  const podRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, podX: 0, podY: 0 });
  const particlesRef = useRef<FloatingParticle[]>(INITIAL_PARTICLES.map((p) => ({ ...p })));
  const cursorRef = useRef({ x: 0, y: 0 });
  const podPosRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);

  const [podPos, setPodPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState<FloatingParticle[]>(INITIAL_PARTICLES);
  const [isLanded, setIsLanded] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLanded(true), 150);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    podPosRef.current = podPos;
  }, [podPos]);

  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  useEffect(() => {
    let animId = 0;

    const tick = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const pod = podPosRef.current;
      const pointer = cursorRef.current;

      const podCenterX = 50 + (pod.x / w) * 100;
      const podCenterY = 50 + (pod.y / h) * 100;

      const next = particlesRef.current.map((particle) => {
        let { x, y, vx, vy } = particle;

        x += vx;
        y += vy;

        if (x <= 5 || x >= 95) {
          vx = -vx;
          x = clamp(x, 5, 95);
        }
        if (y <= 5 || y >= 95) {
          vy = -vy;
          y = clamp(y, 5, 95);
        }

        const toPodX = podCenterX - x;
        const toPodY = podCenterY - y;
        const podDist = Math.hypot(toPodX, toPodY) || 0.001;

        if (podDist > 18 && podDist < 42) {
          vx += (toPodX / podDist) * 0.0018;
          vy += (toPodY / podDist) * 0.0018;
          vx += (-toPodY / podDist) * 0.0012;
          vy += (toPodX / podDist) * 0.0012;
        } else if (podDist >= 42) {
          vx += (toPodX / podDist) * 0.0008;
          vy += (toPodY / podDist) * 0.0008;
        }

        const px = (x / 100) * w;
        const py = (y / 100) * h;
        const toCursorX = px - pointer.x;
        const toCursorY = py - pointer.y;
        const cursorDist = Math.hypot(toCursorX, toCursorY);

        if (cursorDist < 130) {
          const push = (130 - cursorDist) / 130;
          vx += (toCursorX / (cursorDist || 1)) * push * 0.06;
          vy += (toCursorY / (cursorDist || 1)) * push * 0.06;
        }

        vx *= 0.985;
        vy *= 0.985;

        return { ...particle, x, y, vx, vy };
      });

      particlesRef.current = next;
      setParticles(next);
      animId = window.requestAnimationFrame(tick);
    };

    animId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(animId);
  }, []);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: event.clientX,
      mouseY: event.clientY,
      podX: podPos.x,
      podY: podPos.y,
    };
  };

  const handlePointerMove = useCallback((event: PointerEvent) => {
    cursorRef.current = { x: event.clientX, y: event.clientY };
    setCursor({ x: event.clientX, y: event.clientY });

    if (isDraggingRef.current) {
      const deltaX = event.clientX - dragStartRef.current.mouseX;
      const deltaY = event.clientY - dragStartRef.current.mouseY;
      const newPos = {
        x: dragStartRef.current.podX + deltaX,
        y: dragStartRef.current.podY + deltaY,
      };
      podPosRef.current = newPos;
      setPodPos(newPos);
      setTilt({
        x: clamp(-deltaY * 0.08, -15, 15),
        y: clamp(deltaX * 0.08, -15, 15),
      });
      setParallax({ x: 0, y: 0 });
      return;
    }

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    setParallax({
      x: clamp(-((event.clientY - centerY) / centerY) * 8, -8, 8),
      y: clamp(((event.clientX - centerX) / centerX) * 8, -8, 8),
    });
  }, []);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    setTilt({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  const combinedRotateX = tilt.x + parallax.x;
  const combinedRotateY = tilt.y + parallax.y;

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-8 overflow-hidden bg-[#040711] text-white font-sans touch-none">
      <div
        className="fixed w-[600px] h-[600px] rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2 blur-[120px] opacity-30 z-0"
        style={{
          left: `${cursor.x}px`,
          top: `${cursor.y}px`,
          background:
            'radial-gradient(circle, rgba(52,211,153,0.5) 0%, rgba(168,85,247,0.3) 50%, transparent 70%)',
        }}
      />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[15%] -left-[10%] w-[650px] h-[650px] rounded-full bg-gradient-to-tr from-emerald-600/40 via-teal-500/30 to-transparent blur-[140px] animate-auth-aurora" />
        <div
          className="absolute -bottom-[20%] -right-[10%] w-[700px] h-[700px] rounded-full bg-gradient-to-br from-fuchsia-600/40 via-purple-700/30 to-indigo-800/40 blur-[150px] animate-auth-aurora"
          style={{ animationDelay: '-5s' }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4.5rem_4.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-80" />
      </div>

      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {particles.map((particle) => {
          const Icon = particle.Icon;
          return (
            <div
              key={particle.id}
              className={`absolute flex items-center justify-center p-3 rounded-2xl bg-slate-900/60 border border-white/15 backdrop-blur-xl ${particle.color}`}
              style={{
                left: `${particle.x}vw`,
                top: `${particle.y}vh`,
                boxShadow: `0 0 25px ${particle.glow}`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <Icon
                className="animate-pulse"
                style={{ width: particle.size, height: particle.size }}
              />
            </div>
          );
        })}
      </div>

      <div
        ref={podRef}
        style={{
          transform: `translate3d(${podPos.x}px, ${podPos.y}px, 0) perspective(1000px) rotateX(${combinedRotateX}deg) rotateY(${combinedRotateY}deg)`,
          transition: isDragging
            ? 'none'
            : 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }}
        className={`relative z-10 w-full max-w-[490px] transition-opacity duration-1000 ${
          isLanded ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div
          onPointerDown={handlePointerDown}
          className="group flex items-center justify-between px-5 py-2.5 mb-2 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-xl cursor-grab active:cursor-grabbing hover:bg-white/15 transition-all shadow-lg select-none"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
            <Move className="w-4 h-4 animate-bounce" />
            <span className="tracking-wide">CLICK & DRAG CAPSULE ANYWHERE</span>
          </div>
          {(podPos.x !== 0 || podPos.y !== 0) && (
            <button
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => {
                podPosRef.current = { x: 0, y: 0 };
                setPodPos({ x: 0, y: 0 });
              }}
              title="Reset Position"
              className="p-1 rounded-lg bg-black/40 hover:bg-black/60 text-slate-300 text-[10px] font-bold flex items-center gap-1 px-2 border border-white/10"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>

        <div
          className={`relative rounded-3xl p-6 sm:p-8 bg-slate-900/80 backdrop-blur-2xl border-2 border-white/15 shadow-[0_0_90px_-10px_rgba(0,0,0,0.95)] overflow-hidden transition-shadow duration-300 ${
            isDragging ? 'shadow-[0_25px_80px_rgba(16,185,129,0.35)]' : ''
          }`}
        >
          <div
            className={`absolute -top-32 -right-32 w-64 h-64 rounded-full bg-gradient-to-br ${activeGlow} blur-3xl transition-all duration-700 pointer-events-none`}
          />
          <div
            className={`absolute -bottom-32 -left-32 w-64 h-64 rounded-full bg-gradient-to-tr ${activeGlow} blur-3xl transition-all duration-700 pointer-events-none`}
          />

          <Crosshair className="absolute top-3 left-3 w-4 h-4 text-white/20 pointer-events-none" />
          <Crosshair className="absolute top-3 right-3 w-4 h-4 text-white/20 pointer-events-none" />
          <Crosshair className="absolute bottom-3 left-3 w-4 h-4 text-white/20 pointer-events-none" />
          <Crosshair className="absolute bottom-3 right-3 w-4 h-4 text-white/20 pointer-events-none" />

          <div className="relative z-10 mb-4 flex flex-col items-center text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black tracking-widest text-emerald-300">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>NEXORA QUANTUM PORTAL</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">
              {title}
            </h1>
            <p className="text-xs text-slate-400 max-w-xs font-medium">{subtitle}</p>
          </div>

          <div className="mb-4 flex items-center justify-between relative z-10">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Authorization Tier
            </span>
            <span
              className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${activeTagColor}`}
            >
              {activeTitle} ACTIVE
            </span>
          </div>

          <div className="relative z-10">{children}</div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-400 font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>Movable Quantum Interface • 256-Bit Guard Active</span>
        </div>
      </div>
    </div>
  );
}

export function AuthAlert({
  tone,
  message,
}: {
  tone: 'error' | 'success' | 'info';
  message: string;
}) {
  const styles = {
    error: 'border-rose-400/30 bg-rose-500/10 text-rose-200',
    success: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200',
    info: 'border-cyan-400/30 bg-cyan-500/10 text-cyan-200',
  }[tone];

  return (
    <p
      className={`rounded-xl border px-4 py-3 text-xs font-semibold backdrop-blur-sm ${styles}`}
      role="alert"
    >
      {message}
    </p>
  );
}

export function AuthField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  icon: Icon,
  trailing,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  icon?: ComponentType<{ className?: string }>;
  trailing?: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-[11px] font-black tracking-wider text-slate-400 uppercase"
      >
        {label}
      </label>
      <div className="relative group">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-400 transition-colors">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`w-full ${Icon ? 'pl-10' : 'pl-4'} ${trailing ? 'pr-16' : 'pr-4'} py-3 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-semibold placeholder:text-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 transition-all shadow-inner`}
        />
        {trailing}
      </div>
    </div>
  );
}

export function AuthPrimaryButton({
  children,
  loading,
  disabled,
  type = 'submit',
  onClick,
  gradientClass,
  textClass = 'text-slate-950',
}: {
  children: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  type?: 'submit' | 'button';
  onClick?: () => void;
  gradientClass: string;
  textClass?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`relative overflow-hidden w-full py-4 px-4 rounded-2xl font-black text-xs uppercase tracking-widest bg-gradient-to-r ${gradientClass} ${textClass} shadow-[0_0_30px_rgba(16,185,129,0.35)] hover:shadow-[0_0_45px_rgba(16,185,129,0.6)] hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-auth-shimmer" />
      <span className="relative z-10 inline-flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
}
