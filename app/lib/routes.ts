/** Canonical app routes — always use absolute paths from this module. */
export const APP_ROUTES = {
  home: '/',
  login: '/login',
  loginForgotPassword: '/login/forgot-password',
  loginResetPassword: '/login/reset-password',

  /** Core Operations */
  patients: '/patients',
  patientsRegister: '/patients/register',
  appointmentsHub: '/appointments',
  admissionsAllocate: '/admissions/allocate',
  staffDirectory: '/staff',
  staffRoles: '/staff/roles',

  /** Clinical Units */
  opd: '/opd',
  ipdHub: '/ipd-management',
  ipdManagement: '/ipd-management',
  emergency: '/emergency',
  otCoordination: '/ot-coordination',
  emr: '/emr',
  doctorDashboard: '/doctor',
  laboratoryHub: '/laboratory',
  radiologyHub: '/radiology',
  pharmacyHub: '/pharmacy',

  /** Back Office */
  billingHub: '/billing',
  paymentsHub: '/payments',
  insuranceTpa: '/insurance-tpa',
  insurance: '/insurance-tpa',
  inventoryHub: '/inventory',
  procurementHub: '/procurement',
  vendorCoordination: '/vendor-coordination',
  finance: '/finance',
  hrHub: '/hr',
  reportsHub: '/reports',
  assetsHub: '/assets',
  adminAudit: '/admin/audit',
  adminSettings: '/admin/settings',
  settingsHub: '/settings',

  /** Phase 1 foundation modules */
  settingsBedManagement: '/settings/bed-management',
  masterDataPharmacy: '/master-data/pharmacy',

  /** Hospital command cockpit */
  hospitalDashboard: '/hospital/dashboard',

  /** First-time hospital admin onboarding wizard */
  adminOnboarding: '/admin/onboarding',

  /** Legacy / admin aliases (still valid) */
  dashboard: '/dashboard',
  patient: '/patient',
  masterData: '/admin/master-data',
  patientRegistration: '/admin/patients',
  appointments: '/admin/appointments',
  consultation: '/admin/consultation',
  laboratory: '/admin/laboratory',
  radiology: '/admin/radiology',
  pharmacy: '/admin/pharmacy',
  billing: '/admin/billing',
  payments: '/admin/payments',
  ipd: '/admin/ipd',
  inventory: '/admin/inventory',
  procurement: '/admin/procurement',
  vendorHub: '/admin/vendor-hub',
  hr: '/admin/hr',
  assets: '/admin/assets',
  reports: '/admin/reports',
  settings: '/admin/settings',
  hospital: '/hospital',
  clinicalDoctor: '/clinical/doctor',
  vendorGateway: '/vendor',
  vendorPortal: '/vendor/portal',
  vendorPortalLogin: '/vendor/portal/login',
  vendorPortalDashboard: '/vendor/portal/dashboard',
  vendorSecureHub: '/vendor/secure-hub',
  vendorSecureHubPoInbox: '/vendor/secure-hub/po-inbox',
} as const;

export type AppRoute = (typeof APP_ROUTES)[keyof typeof APP_ROUTES];
