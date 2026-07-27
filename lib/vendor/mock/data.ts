import type {
  BatchLot,
  CatalogProduct,
  CommunicationThread,
  ContractRecord,
  DemandForecastPoint,
  HospitalPartner,
  PurchaseOrder,
  RFQRecord,
  ServiceTicket,
  Shipment,
  SupportTicket,
  VendorDashboardMetrics,
  VendorInvoice,
  VendorNotification,
  VendorOrganization,
  WarehouseLocation,
} from '@/lib/vendor/types/domain';

export const MOCK_ORGANIZATION: VendorOrganization = {
  id: 'org-nex-v1',
  legalName: 'MedSupply Nexus Pvt Ltd',
  tradeName: 'MedSupply Nexus',
  gstin: '29AABCM1234F1Z5',
  pan: 'AABCM1234F',
  vendorRating: 4.6,
  scorecardGrade: 'A',
  primaryCategory: 'Medicines',
  verifiedAt: '2026-01-15',
};

export const MOCK_HOSPITALS: HospitalPartner[] = [
  { id: 'hosp-1', name: 'Nexora City Hospital', networkCode: 'NX-CH-01', city: 'Bengaluru', activeContracts: 4 },
  { id: 'hosp-2', name: 'Nexora Heart Institute', networkCode: 'NX-HI-02', city: 'Chennai', activeContracts: 2 },
  { id: 'hosp-3', name: 'Nexora Diagnostics Network', networkCode: 'NX-DN-03', city: 'Hyderabad', activeContracts: 1 },
  { id: 'consolidated', name: 'All Hospitals (Consolidated)', networkCode: 'NX-ALL', city: 'Multi-site', activeContracts: 7 },
];

export const MOCK_DASHBOARD_METRICS: VendorDashboardMetrics = {
  pendingPOs: 6,
  activeShipments: 4,
  outstandingInvoices: 12,
  upcomingPayments: 3,
  expiringContracts: 2,
  openServiceTickets: 5,
  deliveryRatePct: 96,
  revenueGrowthPct: 14,
  complianceScore: 92,
};

export const MOCK_DEMAND_FORECAST: DemandForecastPoint[] = [
  { dayOffset: 30, projectedUnits: 1240, confidence: 0.88 },
  { dayOffset: 60, projectedUnits: 1580, confidence: 0.81 },
  { dayOffset: 90, projectedUnits: 1920, confidence: 0.74 },
];

export const MOCK_RFQS: RFQRecord[] = [
  {
    id: 'rfq-901',
    hospitalId: 'hosp-1',
    hospitalName: 'Nexora City Hospital',
    title: 'Critical care infusion pumps · Q3 replenishment',
    category: 'Equipment',
    dueDate: '28 Jul 2026',
    matchTier: 'High Match',
    estimatedValue: '₹42,00,000',
    status: 'Open',
  },
  {
    id: 'rfq-902',
    hospitalId: 'hosp-2',
    hospitalName: 'Nexora Heart Institute',
    title: 'Cardiology consumables · stent & cath lab',
    category: 'Surgical',
    dueDate: '02 Aug 2026',
    matchTier: 'High Match',
    estimatedValue: '₹18,50,000',
    status: 'Open',
  },
  {
    id: 'rfq-903',
    hospitalId: 'hosp-3',
    hospitalName: 'Nexora Diagnostics Network',
    title: 'Hematology reagent kits · 6-month tender',
    category: 'Laboratory',
    dueDate: '10 Aug 2026',
    matchTier: 'Medium Match',
    estimatedValue: '₹9,20,000',
    status: 'Responded',
  },
];

