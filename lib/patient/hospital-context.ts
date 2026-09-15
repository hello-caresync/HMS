import type { SupabaseClient } from '@supabase/supabase-js';

import {
  isHospitalUuid,
  readStoredHospitalUuid,
} from '@/lib/hospital/resolve-hospital-context';
import { REGAL_HOSPITAL_CODE, REGAL_HOSPITAL_NAME } from '@/lib/regal/constants';

export const REGAL_HOSPITAL = {
  name: REGAL_HOSPITAL_NAME,
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
    return { id: '', name: REGAL_HOSPITAL.name };
  }

  const id = localStorage.getItem(SELECTED_HOSPITAL_ID_KEY) ?? readStoredHospitalUuid() ?? '';
  const name = localStorage.getItem(SELECTED_HOSPITAL_NAME_KEY) ?? REGAL_HOSPITAL.name;

  return { id, name };
}

export function setSelectedHospital(hospital: SelectedHospital): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SELECTED_HOSPITAL_ID_KEY, hospital.id);
  localStorage.setItem(SELECTED_HOSPITAL_NAME_KEY, hospital.name);
}

/** Resolve Regal Hospital UUID from DB and persist as the active registered hospital. */
export async function ensureRegalHospitalSelected(
  supabase: SupabaseClient,
): Promise<SelectedHospital> {
  const current = getSelectedHospital();
  if (isHospitalUuid(current.id)) return current;

  const { data } = await supabase
    .from('hospitals')
    .select('id, name')
    .eq('hospital_code', REGAL_HOSPITAL_CODE)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (data?.id && isHospitalUuid(String(data.id))) {
    const resolved = {
      id: String(data.id),
      name: String(data.name ?? REGAL_HOSPITAL.name),
    };
    setSelectedHospital(resolved);
    return resolved;
  }

  return current;
}
