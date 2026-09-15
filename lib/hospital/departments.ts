/** Standard hospital departments for staff/doctor onboarding dropdowns. */

export const OTHER_DEPARTMENT_OPTION = 'Other (Specify manually)...';

export const DEFAULT_HOSPITAL_DEPARTMENT = 'General Medicine';

export const HOSPITAL_DEPARTMENTS = [
  // Clinical & Outpatient
  'General Medicine',
  'General Surgery',
  'Cardiology',
  'Orthopedics',
  'Pediatrics & Neonatology',
  'Obstetrics & Gynecology (OB-GYN)',
  'Neurology & Neurosurgery',
  'Dermatology',
  'Ophthalmology (Eye Care)',
  'ENT (Otorhinolaryngology)',
  'Pulmonology & Respiratory Medicine',
  'Psychiatry & Behavioral Health',
  'Gastroenterology',
  'Nephrology & Urology',
  'Oncology',

  // Emergency, Critical Care & Anesthesia
  'Emergency & Trauma Care (ER)',
  'Intensive Care Unit (ICU)',
  'Anesthesiology & Critical Care',

  // Diagnostics & Pharmacy
  'Radiology & Diagnostic Imaging',
  'Pathology & Clinical Laboratory',
  'Hospital Pharmacy & Therapeutics',

  // Operations & Administration
  'Billing & Hospital Finance',
  'Inpatient Nursing Administration',
  'Procurement & Central Sterile Supply (CSSD)',
  'Hospital Administration & HR',

  OTHER_DEPARTMENT_OPTION,
] as const;

export function isCustomDepartmentSelection(value: string): boolean {
  return value === OTHER_DEPARTMENT_OPTION;
}

/** Returns the custom text when "Other" is selected, otherwise the dropdown value. */
export function resolveDepartmentValue(selected: string, customText: string): string {
  if (isCustomDepartmentSelection(selected)) {
    return customText.trim();
  }
  return selected.trim();
}

/** Clinical dropdown options (excludes manual "Other" entry). */
export const CLINICAL_DEPARTMENT_OPTIONS = HOSPITAL_DEPARTMENTS.filter(
  (department) => department !== OTHER_DEPARTMENT_OPTION,
);

function normalizeDepartmentKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Synonym groups so roster labels (e.g. "General Physician") match standard dropdown values. */
const DEPARTMENT_SYNONYM_GROUPS: string[][] = [
  ['general medicine', 'general physician', 'internal medicine', 'clinical', 'diabetology'],
  ['general surgery', 'surgery', 'cosmetic surgery', 'vascular surgery'],
  ['cardiology'],
  ['orthopedics', 'orthopaedic', 'orthopaedics'],
  ['pediatrics neonatology', 'pediatrics pediatric surgery', 'pediatric surgery'],
  ['obstetrics gynecology ob gyn', 'obstetrics and gynaecology', 'ob gyn'],
  ['neurology neurosurgery', 'neurosurgery', 'neurology'],
  ['dermatology'],
  ['ophthalmology eye care', 'ophthalmology'],
  ['ent otorhinolaryngology', 'ent'],
  ['pulmonology respiratory medicine', 'pulmonology', 'respiratory medicine'],
  ['psychiatry behavioral health', 'psychiatry'],
  ['gastroenterology'],
  ['nephrology urology', 'nephrology', 'urology'],
  ['oncology'],
  ['emergency trauma care er', 'emergency', 'trauma'],
  ['intensive care unit icu', 'icu'],
  ['anesthesiology critical care', 'anesthesiology', 'anaesthesiology'],
  ['radiology diagnostic imaging', 'radiology', 'radiodiagnosis'],
  ['pathology clinical laboratory', 'pathology', 'laboratory'],
  ['hospital pharmacy therapeutics', 'pharmacy'],
  ['billing hospital finance', 'billing'],
  ['inpatient nursing administration', 'nursing'],
  ['procurement central sterile supply cssd', 'cssd', 'procurement'],
  ['hospital administration hr', 'administration', 'hr'],
];

function departmentSynonymKey(value: string): string {
  const normalized = normalizeDepartmentKey(value);
  if (!normalized) return '';

  for (const group of DEPARTMENT_SYNONYM_GROUPS) {
    if (group.some((term) => normalized === term || normalized.includes(term) || term.includes(normalized))) {
      return group[0];
    }
  }

  return normalized;
}

/** True when two department labels refer to the same clinical area (strict — no cross-department fallback). */
export function doctorMatchesDepartment(doctorDepartment: string, selectedDepartment: string): boolean {
  const doctor = doctorDepartment.trim();
  const selected = selectedDepartment.trim();
  if (!doctor || !selected) return false;

  const doctorKey = normalizeDepartmentKey(doctor);
  const selectedKey = normalizeDepartmentKey(selected);
  if (doctorKey === selectedKey) return true;

  return departmentSynonymKey(doctor) === departmentSynonymKey(selected);
}

/** Merge standard departments with roster-specific labels for patient/OPD dropdowns. */
export function mergeDepartmentOptions(existingDepartments: Array<string | null | undefined>): string[] {
  const merged: string[] = [...CLINICAL_DEPARTMENT_OPTIONS];
  const seen = new Set(merged.map(normalizeDepartmentKey));

  for (const department of existingDepartments) {
    const label = department?.trim();
    if (!label) continue;

    const key = normalizeDepartmentKey(label);
    const alreadyListed = merged.some((option) => doctorMatchesDepartment(option, label));
    if (!alreadyListed && !seen.has(key)) {
      merged.push(label);
      seen.add(key);
    }
  }

  return merged;
}

export function doctorsForDepartment<
  T extends {
    department?: string | null;
    specialization?: string | null;
    specialty?: string | null;
  },
>(doctors: T[], department: string): T[] {
  const selected = department.trim();
  if (!selected) return [];

  return doctors.filter((doctor) => {
    const fields = [doctor.department, doctor.specialization, doctor.specialty]
      .map((value) => String(value ?? '').trim())
      .filter(Boolean);

    return fields.some((field) => doctorMatchesDepartment(field, selected));
  });
}
