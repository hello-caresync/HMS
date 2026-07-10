'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  BarChart3,
  BedDouble,
  Building2,
  Database,
  Calendar,
  Cpu,
  FlaskConical,
  IndianRupee,
  LayoutDashboard,
  Link2,
  ScanLine,
  ShoppingCart,
  Stethoscope,
  Package,
  Warehouse,
  Wallet,
  Settings,
  Shield,
  UserPlus,
  Users,
  UserCog,
  X,
} from 'lucide-react';

import { APP_ROUTES } from '../../lib/routes';

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Master Data', href: APP_ROUTES.masterData, icon: Database },
  { label: 'Patient Registration', href: APP_ROUTES.patientRegistration, icon: UserPlus },
  { label: 'Appointments', href: APP_ROUTES.appointments, icon: Calendar },
  { label: 'Consultation EMR', href: APP_ROUTES.consultation, icon: Stethoscope },
  { label: 'Laboratory', href: APP_ROUTES.laboratory, icon: FlaskConical },
  { label: 'Radiology', href: APP_ROUTES.radiology, icon: ScanLine },
  { label: 'Pharmacy', href: APP_ROUTES.pharmacy, icon: Package },
  { label: 'Billing & Finance', href: APP_ROUTES.billing, icon: IndianRupee },
  { label: 'Payment Processing', href: APP_ROUTES.payments, icon: Wallet },
  { label: 'IPD Management', href: APP_ROUTES.ipd, icon: BedDouble },
  { label: 'Inventory', href: APP_ROUTES.inventory, icon: Warehouse },
  { label: 'Procurement', href: APP_ROUTES.procurement, icon: ShoppingCart },
  { label: 'Vendor Integration', href: APP_ROUTES.vendorHub, icon: Link2 },
  { label: 'HR & Workforce', href: APP_ROUTES.hr, icon: UserCog },
  { label: 'Assets & Equipment', href: APP_ROUTES.assets, icon: Cpu },
  { label: 'Executive Reports', href: APP_ROUTES.reports, icon: BarChart3 },
  { label: 'System Settings', href: APP_ROUTES.settings, icon: Settings },
  { label: 'Hospital Ops', href: APP_ROUTES.hospital, icon: Building2 },
  { label: 'Patients', href: APP_ROUTES.patient, icon: Users },
  { label: 'Activity Log', href: '/dashboard/activity', icon: Activity },
  { label: 'Access Control', href: '/dashboard/access', icon: Shield },
];

type DashboardSidebarProps = {
  mobileOpen: boolean;
  onMobileClose: () => void;
};

export default function DashboardSidebar({ mobileOpen, onMobileClose }: DashboardSidebarProps) {
  const pathname = usePathname();

  const navContent = (
    <>
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white">
          N
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold tracking-tight text-white">Nexora</p>
          <p className="truncate text-[10px] uppercase tracking-widest text-slate-200">
            Command Center
          </p>
        </div>
        <button
          type="button"
          onClick={onMobileClose}
          className="ml-auto rounded-lg p-1.5 text-slate-200 hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="custom-scrollbar flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={onMobileClose}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? 'bg-primary text-white shadow-md shadow-primary/25'
                  : 'text-slate-200 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="rounded-xl bg-white/5 px-3 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-200">
            System Status
          </p>
          <p className="mt-1 flex items-center gap-2 text-xs text-emerald-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            All services operational
          </p>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-30 bg-slate-900/60 backdrop-blur-sm transition-opacity lg:hidden ${
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onMobileClose}
        aria-hidden
      />

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar-canvas transition-transform duration-300 lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {navContent}
      </aside>
    </>
  );
}
