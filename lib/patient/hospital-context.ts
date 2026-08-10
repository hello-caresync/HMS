export const REGAL_HOSPITAL_ID = 'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

export const REGAL_HOSPITAL = {
  id: REGAL_HOSPITAL_ID,
  name: 'Regal Hospital',
  address: 'No.30, CMR Complex, Chokkanahalli Hegdenagar Main Rd, Tirumanahalli, Bengaluru',
} as const;

export const SELECTED_HOSPITAL_ID_KEY = 'selected_hospital_id';
export const SELECTED_HOSPITAL_NAME_KEY = 'selected_hospital_name';

export type SelectedHospital = {
  id: string;
  name: string;
};

export function getSelectedHospital(): SelectedHospital {
  if (typeof window === 'undefined') {
    return { id: REGAL_HOSPITAL.id, name: REGAL_HOSPITAL.name };
  }

  const id = localStorage.getItem(SELECTED_HOSPITAL_ID_KEY) ?? REGAL_HOSPITAL.id;
  const name = localStorage.getItem(SELECTED_HOSPITAL_NAME_KEY) ?? REGAL_HOSPITAL.name;

  return { id, name };
}

export function setSelectedHospital(hospital: SelectedHospital): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SELECTED_HOSPITAL_ID_KEY, hospital.id);
  localStorage.setItem(SELECTED_HOSPITAL_NAME_KEY, hospital.name);
}

/** Ensure Regal Hospital is persisted as the active registered hospital */
export function ensureRegalHospitalSelected(): SelectedHospital {
  const current = getSelectedHospital();
  if (current.id === REGAL_HOSPITAL.id) return current;

  setSelectedHospital({ id: REGAL_HOSPITAL.id, name: REGAL_HOSPITAL.name });
  return { id: REGAL_HOSPITAL.id, name: REGAL_HOSPITAL.name };
}