export const MOCK_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'po-4401',
    hospitalId: 'hosp-1',
    hospitalName: 'Nexora City Hospital',
    poNumber: 'NX-PO-2026-4401',
    status: 'New',
    lifecycleStage: 'Awarded',
    urgency: 'Urgent',
    issuedAt: '18 Jul 2026',
    expectedDelivery: '22 Jul 2026',
    totalAmount: 284000,
    lineItems: [
      { sku: 'MED-ATR-10', name: 'Atorvastatin 10 mg · strip', quantity: 500, unit: 'strips', unitPrice: 48, fulfilledQty: 0, status: 'Pending' },
      { sku: 'MED-MET-500', name: 'Metformin 500 mg · strip', quantity: 800, unit: 'strips', unitPrice: 32, fulfilledQty: 0, status: 'Pending' },
    ],
  },
  {
    id: 'po-4398',
    hospitalId: 'hosp-2',
    hospitalName: 'Nexora Heart Institute',
    poNumber: 'NX-PO-2026-4398',
    status: 'Processing',
    lifecycleStage: 'Processing',
    urgency: 'Normal',
    issuedAt: '15 Jul 2026',
    expectedDelivery: '24 Jul 2026',
    totalAmount: 1250000,
    lineItems: [
      { sku: 'EQ-PUMP-ICU', name: 'ICU Infusion Pump Pro', quantity: 6, unit: 'units', unitPrice: 185000, fulfilledQty: 2, status: 'Partial' },
    ],
  },
  {
    id: 'po-4392',
    hospitalId: 'hosp-1',
    hospitalName: 'Nexora City Hospital',
    poNumber: 'NX-PO-2026-4392',
    status: 'Dispatched',
    lifecycleStage: 'Dispatched',
    urgency: 'Critical',
    issuedAt: '10 Jul 2026',
    expectedDelivery: '20 Jul 2026',
    totalAmount: 890000,
    lineItems: [
      { sku: 'LAB-CBC-RG', name: 'CBC Reagent Pack · 500 tests', quantity: 12, unit: 'kits', unitPrice: 42000, fulfilledQty: 12, status: 'Fulfilled' },
    ],
  },
];

export const MOCK_SHIPMENTS: Shipment[] = [
  { id: 'shp-101', poId: 'po-4392', trackingId: 'NX-TRK-88291', status: 'In Transit', vehicleId: 'KA-01-AB-4521', driverName: 'R. Kumar', eta: '21 Jul 2026 · 14:30', podCaptured: false },
  { id: 'shp-102', poId: 'po-4398', trackingId: 'NX-TRK-88288', status: 'Created', eta: '24 Jul 2026 · 09:00', podCaptured: false },
];

export const MOCK_INVOICES: VendorInvoice[] = [
  {
    id: 'inv-7781',
    poId: 'po-4380',
    hospitalName: 'Nexora City Hospital',
    subtotal: 420000,
    cgst: 37800,
    sgst: 37800,
    igst: 0,
    total: 495600,
    status: 'Under Review',
    dueDate: '05 Aug 2026',
  },
  {
    id: 'inv-7775',
    poId: 'po-4372',
    hospitalName: 'Nexora Heart Institute',
    subtotal: 980000,
    cgst: 0,
    sgst: 0,
    igst: 176400,
    total: 1156400,
    status: 'Paid',
    dueDate: '01 Jul 2026',
  },
];

export const MOCK_CONTRACTS: ContractRecord[] = [
  {
    id: 'ctr-201',
    hospitalName: 'Nexora City Hospital',
    title: 'Pharmacy formulary supply · FY26-27',
    status: 'Active',
    slaOnTimePct: 97,
    validFrom: '01 Apr 2026',
    validTo: '31 Mar 2027',
    digitalSignatureComplete: true,
  },
  {
    id: 'ctr-198',
    hospitalName: 'Nexora Heart Institute',
    title: 'Biomedical AMC · cath lab suite',
    status: 'Expiring',
    slaOnTimePct: 94,
    validFrom: '01 Aug 2025',
    validTo: '31 Jul 2026',
    digitalSignatureComplete: true,
  },
];

export const MOCK_CATALOG: CatalogProduct[] = [
  {
    id: 'cat-1',
    sku: 'MED-ATR-10',
    name: 'Atorvastatin 10 mg',
    category: 'Medicines',
    hsnCode: '3004',
    tierPricing: [
      { tier: 'Tier 1 · 1–500', price: 52 },
      { tier: 'Tier 2 · 501–2000', price: 48 },
      { tier: 'Tier 3 · 2000+', price: 44 },
    ],
    stockAvailable: 12400,
    certifications: ['WHO-GMP', 'CDSCO'],
    specsSummary: 'Film-coated tablet · cold chain not required',
  },
  {
    id: 'cat-2',
    sku: 'EQ-PUMP-ICU',
    name: 'ICU Infusion Pump Pro',
    category: 'Equipment',
    hsnCode: '9018',
    tierPricing: [{ tier: 'Standard', price: 185000 }],
    stockAvailable: 18,
    certifications: ['ISO 13485', 'CE'],
    specsSummary: 'Dual channel · drug library · Wi-Fi telemetry ready',
  },
];

