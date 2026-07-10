import { HubActiveModule } from './types';

export type VendorNavItem = {
  id: HubActiveModule;
  label: string;
  href: string;
};

export const VENDOR_NAV_ITEMS: VendorNavItem[] = [
  {
    id: 'po_inbox',
    label: 'Purchase Order Inbox',
    href: '/vendor/secure-hub/po-inbox',
  },
  {
    id: 'logistics',
    label: 'Logistics & Fulfillment',
    href: '/vendor/secure-hub?module=logistics',
  },
  {
    id: 'billing',
    label: 'Tax Invoicing Desk',
    href: '/vendor/secure-hub?module=billing',
  },
  {
    id: 'catalog',
    label: 'Medical Product Catalog',
    href: '/vendor/secure-hub?module=catalog',
  },
  {
    id: 'documents',
    label: 'Document & Compliance',
    href: '/vendor/secure-hub?module=documents',
  },
  {
    id: 'communication',
    label: 'Hospital Live Chat',
    href: '/vendor/secure-hub?module=communication',
  },
  {
    id: 'returns',
    label: 'Returns & Replacements',
    href: '/vendor/secure-hub?module=returns',
  },
  {
    id: 'analytics',
    label: 'Financial Analytics',
    href: '/vendor/secure-hub?module=analytics',
  },
];

export function isHubActiveModule(value: string | null): value is HubActiveModule {
  return VENDOR_NAV_ITEMS.some((item) => item.id === value);
}
