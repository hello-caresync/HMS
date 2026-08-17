import type { SupabaseClient } from '@supabase/supabase-js';

import { emitSystemEvent } from './events';
import type { HospitalBedRow } from './types';

export async function fetchBedCensus(supabase: SupabaseClient): Promise<HospitalBedRow[]> {
  const { data, error } = await supabase
    .from('hospital_beds')
    .select('*')
    .order('ward', { ascending: true })
    .order('bed_number', { ascending: true });

  if (error) {
    console.warn('[fetchBedCensus]', error.message);
    return getSeedBeds();
  }

  if (!data?.length) return getSeedBeds();
  return data as HospitalBedRow[];
}

function getSeedBeds(): HospitalBedRow[] {
  const wards = [
    { ward: 'ICU', beds: 4, type: 'Critical' },
    { ward: 'General Ward', beds: 8, type: 'Standard' },
    { ward: 'Private Room', beds: 4, type: 'Private' },
  ];
  const rows: HospitalBedRow[] = [];
  for (const w of wards) {
    for (let i = 1; i <= w.beds; i += 1) {
      rows.push({
        id: `${w.ward}-${i}`,
        ward: w.ward,
        bed_number: String(i).padStart(2, '0'),
        bed_type: w.type,
        is_occupied: false,
      });
    }
  }
  return rows;
}

export async function admitOrTransferPatient(
  supabase: SupabaseClient,
  input: {
    bedId: string;
    patientName: string;
    patientId?: string;
    action: 'admit' | 'transfer' | 'discharge';
    fromBedId?: string;
  },
) {
  const timestamp = new Date().toISOString();

  if (input.action === 'discharge') {
    const { error } = await supabase
      .from('hospital_beds')
      .update({
        is_occupied: false,
        patient_id: null,
        patient_name: null,
        updated_at: timestamp,
      })
      .eq('id', input.bedId);

    if (error) throw new Error(error.message);
    return { success: true, action: input.action, bedId: input.bedId };
  }

  if (input.fromBedId) {
    await supabase
      .from('hospital_beds')
      .update({
        is_occupied: false,
        patient_id: null,
        patient_name: null,
        updated_at: timestamp,
      })
      .eq('id', input.fromBedId);
  }

  const { data, error } = await supabase
    .from('hospital_beds')
    .update({
      is_occupied: true,
      patient_id: input.patientId ?? null,
      patient_name: input.patientName,
      updated_at: timestamp,
    })
    .eq('id', input.bedId)
    .select('*')
    .single();

  if (error) throw new Error(error.message || 'Bed allocation failed');

  await emitSystemEvent(
    supabase,
    'BED_ALLOCATED',
    {
      message: `${input.patientName} → ${data.ward} Bed ${data.bed_number}`,
      bedId: input.bedId,
      patientName: input.patientName,
      relatedId: input.bedId,
    },
    { severity: 'info', targetRoles: ['hospital'] },
  );

  return { success: true, action: input.action, bed: data as HospitalBedRow };
}

export function summarizeBedCensus(beds: HospitalBedRow[]) {
  const byWard = beds.reduce<Record<string, { total: number; occupied: number }>>((acc, bed) => {
    if (!acc[bed.ward]) acc[bed.ward] = { total: 0, occupied: 0 };
    acc[bed.ward].total += 1;
    if (bed.is_occupied) acc[bed.ward].occupied += 1;
    return acc;
  }, {});

  return {
    total: beds.length,
    occupied: beds.filter((b) => b.is_occupied).length,
    available: beds.filter((b) => !b.is_occupied).length,
    byWard,
  };
}
