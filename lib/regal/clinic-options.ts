/** Canonical Regal clinic node for login selectors and patient registration. */
export const REGAL_CLINIC_OPTION = {
  value: 'HOSP-01',
  label: 'Regal Multispeciality Hospital (Bengaluru) - HOSP-01',
  name: 'Regal Multispeciality Hospital',
  city: 'Bengaluru',
} as const;

export const DEFAULT_HOSPITAL_NODE_ID = REGAL_CLINIC_OPTION.value;