export const MOCK_BATCHES: BatchLot[] = [
  { id: 'bat-1', productId: 'cat-1', batchNumber: 'ATR-B24-881', expiryDate: 'Mar 2028', warehouseId: 'wh-blr-1', quantityOnHand: 6200 },
  { id: 'bat-2', productId: 'cat-1', batchNumber: 'ATR-B24-902', expiryDate: 'Jun 2028', warehouseId: 'wh-blr-1', quantityOnHand: 6200 },
];

export const MOCK_WAREHOUSES: WarehouseLocation[] = [
  { id: 'wh-blr-1', code: 'BLR-COLD-A', name: 'Bengaluru · Cold Chain A', capacityPct: 78, temperatureControlled: true },
  { id: 'wh-blr-2', code: 'BLR-GEN-B', name: 'Bengaluru · General B', capacityPct: 54, temperatureControlled: false },
  { id: 'wh-che-1', code: 'CHE-HUB-1', name: 'Chennai · Regional Hub', capacityPct: 61, temperatureControlled: true },
];

export const MOCK_SERVICE_TICKETS: ServiceTicket[] = [
  {
    id: 'svc-301',
    hospitalName: 'Nexora Heart Institute',
    equipmentName: 'Cath Lab Injector System',
    type: 'Breakdown',
    priority: 'Emergency',
    status: 'Assigned',
    assignedTechnician: 'Technician · V. Anand',
    scheduledAt: '21 Jul 2026 · 16:00',
  },
  {
    id: 'svc-298',
    hospitalName: 'Nexora City Hospital',
    equipmentName: 'MRI Chiller Unit',
    type: 'PM',
    priority: 'Routine',
    status: 'Open',
    scheduledAt: '25 Jul 2026 · 10:00',
  },
];

export const MOCK_THREADS: CommunicationThread[] = [
  { id: 'th-1', subject: 'PO NX-PO-2026-4401 · partial dispatch approval', channel: 'Procurement', unreadCount: 2, lastMessageAt: '20 Jul 2026 · 11:42' },
  { id: 'th-2', subject: 'Formulary add · Atorvastatin 20 mg', channel: 'Pharmacy', unreadCount: 0, lastMessageAt: '19 Jul 2026 · 09:15' },
];

export const MOCK_NOTIFICATIONS: VendorNotification[] = [
  { id: 'n-1', title: 'New PO received', body: 'NX-PO-2026-4401 from Nexora City Hospital', actionable: true, href: '/vendor/portal/purchase-orders', createdAt: '20 Jul 2026 · 08:10', read: false },
  { id: 'n-2', title: 'License expiry in 30 days', body: 'Drug License Form 20B · renew in Organization', actionable: true, href: '/vendor/portal/organization', createdAt: '19 Jul 2026 · 17:00', read: false },
];

export const MOCK_SUPPORT: SupportTicket[] = [
  { id: 'sup-44', subject: 'EDI 850 mapping · Nexora Heart Institute', category: 'Integration', status: 'In Progress', priority: 'Urgent' },
  { id: 'sup-41', subject: 'Payment advice download format', category: 'Finance', status: 'Open', priority: 'Routine' },
];

export const MOCK_EMPLOYEES = [
  { id: 'emp-1', orgId: 'org-nex-v1', name: 'Priya Menon', email: 'priya@medsupply.nex', role: 'ADMIN' as const, mfaEnabled: true, lastActiveAt: '22 Jul 2026 · 09:12' },
  { id: 'emp-2', orgId: 'org-nex-v1', name: 'Arun Das', email: 'arun@medsupply.nex', role: 'SALES_MANAGER' as const, mfaEnabled: true, lastActiveAt: '22 Jul 2026 · 08:40' },
  { id: 'emp-3', orgId: 'org-nex-v1', name: 'Neha Iyer', email: 'neha@medsupply.nex', role: 'DISPATCHER' as const, mfaEnabled: false, lastActiveAt: '21 Jul 2026 · 18:05' },
  { id: 'emp-4', orgId: 'org-nex-v1', name: 'Karthik Rao', email: 'finance@medsupply.nex', role: 'FINANCE_MANAGER' as const, mfaEnabled: true, lastActiveAt: '22 Jul 2026 · 07:55' },
];

