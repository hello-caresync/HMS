import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Bell,
  Building2,
  FileSignature,
  LayoutDashboard,
  MessageSquare,
  Package,
  Receipt,
  Settings,
  ShoppingCart,
  Truck,
  Warehouse,
  Wrench,
} from 'lucide-react';

export const VENDOR_PORTAL_ROUTES = {
  root: '/vendor/portal',
  login: '/vendor/portal/login',
  dashboard: '/vendor/portal/dashboard',
  purchaseOrders: '/vendor/portal/purchase-orders',
  catalog: '/vendor/portal/catalog',
  inventory: '/vendor/portal/inventory',
  deliveries: '/vendor/portal/deliveries',
  billing: '/vendor/portal/invoices',
  contracts: '/vendor/portal/contracts',
  serviceRequests: '/vendor/portal/service-requests',
  analytics: '/vendor/portal/analytics',
  communication: '/vendor/portal/communication',
  notifications: '/vendor/portal/notifications',
  organization: '/vendor/portal/organization',
  settings: '/vendor/portal/settings',
  /** Legacy aliases — redirect to canonical modules */
  quotations: '/vendor/portal/purchase-orders',
  invoices: '/vendor/portal/invoices',
  warehouse: '/vendor/portal/inventory',
  compliance: '/vendor/portal/organization',
  support: '/vendor/portal/communication',
} as const;

export type VendorNavItem = {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
};

/** Collapsible sidebar — 13 core SRM modules */
export const VENDOR_NAV_ITEMS: VendorNavItem[] = [
  { key: 'dashboard', label: 'Dashboard', href: VENDOR_PORTAL_ROUTES.dashboard, icon: LayoutDashboard },
  { key: 'purchase-orders', label: 'Purchase Orders', href: VENDOR_PORTAL_ROUTES.purchaseOrders, icon: ShoppingCart, badge: 6 },
  { key: 'catalog', label: 'Product Catalog', href: VENDOR_PORTAL_ROUTES.catalog, icon: Package },
  { key: 'inventory', label: 'Inventory', href: VENDOR_PORTAL_ROUTES.inventory, icon: Warehouse },
  { key: 'deliveries', label: 'Deliveries', href: VENDOR_PORTAL_ROUTES.deliveries, icon: Truck, badge: 2 },
  { key: 'billing', label: 'Billing & Payments', href: VENDOR_PORTAL_ROUTES.billing, icon: Receipt },
  { key: 'contracts', label: 'Contracts', href: VENDOR_PORTAL_ROUTES.contracts, icon: FileSignature },
  { key: 'service-requests', label: 'Service Requests', href: VENDOR_PORTAL_ROUTES.serviceRequests, icon: Wrench },
  { key: 'analytics', label: 'Business Analytics', href: VENDOR_PORTAL_ROUTES.analytics, icon: BarChart3 },
  { key: 'communication', label: 'Communication', href: VENDOR_PORTAL_ROUTES.communication, icon: MessageSquare, badge: 5 },
  { key: 'notifications', label: 'Notifications', href: VENDOR_PORTAL_ROUTES.notifications, icon: Bell, badge: 8 },
  { key: 'organization', label: 'Organization', href: VENDOR_PORTAL_ROUTES.organization, icon: Building2 },
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
  if (href === VENDOR_PORTAL_ROUTES.inventory) {
    return (
      pathname === href ||
      pathname.startsWith(`${href}/`) ||
      pathname === '/vendor/portal/warehouse' ||
      pathname.startsWith('/vendor/portal/warehouse/')
    );
  }
  if (href === VENDOR_PORTAL_ROUTES.billing) {
    return pathname === '/vendor/portal/invoices' || pathname.startsWith('/vendor/portal/invoices/');
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
