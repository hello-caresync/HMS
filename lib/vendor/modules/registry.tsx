import type { ReactNode } from 'react';

export type VendorModuleConfig = {
  slug: string;
  title: string;
  description: string;
  features: string[];
  panelTitle: string;
  panelBody: ReactNode;
};

function panel(rows: { label: string; value: string }[]) {
  return (
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {rows.map((row) => (
        <div key={row.label} className="rounded-xl border border-slate-100 p-3 dark:border-slate-800">
          <dt className="text-[10px] font-bold uppercase text-slate-500">{row.label}</dt>
          <dd className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export const VENDOR_MODULE_REGISTRY: Record<string, VendorModuleConfig> = {
  quotations: {
    slug: 'quotations',
    title: 'Quotations & Bids',
    description: 'Smart RFQ feed, quote builder, revision history, tender portal, and negotiation panel.',
    features: ['High Match RFQ badges', 'Quote revision v3', 'Hospital procurement chat bridge'],
    panelTitle: 'Open RFQs',
    panelBody: panel([
      { label: 'High match', value: '2 RFQs · ₹60.5L pipeline' },
      { label: 'Due this week', value: '3 responses required' },
      { label: 'Win rate (90d)', value: '38%' },
    ]),
  },
  catalog: {
    slug: 'catalog',
    title: 'Product Catalog',
    description: 'Multi-category master list, spec sheets, certifications, tiered pricing, stock toggles.',
    features: ['Medicines · Equipment · Surgical · Lab', 'HSN & GST mapping', 'Certification vault per SKU'],
    panelTitle: 'Catalog snapshot',
    panelBody: panel([
      { label: 'Active SKUs', value: '1,248' },
      { label: 'Cold chain SKUs', value: '186' },
      { label: 'Pending spec review', value: '12' },
    ]),
  },
  inventory: {
    slug: 'inventory',
    title: 'Inventory Supply & Demand',
    description: 'Batch/expiry tracker, replenishment planning, AI hospital demand sync, availability calendar.',
    features: ['FEFO batch logic', '30/60/90 demand curves', 'Real-time stock sync (mock SSE)'],
    panelTitle: 'Supply health',
    panelBody: panel([
      { label: 'Expiring < 90 days', value: '14 batches' },
      { label: 'Replenishment alerts', value: '6 SKUs' },
      { label: 'Sync latency', value: '< 2s (simulated)' },
    ]),
  },
  deliveries: {
    slug: 'deliveries',
    title: 'Deliveries & Logistics',
    description: 'Shipment creator, GPS tracking, PoD capture, vehicle/driver allocation, partial returns.',
    features: ['Live map placeholder', 'PoD signature & photo', 'Return & partial delivery'],
    panelTitle: 'Active lanes',
    panelBody: panel([
      { label: 'In transit', value: '4 shipments' },
      { label: 'PoD pending', value: '2 deliveries' },
      { label: 'Fleet utilization', value: '71%' },
    ]),
  },
  invoices: {
    slug: 'invoices',
    title: 'Invoices & Payments',
    description: 'Auto-invoice from PO/delivery, manual upload, payment tracker, GST summary, credit/debit notes.',
    features: ['E-invoice ready', 'Payment advice PDF', 'TDS & GST ledgers'],
    panelTitle: 'Receivables',
    panelBody: panel([
      { label: 'Outstanding', value: '₹42.8L' },
      { label: 'Due this month', value: '₹18.2L' },
      { label: 'Settled (30d)', value: '₹1.02Cr' },
    ]),
  },
  contracts: {
    slug: 'contracts',
    title: 'Contracts & Agreements',
    description: 'Contract vault, SLA monitor, digital signature canvas, clause viewer, amendment history.',
    features: ['CLM alerts', 'SLA breach warnings', 'eSign audit trail'],
    panelTitle: 'Contract posture',
    panelBody: panel([
      { label: 'Active', value: '7 agreements' },
      { label: 'Expiring < 60d', value: '2 contracts' },
      { label: 'SLA compliance', value: '96.2% avg' },
    ]),
  },
  'service-requests': {
    slug: 'service-requests',
    title: 'Service Requests & Field Service',
    description: 'Installation tracker, PM scheduler, breakdown desk, AMC manager, technician assignment, FSR upload.',
    features: ['Emergency breakdown queue', 'AMC renewal radar', 'Technician GPS (mock)'],
    panelTitle: 'Field ops',
    panelBody: panel([
      { label: 'Open tickets', value: '5' },
      { label: 'Emergency', value: '1 active' },
      { label: 'PM this week', value: '8 scheduled' },
    ]),
  },
  compliance: {
    slug: 'compliance',
    title: 'Compliance Center',
    description: 'Document locker, expiry alerts, verification status, compliance health score.',
    features: ['Drug license · GST · ISO · NABH', 'Automated verification hooks', 'Health score gauge'],
    panelTitle: 'Compliance health',
    panelBody: panel([
      { label: 'Health score', value: '92%' },
      { label: 'Expiring docs', value: '1 in 30 days' },
      { label: 'Pending verification', value: '2 uploads' },
    ]),
  },
  warehouse: {
    slug: 'warehouse',
    title: 'Warehouse Management',
    description: 'Grid view, capacity utilization, barcode/QR scanner UI, stock transfer, audit log.',
    features: ['Multi-warehouse', 'Cold chain zones', 'Scan-to-dispatch'],
    panelTitle: 'Capacity',
    panelBody: panel([
      { label: 'BLR cold A', value: '78% full' },
      { label: 'BLR general B', value: '54% full' },
      { label: 'Audits this month', value: '3 completed' },
    ]),
  },
  analytics: {
    slug: 'analytics',
    title: 'Business Analytics',
    description: 'Sales trends, revenue vs outstanding, on-time fulfillment, quality ratings, PDF/Excel export.',
    features: ['Interactive charts (mock)', 'Hospital-wise drill-down', 'Export audit logged'],
    panelTitle: 'Insights',
    panelBody: panel([
      { label: 'On-time fulfillment', value: '96%' },
      { label: 'Quality rating trend', value: '+0.2 QoQ' },
      { label: 'Revenue YTD', value: '₹4.2Cr' },
    ]),
  },
  communication: {
    slug: 'communication',
    title: 'Communication Center',
    description: 'Multi-channel messaging, secure attachments, video meeting requests, hospital broadcasts.',
    features: ['Procurement · Pharmacy · Biomedical', 'Encrypted attachments', 'Broadcast inbox'],
    panelTitle: 'Threads',
    panelBody: panel([
      { label: 'Unread', value: '5 messages' },
      { label: 'Video requests', value: '1 pending' },
      { label: 'Broadcasts', value: '2 this week' },
    ]),
  },
  notifications: {
    slug: 'notifications',
    title: 'Notifications',
    description: 'Actionable in-app, email, and SMS triggers for PO, shipment, payment, compliance, and SLA events.',
    features: ['Channel preferences', 'Digest scheduling', 'Critical escalation'],
    panelTitle: 'Inbox',
    panelBody: panel([
      { label: 'Unread', value: '8 alerts' },
      { label: 'Action required', value: '3 items' },
      { label: 'SMS enabled', value: 'Finance + Logistics roles' },
    ]),
  },
  support: {
    slug: 'support',
    title: 'Support Center',
    description: 'Ticket desk, knowledge base search, escalation matrix, integration support.',
    features: ['KB full-text search', 'L2 escalation SLA', 'EDI/API onboarding'],
    panelTitle: 'Support queue',
    panelBody: panel([
      { label: 'Open tickets', value: '2' },
      { label: 'Avg response', value: '4.2 hrs' },
      { label: 'KB articles', value: '148' },
    ]),
  },
  organization: {
    slug: 'organization',
    title: 'Organization Management',
    description: 'Company profile, branches, warehouses, employee RBAC matrix, API/EDI key management.',
    features: ['Multi-branch', 'Role matrix', 'Key rotation audit'],
    panelTitle: 'Org graph',
    panelBody: panel([
      { label: 'Branches', value: '4 active' },
      { label: 'Employees', value: '32 seats' },
      { label: 'API keys', value: '3 production' },
    ]),
  },
  settings: {
    slug: 'settings',
    title: 'Profile & Settings',
    description: 'MFA, biometric toggle, device sessions, notification prefs, theme, digital signature profile.',
    features: ['MFA TOTP', 'Session revoke', 'Biometric opt-in'],
    panelTitle: 'Security',
    panelBody: panel([
      { label: 'MFA', value: 'Enabled' },
      { label: 'Active sessions', value: '3 devices' },
      { label: 'Last audit', value: '20 Jul 2026' },
    ]),
  },
};
