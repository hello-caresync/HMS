/**
 * Re-exports 19-module clinical navigation for legacy imports.
 */
export {
  CLINICAL_SIDEBAR_NAV as DOCTOR_SIDEBAR_NAV,
  CLINICAL_NAV_ALIASES as NAV_ALIAS_GROUPS,
  isClinicalNavActive as isDoctorNavActive,
  sageSidebar,
  type ClinicalNavItem as DoctorNavItem,
} from '@/lib/doctor-os/clinical-navigation';