export const MOCK_BRANCHES = [
  { id: 'br-1', orgId: 'org-nex-v1', name: 'HQ · Bengaluru', city: 'Bengaluru', isHeadOffice: true },
  { id: 'br-2', orgId: 'org-nex-v1', name: 'Regional · Chennai', city: 'Chennai', isHeadOffice: false },
];

export const MOCK_COMPLIANCE_DOCS = [
  { id: 'doc-1', orgId: 'org-nex-v1', name: 'Drug License Form 20B', type: 'Drug License' as const, status: 'Verified' as const, expiryDate: '21 Aug 2026', verificationRef: 'CDSCO-VL-8821' },
  { id: 'doc-2', orgId: 'org-nex-v1', name: 'GST Registration Certificate', type: 'GST' as const, status: 'Verified' as const, verificationRef: 'GSTN-AUTO-OK' },
  { id: 'doc-3', orgId: 'org-nex-v1', name: 'ISO 13485:2016', type: 'ISO' as const, status: 'Pending Review' as const, expiryDate: '15 Dec 2026' },
  { id: 'doc-4', orgId: 'org-nex-v1', name: 'NABH Supplier Audit 2025', type: 'NABH' as const, status: 'Verified' as const, verificationRef: 'NABH-SUP-441' },
];

export const MOCK_QUOTE_REVISIONS = [
  { id: 'qr-3', rfqId: 'rfq-901', version: 3, submittedAt: '19 Jul 2026', totalAmount: 4150000, status: 'Under Negotiation' as const },
  { id: 'qr-2', rfqId: 'rfq-901', version: 2, submittedAt: '12 Jul 2026', totalAmount: 4280000, status: 'Submitted' as const },
  { id: 'qr-1', rfqId: 'rfq-901', version: 1, submittedAt: '08 Jul 2026', totalAmount: 4400000, status: 'Draft' as const },
];

export const MOCK_CREDIT_NOTES = [
  { id: 'cn-12', reference: 'NX-CN-2026-012', poId: 'po-4370', amount: 18500, reason: 'Short shipment · line adjustment', status: 'Issued' },
  { id: 'cn-11', reference: 'NX-CN-2026-011', poId: 'po-4362', amount: 4200, reason: 'Rate variance settlement', status: 'Pending Approval' },
];

export const MOCK_EDI_KEYS = [
  { id: 'key-1', label: 'Production · SAP IDoc', keyPrefix: 'nx_live_••••8f2a', scopes: ['PO_IN', 'ASN_OUT', 'INV_OUT'], lastRotatedAt: '01 Jun 2026' },
  { id: 'key-2', label: 'Sandbox · Oracle Fusion', keyPrefix: 'nx_sbx_••••19bd', scopes: ['PO_IN'], lastRotatedAt: '15 Jul 2026' },
];

export const MOCK_DEVICE_SESSIONS = [
  { id: 'sess-1', name: 'Chrome · Windows · Bengaluru', lastActive: 'Active now', current: true },
  { id: 'sess-2', name: 'Safari · iPad · Field service', lastActive: '21 Jul 2026 · 14:22', current: false },
  { id: 'sess-3', name: 'Edge · Chennai warehouse', lastActive: '20 Jul 2026 · 09:01', current: false },
];

export const MOCK_AUDIT_LOG = [
  { id: 'aud-1', actor: 'Priya Menon · ADMIN', action: 'PO bulk accept', resource: 'NX-PO-2026-4398', timestamp: '22 Jul 2026 · 09:05', ipMasked: '103.•••.••42' },
  { id: 'aud-2', actor: 'Karthik Rao · FINANCE', action: 'Invoice submitted', resource: 'inv-7781', timestamp: '21 Jul 2026 · 16:40', ipMasked: '49.•••.••18' },
  { id: 'aud-3', actor: 'System', action: 'GST auto-verify', resource: '29AABCM1234F1Z5', timestamp: '21 Jul 2026 · 08:00', ipMasked: '—' },
];

export const MOCK_ANALYTICS_SERIES = {
  salesMonths: ['Apr', 'May', 'Jun', 'Jul'],
  salesValues: [82, 91, 88, 96],
  fulfillmentPct: [94, 95, 96, 96],
  qualityRating: [4.4, 4.5, 4.5, 4.6],
};
