import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  MessageSquare,
  Receipt,
  Settings,
  ShoppingCart,
  Truck,
} from 'lucide-react';

export const VENDOR_PORTAL_ROUTES = {
  root: '/vendor/portal',
  login: '/vendor/portal/login',
  dashboard: '/vendor/portal/dashboard',
  purchaseOrders: '/vendor/portal/purchase-orders',
  deliveries: '/vendor/portal/deliveries',
  billing: '/vendor/portal/billing',
  communication: '/vendor/portal/communication',
  settings: '/vendor/portal/settings',
  /** Legacy aliases — redirect to MVP modules */
  catalog: '/vendor/portal/dashboard',
  inventory: '/vendor/portal/deliveries',
  contracts: '/vendor/portal/dashboard',
  serviceRequests: '/vendor/portal/dashboard',
  analytics: '/vendor/portal/dashboard',
  notifications: '/vendor/portal/communication',
  organization: '/vendor/portal/settings',
  quotations: '/vendor/portal/purchase-orders',
  invoices: '/vendor/portal/billing',
  warehouse: '/vendor/portal/deliveries',
  compliance: '/vendor/portal/settings',
  support: '/vendor/portal/communication',
} as const;

export type VendorNavItem = {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
};

/** V0 MVP sidebar — 6 core modules only */
export const VENDOR_NAV_ITEMS: VendorNavItem[] = [
  { key: 'dashboard', label: 'Dashboard', href: VENDOR_PORTAL_ROUTES.dashboard, icon: LayoutDashboard },
  {
    key: 'purchase-orders',
    label: 'Purchase Orders',
    href: VENDOR_PORTAL_ROUTES.purchaseOrders,
    icon: ShoppingCart,
  },
  { key: 'deliveries', label: 'Deliveries', href: VENDOR_PORTAL_ROUTES.deliveries, icon: Truck },
  { key: 'billing', label: 'Billing & Payments', href: VENDOR_PORTAL_ROUTES.billing, icon: Receipt },
  {
    key: 'communication',
    label: 'Messages',
    href: VENDOR_PORTAL_ROUTES.communication,
    icon: MessageSquare,
  },
  { key: 'settings', label: 'Profile & Settings', href: VENDOR_PORTAL_ROUTES.settings, icon: Settings },
];

/** Hospital procurement lifecycle (vendor-facing) */
export const VENDOR_WORKFLOW_STAGES = [
  'Issued',
  'Accepted',
  'Dispatched',
  'Goods Receipt',
  'Invoiced',
  'Paid',
] as const;

export type VendorLifecycleStage = (typeof VENDOR_WORKFLOW_STAGES)[number];

export function isVendorNavActive(pathname: string, href: string): boolean {
  if (href === VENDOR_PORTAL_ROUTES.dashboard) {
    return pathname === href || pathname === `${href}/`;
  }
  if (href === VENDOR_PORTAL_ROUTES.billing) {
    return ['/vendor/portal/billing', '/vendor/portal/invoices'].some(
      (route) => pathname === route || pathname.startsWith(`${route}/`),
    );
  }
  if (href === VENDOR_PORTAL_ROUTES.communication) {
    return [
      '/vendor/portal/communication',
      '/vendor/portal/notifications',
      '/vendor/portal/support',
    ].some((route) => pathname === route || pathname.startsWith(`${route}/`));
  }
  if (href === VENDOR_PORTAL_ROUTES.settings) {
    return ['/vendor/portal/settings', '/vendor/portal/organization', '/vendor/portal/compliance'].some(
      (route) => pathname === route || pathname.startsWith(`${route}/`),
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
