'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Bed,
  Bell,
  Building2,
  CalendarRange,
  ClipboardList,
  Clock,
  CreditCard,
  ExternalLink,
  FileText,
  FlaskConical,
  FolderHeart,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Package,
  Pill,
  Receipt,
  RotateCcw,
  ScanLine,
  Scissors,
  Shield,
  ShieldAlert,
  Stethoscope,
  Truck,
  UserCheck,
  Users,
  Video,
  Wallet,
  Wrench,
} from 'lucide-react';

import {
  ECOSYSTEM_NAV_LAYERS,
  isAuthRoute,
  isStandaloneShellRoute,
  isHospitalNavActive,
  NAV_LINK_ICON_IDS,
} from '../_config/ecosystemNavigation';

const ICON_MAP: Record<string, LucideIcon> = {
  shield: Shield,
  layout: LayoutDashboard,
  users: Users,
  calendar: CalendarRange,
  clipboard: ClipboardList,
  file: FileText,
  flask: FlaskConical,
  scan: ScanLine,
  pill: Pill,
  bed: Bed,
  activity: Activity,
  alert: ShieldAlert,
  scissors: Scissors,
  logout: LogOut,
  receipt: Receipt,
  folder: FolderHeart,
  wallet: Wallet,
  credit: CreditCard,
  usercheck: UserCheck,
  building: Building2,
  clock: Clock,
  stethoscope: Stethoscope,
  heart: HeartPulse,
  bell: Bell,
  video: Video,
  truck: Truck,
  package: Package,
  wrench: Wrench,
  rotate: RotateCcw,
  message: MessageSquare,
};

const ACTIVE_LINK_CLASS =
  'bg-gradient-to-r from-[#008588]/10 to-transparent text-[#008588] border-l-4 border-l-[#008588] font-black pl-5 pr-4 py-2.5 transition-all flex items-center gap-3 text-sm shadow-sm';

const INACTIVE_LINK_CLASS =
  'text-slate-600 hover:text-[#00758C] hover:bg-slate-50/60 transition-colors font-medium text-sm px-4 py-2.5 rounded-lg flex items-center gap-3';

const EXTERNAL_LINK_CLASS =
  'text-slate-600 hover:text-[#008588] hover:bg-[#008588]/5 transition-colors font-medium text-sm px-4 py-2.5 rounded-lg flex items-center gap-3 border border-transparent hover:border-[#008588]/15';

const SECTION_LABEL_CLASS =
  'text-[#00A481] font-black tracking-wider text-[11px] uppercase block mb-2 mt-3 px-4';

const LAYER_LABEL_CLASS =
  'text-[10px] font-black uppercase tracking-wider block mb-0.5 px-4 first:mt-0';

const ZONE_TITLE_CLASS = 'text-[11px] font-black uppercase tracking-wider block mb-1 px-4';

function resolveIcon(linkId: string): LucideIcon {
  const iconKey = NAV_LINK_ICON_IDS[linkId] ?? 'layout';
  return ICON_MAP[iconKey] ?? LayoutDashboard;
}

type HospitalPortalLayoutProps = {
  children: ReactNode;
};

export default function HospitalPortalLayout({ children }: HospitalPortalLayoutProps) {
  const pathname = usePathname();
  const [syncPulse, setSyncPulse] = useState(true);
  const [dbSyncIndex, setDbSyncIndex] = useState(98.7);
  const [networkLatencyMs, setNetworkLatencyMs] = useState(12);

  useEffect(() => {
    const tick = () => {
      setSyncPulse((prev) => !prev);
      setDbSyncIndex((prev) => Math.min(99.9, Math.max(97.5, prev + (Math.random() - 0.5) * 0.4)));
      setNetworkLatencyMs((prev) => Math.max(8, Math.min(24, Math.round(prev + (Math.random() - 0.5) * 3))));
    };

    tick();
    const interval = window.setInterval(tick, 3000);
    return () => window.clearInterval(interval);
  }, []);

  if (isStandaloneShellRoute(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen w-full bg-slate-50/40">
      <aside
        className="flex min-h-screen w-[280px] shrink-0 flex-col justify-between border-r border-slate-200/80 bg-white shadow-sm"
        aria-label="Nexora Hospital ecosystem navigation"
      >
        <div>
          <header className="border-b border-slate-200/60 px-6 pb-4 pt-6">
            <span className="block text-lg font-black uppercase tracking-wider text-[#00758C]">
              Nexora Hospital
            </span>
            <p className="mt-1.5 text-xs font-semibold leading-snug text-slate-500">
              Enterprise Management Ecosystem
            </p>

            <div
              className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200/60 bg-slate-50/80 px-3 py-2"
              aria-live="polite"
            >
              <span
                className={`h-1.5 w-1.5 rounded-full transition-opacity duration-500 ${
                  syncPulse ? 'bg-[#00A481] opacity-100' : 'bg-[#5EC283] opacity-60'
                }`}
                aria-hidden
              />
              <span className="text-[10px] font-bold uppercase tracking-wide text-[#00758C]">
                Systems Online
              </span>
              <span className="text-[10px] text-slate-400">·</span>
              <span className="font-mono text-[10px] font-semibold tabular-nums text-slate-600">
                {networkLatencyMs}ms
              </span>
              <span className="text-[10px] text-slate-400">·</span>
              <span className="font-mono text-[10px] font-semibold tabular-nums text-[#00A481]">
                DB {dbSyncIndex.toFixed(1)}%
              </span>
            </div>
          </header>

          <nav className="custom-scrollbar max-h-[calc(100vh-12rem)] overflow-y-auto pb-4">
            {ECOSYSTEM_NAV_LAYERS.map((layer) => (
              <div key={layer.id} className="border-b border-slate-100/80 last:border-b-0">
                <div className="px-4 pt-4">
                  <span className={`${LAYER_LABEL_CLASS} ${layer.accentClass}`}>
                    {layer.layerLabel}
                  </span>
                  <span className={`${ZONE_TITLE_CLASS} ${layer.accentClass}`}>{layer.title}</span>
                  <p className="mb-1 text-[10px] font-medium text-slate-400">{layer.description}</p>
                </div>

                {layer.sections.map((section) => (
                  <div key={section.id}>
                    <span className={SECTION_LABEL_CLASS}>{section.title}</span>
                    <ul className="space-y-0.5 px-2 pb-2">
                      {section.links.map((link) => {
                        const Icon = resolveIcon(link.id);
                        const active = !link.external && isHospitalNavActive(pathname, link.href);
                        const linkClass = active
                          ? ACTIVE_LINK_CLASS
                          : link.external
                            ? EXTERNAL_LINK_CLASS
                            : INACTIVE_LINK_CLASS;

                        return (
                          <li key={link.id}>
                            <Link
                              href={link.href}
                              className={linkClass}
                              aria-current={active ? 'page' : undefined}
                            >
                              <Icon
                                className={`h-4 w-4 shrink-0 ${
                                  active ? 'text-[#008588]' : 'text-slate-400'
                                }`}
                                aria-hidden
                              />
                              <span className="min-w-0 flex-1 text-[12px] leading-snug">{link.label}</span>
                              {link.external ? (
                                <ExternalLink className="h-3 w-3 shrink-0 text-slate-400" aria-hidden />
                              ) : null}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            ))}
          </nav>
        </div>

        <footer className="border-t border-slate-200/80 px-6 py-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#008588]">
            Facility Sync Active
          </p>
          <p className="mt-1 font-mono text-[10px] text-slate-500">node · nexora-hospital-ecosystem</p>
        </footer>
      </aside>

      <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
    </div>
  );
}
